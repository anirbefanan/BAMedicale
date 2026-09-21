const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const backend = fs.readFileSync(path.join(__dirname, "backend.js"), "utf8");
const client = fs.readFileSync(path.join(root, "jumi/app.js"), "utf8");
const scope = fs.readFileSync(path.join(root, "jumi/scope.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "appsscript.json"), "utf8"));
const properties = new Map();
const context = {
  console,
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties.get(key) || "", setProperty: (key, value) => properties.set(key, value) }) },
  Utilities: {
    formatDate: date => new Date(date).toISOString(),
    getUuid: () => "00000000-0000-0000-0000-000000000001"
  }
};
vm.createContext(context);
vm.runInContext(backend, context);

const now = Date.parse("2026-10-19T08:00:00+07:00");
const event = (overrides = {}) => ({
  "Event ID": "safe-seminar-2026",
  Title: "Evidence-based Seminar",
  "Start At": "2026-10-20T09:00:00+07:00",
  "End At": "2026-10-20T11:00:00+07:00",
  Format: "Online",
  Platform: "Zoom",
  "Meeting URL": "https://zoom.example.test/private-access",
  Commercial: "Free",
  Lifecycle: "Upcoming",
  "Public URL": "https://bamedicale.com/events/safe-seminar-2026.html",
  ...overrides
});
const registrant = (overrides = {}) => ({
  "Registrant ID": "registrant-1",
  "Event ID": "safe-seminar-2026",
  Name: "Fixture Participant",
  Email: "fixture@example.test",
  "Registered At": "2026-10-18T10:00:00+07:00",
  "Registration Status": "Registered",
  "Payment Status": "Not Required",
  "Attendance Status": "Not Checked",
  "Certificate Status": "Not Eligible",
  ...overrides
});

test("Free registration queues confirmation without payment", () => {
  const result = context.jumiNotificationEligibility_(event(), registrant(), "Registration Confirmation", null, now);
  assert.equal(result.eligible, true);
  assert.match(result.reason, /Free registration/);
});

test("Paid submission receives acknowledgement but not official confirmation until Mark Paid", () => {
  const paid = event({ Commercial: "Paid" });
  const pending = registrant({ "Registration Status": "Submitted", "Payment Status": "Pending" });
  assert.equal(context.jumiNotificationEligibility_(paid, pending, "Registration Acknowledgement", null, now).eligible, true);
  assert.equal(context.jumiNotificationEligibility_(paid, pending, "Registration Confirmation", null, now).eligible, false);
  const verified = registrant({ "Registration Status": "Registered", "Payment Status": "Paid" });
  assert.equal(context.jumiNotificationEligibility_(paid, verified, "Registration Confirmation", null, now).eligible, true);
  assert.match(backend, /UPLOAD_PAYMENT_PROOF[\s\S]*return\{saved:true,reference:'stored'\}/);
  assert.match(backend, /MARK_PAID[\s\S]*confirmationQueued:true/);
});

test("H-1 schedules are Jakarta-safe and reschedule from the canonical event", () => {
  const firstDay = context.jumiNotificationEligibility_(event(), registrant(), "H-1 Day", null, now);
  const firstHour = context.jumiNotificationEligibility_(event(), registrant(), "H-1 Hour", null, now);
  assert.equal(firstDay.scheduledAt, Date.parse("2026-10-19T09:00:00+07:00"));
  assert.equal(firstHour.scheduledAt, Date.parse("2026-10-20T08:00:00+07:00"));
  const moved = event({ "Start At": "2026-10-21T10:00:00+07:00", "End At": "2026-10-21T12:00:00+07:00" });
  assert.equal(context.jumiNotificationEligibility_(moved, registrant(), "H-1 Day", null, now).scheduledAt, Date.parse("2026-10-20T10:00:00+07:00"));
  assert.match(backend, /\['Sent','Delivered'\].*return/);
});

test("late and cancelled participants never receive nonsensical reminders", () => {
  const lateNow = Date.parse("2026-10-20T08:30:00+07:00");
  const late = registrant({ "Registered At": "2026-10-20T08:20:00+07:00" });
  assert.equal(context.jumiNotificationEligibility_(event(), late, "H-1 Hour", null, lateNow).eligible, false);
  assert.match(context.jumiNotificationEligibility_(event(), late, "H-1 Hour", null, lateNow).reason, /Late registration/);
  const cancelled = registrant({ "Registration Status": "Cancelled" });
  assert.equal(context.jumiNotificationEligibility_(event(), cancelled, "Registration Confirmation", null, now).eligible, false);
});

test("post-event and certificate messages require recorded evidence", () => {
  const completed = event({ "Start At": "2026-10-18T09:00:00+07:00", "End At": "2026-10-18T11:00:00+07:00", Lifecycle: "Completed" });
  const attended = registrant({ "Attendance Status": "Attended", "Certificate Status": "Approved" });
  assert.equal(context.jumiNotificationEligibility_(completed, attended, "Post-event Follow-up", null, now).eligible, true);
  assert.equal(context.jumiNotificationEligibility_(completed, attended, "Certificate Ready", { "File ID": "private-file", "Approved At": "2026-10-18T13:00:00+07:00" }, now).eligible, false);
  const ready = { "File ID": "private-file", "Approved At": "2026-10-18T13:00:00+07:00", "Access URL": "https://bamedicale.com/certificates/fixture" };
  assert.equal(context.jumiNotificationEligibility_(completed, attended, "Certificate Ready", ready, now).eligible, true);
});

