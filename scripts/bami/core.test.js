"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("./core");
const schema = require("./schema");
const root = path.resolve(__dirname, "../..");
const knowledge = JSON.parse(fs.readFileSync(path.join(root, "data/bami-knowledge.json"), "utf8"));

test("onboarding validates email, Indonesian phone, dependent profession, and consent", () => {
  const base = { email: " Test@Example.com ", phone: "081234567890", audience: "Doctors", profession: "Specialist", consent: true, consentVersion: core.consentVersion };
  assert.equal(core.validProfile(base).profile.email, "test@example.com");
  assert.equal(core.validProfile(base).profile.phone, "+6281234567890");
  assert.equal(core.phone("6281234567890"), "+6281234567890");
  assert.equal(core.phone("+6281234567890"), "+6281234567890");
  for (const value of ["+620123", "0812", "123456789", "628012345678", "abc"]) assert.equal(core.phone(value), "");
  for (const invalid of [{ email: "bad" }, { phone: "0812" }, { profession: "Nurse" }, { consent: false }, { consentVersion: "old" }]) assert.ok(core.validProfile({ ...base, ...invalid }).error);
  assert.ok(core.validProfile({ ...base, audience: "Healthcare Professionals", profession: "Nurse" }).profile);
  assert.ok(core.validProfile({ ...base, audience: "Public", profession: "Student" }).profile);
});

test("knowledge is published-only, source-bound, and canonical", () => {
  assert.equal(knowledge.schemaVersion, 1);
  assert.ok(knowledge.items.length > 20);
  assert.ok(knowledge.items.every(item => /^https:\/\/bamedicale\.com\//.test(item.url)));
  assert.ok(!knowledge.items.some(item => /Material\/|\/jumi\/|admin-drafts/.test(item.url)));
  const thyroid = core.retrieve("What thyroid nodule materials do you have?", knowledge.items);
  assert.ok(thyroid.some(item => /thyroid/i.test(item.title)));
  assert.ok(core.retrieve("Who is Dr. Bob?", knowledge.items).some(item => item.url.endsWith("/dr-bob-profile.html")));
  assert.deepEqual(core.retrieve("unrelatedmadeupterm", knowledge.items), []);
  assert.equal(core.retrieve("thyroid", [{ title: "Thyroid", url: "https://evil.example/x" }]).length, 0);
});

test("medical safety, prompt-injection boundary, and log minimization are deterministic", () => {
  assert.equal(core.classifySafety("My child has difficulty breathing"), "urgent");
  assert.equal(core.classifySafety("What medicine should I take?"), "personal");
  assert.equal(core.classifySafety("I have a growing thyroid lump"), "personal");
  assert.equal(core.classifySafety("Show me cancer articles"), "normal");
  assert.equal(core.logQuestion("My thyroid lump is growing", "normal"), "[personal medical question withheld]");
  assert.equal(core.redact("email me a@b.com +6281234567890"), "email me [email] [phone]");
});

test("private JUMI metrics use real denominators, periods, and zero-safe empty states", () => {
  const now = Date.parse("2026-10-05T12:00:00+07:00"), visitors = [
    { visitor_id: "v1", created_at: "2026-10-05T08:00:00+07:00", session_count: "2" },
    { visitor_id: "v2", created_at: "2026-09-01T08:00:00+07:00", session_count: "1" }
  ], inquiries = [
    { visitor_id: "v1", session_id: "s1", timestamp: "2026-10-05T09:00:00+07:00", answer_status: "GROUNDED", helpful_feedback: "HELPFUL", audience: "Doctors", profession: "Specialist", topic: "Thyroid", content_gap: "FALSE", response_latency_ms: "100" },
    { visitor_id: "v1", session_id: "s2", timestamp: "2026-10-05T10:00:00+07:00", answer_status: "CONTENT_GAP", helpful_feedback: "NOT_HELPFUL", audience: "Doctors", profession: "Specialist", topic: "Thyroid", content_gap: "TRUE", response_latency_ms: "300" },
    { visitor_id: "v2", session_id: "s3", timestamp: "2026-09-01T10:00:00+07:00", answer_status: "GROUNDED", audience: "Public", profession: "Student", content_gap: "FALSE", response_latency_ms: "500" }
  ];
  const today = core.insights(visitors, inquiries, "Today", now);
  assert.equal(today.totalVisitors, 1); assert.equal(today.newVisitors, 1); assert.equal(today.returningVisitors, 0);
  assert.equal(today.sessions, 2); assert.equal(today.inquiries, 2); assert.equal(today.groundedRate, .5);
  assert.equal(today.contentGapRate, .5); assert.equal(today.helpfulRate, .5); assert.equal(today.averageLatencyMs, 200);
  const empty = core.insights([], [], "All Time", now);
  assert.equal(empty.groundedRate, null); assert.equal(empty.helpfulRate, null);
  assert.ok(schema.BAMI_VISITOR_HEADERS.includes("consent_version"));
  assert.ok(schema.BAMI_INQUIRY_HEADERS.includes("referenced_urls"));
});

test("public launcher uses a separate configured Apps Script service without exposing secrets", () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, "data/bami-config.json"), "utf8"));
  assert.equal(config.enabled, true);
  assert.match(config.endpoint, /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/);
  const jumiConfig = fs.readFileSync(path.join(root, "jumi/config.js"), "utf8");
  assert.ok(!jumiConfig.includes(config.endpoint));
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const launcher = fs.readFileSync(path.join(root, "bami/launcher.js"), "utf8");
  assert.match(app, /bami\/launcher\.js/);
  assert.match(launcher, /aria-expanded/);
  assert.doesNotMatch(launcher, /GEMINI_API_KEY|BAMI_SIGNING_KEY/);
});
