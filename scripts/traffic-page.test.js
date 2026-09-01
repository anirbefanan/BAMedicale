const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("traffic.html");
const app = read("app.js");
const sitemap = read("sitemap.xml");
const workflow = read(".github/workflows/refresh-traffic-data.yml");

test("traffic page exposes the required semantic, SEO, and fallback content", () => {
  assert.match(html, /<title>BA Medicale Website Traffic \| Public Analytics Overview<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/bamedicale\.com\/traffic\.html">/);
  assert.match(html, /<h1 id="traffic-title">BA Medicale website traffic\.<\/h1>/);
  assert.match(html, /Public website traffic overview · Updated automatically · Last 28 days/);
  assert.match(html, /Last updated: awaiting the first automatic refresh\./);
  assert.match(html, /Traffic data is being prepared\./);
  assert.match(html, /does not display individual visitor information/);
  assert.match(html, /data-traffic-dashboard/);
  assert.match(html, /data-shell/);
  assert.match(html, /data-footer/);
});

test("traffic page local assets and scripts resolve in the repository", () => {
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  const local = references.filter((value) => !/^(?:https?:|mailto:|tel:|#)/.test(value));
  for (const reference of local) {
    const clean = reference.split(/[?#]/)[0].replace(/^\//, "");
    assert.ok(fs.existsSync(path.join(root, clean)), `${reference} should resolve`);
  }
});

test("shared navigation, footer, and sitemap place Traffic correctly", () => {
  assert.match(app, /\{ label: "BA Medicale", href: "about\.html" \},\s*\{ label: "Team", href: "team\.html" \},\s*\{ label: "Traffic", href: "traffic\.html" \},\s*\{ label: "Contact Us", href: "contact\.html" \}/);
  assert.match(app, /About BA Medicale<\/a><a href="team\.html">Team<\/a><a href="traffic\.html">Traffic<\/a><a href="contact\.html">Contact Us<\/a><a href="privacy-policy\.html">Privacy Policy<\/a>/);
  assert.match(app, /route === "traffic\.html".*group: "About", child: "traffic\.html"/);
  assert.match(sitemap, /<loc>https:\/\/bamedicale\.com\/traffic\.html<\/loc>/);
});

test("workflow is scheduled, least-privilege, and stages generated data only", () => {
  assert.match(workflow, /cron: "0 \*\/6 \* \* \*"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n\s*contents: write/);
  assert.match(workflow, /secrets\.GA4_PROPERTY_ID/);
  assert.match(workflow, /secrets\.GA4_SERVICE_ACCOUNT_JSON/);
  assert.match(workflow, /git add -- data\/traffic-summary\.json/);
  assert.match(workflow, /git diff --cached --quiet/);
});

test("public dashboard files contain no private GA4 configuration", () => {
  const publicSurface = [html, app, read("data/traffic-summary.json")].join("\n");
  assert.doesNotMatch(publicSurface, /GA4_PROPERTY_ID|GA4_SERVICE_ACCOUNT_JSON|client_email|private_key|analyticsdata\.googleapis\.com/);
});