test("Bahasa Indonesia and English templates use canonical facts and protect meeting access", () => {
  const pending = registrant({ "Registration Status": "Submitted", "Payment Status": "Pending" });
  const acknowledgement = context.jumiNotificationMessage_(event({ Commercial: "Paid" }), pending, "Registration Acknowledgement", "Bahasa Indonesia", null);
  assert.match(acknowledgement.text, /Verifikasi pembayaran masih menunggu/);
  assert.doesNotMatch(acknowledgement.text, /zoom\.example\.test/);
  const confirmed = context.jumiNotificationMessage_(event(), registrant(), "Registration Confirmation", "English", null);
  assert.match(confirmed.text, /Your registration.*is confirmed/);
  assert.match(confirmed.text, /zoom\.example\.test/);
  assert.match(confirmed.text, /BA Medicale/);
});

test("idempotency is deterministic and excludes recipient PII", () => {
  const a = context.jumiNotificationIdempotency_("safe-seminar-2026", "registrant-1", "H-1 Day", "v1");
  const b = context.jumiNotificationIdempotency_("safe-seminar-2026", "registrant-1", "H-1 Day", "v1");
  assert.equal(a, b);
  assert.doesNotMatch(a, /@|fixture/);
  assert.notEqual(a, context.jumiNotificationIdempotency_("safe-seminar-2026", "registrant-1", "H-1 Hour", "v1"));
});

test("provider failures are classified and retries remain bounded", () => {
  assert.deepEqual({ ...context.jumiProviderFailure_(429, "{}") }, { ok: false, retryable: true, category: "rate_limit", message: "" });
  assert.equal(context.jumiProviderFailure_(401, "{}").category, "provider_configuration");
  assert.equal(context.jumiProviderFailure_(422, "{}").retryable, false);
  assert.equal(context.jumiRetryDelay_(1), 15 * 60000);
  assert.equal(context.jumiRetryDelay_(2), 60 * 60000);
  assert.equal(context.jumiRetryDelay_(3), 6 * 3600000);
  assert.match(backend, /JUMI_NOTIFICATION_MAX_ATTEMPTS = 4/);
});

test("queue is locked, bounded, execution-aware, and server-side only", () => {
  assert.match(backend, /tryLock\(1000\)/);
  assert.match(backend, /JUMI_NOTIFICATION_BATCH_SIZE = 25/);
  assert.match(backend, /Date\.now\(\)-started>240000/);
  assert.match(backend, /Idempotency-Key/);
  assert.match(backend, /UrlFetchApp\.fetch\('https:\/\/api\.resend\.com\/emails'/);
  assert.match(backend, /everyMinutes\(15\)/);
  assert.match(manifest.oauthScopes.join(" "), /script\.scriptapp/);
  assert.doesNotMatch(client, /JUMI_RESEND_API_KEY|api\.resend\.com|Authorization:'Bearer/);
});

test("schedule override is future-only, audited, and limited to untouched sends", () => {
  assert.match(backend, /jumi_reschedule_notification/);
  assert.match(backend, /Only an unsent notification with no delivery attempt may be rescheduled/);
  assert.match(backend, /Choose a valid future schedule in Asia\/Jakarta/);
  assert.match(backend, /RESCHEDULE_NOTIFICATION/);
  assert.match(client, /data-reschedule-notification/);
  assert.match(client, /type="datetime-local"/);
  assert.match(backend, /'Schedule Override':'Manual'/);
  assert.match(backend, /override&&existing&&existing\['Scheduled At'\]/);
  assert.match(backend, /if\(found&&found\['Cancelled At'\]\)return/);
});

test("workspace supports preview, schedule, filters, retry, cancel, and honest providers", () => {
  for (const token of ["Notification Center", "Private message preview", "Prepare Eligible Queue", "Process Due", "data-retry-notification", "data-cancel-notification", "WhatsApp — Not Connected"]) assert.match(client, new RegExp(token));
  assert.match(client, /integration\("email"\)/);
  assert.match(client, /integration\("whatsapp"\)/);
  assert.match(scope, /Notification delivery failed/);
  assert.match(scope, /Notifications ready to process/);
});

test("notification records are additive, auditable, minimized, and responsive", () => {
  for (const header of ["Participant ID", "Recipient", "Eligibility", "Provider Message ID", "Attempt Count", "Last Error Category", "Template Version", "Idempotency Key"]) assert.match(backend, new RegExp(`'${header}'`));
  assert.match(backend, /SYNC_NOTIFICATIONS/);
  assert.match(backend, /SEND_NOTIFICATION/);
  assert.match(backend, /CANCEL_NOTIFICATION/);
  assert.doesNotMatch(client, /JUMI_GITHUB_TOKEN|JUMI_RESEND_API_KEY|JUMI_CONTENT_ROOT_FOLDER_ID/);
  const styles = fs.readFileSync(path.join(root, "jumi/styles.css"), "utf8");
  assert.match(styles, /@media\(max-width:820px\)/);
  assert.match(styles, /@media\(max-width:520px\)/);
  assert.match(styles, /\.table-wrap\{[^}]*max-width:100%/);
});
