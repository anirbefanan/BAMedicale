const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "traffic-summary.json");
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REPORTING_PERIOD = Object.freeze({ label: "Last 28 days", startDate: "28daysAgo", endDate: "yesterday" });
const metricOrder = (metricName) => [{ metric: { metricName }, desc: true }];

const REPORTS = Object.freeze({
  summary: {
    metrics: ["activeUsers", "newUsers", "eventCount", "userEngagementDuration"]
  },
  topPages: {
    dimensions: ["pageTitle"],
    metrics: ["screenPageViews", "activeUsers", "eventCount", "bounceRate"],
    orderBys: metricOrder("screenPageViews"),
    limit: "10"
  },
  firstUserSources: {
    dimensions: ["firstUserSourceMedium"],
    metrics: ["activeUsers"],
    orderBys: metricOrder("activeUsers"),
    limit: "10"
  },
  sessionSources: {
    dimensions: ["sessionSourceMedium"],
    metrics: ["sessions"],
    orderBys: metricOrder("sessions"),
    limit: "10"
  },
  cities: {
    dimensions: ["city"],
    metrics: ["activeUsers"],
    orderBys: metricOrder("activeUsers"),
    limit: "10"
  }
});

const pendingPayload = () => ({
  generatedAt: null,
  reportingPeriod: { label: REPORTING_PERIOD.label, startDate: null, endDate: null },
  summary: { activeUsers: 0, newUsers: 0, averageEngagementTimeSeconds: 0, eventCount: 0 },
  topPages: [],
  firstUserSources: [],
  sessionSources: [],
  cities: []
});

const base64Url = (value) => Buffer.from(value).toString("base64url");
const finiteNumber = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const validRows = (rows, textKey, numberKeys) => Array.isArray(rows) && rows.length <= 10 && rows.every((row) => (
  row && typeof row[textKey] === "string" && row[textKey].trim() && numberKeys.every((key) => finiteNumber(row[key]))
));

function validatePayload(payload, { allowPending = false } = {}) {
  const pending = payload?.generatedAt === null;
  if (pending && !allowPending) throw new Error("Traffic payload has not been generated yet.");
  if (!pending && (typeof payload?.generatedAt !== "string" || Number.isNaN(Date.parse(payload.generatedAt)))) throw new Error("Traffic payload generatedAt is invalid.");
  if (payload?.reportingPeriod?.label !== REPORTING_PERIOD.label) throw new Error("Traffic payload reporting label is invalid.");
  if (pending) {
    if (payload.reportingPeriod.startDate !== null || payload.reportingPeriod.endDate !== null) throw new Error("Pending traffic payload dates must be null.");
  } else if (!validDate(payload.reportingPeriod.startDate) || !validDate(payload.reportingPeriod.endDate)) {
    throw new Error("Traffic payload reporting dates are invalid.");
  }
  for (const key of ["activeUsers", "newUsers", "averageEngagementTimeSeconds", "eventCount"]) {
    if (!finiteNumber(payload?.summary?.[key])) throw new Error(`Traffic summary ${key} is invalid.`);
  }
  if (!validRows(payload.topPages, "title", ["views", "activeUsers", "eventCount", "bounceRate"])) throw new Error("Traffic topPages are invalid.");
  if (payload.topPages.some((row) => row.bounceRate > 1)) throw new Error("Traffic topPages bounceRate is invalid.");
  if (!validRows(payload.firstUserSources, "label", ["activeUsers"])) throw new Error("Traffic firstUserSources are invalid.");
  if (!validRows(payload.sessionSources, "label", ["sessions"])) throw new Error("Traffic sessionSources are invalid.");
  if (!validRows(payload.cities, "label", ["activeUsers"])) throw new Error("Traffic cities are invalid.");
  return payload;
}

function reportRequest(definition) {
  return {
    dateRanges: [{ startDate: REPORTING_PERIOD.startDate, endDate: REPORTING_PERIOD.endDate }],
    ...(definition.dimensions ? { dimensions: definition.dimensions.map((name) => ({ name })) } : {}),
    metrics: definition.metrics.map((name) => ({ name })),
    ...(definition.orderBys ? { orderBys: definition.orderBys } : {}),
    ...(definition.limit ? { limit: definition.limit } : {})
  };
}

function parseReport(report) {
  const dimensions = (report.dimensionHeaders || []).map((header) => header.name);
  const metrics = (report.metricHeaders || []).map((header) => header.name);
  return (report.rows || []).map((row) => {
    const values = {};
    dimensions.forEach((name, index) => { values[name] = row.dimensionValues?.[index]?.value || ""; });
    metrics.forEach((name, index) => { values[name] = Number(row.metricValues?.[index]?.value || 0); });
    return values;
  });
}

const cleanLabel = (value, fallback) => {
  const label = String(value || "").trim();
  if (!label || label === "(not set)") return fallback;
  return label;
};

