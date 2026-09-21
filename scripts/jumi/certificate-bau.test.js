const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const backend = fs.readFileSync(path.join(__dirname, "backend.js"), "utf8");
const client = fs.readFileSync(path.join(root, "jumi/app.js"), "utf8");
const scope = fs.readFileSync(path.join(root, "jumi/scope.js"), "utf8");
const context = { console, Utilities: { formatDate: date => new Date(date).toISOString(), getUuid: () => "00000000-0000-0000-0000-000000000001" } };
vm.createContext(context);
vm.runInContext(backend, context);

const event = (overrides = {}) => ({
  "Event ID": "fixture-seminar-2026",
  Title: "Source-grounded Seminar",
  "Start At": "2026-10-20T09:00:00+07:00",
  "Certificate Program": "BA Medicale Participation Certificate",
  "Certificate Rule": "BA Medicale Attendance",
  ...overrides
});
const participant = (overrides = {}) => ({
  "Registrant ID": "participant-1",
  "Event ID": "fixture-seminar-2026",
  Name: "Valid Participant",
  "Registration Status": "Registered",
  "Payment Status": "Not Required",
  "Attendance Status": "Attended",
  "Attendance Source": "BA Medicale Attendance",
  ...overrides
});

test("eligibility is event-specific and rejects registration without attendance", () => {
  const result = context.jumiCertificateEligibility_(event(), participant({ "Attendance Status": "Not Checked", "Attendance Source": "" }), null);
  assert.equal(result.eligible, false);
  assert.match(result.basis, /attendance/i);
  assert.equal(context.jumiCertificateEligibility_(event({ "Certificate Program": "None" }), participant(), null).eligible, false);
});

test("BA Medicale and LMS attendance follow the configured rule", () => {
  assert.equal(context.jumiCertificateEligibility_(event(), participant(), null).eligible, true);
  assert.equal(context.jumiCertificateEligibility_(event(), participant({ "Attendance Source": "LMS Attendance" }), null).eligible, false);
  assert.equal(context.jumiCertificateEligibility_(event({ "Certificate Rule": "BA Medicale or LMS Attendance" }), participant({ "Attendance Source": "LMS Attendance" }), null).eligible, true);
});

test("Zoom join alone never establishes eligibility", () => {
  const result = context.jumiCertificateEligibility_(event({ "Certificate Rule": "BA Medicale or LMS Attendance" }), participant({ "Attendance Source": "Zoom Join" }), null);
  assert.equal(result.eligible, false);
  assert.match(result.basis, /Zoom join alone/);
});

test("identity and registration gates prevent wrong or placeholder certificates", () => {
  assert.equal(context.jumiCertificateEligibility_(event(), participant({ Name: "Test User" }), null).eligible, false);
  assert.equal(context.jumiCertificateEligibility_(event(), participant({ "Registration Status": "Submitted", "Payment Status": "Pending" }), null).eligible, false);
});

test("manual override is explicit, reasoned, and frozen approval is not recalculated", () => {
  const overridden = context.jumiCertificateEligibility_(event(), participant({ "Attendance Status": "Not Checked", "Attendance Source": "" }), { "Manual Override": "eligible", "Override Reason": "Verified signed attendance sheet" });
  assert.equal(overridden.eligible, true);
  assert.match(overridden.basis, /authorized manual/i);
  const frozen = context.jumiCertificateEligibility_(event({ "Certificate Rule": "Manual Review Only" }), participant(), { Status: "Approved", "Eligibility Basis": "Approved under v1" });
  assert.equal(frozen.frozen, true);
});

test("certificate identifiers are stable, unique, and contain no participant PII", () => {
  const first = context.jumiCertificateId_("fixture-seminar-2026", "participant-1", "2026-10-20T09:00:00+07:00");
  assert.equal(first, context.jumiCertificateId_("fixture-seminar-2026", "participant-1", "2026-10-20T09:00:00+07:00"));
  assert.notEqual(first, context.jumiCertificateId_("fixture-seminar-2026", "participant-2", "2026-10-20T09:00:00+07:00"));
  assert.doesNotMatch(first, /valid|participant-1|@/i);
});

