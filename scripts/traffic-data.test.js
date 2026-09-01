const assert = require("node:assert/strict");
const test = require("node:test");
const { REPORTS, buildPayload, pendingPayload, reportRequest, validatePayload } = require("./fetch-ga4-traffic");

const report = (dimensions, metrics, values, timeZone) => ({
  dimensionHeaders: dimensions.map((name) => ({ name })),
  metricHeaders: metrics.map((name) => ({ name })),
  rows: values.map((row) => ({
    dimensionValues: row.slice(0, dimensions.length).map((value) => ({ value: String(value) })),
    metricValues: row.slice(dimensions.length).map((value) => ({ value: String(value) }))
  })),
  ...(timeZone ? { metadata: { timeZone } } : {})
});

test("GA4 report definitions use the required dimensions, metrics, order, and limits", () => {
  assert.deepEqual(REPORTS.summary.metrics, ["activeUsers", "newUsers", "eventCount", "userEngagementDuration"]);
  assert.deepEqual(REPORTS.topPages.dimensions, ["pageTitle"]);
  assert.deepEqual(REPORTS.topPages.metrics, ["screenPageViews", "activeUsers", "eventCount", "bounceRate"]);
  assert.deepEqual(REPORTS.firstUserSources.dimensions, ["firstUserSourceMedium"]);
  assert.deepEqual(REPORTS.sessionSources.dimensions, ["sessionSourceMedium"]);
  assert.deepEqual(REPORTS.cities.dimensions, ["city"]);
  for (const [name, definition] of Object.entries(REPORTS).filter(([name]) => name !== "summary")) {
    const request = reportRequest(definition);
    assert.equal(request.limit, "10", `${name} limit`);
    assert.equal(request.orderBys[0].desc, true, `${name} descending order`);
  }
});

test("GA4 responses map to the stable public aggregate schema", () => {
  const reports = {
    summary: report([], REPORTS.summary.metrics, [[120, 85, 980, 7350]], "Asia/Jakarta"),
    topPages: report(REPORTS.topPages.dimensions, REPORTS.topPages.metrics, [["Medical Library", 300, 100, 450, .32]]),
    firstUserSources: report(REPORTS.firstUserSources.dimensions, REPORTS.firstUserSources.metrics, [["google / organic", 70]]),
    sessionSources: report(REPORTS.sessionSources.dimensions, REPORTS.sessionSources.metrics, [["google / organic", 90]]),
    cities: report(REPORTS.cities.dimensions, REPORTS.cities.metrics, [["Jakarta", 44]])
  };
  const payload = buildPayload(reports, new Date("2026-09-01T03:00:00.000Z"));
  assert.equal(payload.generatedAt, "2026-09-01T03:00:00.000Z");
  assert.deepEqual(payload.reportingPeriod, { label: "Last 28 days", startDate: "2026-08-04", endDate: "2026-08-31" });
  assert.deepEqual(payload.summary, { activeUsers: 120, newUsers: 85, averageEngagementTimeSeconds: 61.25, eventCount: 980 });
  assert.equal(payload.topPages[0].bounceRate, .32);
  assert.equal(payload.firstUserSources[0].label, "google / organic");
  assert.equal(payload.sessionSources[0].sessions, 90);
  assert.equal(payload.cities[0].activeUsers, 44);
});

test("pending bootstrap is valid only when explicitly allowed", () => {
  assert.equal(validatePayload(pendingPayload(), { allowPending: true }).generatedAt, null);
  assert.throws(() => validatePayload(pendingPayload()), /not been generated/);
});

test("invalid bounce-rate fractions are rejected", () => {
  const payload = pendingPayload();
  payload.generatedAt = "2026-09-01T03:00:00.000Z";
  payload.reportingPeriod = { label: "Last 28 days", startDate: "2026-08-04", endDate: "2026-08-31" };
  payload.topPages = [{ title: "Invalid page", views: 1, activeUsers: 1, eventCount: 1, bounceRate: 1.01 }];
  assert.throws(() => validatePayload(payload), /bounceRate/);
});
