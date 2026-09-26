(function registerContentRegistry(globalObject, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (globalObject) globalObject.BAMEDICALE_REGISTRY = api;
})(typeof window !== "undefined" ? window : globalThis, function createRegistryApi() {
  // Internal audience values remain stable for stored content and URLs. Public
  // wording and order are defined here once for every browser/build consumer.
  const AUDIENCES = ["DOCTOR", "HEALTHCARE WORKER", "PUBLIC"];
  const PUBLIC_AUDIENCE_LABELS = Object.freeze({
    DOCTOR: "Doctors",
    "HEALTHCARE WORKER": "Healthcare Professionals",
    PUBLIC: "Public",
    ALL: "All"
  });
  const PUBLISHED = "published";
  const PROFESSIONAL_NAMES = Object.freeze({
    BOB_ANDINATA: "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"
  });
  // Deterministic, metadata-only disease classification. These are strong
  // clinical concepts and common synonyms mapped to the existing canonical
  // disease IDs; body text is deliberately excluded to avoid incidental hits
  // and repeated full-text scans during page initialization.
  const DISEASE_SIGNALS = Object.freeze({
    "cancer-neoplastic": /\b(?:cancer|cancers|malignan\w*|neoplas\w*|carcinoma\w*|oncolog\w*|tumou?rs?|lymphoma\w*|leuk[ae]mia\w*|myeloma\w*)\b/i,
    cardiovascular: /\b(?:cardiovascular(?: disease)?s?|hypertension|high blood pressure|blood pressure|heart disease|coronary artery disease|ischemic heart disease)\b/i,
    respiratory: /\b(?:respiratory disease\w*|pulmonary disease\w*|asthma|copd|chronic obstructive pulmonary disease|pneumonia|lung cancer|lung disease\w*)\b/i,
    neurological: /\b(?:neurolog\w* disease\w*|stroke|epilepsy|parkinson\w*|alzheimer\w*|dementia|migraine|brain tumour\w*|brain tumor\w*)\b/i,
    gastrointestinal: /\b(?:gastrointestinal disease\w*|digestive disease\w*|crohn(?:'s)? disease|ulcerative colitis|\bibs\b|irritable bowel syndrome|inflammatory bowel disease|gastritis|peptic ulcer\w*)\b/i,
    "liver-biliary-pancreatic": /\b(?:liver disease\w*|hepatic disease\w*|hepatitis|cirrhosis|biliary disease\w*|gallstone\w*|pancreatitis|pancreatic disease\w*)\b/i,
    "kidney-urinary": /\b(?:kidney disease\w*|renal disease\w*|chronic kidney disease|\bckd\b|urinary tract disease\w*|bladder disease\w*|nephropath\w*|urolithiasis)\b/i,
    "endocrine-metabolic": /\b(?:endocrine disease\w*|metabolic disease\w*|metabolic disorder\w*|thyroid\w*|diabetes(?: mellitus)?|diabetic\w*|dyslipid\w*|metabolic syndrome)\b/i,
    hematologic: /\b(?:hematolog\w* disease\w*|haematolog\w* disease\w*|lymphoma\w*|leuk[ae]mia\w*|myeloma\w*|blood disorder\w*|hematologic malignan\w*|haematologic malignan\w*)\b/i,
    infectious: /\b(?:infectious disease\w*|sporotrichosis|sporothrix|tuberculosis|malaria|dengue|fungal infection\w*|viral infection\w*|bacterial infection\w*|zoonosis|zoonotic disease\w*)\b/i,
    musculoskeletal: /\b(?:musculoskeletal disease\w*|osteoarthritis|rheumatoid arthritis|osteoporosis|fracture\w*|joint disease\w*|tendon disorder\w*|soft tissue sarcoma\w*)\b/i,
    "rheumatologic-autoimmune": /\b(?:rheumatologic disease\w*|rheumatoid arthritis|autoimmune disease\w*|autoimmune disorder\w*|systemic lupus|lupus erythematosus|scleroderma|vasculitis)\b/i,
    dermatologic: /\b(?:dermatologic disease\w*|skin disease\w*|dermatitis|eczema|psoriasis|melanoma\w*|skin cancer\w*|alopecia)\b/i,
    "obstetric-gynecologic": /\b(?:obstetric\w*|gynecolog\w*|gynaecolog\w*|endometriosis|polycystic ovary syndrome|\bpcos\b|ovarian cancer\w*|cervical cancer\w*|uterine cancer\w*|cervical disease\w*)\b/i,
    "male-reproductive": /\b(?:male reproductive disease\w*|prostate disease\w*|prostate cancer\w*|testicular disease\w*|testicular cancer\w*|erectile dysfunction|male infertility)\b/i,
    breast: /\b(?:breast disease\w*|breast cancer\w*|breast tumour\w*|breast tumor\w*|breast nodule\w*|breast lump\w*|mammary neoplasm\w*)\b/i,
    eye: /\b(?:eye disease\w*|ocular disease\w*|glaucoma|cataract\w*|retinopathy|macular degeneration|uveitis)\b/i,
    "ear-nose-throat": /\b(?:ear nose and throat|\bent disease\w*|otolaryngolog\w*|sinusitis|rhinitis|tonsillitis|laryngeal cancer\w*|nasopharyngeal cancer\w*)\b/i,
    "oral-dental": /\b(?:oral disease\w*|dental disease\w*|periodontal disease\w*|gingivitis|tooth decay|oral cancer\w*|mouth cancer\w*)\b/i,
    "allergic-immunologic": /\b(?:allerg\w* disease\w*|allergic disease\w*|immunologic disease\w*|immunodeficien\w*|anaphylaxis|allergic rhinitis)\b/i,
    "mental-behavioral": /\b(?:mental health disorder\w*|mental illness\w*|depression|anxiety disorder\w*|bipolar disorder\w*|schizophren\w*|eating disorder\w*|substance use disorder\w*)\b/i,
    "pediatric-congenital": /\b(?:pediatric disease\w*|paediatric disease\w*|congenital disorder\w*|congenital disease\w*|birth defect\w*|neonatal disease\w*|childhood cancer\w*)\b/i,
    "genetic-rare": /\b(?:genetic disorder\w*|genetic disease\w*|rare disease\w*|inherited disorder\w*|hereditary disease\w*|familial cancer\w*|germline mutation\w*)\b/i,
    nutritional: /\b(?:nutrition|nutritional disease\w*|malnutrition|undernutrition|nutrient deficienc\w*|nutrition-related disease\w*|front-of-pack|nutri-level|dietary disease\w*)\b/i,
    "injury-poisoning-other": /\b(?:injur\w*|poisoning|toxic exposure\w*|trauma\w*|overdose\w*|envenomation)\b/i,
    "preventive-public-health": /\b(?:public health|population health|epidemiolog\w*|disease prevention|cancer prevention|early detection|screening program\w*|health promotion)\b/i
  });
  const PRIMARY_DISEASE_TIE_ORDER = Object.freeze([
    "breast", "hematologic", "endocrine-metabolic", "cardiovascular", "respiratory", "neurological",
    "gastrointestinal", "liver-biliary-pancreatic", "kidney-urinary", "infectious", "musculoskeletal",
    "rheumatologic-autoimmune", "dermatologic", "obstetric-gynecologic", "male-reproductive", "eye",
    "ear-nose-throat", "oral-dental", "allergic-immunologic", "mental-behavioral", "pediatric-congenital",
    "genetic-rare", "nutritional", "injury-poisoning-other", "preventive-public-health", "cancer-neoplastic"
  ]);

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
    if (["HEALTHCARE WORKERS", "HEALTHCARE PROFESSIONAL", "HEALTHCARE PROFESSIONALS", "HEALTH WORKER", "HEALTH WORKERS", "OTHER HCP", "HCP", "HCW"].includes(normalized)) return "HEALTHCARE WORKER";
    return AUDIENCES.includes(normalized) ? normalized : "";
  };
  const audienceQueryValue = (value = "") => normalizeAudience(value).toLowerCase().replace(/\s+/g, "-");
  const publicAudienceLabel = (value = "") => PUBLIC_AUDIENCE_LABELS[normalizeAudience(value) || String(value).trim().toUpperCase()] || String(value);
  const publicAudienceList = (values = []) => {
    const normalized = compact(values).map(normalizeAudience).filter(Boolean);
    if (normalized.length === AUDIENCES.length && AUDIENCES.every((value) => normalized.includes(value))) return "All";
    return AUDIENCES.filter((value) => normalized.includes(value)).map(publicAudienceLabel).join(" + ");
  };
  const publicProfessionalText = (value = "") => {
    const text = String(value);
    if (!/Bob Andinata/i.test(text) || text.includes(PROFESSIONAL_NAMES.BOB_ANDINATA)) return text;
    const variants = [
      /dr\.\s*Bob Andinata,\s*Sp\.B\.Subsp\.Onk\s*\(K\)/gi,
      /dr\.\s*Bob Andinata,\s*Sp\.B\s*\(K\)\s*Onk/gi,
      /dr\.\s*Bob Andinata,\s*SpB\(K\)Onk/gi
    ];
    const variant = variants.find((pattern) => pattern.test(text));
    if (variant) {
      variant.lastIndex = 0;
      return text.replace(variant, PROFESSIONAL_NAMES.BOB_ANDINATA);
    }
    return text.replace(/(?:Dr\.\s*)?dr\.\s*Bob Andinata/gi, PROFESSIONAL_NAMES.BOB_ANDINATA);
  };
  const defaultEditorialDescription = (record = {}) => {
    const supplied = summaryFor(record);
    if (supplied) return supplied;
    const audience = normalizeAudience(record.primaryAudience);
    const type = String(record.contentType || record.label || "medical education").toLowerCase();
    const subject = compact([record.primaryTopic, record.topic, ...(record.topics || []), record.diseaseCondition || record.diseaseSite])[0] || "this medical subject";
    if (audience === "DOCTOR") return `${subject}: ${type} for clinical reasoning, diagnosis, management, and evidence-informed decisions.`;
    if (audience === "HEALTHCARE WORKER") return `${subject}: ${type} for multidisciplinary care, clinical workflows, coordination, and patient support.`;
    if (audience === "PUBLIC") return `${subject}: clear ${type} for understanding health, care, and informed discussions with Healthcare Professionals.`;
    return `${subject}: source-aware ${type} presented at the appropriate level of medical depth.`;
  };
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
  const classifyDiseaseGroups = (record, data = {}) => {
    const validIds = new Set((data.diseaseTaxonomy || []).map((group) => group.id));
    const canonicalNames = new Map((data.diseaseTaxonomy || []).map((group) => [group.id, String(group.name || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()]));
    const explicitPrimary = validIds.has(record.primaryDiseaseGroup) ? record.primaryDiseaseGroup : "";
    const explicitSecondary = compact(record.secondaryDiseaseGroups || []).filter((id) => validIds.has(id));
    const signals = [
      [record.title, 10], [record.subtitle, 8], [record.diseaseCondition || record.diseaseSite, 10],
      [record.primaryTopic, 8], [record.topic, 8], [record.topics, 8], [record.tags, 8],
      [record.categories, 7], [record.publicCategories, 7], [record.searchableMetadata, 7],
      [record.summary, 4], [record.excerpt, 4], [record.short_description, 4], [record.description, 4],
      [record.paper?.keywords, 7]
    ];
    const candidates = [];
    for (const [id, pattern] of Object.entries(DISEASE_SIGNALS)) {
      if (!validIds.has(id)) continue;
      const score = signals.reduce((best, [value, weight]) => {
        const text = Array.isArray(value) ? value.join(" ") : String(value || "");
        const normalizedText = text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ");
        const canonicalName = canonicalNames.get(id);
        return pattern.test(text) || (canonicalName && normalizedText.includes(canonicalName)) ? Math.max(best, weight) : best;
      }, 0);
      if (score >= 6) candidates.push({ id, score });
    }
    const rank = new Map(PRIMARY_DISEASE_TIE_ORDER.map((id, index) => [id, index]));
    candidates.sort((a, b) => b.score - a.score || (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99));
    const inferredPrimary = explicitPrimary || candidates.find(({ id }) => !explicitSecondary.includes(id))?.id || "";
    const inferredSecondary = candidates.map(({ id }) => id).filter((id) => id !== inferredPrimary);
    const secondaryDiseaseGroups = compact([...explicitSecondary, ...inferredSecondary]).filter((id) => id !== inferredPrimary);
    return {
      primaryDiseaseGroup: inferredPrimary,
      secondaryDiseaseGroups,
      diseaseGroups: compact([inferredPrimary, ...secondaryDiseaseGroups]),
      inferredDiseaseGroups: compact([inferredPrimary && !explicitPrimary ? inferredPrimary : "", ...inferredSecondary.filter((id) => !explicitSecondary.includes(id))]),
      classificationSource: explicitPrimary ? (inferredSecondary.some((id) => !explicitSecondary.includes(id)) ? "explicit+inferred" : "explicit") : inferredPrimary || inferredSecondary.length ? "inferred" : "unclassified"
    };
  };
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
  const matchesCategory = (record, category, diseaseGroups) => {
    const topics = topicsFor(record).map((value) => String(value).toLowerCase());
    const typeId = slugify(record.contentType);
    return Boolean(
      category.matchAnyPublished ||
      (category.matchTopics || []).some((value) => topics.includes(String(value).toLowerCase())) ||
      (category.matchContentTypes || []).some((value) => slugify(value) === typeId) ||
      (category.matchDiseaseGroups || []).some((value) => diseaseGroups.includes(value))
    );
  };
  const categoriesFor = (record, data, diseaseGroups) => compact([
    ...explicitCategoriesFor(record),
    ...categoryDefinitions(data).filter((category) => matchesCategory(record, category, diseaseGroups)).map((category) => category.id)
  ]);
  const doiFor = (record) => record.doi || record.paper?.articleInfo?.find(([label]) => /doi/i.test(label))?.[1] || record.paper?.publicationDetails?.match(/DOI:\s*([^\s·]+)/i)?.[1] || "";
  const affiliationFor = (record) => compact(record.affiliations || record.paper?.affiliations || []);
  const routeFor = (record, family) => {
    if (record.canonicalUrl) return record.canonicalUrl;
    if (family === "article") return `articles/${record.slug}.html`;
    if (family === "seminar") return record.detailUrl || `events/${record.slug}.html`;
    if (family === "ebook") return `ebooks/${record.slug}.html`;
    if (family === "video") return `videos.html?video=${encodeURIComponent(record.id)}`;
    return record.url || record.href || "resources.html";
  };
  const coverFor = (record, family) => record.cover || record.artwork || record.thumbnail || (family === "ebook" ? "assets/ebooks/default-ebook-cover.png" : family === "resource" ? "assets/medical/neoplasia-development.png" : "");
  const summaryFor = (record) => record.excerpt || record.summary || record.short_description || record.text || record.description || "";
  const labelFor = (record, family) => record.label || record.contentType || ({ article: "Article", seminar: "Seminar", ebook: "eBook", video: "Video", resource: "Resource" }[family]);

  const normalizeRecord = (record, family, data) => {
    const primaryAudience = normalizeAudience(record.primaryAudience);
    const secondaryAudiences = compact(record.secondaryAudiences || []).map(normalizeAudience).filter(Boolean);
    const contentType = record.contentType || labelFor(record, family);
    const publishedDate = normalizeDate(record.publishedDate);
    const originalPublicationDate = normalizeDate(record.sourcePublicationDate || record.originalPublicationDate || record.publish_date);
    const publicationStatus = normalizeStatus(record, publishedDate || (family === "video" && record.verified_identity) ? PUBLISHED : family === "ebook" ? "planned" : "draft");
    const authors = authorsFor(record);
    const topics = topicsFor(record);
    const diseaseClassification = classifyDiseaseGroups(record, data);
    const diseaseGroups = diseaseClassification.diseaseGroups;
    const categories = categoriesFor(record, data, diseaseGroups);
    const route = routeFor(record, family);
    const searchable = compact([
      record.title, publicProfessionalText(record.title), summaryFor(record), contentType, ...authors, ...affiliationFor(record),
      record.primaryDiseaseGroup, ...diseaseGroups, record.diseaseCondition || record.diseaseSite,
      ...categories, ...topics, doiFor(record), record.sourceAttribution, record.source_label,
      record.paper?.publicationDetails, record.paper?.keywords, ...(record.searchableMetadata || [])
    ]).join(" ").toLowerCase();
    return Object.freeze({
      id: record.id || `${family}-${record.slug || slugify(record.title)}`,
      slug: record.slug || slugify(record.title),
      title: publicProfessionalText(record.title),
      family,
      contentType,
      typeId: slugify(contentType),
      publicationStatus,
      primaryAudience,
      secondaryAudiences,
      audiences: compact([primaryAudience, ...secondaryAudiences]),
      primaryDiseaseGroup: diseaseClassification.primaryDiseaseGroup,
      secondaryDiseaseGroups: diseaseClassification.secondaryDiseaseGroups,
      diseaseGroups,
      inferredDiseaseGroups: diseaseClassification.inferredDiseaseGroups,
      diseaseClassificationSource: diseaseClassification.classificationSource,
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
      summary: defaultEditorialDescription(record),
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
      id: `navigation-${category.id}`, title: category.area || category.label, label: "Healthcare Professional topic",
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
      ...Object.values(data.presentations || {}).map((record) => normalizeRecord(record, "presentation", data)),
      ...Object.values(data.seminars || {}).map((record) => normalizeRecord(record, "seminar", data)),
      ...(data.ebooks || []).map((record) => normalizeRecord(record, "ebook", data)),
      ...(data.resources || []).map((record) => normalizeRecord(record, "resource", data)),
      ...(catalogs.videos || []).filter((record) => record.verified_identity).map((record) => normalizeRecord(record, "video", data)),
      ...(catalogs.originalVideos || []).filter((record) => record.verified_identity).map((record) => normalizeRecord(record, "video", data))
    ].sort(compareRecords);
    const byIdMap = new Map(records.map((record) => [record.id, record]));
    const navRecords = navigationRecords(data);
    const query = (filters = {}) => records.filter((record) => matchesFilters(record, { publishedOnly: filters.publishedOnly !== false, ...filters })).sort(compareRecords);
    const queryDisease = (disease, filters = {}) => query({ ...filters, disease });
    const search = (text = "") => {
      const terms = String(text).toLowerCase().split(/\s+/).filter(Boolean);
      return [...query({ text }), ...navRecords.filter((record) => terms.every((term) => record.searchable.includes(term)))];
    };
    const destination = (matchingRecords, filters = {}) => matchingRecords.length === 1 ? matchingRecords[0].route : libraryPath(filters);
    const related = (recordOrId, limit = 3) => {
      const record = typeof recordOrId === "string" ? byIdMap.get(recordOrId) : recordOrId;
      if (!record) return [];
      const relatedDiseaseGroups = (item) => compact([
        item.sourceRecord?.primaryDiseaseGroup || item.primaryDiseaseGroup,
        ...(item.sourceRecord?.secondaryDiseaseGroups || [])
      ]);
      const sourceDiseaseGroups = relatedDiseaseGroups(record);
      return query().filter((candidate) => candidate.id !== record.id).map((candidate) => {
        const sameCondition = record.diseaseCondition && slugify(candidate.diseaseCondition) === slugify(record.diseaseCondition);
        const diseaseOverlap = relatedDiseaseGroups(candidate).filter((value) => sourceDiseaseGroups.includes(value)).length;
        const categoryOverlap = candidate.categories.filter((value) => record.categories.includes(value)).length;
        const topicOverlap = candidate.topics.map(slugify).filter((value) => record.topics.map(slugify).includes(value)).length;
        const audienceOverlap = candidate.audiences.some((value) => record.audiences.includes(value));
        const score = (sameCondition ? 12 : 0) + diseaseOverlap * 6 + categoryOverlap * 4 + topicOverlap * 2 + (audienceOverlap ? 1 : 0) + (candidate.family === record.family ? 1 : 0);
        return { candidate, score };
      }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || compareRecords(a.candidate, b.candidate)).slice(0, limit).map((entry) => entry.candidate);
    };
    return Object.freeze({ records, navigationRecords: navRecords, byId: (id) => byIdMap.get(id), query, queryDisease, search, destination, related, libraryPath });
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
      if (record.primaryDiseaseGroup && !diseaseIds.has(record.primaryDiseaseGroup)) errors.push(`${record.id}: unknown primary disease group`);
      record.secondaryDiseaseGroups.forEach((id) => { if (!diseaseIds.has(id)) errors.push(`${record.id}: unknown secondary disease group ${id}`); });
      record.categories.forEach((id) => { if (!categoryIds.has(id)) errors.push(`${record.id}: unknown content category ${id}`); });
      if (record.publicationStatus === PUBLISHED && !record.route) errors.push(`${record.id}: published content missing route`);
      if (record.indexable && routes.has(record.route)) errors.push(`duplicate canonical route: ${record.route}`);
      if (record.indexable) routes.add(record.route);
      if (record.sourceRecord.publishedDate && !normalizeDate(record.sourceRecord.publishedDate)) errors.push(`${record.id}: invalid published date`);
      if (record.sourceRecord.updatedDate && !normalizeDate(record.sourceRecord.updatedDate)) errors.push(`${record.id}: invalid updated date`);
      if (record.cover && !/^https?:\/\//i.test(record.cover) && root && !exists(root, record.cover)) errors.push(`${record.id}: missing asset ${record.cover}`);
      if (record.sourceRecord.sourceFile && root && !exists(root, record.sourceRecord.sourceFile)) errors.push(`${record.id}: missing original source ${record.sourceRecord.sourceFile}`);
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

  return Object.freeze({ AUDIENCES, PUBLIC_AUDIENCE_LABELS, PROFESSIONAL_NAMES, PUBLISHED, create, validate, classifyDiseaseGroups, slugify, normalizeAudience, publicAudienceLabel, publicAudienceList, publicProfessionalText, defaultEditorialDescription, libraryPath });
});