test("locked PDF generation validates signature, hashes output, and stores privately", () => {
  assert.match(backend, /HtmlService\.createHtmlOutput\(jumiCertificateHtml_/);
  assert.match(backend, /getAs\(MimeType\.PDF\)/);
  assert.match(backend, /===\s*'%PDF'/);
  assert.match(backend, /jumiSha256_\(blob\)/);
  assert.match(backend, /getSharingAccess\(\)===DriveApp\.Access\.PRIVATE/);
  assert.doesNotMatch(backend, /Certificate of Achievement|SKP awarded|Kemenkes accredited/i);
});

test("generation batches are bounded, locked, resumable, and participant-isolated", () => {
  assert.match(backend, /JUMI_CERTIFICATE_BATCH_SIZE = 10/);
  assert.match(backend, /Certificate generation is already running/);
  assert.match(backend, /Date\.now\(\)-started>240000/);
  assert.match(backend, /item\.skipped\?result\.skipped\+\+/);
  assert.match(backend, /catch\(error\)\{result\.failed\+\+/);
});

test("Preview and Nana approval are separate mandatory gates", () => {
  assert.match(backend, /Generate a valid private certificate PDF before Preview/);
  assert.match(backend, /row\['Previewed At'\]/);
  assert.match(backend, /Only a generated and reviewed Preview may be approved/);
  assert.match(client, /Private · not approved · not sent/);
});

test("delivery uses the approved private PDF attachment and never raw Drive URLs", () => {
  const ready = { Status: "Approved", "File ID": "private", "File Hash": "hash", "Approved At": "2026-10-20T12:00:00+07:00", "Delivery Mode": "Email Attachment" };
  const result = context.jumiNotificationEligibility_(event(), participant({ Email: "safe@example.test", "Certificate Status": "Approved" }), "Certificate Ready", ready, Date.now());
  assert.equal(result.eligible, true);
  assert.match(backend, /message\.attachments=\[jumiCertificateAttachment_\(certificate\)\]/);
  assert.match(backend, /Utilities\.base64Encode\(blob\.getBytes\(\)\)/);
  assert.doesNotMatch(client, /drive\.google\.com|Access URL/);
});

test("provider disconnection retains Approved and never reports Sent", () => {
  assert.match(client, /Certificate remains Approved; email provider is not connected/);
  assert.match(backend, /Email provider is not connected/);
  assert.match(backend, /row\.Template==='Certificate Ready'&&certificate/);
  assert.match(backend, /'Certificate Status':'Sent'/);
});

test("correction and reissue preserve audit history and certificate identity", () => {
  assert.match(backend, /CORRECT_CERTIFICATE_NAME/);
  assert.match(backend, /REISSUE_CERTIFICATE/);
  assert.match(backend, /'Superseded File IDs JSON'/);
  assert.match(backend, /'Reissue Of':String\(row\['Certificate ID'\]\)/);
  assert.match(backend, /Approved certificates require reissue/);
  assert.match(backend, /JUMI_NOTIFICATION_VERSION\+'-certificate-'\+String\(certificate&&certificate\.Version\|\|0\)/);
});

test("Certificates remain nested in Seminar with filters and operational actions", () => {
  for (const token of ["Certificate lifecycle", "Certificate operations", "certificate-status", "data-review-certificate", "data-generate-certificate", "data-preview-certificate", "data-approve-certificate", "data-queue-certificate", "data-reissue-certificate"]) assert.match(client, new RegExp(token));
  assert.match(client, /Content.*Community.*Settings/s);
  assert.doesNotMatch(client.match(/const modules=\[[^\]]+\]/)?.[0] || "", /Certificates/);
});

test("Dashboard and Community count grounded certificate states only", () => {
  assert.match(scope, /Certificates pending generation/);
  assert.match(scope, /Certificates pending approval/);
  assert.match(scope, /Certificates pending delivery/);
  assert.match(scope, /\["Approved","Sent"\]\.includes\(row\.certificateStatus\)/);
  assert.match(backend, /\['Approved','Sent'\]\.includes\(item\.status\)/);
});

test("historical 19 Sep data is grandfathered and receives no automatic certificate side effect", () => {
  assert.match(backend, /row\['Certificate Program'\]\|\|'None'/);
  assert.match(backend, /program!==JUMI_CERTIFICATE_PROGRAM/);
  assert.doesNotMatch(backend, /Management of Thyroid Nodules[\s\S]{0,300}Certificate Program/);
  assert.match(client, /Historical events remain disabled until explicitly configured/);
});

test("schema, audit, security, and responsive contracts remain additive", () => {
  for (const header of ["Eligibility Rule", "File Hash", "Template Version", "Failure Category", "Reissue Reason", "Delivery Mode"]) assert.match(backend, new RegExp(`'${header}'`));
  assert.match(backend, /\['Articles','eBooks','Seminars','Certificates'\]/);
  assert.doesNotMatch(client, /JUMI_GITHUB_TOKEN|JUMI_RESEND_API_KEY|JUMI_CONTENT_ROOT_FOLDER_ID|File ID|Drive ID/);
  const styles = fs.readFileSync(path.join(root, "jumi/styles.css"), "utf8");
  assert.match(styles, /\.certificate-preview/);
  assert.match(styles, /@media\(max-width:820px\)/);
  assert.match(styles, /@media\(max-width:520px\)/);
});
