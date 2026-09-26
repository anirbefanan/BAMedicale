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

test("Disease Explorer destinations derive from result cardinality as the catalog grows", () => {
  const zero = [];
  const one = registry.records.slice(0, 1);
  const multiple = registry.records.slice(0, 2);
  assert.equal(zero.length, 0);
  assert.equal(registry.destination(zero, { disease: "cardiovascular" }), "library.html?disease=cardiovascular");
  assert.equal(one.length, 1);
  assert.equal(registry.destination(one, { disease: "hematologic" }), one[0].route);
  assert.ok(multiple.length > 1);
  assert.equal(registry.destination(multiple, { disease: "breast" }), "library.html?disease=breast");
});

test("disease classification preserves explicit groups and infers strong clinical evidence", () => {
  const explicit = registryApi.classifyDiseaseGroups({
    title: "Hypertension and High Blood Pressure",
    primaryDiseaseGroup: "infectious",
    secondaryDiseaseGroups: ["cancer-neoplastic"]
  }, data);
  assert.equal(explicit.primaryDiseaseGroup, "infectious");
  assert.deepEqual(explicit.secondaryDiseaseGroups, ["cancer-neoplastic", "cardiovascular"]);

  const breastCancer = registryApi.classifyDiseaseGroups({ title: "Breast Cancer Diagnosis" }, data);
  assert.equal(breastCancer.primaryDiseaseGroup, "breast");
  assert.deepEqual(breastCancer.secondaryDiseaseGroups, ["cancer-neoplastic"]);

  const lymphoma = registryApi.classifyDiseaseGroups({ title: "Lymphoma: Diagnosis and Care" }, data);
  assert.equal(lymphoma.primaryDiseaseGroup, "hematologic");
  assert.deepEqual(lymphoma.secondaryDiseaseGroups, ["cancer-neoplastic"]);

  assert.equal(registryApi.classifyDiseaseGroups({ title: "High Blood Pressure" }, data).primaryDiseaseGroup, "cardiovascular");
  assert.equal(registryApi.classifyDiseaseGroups({ title: "A General Health Question", topics: ["High Blood Pressure"] }, data).primaryDiseaseGroup, "cardiovascular");
  assert.equal(registryApi.classifyDiseaseGroups({ title: "Sporotrichosis in cats" }, data).primaryDiseaseGroup, "infectious");
  assert.equal(registryApi.classifyDiseaseGroups({ title: "Nutrition and Metabolic Disease Prevention" }, data).primaryDiseaseGroup, "endocrine-metabolic");
  assert.ok(registryApi.classifyDiseaseGroups({ title: "Nutrition and Metabolic Disease Prevention" }, data).secondaryDiseaseGroups.includes("nutritional"));
});

test("weak incidental mentions do not classify and unpublished content never activates a disease group", () => {
  const incidental = registryApi.classifyDiseaseGroups({
    title: "A General Overview of Health Decisions",
    summary: "This talk briefly mentions hypertension as one of several unrelated examples."
  }, data);
  assert.equal(incidental.primaryDiseaseGroup, "");
  assert.deepEqual(incidental.diseaseGroups, []);
  assert.deepEqual(registryApi.classifyDiseaseGroups({ title: "General Learning", body: "Breast cancer education." }, data).diseaseGroups, []);

  const fixtureData = structuredClone(data);
  fixtureData.articles["inferred-hypertension"] = {
    id: "inferred-hypertension", slug: "inferred-hypertension", title: "High Blood Pressure",
    publicationStatus: "published", primaryAudience: "PUBLIC", publishedDate: "2026-09-26", contentType: "Article"
  };
  fixtureData.articles["unpublished-breast"] = {
    id: "unpublished-breast", slug: "unpublished-breast", title: "Breast Cancer",
    publicationStatus: "draft", primaryAudience: "PUBLIC", contentType: "Article"
  };
  const inferredRegistry = registryApi.create(fixtureData);
  assert.equal(inferredRegistry.queryDisease("cardiovascular").length, registry.queryDisease("cardiovascular").length + 1);
  assert.ok(!inferredRegistry.queryDisease("breast").some((record) => record.id === "unpublished-breast"));
  delete fixtureData.articles["inferred-hypertension"];
  assert.equal(registryApi.create(fixtureData).queryDisease("cardiovascular").length, registry.queryDisease("cardiovascular").length);
});

test("Disease Explorer counts and Library results share one published disease query", () => {
  assert.equal(data.diseaseTaxonomy.length, 26);
  for (const group of data.diseaseTaxonomy) assert.equal(registryApi.classifyDiseaseGroups({ title: group.name }, data).primaryDiseaseGroup, group.id, `${group.id} should be covered by its canonical disease label`);
  for (const group of data.diseaseTaxonomy) {
    const count = registry.queryDisease(group.id).length;
    assert.equal(count, registry.query({ disease: group.id }).length);
    assert.equal(count > 0, registry.queryDisease(group.id).length > 0);
    assert.equal(registry.libraryPath({ disease: group.id }), `library.html?disease=${group.id}`);
  }
  assert.ok(registry.queryDisease("endocrine-metabolic").some((record) => record.family === "article"));
  assert.ok(registry.queryDisease("endocrine-metabolic").some((record) => record.family === "ebook"));
  assert.ok(registry.queryDisease("endocrine-metabolic").some((record) => record.family === "seminar"));
  assert.ok(registry.queryDisease("endocrine-metabolic").some((record) => record.family === "presentation"));
  assert.ok(registry.queryDisease("endocrine-metabolic").some((record) => record.family === "video"));
  assert.ok(registry.queryDisease("endocrine-metabolic", { type: "video", text: "thyroid" }).every((record) => record.family === "video"));
  const nutrilevelRelated = registry.related("nutri-level-metabolic-disease-prevention").map((record) => record.id);
  assert.ok(nutrilevelRelated.includes("youtube-yT5W5tNjKBM"));
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
  const baseline = registryApi.create(data);
  const audience = fixtureRegistry.query({ audience: "healthcare-worker", primaryAudienceOnly: true });
  assert.equal(audience.length, baseline.query({ audience: "healthcare-worker", primaryAudienceOnly: true }).length + 1);
  assert.equal(fixtureRegistry.query({ disease: "cardiovascular" }).length, baseline.query({ disease: "cardiovascular" }).length + 1);
  assert.equal(fixtureRegistry.query({ category: "healthcare-teamwork" }).length, baseline.query({ category: "healthcare-teamwork" }).length + 1);
  assert.ok(fixtureRegistry.search("Care Coordination").some(record => record.id === "healthcare-fixture"));
  assert.equal(fixtureRegistry.destination(audience.filter(record => record.id === "healthcare-fixture"), { audience: "healthcare-worker" }), "articles/healthcare-fixture.html");
});

test("Library query URLs are stable, combinable, and normalized", () => {
  assert.equal(
    registry.libraryPath({ audience: "HEALTHCARE WORKER", disease: "breast", type: "Case report", category: "diagnosis" }),
    "library.html?audience=healthcare-worker&category=diagnosis&disease=breast&type=case-report"
  );
  const dates = registry.query({ disease: "cancer-neoplastic" }).map((record) => record.sortDate);
  assert.deepEqual(dates, dates.slice().sort((a, b) => String(b).localeCompare(String(a))));
});
