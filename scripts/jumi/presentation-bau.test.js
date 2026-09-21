const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const backend = fs.readFileSync(path.join(__dirname, "backend.js"), "utf8");
const client = fs.readFileSync(path.join(root, "jumi/app.js"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/publish-jumi-content.yml"), "utf8");
const publicClient = fs.readFileSync(path.join(root, "app.js"), "utf8");
const eventTemplate = fs.readFileSync(path.join(root, "scripts/event-template.js"), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(backend, context);

function validPresentation(overrides = {}) {
  return {
    type: "Presentation",
    title: "Source-supported fixture presentation",
    slug: "source-supported-fixture-presentation",
    sourceStored: true,
    mediaStored: false,
    typeData: {
      author: "Fixture doctor",
      source: "Original fixture presentation",
      tags: ["Thyroid"],
      quickSummary: "Source-grounded fixture summary.",
      sourceAsset: { sha256: "a".repeat(64) },
      publication: {
        eventId: "fixture-seminar",
        speakerId: "fixture-doctor",
        sourceDownloadApproved: true,
        primaryAudience: "Doctors",
        primaryDiseaseGroup: "endocrine-metabolic",
        quickRead: [{ title: "Fixture point", body: "Source-grounded summary.", pages: [1] }]
      }
    },
    ...overrides
  };
}

test("Presentation Quick Read parsing stays structured, bounded, and page mapped", () => {
  const result = context.jumiPresentationQuickRead_("Diagnostic approach | Source-grounded text | 1, 2\nManagement | Source-grounded text | 3");
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [
    { title: "Diagnostic approach", body: "Source-grounded text", pages: [1, 2] },
    { title: "Management", body: "Source-grounded text", pages: [3] }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(context.jumiPresentationQuickRead_("Incomplete line"))), []);
});

test("Presentation validation gates source integrity, Quick Read, download approval, and media association", () => {
  assert.deepEqual([...context.jumiContentIssues_(validPresentation())], []);
  const privateSource = validPresentation();privateSource.typeData.publication.sourceDownloadApproved = false;
  assert.match(context.jumiContentIssues_(privateSource).join(" "), /Explicitly approve/);
  const noQuickRead = validPresentation();noQuickRead.typeData.publication.quickRead = [];
  assert.match(context.jumiContentIssues_(noQuickRead).join(" "), /Quick Read/);
  const noHash = validPresentation();noHash.typeData.sourceAsset = null;
  assert.match(context.jumiContentIssues_(noHash).join(" "), /integrity hash/);
  const unassociatedMedia = validPresentation({ mediaStored: true });
  assert.match(context.jumiContentIssues_(unassociatedMedia).join(" "), /source slide/);
});

test("Speaker association is dynamic, duplicate-safe, and independent per Presentation", () => {
  assert.match(backend, /jumiSpeakerRecords_/);
  assert.match(backend, /new Set\(speakerIds\)\.size===speakerIds\.length/);
  assert.match(backend, /Presentation must reference an existing speaker in that Seminar/);
  assert.match(backend, /already has a Presentation record/);
  assert.match(client, /records\.find\(record=>record\.typeData\?\.publication\?\.speakerId===speaker\.id\)/);
  assert.match(client, /Update \/ Replace/);
  assert.match(client, /One missing deck never blocks the Seminar or another speaker/);
});

test("JUMI accepts only validated PDF source, optional MP4, and optional approved infographic", () => {
  assert.match(client, /accept="application\/pdf"/);
  assert.match(client, /data-content-file="media" accept="video\/mp4"/);
  assert.match(client, /data-content-file="infographic" accept="image\/jpeg,image\/png"/);
  assert.match(backend, /media:\['video\/mp4'\]/);
  assert.match(backend, /infographic:\['image\/jpeg','image\/png'\]/);
  assert.match(backend, /Optional media and infographic files belong only to Presentations/);
  assert.doesNotMatch(client, /accept="[^\"]*(?:ppt|pptx)/i);
});

test("controlled publisher prepares source-faithful pages and hashes optional media", () => {
  const preparer = fs.readFileSync(path.join(__dirname, "prepare-presentation.js"), "utf8");
  assert.match(preparer, /imageSha256: hashFile\(plain\)/);
  assert.match(preparer, /textAvailable: Boolean\(text\)/);
  assert.match(preparer, /manifest\.videoSha256 = hashFile\(video\)/);
  assert.match(workflow, /VIDEO_ARGS/);
  assert.match(workflow, /--video/);
  assert.match(backend, /sourceDownloadApproved/);
  assert.match(backend, /mediaBlob/);
  assert.match(backend, /infographicBlob/);
});

test("published presentations integrate with their Seminar without manual event-page editing", () => {
  assert.match(eventTemplate, /presentations\.find\(p => p\.eventId === event\.id/);
  assert.match(eventTemplate, /p\.speakerId && p\.speakerId === speakerId/);
  assert.match(eventTemplate, /data-article-reader/);
  assert.match(publicClient, /data\.seminars\?\.\[presentation\.eventId\]/);
  assert.match(publicClient, /presentation\.downloadable===false/);
});

test("Presentation privacy and responsive safeguards remain locked", () => {
  assert.doesNotMatch(client, /JUMI_GITHUB_TOKEN|api\.github\.com|Drive File ID|Folder ID/);
  assert.match(backend, /Session\.getActiveUser\(\)\.getEmail\(\)/);
  assert.match(backend, /getSharingAccess\(\)===DriveApp\.Access\.PRIVATE/);
  assert.match(client, /Private preview · noindex/);
  const css = fs.readFileSync(path.join(root, "jumi/styles.css"), "utf8");
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /overflow-wrap:break-word;word-break:normal/);
});
