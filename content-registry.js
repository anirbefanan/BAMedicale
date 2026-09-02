(function registerContentRegistry(globalObject, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (globalObject) globalObject.BAMEDICALE_REGISTRY = api;
})(typeof window !== "undefined" ? window : globalThis, function createRegistryApi() {
  const AUDIENCES = ["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"];
  const PUBLISHED = "published";

  const compact = (values) => [...new Set((values || []).flat().filter(Boolean))];
  const slugify = (value = "") => String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const normalizeAudience = (value = "") => {
    const normalized = String(value).trim().replace(/-/g, " ").toUpperCase();
    if (normalized === "DOCTORS") return "DOCTOR";
    if (normalized === "HEALTHCARE WORKERS") return "HEALTHCARE WORKER";
    return AUDIENCES.includes(normalized) ? normalized : "";
  };
  const audienceQueryValue = (value = "") => normalizeAudience(value).toLowerCase().replace(/\s+/g, "-");
  const normalizeDate = (value = "") => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : "";
  const normalizeStatus = (record, fallback = "draft") => {
    const status = String(record.publicationStatus || record.status || "").toLowerCase();
    if (["published", "live", "available", "original upload"].includes(status)) return PUBLISHED;
    if (["draft", "planned", "coming-soon", "archived"].includes(status)) return status;
    return fallback;
  };
  const authorsFor = (record) => compact(
    record.authors?.map((author) => author?.name) ||
    [record.author?.name, record.person, record.source_label]
  );
  const diseaseGroupsFor = (record) => compact([record.primaryDiseaseGroup, ...(record.secondaryDiseaseGroups || [])]);
  const topicsFor = (record) => compact([record.primaryTopic, record.topic, ...(record.topics || []), ...(record.tags || [])]);
  const explicitCategoriesFor = (record) => compact([
    record.professionalCategory,
    ...(record.publicCategories || []),
    ...(record.healthcareCategories || []),
    record.resourceCategory
  ]);
  const categoryDefinitions = (data) => compact([
    ...(data.doctorContentCategories || []),
    ...(data.publicContentCategories || []),
    ...(data.healthcareWorkerContentCategories || []),
    ...(data.resourceCategories || [])
  ]);
  const matchesCategory = (record, category) => {
    const topics = topicsFor(record).map((value) => String(value).toLowerCase());
    const typeId = slugify(record.contentType);
    const diseaseGroups = diseaseGroupsFor(record);
    return Boolean(
      category.matchAnyPublished ||
      (category.matchTopics || []).some((value) => topics.includes(String(value).toLowerCase())) ||
      (category.matchContentTypes || []).some((value) => slugify(value) === typeId) ||
      (category.matchDiseaseGroups || []).some((value) => diseaseGroups.includes(value))
    );
  };
  const categoriesFor = (record, data) => compact([
    ...explicitCategoriesFor(record),
    ...categoryDefinitions(data).filter((category) => matchesCategory(record, category)).map((category) => category.id)
  ]);
  const doiFor = (record) => record.doi || record.paper?.articleInfo?.find(([label]) => /doi/i.test(label))?.[1] || record.paper?.publicationDetails?.match(/DOI:\s*([^\s·]+)/i)?.[1] || "";
  const affiliationFor = (record) => compact(record.affiliations || record.paper?.affiliations || []);
  const routeFor = (record, family) => {
    if (record.canonicalUrl) return record.canonicalUrl;
    if (family === "article") return `articles/${record.slug}.html`;
    if (family === "seminar") return record.detailUrl || `events/${record.slug}.html`;
    if (family === "ebook") return `ebook-detail.html?book=${encodeURIComponent(record.slug)}`;
    if (family === "video") return `videos.html?video=${encodeURIComponent(record.id)}`;
    return record.url || record.href || "resources.html";
  };
  const coverFor = (record, family) => record.cover || record.artwork || record.thumbnail || (family === "resource" ? "assets/medical/neoplasia-development.png" : "");
  const summaryFor = (record) => record.excerpt || record.summary || record.short_description || record.text || record.description || "";
  const labelFor = (record, family) => record.label || record.contentType || ({ article: "Article", seminar: "Seminar", ebook: "eBook", video: "Video", resource: "Resource" }[family]);

  const normalizeRecord = (record, family, data) => {
    const primaryAudience = normalizeAudience(record.primaryAudience);
    const secondaryAudiences = compact(record.secondaryAudiences || []).map(normalizeAudience).filter(Boolean);
    const contentType = record.contentType || labelFor(record, family);
    const publishedDate = normalizeDate(record.publishedDate);
    const originalPublicationDate = normalizeDate(record.originalPublicationDate || record.publish_date);
    const publicationStatus = normalizeStatus(record, publishedDate || (family === "video" && record.verified_identity) ? PUBLISHED : family === "ebook" ? "planned" : "draft");
    const authors = authorsFor(record);
    const topics = topicsFor(record);
    const diseaseGroups = diseaseGroupsFor(record);
    const categories = categoriesFor(record, data);
    const route = routeFor(record, family);
    const searchable = compact([
      record.title, summaryFor(record), contentType, ...authors, ...affiliationFor(record),
      record.primaryDiseaseGroup, ...diseaseGroups, record.diseaseCondition || record.diseaseSite,
      ...categories, ...topics, doiFor(record), record.sourceAttribution, record.source_label,
      record.paper?.publicationDetails, record.paper?.keywords, ...(record.searchableMetadata || [])
    ]).join(" ").toLowerCase();
    return Object.freeze({
      id: record.id || `${family}-${record.slug || slugify(record.title)}`,
      slug: record.slug || slugify(record.title),
      title: record.title,
      family,
      contentType,
      typeId: slugify(contentType),
      publicationStatus,
      primaryAudience,
      secondaryAudiences,
      audiences: compact([primaryAudience, ...secondaryAudiences]),
      primaryDiseaseGroup: record.primaryDiseaseGroup || "",
      secondaryDiseaseGroups: compact(record.secondaryDiseaseGroups || []),
      diseaseGroups,
      diseaseCondition: record.diseaseCondition || record.diseaseSite || "",
      categories,
      topics,
      authors,
      authorKeys: authors.map(slugify),
      affiliations: affiliationFor(record),
      doi: doiFor(record),
      source: record.sourceAttribution || record.source_label || record.paper?.publicationDetails || "",
      publishedDate,
      updatedDate: normalizeDate(record.updatedDate),
      originalPublicationDate,
      sortDate: normalizeDate(record.updatedDate) || publishedDate || originalPublicationDate,
      sortOrder: Number(record.sortOrder || 0),
      scientificWork: Boolean(record.scientificWork),
      schemaType: record.schemaType || (record.scientificWork ? "ScholarlyArticle" : family === "article" ? "Article" : ""),
      route,
      canonicalUrl: route,
      cover: coverFor(record, family),
      summary: summaryFor(record),
      label: labelFor(record, family),
      indexable: family === "article" || family === "seminar" || Boolean(record.indexable),
      searchable,
      sourceRecord: record
    });
  };

  const compareRecords = (a, b) => {
    const dateOrder = String(b.sortDate || "").localeCompare(String(a.sortDate || ""));
    return dateOrder || b.sortOrder - a.sortOrder || String(a.title || "").localeCompare(String(b.title || ""));
  };
  const matchesFilters = (record, filters = {}) => {
    const audience = normalizeAudience(filters.audience);
    const terms = String(filters.text || "").toLowerCase().split(/\s+/).filter(Boolean);
    return (!filters.publishedOnly || record.publicationStatus === PUBLISHED) &&
      (!audience || (filters.primaryAudienceOnly ? record.primaryAudience === audience : record.audiences.includes(audience))) &&
      (!filters.disease || record.diseaseGroups.includes(filters.disease)) &&
      (!filters.condition || slugify(record.diseaseCondition) === slugify(filters.condition)) &&
      (!filters.category || record.categories.includes(filters.category)) &&
      (!filters.topic || record.topics.some((topic) => slugify(topic) === slugify(filters.topic))) &&
      (!filters.type || record.typeId === slugify(filters.type)) &&
      (!filters.family || record.family === filters.family) &&
      (!filters.author || record.authorKeys.includes(slugify(filters.author))) &&
      (filters.scientific === undefined || record.scientificWork === filters.scientific) &&
      terms.every((term) => record.searchable.includes(term));
  };
  const libraryPath = (filters = {}) => {
    const values = {
      audience: filters.audience ? audienceQueryValue(filters.audience) : "",
      category: filters.category || "",
      disease: filters.disease || "",
      condition: filters.condition ? slugify(filters.condition) : "",
      topic: filters.topic ? slugify(filters.topic) : "",
      type: filters.type ? slugify(filters.type) : "",
      author: filters.author ? slugify(filters.author) : ""
    };
    const query = new URLSearchParams(Object.entries(values).filter(([, value]) => value));
    return `library.html${query.size ? `?${query}` : ""}`;
  };

  const navigationRecords = (data) => {
    const publicRecords = (data.publicContentCategories || []).map((category) => ({
      id: `navigation-${category.id}`, title: category.area || category.label, label: "Public guide",
      summary: category.description, route: category.fallbackHref || `public.html#${category.anchor}`, searchable: `${category.label} ${category.area} ${category.description}`.toLowerCase()
    }));
    const doctorRecords = (data.doctorContentCategories || []).map((category) => ({
      id: `navigation-${category.id}`, title: category.area || category.label, label: "Professional topic",
      summary: category.description, route: `clinical.html#${category.id}`, searchable: `${category.label} ${category.area} ${category.description}`.toLowerCase()
    }));
    const healthcareRecords = (data.healthcareWorkerContentCategories || []).map((category) => ({
      id: `navigation-${category.id}`, title: category.area || category.label, label: "Healthcare Worker topic",
      summary: category.description, route: `healthcare-workers.html#${category.anchor || category.id}`, searchable: `${category.label} ${category.area} ${category.description}`.toLowerCase()
    }));
    const diseaseRecords = (data.diseaseTaxonomy || []).map((group) => ({
      id: `navigation-disease-${group.id}`, title: group.name, label: "Disease Explorer",
      summary: group.descriptor, route: libraryPath({ disease: group.id }), searchable: `${group.name} ${group.descriptor}`.toLowerCase()
    }));
    return [...publicRecords, ...doctorRecords, ...healthcareRecords, ...diseaseRecords];
  };

  const create = (data = {}, catalogs = {}) => {
    const records = [
      ...Object.values(data.articles || {}).map((record) => normalizeRecord(record, "article", data)),
      ...Object.values(data.seminars || {}).map((record) => normalizeRecord(record, "seminar", data)),
      ...(data.ebooks || []).map((record) => normalizeRecord(record, "ebook", data)),
      ...(data.resources || []).map((record) => normalizeRecord(record, "resource", data)),
      ...(catalogs.videos || []).filter((record) => record.verified_identity).map((record) => normalizeRecord(record, "video", data)),
      ...(catalogs.originalVideos || []).filter((record) => record.verified_identity).map((record) => normalizeRecord(record, "video", data))
    ].sort(compareRecords);
    const byIdMap = new Map(records.map((record) => [record.id, record]));
    const navRecords = navigationRecords(data);
    const query = (filters = {}) => records.filter((record) => matchesFilters(record, { publishedOnly: filters.publishedOnly !== false, ...filters })).sort(compareRecords);
    const search = (text = "") => {
      const terms = String(text).toLowerCase().split(/\s+/).filter(Boolean);
      return [...query({ text }), ...navRecords.filter((record) => terms.every((term) => record.searchable.includes(term)))];
    };
    const destination = (matchingRecords, filters = {}) => matchingRecords.length === 1 ? matchingRecords[0].route : libraryPath(filters);
    const related = (recordOrId, limit = 3) => {
      const record = typeof recordOrId === "string" ? byIdMap.get(recordOrId) : recordOrId;
      if (!record) return [];
      return query().filter((candidate) => candidate.id !== record.id).map((candidate) => {
        const sameCondition = record.diseaseCondition && slugify(candidate.diseaseCondition) === slugify(record.diseaseCondition);
        const diseaseOverlap = candidate.diseaseGroups.filter((value) => record.diseaseGroups.includes(value)).length;
        const categoryOverlap = candidate.categories.filter((value) => record.categories.includes(value)).length;
        const topicOverlap = candidate.topics.map(slugify).filter((value) => record.topics.map(slugify).includes(value)).length;
        const audienceOverlap = candidate.audiences.some((value) => record.audiences.includes(value));
        const score = (sameCondition ? 12 : 0) + diseaseOverlap * 6 + categoryOverlap * 4 + topicOverlap * 2 + (audienceOverlap ? 1 : 0) + (candidate.family === record.family ? 1 : 0);
        return { candidate, score };
      }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || compareRecords(a.candidate, b.candidate)).slice(0, limit).map((entry) => entry.candidate);
    };
    return Object.freeze({ records, navigationRecords: navRecords, byId: (id) => byIdMap.get(id), query, search, destination, related, libraryPath });
  };

  const validate = (registry, data = {}, { root = "", exists = () => true } = {}) => {
    const errors = [];
    const ids = new Set();
    const slugs = new Set();
    const routes = new Set();
    const diseaseIds = new Set((data.diseaseTaxonomy || []).map((group) => group.id));
    const categoryIds = new Set(categoryDefinitions(data).map((category) => category.id));
    for (const record of registry.records) {
      if (!record.id) errors.push("content record missing id");
      else if (ids.has(record.id)) errors.push(`duplicate content id: ${record.id}`);
      ids.add(record.id);
      if (!record.slug) errors.push(`${record.id}: missing slug`);
      else if (slugs.has(record.slug)) errors.push(`duplicate content slug: ${record.slug}`);
      slugs.add(record.slug);
      if (!record.title) errors.push(`${record.id}: missing title`);
      if (!record.contentType) errors.push(`${record.id}: missing content type`);
      if (!record.primaryAudience) errors.push(`${record.id}: missing valid primary audience`);
      if (!record.primaryDiseaseGroup || !diseaseIds.has(record.primaryDiseaseGroup)) errors.push(`${record.id}: unknown primary disease group`);
      record.secondaryDiseaseGroups.forEach((id) => { if (!diseaseIds.has(id)) errors.push(`${record.id}: unknown secondary disease group ${id}`); });
      record.categories.forEach((id) => { if (!categoryIds.has(id)) errors.push(`${record.id}: unknown content category ${id}`); });
      if (record.publicationStatus === PUBLISHED && !record.route) errors.push(`${record.id}: published content missing route`);
      if (record.indexable && routes.has(record.route)) errors.push(`duplicate canonical route: ${record.route}`);
      if (record.indexable) routes.add(record.route);
      if (record.sourceRecord.publishedDate && !normalizeDate(record.sourceRecord.publishedDate)) errors.push(`${record.id}: invalid published date`);
      if (record.sourceRecord.updatedDate && !normalizeDate(record.sourceRecord.updatedDate)) errors.push(`${record.id}: invalid updated date`);
      if (record.cover && !/^https?:\/\//i.test(record.cover) && root && !exists(root, record.cover)) errors.push(`${record.id}: missing asset ${record.cover}`);
      if (record.sourceRecord.sourcePdf && root && !exists(root, record.sourceRecord.sourcePdf)) errors.push(`${record.id}: missing source PDF ${record.sourceRecord.sourcePdf}`);
      if (record.scientificWork) {
        const source = record.sourceRecord;
        if (!source.paper?.abstract?.length || !source.sections?.length || !source.references?.length) errors.push(`${record.id}: scientific source-lock metadata/body is incomplete`);
        if (!record.authors.length || !source.paper?.publicationDetails) errors.push(`${record.id}: scientific authors or original publication metadata missing`);
      }
    }
    if (errors.length) throw new Error(`Content registry validation failed:\n- ${errors.join("\n- ")}`);
    return true;
  };

  return Object.freeze({ AUDIENCES, PUBLISHED, create, validate, slugify, normalizeAudience, libraryPath });
});