function calendarDateInZone(now, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const get = (type) => Number(parts.find((part) => part.type === type)?.value);
    return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  } catch {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}

const formatIsoDate = (date) => date.toISOString().slice(0, 10);
function actualReportingPeriod(now, timeZone) {
  const today = calendarDateInZone(now, timeZone || "UTC");
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  return { label: REPORTING_PERIOD.label, startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
}

function buildPayload(reports, now = new Date()) {
  const summaryRow = parseReport(reports.summary)[0] || {};
  const activeUsers = Number(summaryRow.activeUsers || 0);
  const userEngagementDuration = Number(summaryRow.userEngagementDuration || 0);
  const pageRows = parseReport(reports.topPages);
  const firstRows = parseReport(reports.firstUserSources);
  const sessionRows = parseReport(reports.sessionSources);
  const cityRows = parseReport(reports.cities);
  const payload = {
    generatedAt: now.toISOString(),
    reportingPeriod: actualReportingPeriod(now, reports.summary.metadata?.timeZone),
    summary: {
      activeUsers,
      newUsers: Number(summaryRow.newUsers || 0),
      averageEngagementTimeSeconds: activeUsers ? userEngagementDuration / activeUsers : 0,
      eventCount: Number(summaryRow.eventCount || 0)
    },
    topPages: pageRows.map((row) => ({
      title: cleanLabel(row.pageTitle, "Untitled page"),
      views: Number(row.screenPageViews || 0),
      activeUsers: Number(row.activeUsers || 0),
      eventCount: Number(row.eventCount || 0),
      bounceRate: Number(row.bounceRate || 0)
    })),
    firstUserSources: firstRows.map((row) => ({ label: cleanLabel(row.firstUserSourceMedium, "Not set"), activeUsers: Number(row.activeUsers || 0) })),
    sessionSources: sessionRows.map((row) => ({ label: cleanLabel(row.sessionSourceMedium, "Not set"), sessions: Number(row.sessions || 0) })),
    cities: cityRows.map((row) => ({ label: cleanLabel(row.city, "Not set"), activeUsers: Number(row.activeUsers || 0) }))
  };
  return validatePayload(payload);
}

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Google API request failed with status ${response.status}.`);
  return response.json();
}

async function accessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", ...(credentials.private_key_id ? { kid: credentials.private_key_id } : {}) };
  const claims = { iss: credentials.client_email, scope: ANALYTICS_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), credentials.private_key).toString("base64url");
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` });
  const result = await requestJson(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!result.access_token) throw new Error("Google authorization did not return an access token.");
  return result.access_token;
}

function readConfiguration(env = process.env) {
  const propertyId = String(env.GA4_PROPERTY_ID || "").replace(/^properties\//, "");
  if (!/^\d+$/.test(propertyId)) throw new Error("GA4_PROPERTY_ID is missing or invalid.");
  if (!env.GA4_SERVICE_ACCOUNT_JSON) throw new Error("GA4_SERVICE_ACCOUNT_JSON is missing.");
  let credentials;
  try { credentials = JSON.parse(env.GA4_SERVICE_ACCOUNT_JSON); } catch { throw new Error("GA4_SERVICE_ACCOUNT_JSON is not valid JSON."); }
  if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) throw new Error("GA4_SERVICE_ACCOUNT_JSON does not contain service-account credentials.");
  return { propertyId, credentials };
}

async function fetchReports(propertyId, token) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const entries = await Promise.all(Object.entries(REPORTS).map(async ([name, definition]) => {
    const report = await requestJson(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(reportRequest(definition))
    });
    return [name, report];
  }));
  return Object.fromEntries(entries);
}

function writePayload(payload, outputPath = OUTPUT_PATH) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--bootstrap") {
    if (!fs.existsSync(OUTPUT_PATH)) writePayload(validatePayload(pendingPayload(), { allowPending: true }));
    console.log(`Traffic data bootstrap ready: ${path.relative(ROOT, OUTPUT_PATH)}`);
    return;
  }
  if (args[0] === "--validate") {
    const inputPath = path.resolve(ROOT, args[1] || path.relative(ROOT, OUTPUT_PATH));
    validatePayload(JSON.parse(fs.readFileSync(inputPath, "utf8")), { allowPending: args.includes("--allow-pending") });
    console.log(`Traffic data valid: ${path.relative(ROOT, inputPath)}`);
    return;
  }
  const { propertyId, credentials } = readConfiguration();
  const token = await accessToken(credentials);
  const reports = await fetchReports(propertyId, token);
  writePayload(buildPayload(reports));
  console.log(`Traffic data refreshed: ${path.relative(ROOT, OUTPUT_PATH)}`);
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

module.exports = { REPORTING_PERIOD, REPORTS, actualReportingPeriod, buildPayload, pendingPayload, reportRequest, validatePayload };
