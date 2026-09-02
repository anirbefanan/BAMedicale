const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const registryApi = require("../content-registry");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context);
const data = context.window.BAMEDICALE_DATA;
const videos = JSON.parse(fs.readFileSync(path.join(root, "data", "videos.json"), "utf8")).videos;
const originalVideos = JSON.parse(fs.readFileSync(path.join(root, "data", "original-videos.json"), "utf8")).videos;
const registry = registryApi.create(data, { videos, originalVideos });

test("canonical registry validates all current publishable content", () => {
  assert.equal(registryApi.validate(registry, data, { root, exists: (base, asset) => fs.existsSync(path.join(base, asset)) }), true);
  assert.equal(new Set(registry.records.map((record) => record.id)).size, registry.records.length);
});

test("Disease Explorer destinations derive from zero, one, and multiple published records", () => {
  const zero = registry.query({ disease: "cardiovascular" });
  const one = registry.query({ disease: "hematologic" });
  const multiple = registry.query({ disease: "breast" });
  assert.equal(zero.length, 0);
  assert.equal(registry.destination(zero, { disease: "cardiovascular" }), "library.html?disease=cardiovascular");
  assert.equal(one.length, 1);
  assert.equal(registry.destination(one, { disease: "hematologic" }), one[0].route);
  assert.ok(multiple.length > 1);
  assert.equal(registry.destination(multiple, { disease: "breast" }), "library.html?disease=breast");
});

test("Public and Doctor publications propagate through shared queries", () => {
  const publicArticle = registry.byId("tumor-vs-cancer-guide");
  assert.ok(publicArticle);
  assert.ok(registry.query({ audience: "public", primaryAudienceOnly: true }).some((record) => record.id === publicArticle.id));
  assert.ok(registry.query({ category: "public-tumor-cancer" }).some((record) => record.id === publicArticle.id));
  assert.ok(registry.search("Tumor vs Cancer").some((record) => record.id === publicArticle.id));

  const scientific = registry.byId("parotid-gland-metastasis-from-breast-cancer");
  assert.ok(scientific?.scientificWork);
  assert.equal(scientific.doi, "http://dx.doi.org/10.33371/ijoc.v14i3.723");
  assert.equal(scientific.publishedDate, "2026-09-01");
  assert.equal(scientific.sourceRecord.originalPublicationDateLabel, "September 2020");
  assert.ok(registry.query({ audience: "doctor", scientific: true, primaryAudienceOnly: true }).some((record) => record.id === scientific.id));
  assert.ok(registry.query({ category: "diagnosis" }).some((record) => record.id === scientific.id));
  assert.ok(registry.search("Bob Andinata parotid").some((record) => record.id === scientific.id));
  assert.ok(registry.related(scientific).length > 0);
});

test("Healthcare Worker fixture propagates without production content changes", () => {
  const fixtureData = structuredClone(data);
  fixtureData.articles["healthcare-fixture"] = {
    id: "healthcare-fixture",
    slug: "healthcare-fixture",
    title: "Healthcare Fixture",
    publicationStatus: "published",
    primaryAudience: "HEALTHCARE WORKER",
    primaryDiseaseGroup: "cardiovascular",
    diseaseCondition: "Cardiovascular care",
    primaryTopic: "Care Coordination",
    healthcareCategories: ["healthcare-teamwork"],
    contentType: "Healthcare Worker Education",
    publishedDate: "2026-09-02",
    excerpt: "Registry propagation fixture.",
    cover: "assets/medical/neoplasia-development.png"
  };
  const fixtureRegistry = registryApi.create(fixtureData);
  const audience = fixtureRegistry.query({ audience: "healthcare-worker", primaryAudienceOnly: true });
  assert.equal(audience.length, 1);
  assert.equal(fixtureRegistry.query({ disease: "cardiovascular" }).length, 1);
  assert.equal(fixtureRegistry.query({ category: "healthcare-teamwork" }).length, 1);
  assert.equal(fixtureRegistry.search("Care Coordination")[0].id, "healthcare-fixture");
  assert.equal(fixtureRegistry.destination(audience, { audience: "healthcare-worker" }), "articles/healthcare-fixture.html");
});

test("Library query URLs are stable, combinable, and normalized", () => {
  assert.equal(
    registry.libraryPath({ audience: "HEALTHCARE WORKER", disease: "breast", type: "Case report", category: "diagnosis" }),
    "library.html?audience=healthcare-worker&category=diagnosis&disease=breast&type=case-report"
  );
  const dates = registry.query({ disease: "cancer-neoplastic" }).map((record) => record.sortDate);
  assert.deepEqual(dates, dates.slice().sort((a, b) => String(b).localeCompare(String(a))));
});
