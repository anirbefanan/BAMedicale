const data = window.BAMEDICALE_DATA;
const BRAND = Object.freeze({
  name: data.brand?.name || "BA Medicale",
  domainDisplay: data.brand?.domainDisplay || "BAMedicale.com",
  logo: data.brand?.logo || "assets/brand/bamedicale-approved-logo.jpg"
});
const CONTACT = Object.freeze({
  email: "support@bamedicale.com",
  whatsappDisplay: "+62 821-236-6331",
  whatsappUrl: "https://wa.me/628212366331"
});
const registryApi = window.BAMEDICALE_REGISTRY;
let contentRegistry = registryApi.create(data);
let registryCatalogs = { videos: [], originalVideos: [] };
const GA4_MEASUREMENT_ID = "G-5Q36DG7PTC";
const ANALYTICS_SAFE_QUERY_KEYS = new Set(["disease", "book", "category", "audience", "type", "topic", "condition", "author", "video", "page"]);
const analyticsEnabled = () => !window.location.pathname.startsWith("/attendance/") && /(^|\.)bamedicale\.com$/i.test(window.location.hostname);
const analyticsPageUrl = () => {
  const url = new URL(window.location.href);
  const safe = new URL(`${url.origin}${url.pathname}`);
  [...url.searchParams.entries()].forEach(([key, value]) => {
    if (ANALYTICS_SAFE_QUERY_KEYS.has(key) && /^[a-z0-9-]{1,80}$/i.test(value)) safe.searchParams.set(key, value);
  });
  safe.hash = "";
  return safe.href;
};
const analyticsReferrer = () => {
  if (!document.referrer) return "";
  try {
    const source = new URL(document.referrer);
    if (source.origin !== window.location.origin) return `${source.origin}/`;
    const safe = new URL(`${source.origin}${source.pathname}`);
    [...source.searchParams.entries()].forEach(([key, value]) => {
      if (ANALYTICS_SAFE_QUERY_KEYS.has(key) && /^[a-z0-9-]{1,80}$/i.test(value)) safe.searchParams.set(key, value);
    });
    return safe.href;
  } catch {
    return "";
  }
};
const analyticsPageType = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (path.startsWith("articles/")) return "article";
  if (path.startsWith("events/")) return "event";
  return path.replace(/\.html$/i, "") || "home";
};
const analyticsParams = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => typeof value === "string" && value && value.length <= 100));
const trackAnalytics = (name, params = {}) => {
  if (!analyticsEnabled() || typeof window.gtag !== "function") return;
  window.gtag("event", name, analyticsParams({ page_type: analyticsPageType(), ...params }));
};
const analyticsContent = (contentType, content) => {
  if (!content) return analyticsParams({ content_type: contentType });
  return analyticsParams({
    content_type: contentType,
    content_id: String(content.id || content.slug || ""),
    content_slug: String(content.slug || ""),
    primary_audience: String(content.primaryAudience || ""),
    disease_group: String(content.primaryDiseaseGroup || ""),
    topic: String(content.primaryTopic || content.topic || "")
  });
};
const articleByPath = () => Object.values(data.articles || {}).find((item) => window.location.pathname.endsWith(`/articles/${item.slug}.html`));
const seminarByPath = () => Object.values(data.seminars || {}).find((item) => window.location.pathname.endsWith(`/${item.detailUrl}`));
const seminarByArtwork = (artwork) => Object.values(data.seminars || {}).find((item) => String(artwork || "").endsWith(String(item.artwork || "")));
const ebookBySlug = (slug) => (data.ebooks || []).find((item) => item.slug === slug);
const icon = (name) => {
  const shellIcons = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    whatsapp: '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.6l1.1-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.2c.3 2.2 2 4 4.2 4.8l1.2-1.2 2 .9c-.3 1.7-1.5 2.4-2.8 2.2-3.5-.6-6.9-4-7.5-7.5C5.9 6.1 6.6 4.9 8.3 4.6l.9 2L8 7.8"/>'
  };
  return shellIcons[name] ? `<svg aria-hidden="true" viewBox="0 0 24 24">${shellIcons[name]}</svg>` : `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
};
const diseaseIconPaths = {
  heart: '<path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M12 21S4 16 4 9a4 4 0 0 1 7-2.6A4 4 0 0 1 20 9c0 7-8 12-8 12Z"/>',
  lungs: '<path d="M12 4v8M10 8c-2-2-4-1-5 2l-2 7c-.5 2 1 3 3 3 3 0 5-2 5-5V9M14 8c2-2 4-1 5 2l2 7c.5 2-1 3-3 3-3 0-5-2-5-5V9"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 5 2V6a3 3 0 0 0-3-2Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 5 3 3 0 0 1-5 2V6a3 3 0 0 1 3-2Z"/>',
  digestive: '<path d="M9 3v7c0 2-3 2-3 5 0 4 3 6 7 6 5 0 8-3 8-8 0-3-2-6-5-6-3 0-3 3-5 3"/>',
  liver: '<path d="M4 7c5-4 13-4 16 1v5c-3 2-6 3-9 2l-3 4H5c1-4 1-8-1-12Z"/>',
  kidney: '<path d="M8 4C4 4 3 8 4 12s3 7 6 7V9C10 6 9 4 8 4Zm8 0c4 0 5 4 4 8s-3 7-6 7V9c0-3 1-5 2-5Z"/>',
  molecule: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="m7 10 3-3m4 0 3 3m0 4-3 3m-4 0-3-3"/>',
  blood: '<path d="M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z"/>',
  ribbon: '<path d="M12 4c-4-3-8 0-6 4l10 12M12 4c4-3 8 0 6 4L8 20"/>',
  microbe: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="13" r="1"/>',
  bone: '<path d="M7 7a3 3 0 1 1-4-4 3 3 0 0 1 4 4l10 10a3 3 0 1 1 4 4 3 3 0 0 1-4-4L7 7Z"/>',
  shield: '<path d="M12 3 20 6v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/><path d="M8 12h8M12 8v8"/>',
  skin: '<path d="M4 18c4-5 5-8 4-13m12 13c-4-5-5-8-4-13M8 9h8M7 14h10"/>',
  female: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8m-4-3h8"/>',
  male: '<circle cx="10" cy="14" r="5"/><path d="m14 10 6-6m-5 0h5v5"/>',
  breast: '<path d="M7 4c4 3 3 8 5 12 2-4 1-9 5-12M5 20c4-2 10-2 14 0"/><circle cx="12" cy="12" r="1"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  ear: '<path d="M8 17c-4-9 0-14 5-14 5 0 8 5 5 9-2 3-5 2-5 6 0 3-4 4-5-1Z"/><path d="M10 10c1-3 5-3 6 0"/>',
  tooth: '<path d="M7 3c-3 1-4 5-2 9l2 8c1 2 3 1 4-3l1-3 1 3c1 4 3 5 4 3l2-8c2-4 1-8-2-9-2-1-3 1-5 1S9 2 7 3Z"/>',
  immune: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3m0-14-3 3M8 16l-3 3"/>',
  mind: '<path d="M9 20H6v-4a8 8 0 1 1 13-6l2 4h-4v6h-5"/><path d="M11 8a2 2 0 1 0 2 3c2 0 2 3 0 3"/>',
  child: '<circle cx="12" cy="8" r="4"/><path d="M5 21c0-5 3-8 7-8s7 3 7 8M9 6 7 3m8 3 2-3"/>',
  dna: '<path d="M7 3c0 6 10 12 10 18M17 3C17 9 7 15 7 21M8 7h8m-6 5h4m-6 5h8"/>',
  nutrition: '<path d="M12 7c-2-4-6-3-7 1-2 7 3 13 7 13s9-6 7-13c-1-4-5-5-7-1Z"/><path d="M12 7c0-3 2-5 5-5"/>',
  aid: '<path d="m7 17 10-10a3 3 0 0 0-4-4L3 13a3 3 0 0 0 4 4Zm3-9 6 6M5 13l6 6"/>',
  prevention: '<path d="M12 3 20 6v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/><path d="M12 8v8M8 12h8"/>'
};
const diseaseIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${diseaseIconPaths[name] || diseaseIconPaths.prevention}</svg>`;
const route = window.location.pathname.split("/").pop().replace(".html", "") || "index";
document.body.classList.add(`route-${route}`);
const routePath = window.location.pathname.toLowerCase();
const mediumImmersionRoutes = new Set(["public", "clinical", "healthcare-workers", "about", "team", "seminar", "videos", "ebooks", "resources", "contact", "symposia"]);
const readingImmersionRoutes = new Set(["library", "search", "privacy-policy", "login", "traffic", "ebook-detail", "dr-bob-profile", "nana-febrina-profile", "melati-noerwa-profile", "adlina-karisyah-profile", "yudi-febriadi-profile"]);
const immersionLevel = route === "index" ? "high" : routePath.includes("/articles/") || routePath.includes("/events/") || readingImmersionRoutes.has(route) ? "reading" : mediumImmersionRoutes.has(route) ? "medium" : "reading";
document.body.classList.add(`immersion-${immersionLevel}`);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const safeUrl = (value, { external = false, hosts = [] } = {}) => {
  try {
    const url = new URL(String(value || "").trim(), window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    if (!sameOrigin && (!external || url.protocol !== "https:")) return "";
    if (sameOrigin && !["http:", "https:"].includes(url.protocol)) return "";
    if (!sameOrigin && hosts.length && !hosts.includes(url.hostname)) return "";
    return sameOrigin ? `${url.pathname}${url.search}${url.hash}` : url.href;
  } catch {
    return "";
  }
};
const safeInternalUrl = (value) => safeUrl(value);
const safeExternalUrl = (value) => safeUrl(value, { external: true });
const safeImageUrl = (value) => safeUrl(value, { external: true, hosts: ["i.ytimg.com"] });
const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {}
  }
  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.opacity = "0";
  document.body.append(fallback);
  fallback.select();
  const copied = document.execCommand("copy");
  fallback.remove();
  return copied;
};
const safeYouTubeEmbedUrl = (value) => {
  const safe = safeUrl(value, { external: true, hosts: ["www.youtube-nocookie.com"] });
  if (!safe) return "";
  const url = new URL(safe);
  return /^\/embed\/[A-Za-z0-9_-]{6,}$/.test(url.pathname) ? url : "";
};
const protectExternalLinks = (root = document) => {
  root.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const href = safeExternalUrl(link.getAttribute("href"));
    if (href) link.setAttribute("href", href);
    else link.removeAttribute("href");
    link.setAttribute("rel", "noopener noreferrer");
  });
};
const articleRecords = () => Object.values(data.articles || {}).sort((a, b) => {
  const dateOrder = String(b.updatedDate || b.publishedDate || "").localeCompare(String(a.updatedDate || a.publishedDate || ""));
  return dateOrder || Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
});
const articlePath = (article) => `articles/${article.slug}.html`;
const formatPublishedDate = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
};
const articlePrimaryAudience = (article) => registryApi.publicAudienceLabel(article.primaryAudience || "PUBLIC");
const articleAuthor = (article) => article.authors?.length ? article.authors.map((author) => author.name).join(", ") : article.author?.name || "BA Medicale";
const diseaseGroupById = (id) => (data.diseaseTaxonomy || []).find((group) => group.id === id);
const articleDiseaseCondition = (article) => article.diseaseCondition || article.diseaseSite || "";
const publishedContentForDisease = (disease) => contentRegistry.query({ disease });
const diseaseContentDestination = (records, disease) => contentRegistry.destination(records, { disease });
const doctorContentCategories = () => data.doctorContentCategories || [];
const doctorCategoryById = (id) => doctorContentCategories().find((category) => category.id === id);
const publicContentCategories = () => data.publicContentCategories || [];
const allContentCategories = () => [...doctorContentCategories(), ...publicContentCategories(), ...(data.healthcareWorkerContentCategories || []), ...(data.resourceCategories || [])];
const contentCategoryById = (id) => allContentCategories().find((category) => category.id === id);
const publishedContentForAudience = (audience) => contentRegistry.query({ audience, primaryAudienceOnly: true });
const publishedDoctorScientificContent = () => contentRegistry.query({ audience: "DOCTOR", primaryAudienceOnly: true, scientific: true });
const libraryPath = (params = {}) => contentRegistry.libraryPath(params);
const doctorContentForCategory = (category) => contentRegistry.query({ audience: "DOCTOR", primaryAudienceOnly: true, category });
const doctorContentDestination = (records, params = {}) => contentRegistry.destination(records, { audience: "DOCTOR", ...params });
const publicContentForCategory = (category) => contentRegistry.query({ audience: "PUBLIC", primaryAudienceOnly: true, category });
const publicContentDestination = (records, params = {}) => contentRegistry.destination(records, { audience: "PUBLIC", ...params });
const healthcareContentCategories = () => data.healthcareWorkerContentCategories || [];
const healthcareContentForCategory = (category) => contentRegistry.query({ audience: "HEALTHCARE WORKER", primaryAudienceOnly: true, category });
const contentRecordMeta = (record) => `${record.contentType}${record.publishedDate ? ` · Published ${formatPublishedDate(record.publishedDate)}` : record.originalPublicationDate ? ` · Original source ${formatPublishedDate(record.originalPublicationDate)}` : ""}`;
const audienceLabel = value => registryApi.publicAudienceLabel(value);
const recordAudience = record => registryApi.publicAudienceList(record.audiences || []) || "All";
const discoveryActionLabel = record => ({ article: "Read Article", ebook: "Open eBook", seminar: "View Seminar", video: "Watch Video", presentation: "Full Read" }[record.family] || "Open resource");
const discoveryTypeLabel = record => ({ article: "Article", ebook: "eBook", seminar: "Seminar", video: "Video", presentation: "Presentation" }[record.family] || record.contentType);
const discoveryActions = record => `${record.family === "presentation" && data.presentations?.[record.id]?.quickRead?.length ? `<a href="${escapeHtml(record.route)}" data-article-reader="${escapeHtml(record.id)}">Quick Read</a>` : ""}<a href="${escapeHtml(record.route)}">${discoveryActionLabel(record)}</a>`;
const discoveryArtworkProfile = (record) => {
  const evidence = [record.primaryDiseaseGroup, record.diseaseCondition, record.contentType, ...(record.topics || []), ...(record.tags || [])].join(" ").toLowerCase();
  const profiles = [
    [/thyroid|endocrin/, ["thyroid", "dna"]],
    [/cardio|heart|blood pressure|hypertension/, ["cardiovascular", "heart"]],
    [/patholog|cytolog|histolog|cell/, ["pathology", "molecule"]],
    [/cancer|oncolog|neoplas|tumou?r/, ["oncology", "ribbon"]],
    [/radiolog|imaging|ultrasound|diagnos/, ["diagnosis", "eye"]],
    [/therapy|treatment|surgery|therapeut/, ["therapeutics", "aid"]],
    [/respirat|lung/, ["respiratory", "lungs"]],
    [/neurolog|brain/, ["neurology", "brain"]],
    [/kidney|urinary|renal/, ["renal", "kidney"]]
  ];
  const match = profiles.find(([pattern]) => pattern.test(evidence));
  const [context, motif] = match?.[1] || [record.primaryAudience === "PUBLIC" ? "public-education" : "clinical-learning", record.family === "video" ? "eye" : "dna"];
  return { context, motif };
};
const discoveryDefaultArtwork = (record) => {
  const profile = discoveryArtworkProfile(record);
  const artworkIcon = diseaseIcon(profile.motif);
  return `<span class="discovery-artwork" data-artwork-context="${escapeHtml(profile.context)}" role="img" aria-label="BA Medicale editorial artwork for ${escapeHtml(record.title)}"><span class="discovery-artwork__grid" aria-hidden="true"></span><span class="discovery-artwork__orbit" aria-hidden="true"></span><span class="discovery-artwork__symbol" aria-hidden="true">${artworkIcon}</span><span class="discovery-artwork__type">${escapeHtml(discoveryTypeLabel(record))}</span><span class="discovery-artwork__context">${escapeHtml((record.topics || [])[0] || record.diseaseCondition || "Medical learning")}</span></span>`;
};
const discoveryMedia = (record, eager = false) => {
  const image = record.cover ? `<img src="${escapeHtml(safeImageUrl(record.cover))}" alt="" width="640" height="360" loading="${eager ? "eager" : "lazy"}"${record.family === "video" ? ' referrerpolicy="no-referrer"' : ""}>` : "";
  const artwork = discoveryDefaultArtwork(record);
  if (record.family === "presentation") return `<button class="discovery-card__media presentation-infographic" type="button" data-seminar-poster="${escapeHtml(safeImageUrl(record.cover))}" data-seminar-poster-alt="${escapeHtml(record.title)} — presentation infographic" data-poster-title="Presentation infographic" aria-label="Enlarge presentation infographic">${image}</button>`;
  return `<a class="discovery-card__media${record.cover ? "" : " is-default-artwork"}" href="${escapeHtml(record.route)}" aria-label="${escapeHtml(discoveryActionLabel(record) + ': ' + record.title)}">${artwork}${image}${record.family === "video" ? '<span class="discovery-card__play" aria-hidden="true">▶</span>' : ""}</a>`;
};
const discoveryCard = (record, { eager = false, showSummary = true, variant = "standard", identityLabel = "", metaLabel = "" } = {}) => `<article class="discovery-card discovery-card--${escapeHtml(variant)}" data-family="${escapeHtml(record.family || "resource")}" data-audience="${escapeHtml(String(record.primaryAudience || "ALL").toLowerCase().replace(/\s+/g, "-"))}"${record.id ? ` data-content-id="${escapeHtml(record.id)}"` : ""}>${discoveryMedia(record, eager)}<div class="discovery-card__body"><div class="discovery-card__labels"><span>${escapeHtml(identityLabel || discoveryTypeLabel(record))}</span><span>${escapeHtml(recordAudience(record))}</span></div><h3><a href="${escapeHtml(record.route)}">${escapeHtml(record.title)}</a></h3>${showSummary && record.summary ? `<p>${escapeHtml(record.summary)}</p>` : ""}<div class="discovery-card__meta">${record.sortDate ? `<time datetime="${escapeHtml(record.sortDate)}">${escapeHtml(formatPublishedDate(record.sortDate))}</time>` : ""}${metaLabel || (record.topics || [])[0] ? `<span>${escapeHtml(metaLabel || record.topics[0])}</span>` : ""}</div></div><div class="discovery-card__actions">${discoveryActions(record)}</div></article>`;
const videoDurationLabel = seconds => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return "";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainder = Math.floor(value % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}` : `${minutes}:${String(remainder).padStart(2, "0")}`;
};
const videoCoverflowCard = (record, index) => {
  const original = record.sourceRecord.source === "ba-medicale";
  const cover = safeImageUrl(record.cover);
  const media = cover ? `<img src="${escapeHtml(cover)}" alt="" width="960" height="540" loading="${index < 2 ? "eager" : "lazy"}"${original ? "" : ' referrerpolicy="no-referrer"'}>` : discoveryDefaultArtwork(record);
  const duration = videoDurationLabel(record.sourceRecord.duration_seconds);
  const playAttribute = original ? `data-video-local="${escapeHtml(record.id)}"` : `data-video-play="${escapeHtml(record.id)}"`;
  return `<article class="video-coverflow__card" data-video-coverflow-card data-coverflow-index="${index}" data-content-id="${escapeHtml(record.id)}" data-source="${original ? "ba-medicale" : "youtube"}"><button class="video-coverflow__media${cover ? "" : " is-default-artwork"}" type="button" data-video-coverflow-select="${index}" aria-label="Center ${escapeHtml(record.title)}">${media}<span class="video-coverflow__media-shade" aria-hidden="true"></span><span class="video-coverflow__play-mark" aria-hidden="true">▶</span></button><div class="video-coverflow__copy"><p class="video-coverflow__provenance">${original ? "BA Medicale Original" : "YouTube · Dr. Bob"}</p><h3>${escapeHtml(record.title)}</h3><div class="video-coverflow__meta">${record.sortDate ? `<time datetime="${escapeHtml(record.sortDate)}">${escapeHtml(formatPublishedDate(record.sortDate))}</time>` : ""}${duration ? `<span>${escapeHtml(duration)}</span>` : ""}</div><button class="video-coverflow__action" type="button" ${playAttribute} data-video-coverflow-play aria-label="Play ${escapeHtml(record.title)}">Play Video <span aria-hidden="true">▶</span></button></div></article>`;
};
function initVideoCoverflow(root) {
  if (!root || root.dataset.coverflowReady === "true") return;
  const cards = [...root.querySelectorAll("[data-video-coverflow-card]")];
  const previous = root.querySelector('[data-video-coverflow-nav="previous"]');
  const next = root.querySelector('[data-video-coverflow-nav="next"]');
  const indicators = root.querySelector("[data-video-coverflow-indicators]");
  const status = root.querySelector("[data-video-coverflow-status]");
  const stage = root.querySelector(".video-coverflow__stage");
  const track = root.querySelector(".video-coverflow__track");
  if (!cards.length || !previous || !next || !indicators || !status || !stage || !track) return;
  root.dataset.coverflowReady = "true";
  let activeIndex = 0;
  let startX = 0;
  let dragX = 0;
  let pointerId = null;
  let dragged = false;
  let suppressClick = false;
  indicators.replaceChildren(...cards.map((card, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.dataset.videoCoverflowDot = String(index);
    dot.setAttribute("aria-label", `Show video ${index + 1}: ${card.querySelector("h3")?.textContent || "Video"}`);
    dot.addEventListener("click", () => setActive(index));
    return dot;
  }));
  const dots = [...indicators.querySelectorAll("button")];
  const setActive = (index, { announce = true } = {}) => {
    activeIndex = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, cardIndex) => {
      const position = cardIndex - activeIndex;
      const visiblePosition = Math.max(-3, Math.min(3, position));
      card.dataset.coverflowPosition = String(visiblePosition);
      card.toggleAttribute("data-coverflow-far", Math.abs(position) > 3);
      card.toggleAttribute("data-coverflow-active", position === 0);
      card.setAttribute("aria-hidden", Math.abs(position) > 2 ? "true" : "false");
      const selector = card.querySelector("[data-video-coverflow-select]");
      const play = card.querySelector("[data-video-coverflow-play]");
      selector.tabIndex = Math.abs(position) <= 2 ? 0 : -1;
      selector.setAttribute("aria-label", position === 0 ? `Play current video: ${card.querySelector("h3")?.textContent || "Video"}` : `Center ${card.querySelector("h3")?.textContent || "video"}`);
      play.disabled = position !== 0;
      play.tabIndex = position === 0 ? 0 : -1;
      play.setAttribute("aria-hidden", position === 0 ? "false" : "true");
    });
    dots.forEach((dot, dotIndex) => {
      dot.toggleAttribute("data-active", dotIndex === activeIndex);
      dot.setAttribute("aria-current", dotIndex === activeIndex ? "true" : "false");
    });
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
    previous.hidden = cards.length < 2;
    next.hidden = cards.length < 2;
    indicators.hidden = cards.length < 2;
    const title = cards[activeIndex].querySelector("h3")?.textContent || "Video";
    status.textContent = `${activeIndex + 1} of ${cards.length}: ${title}`;
    if (!announce) status.setAttribute("aria-live", "off"); else status.setAttribute("aria-live", "polite");
  };
  const move = direction => setActive(activeIndex + direction);
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  cards.forEach((card, index) => card.querySelector("[data-video-coverflow-select]").addEventListener("click", event => {
    if (suppressClick && event.isTrusted) {
      event.preventDefault();
      return;
    }
    if (index !== activeIndex) setActive(index);
    else card.querySelector("[data-video-coverflow-play]")?.click();
  }));
  stage.addEventListener("click", event => {
    if (suppressClick || event.target.closest("[data-video-coverflow-select], [data-video-coverflow-nav], [data-video-coverflow-play]")) return;
    const bounds = stage.getBoundingClientRect();
    const offset = event.clientX - (bounds.left + bounds.width / 2);
    if (Math.abs(offset) < Math.min(120, bounds.width * .24)) return;
    move(offset < 0 ? -1 : 1);
  });
  root.addEventListener("keydown", event => {
    if (event.target.closest("[data-video-coverflow-play]") || event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (direction) {
      event.preventDefault();
      move(direction);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(cards.length - 1);
    }
  });
  stage.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("[data-video-coverflow-nav], [data-video-coverflow-play]") || cards.length < 2) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    dragX = 0;
    dragged = false;
    stage.setPointerCapture(pointerId);
    root.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", event => {
    if (pointerId !== event.pointerId) return;
    dragX = event.clientX - startX;
    dragged ||= Math.abs(dragX) > 8;
    track.style.transform = `translate3d(${Math.max(-72, Math.min(72, dragX))}px,0,0)`;
  });
  const endDrag = event => {
    if (pointerId !== event.pointerId) return;
    if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
    pointerId = null;
    track.style.transform = "";
    root.classList.remove("is-dragging");
    if (dragged) {
      suppressClick = true;
      if (Math.abs(dragX) >= 42) move(dragX < 0 ? 1 : -1);
      setTimeout(() => { suppressClick = false; }, 0);
    }
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  setActive(0, { announce: false });
  requestAnimationFrame(() => status.setAttribute("aria-live", "polite"));
}
const initDiscoveryImageFallbacks = (root = document) => {
  root.querySelectorAll('.discovery-card__media img:not([data-fallback-bound]), .discovery-related-card__media img:not([data-fallback-bound])').forEach((image) => {
    image.dataset.fallbackBound = 'true';
    const fallback = () => {
      if (image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = 'true';
      image.classList.add('is-unavailable');
      image.closest('.discovery-card__media, .discovery-related-card__media')?.classList.add('is-default-artwork');
    };
    image.addEventListener('error', fallback, { once: true });
    if (image.complete && !image.naturalWidth) fallback();
  });
};
const loadContentRegistry = async () => {
  const needsCatalogs = document.querySelector("[data-disease-explorer], [data-article-library], [data-content-discovery], [data-search-results], [data-video-hub], [data-video-preview-list], [data-doctor-categories], [data-public-categories], [data-healthcare-categories], [data-healthcare-worker-content], [data-home-updates]");
  if (!needsCatalogs) return contentRegistry;
  const load = async (path) => {
    const response = await fetch(`${navigationRoot()}${path}`);
    if (!response.ok) throw new Error(`${path} unavailable`);
    return response.json();
  };
  try {
    const [videos, originals] = await Promise.all([load("data/videos.json"), load("data/original-videos.json")]);
    registryCatalogs = { videos: videos.videos || [], originalVideos: originals.videos || [] };
    contentRegistry = registryApi.create(data, registryCatalogs);
  } catch {
    contentRegistry = registryApi.create(data);
  }
  return contentRegistry;
};
const PRIMARY_NAVIGATION = Object.freeze([
  { label: "Education", items: [
    { label: "For Doctors", href: "clinical.html" },
    { label: "For Healthcare Professionals", href: "healthcare-workers.html" },
    { label: "For Public", href: "public.html" }
  ] },
  { label: "Knowledge", items: [
    { label: "Library & Articles", href: "library.html" },
    { label: "Videos", href: "videos.html" },
    { label: "eBooks", href: "ebooks.html" },
    { label: "Resources", href: "resources.html" }
  ] },
  { label: "Learning", items: [{ label: "Courses & Seminars", href: "seminar.html" }] },
  { label: "About", items: [
    { label: "BA Medicale", href: "about.html" },
    { label: "Team", href: "team.html" },
    { label: "Traffic", href: "traffic.html" },
    { label: "Contact Us", href: "contact.html" }
  ] }
]);
const HOME_NAVIGATION = Object.freeze({ label: "Home", href: "index.html" });
const MEMBER_NAVIGATION = Object.freeze({ label: "Member Login", href: "login.html" });
const navigationRoot = () => window.location.pathname.replace(/^\/+/, "").split("/").filter(Boolean).length > 1 ? "../" : "";
const navigationHref = (href) => `${navigationRoot()}${href}`;
const navigationContext = () => {
  const pathname = window.location.pathname.toLowerCase();
  const route = pathname.split("/").pop() || "index.html";
  if (pathname === "/" || route === "index.html") return { top: "home" };
  if (["public.html", "clinical.html", "healthcare-workers.html"].includes(route)) return { group: "Education", child: route };
  if (pathname.includes("/articles/")) return { group: "Knowledge", child: "library.html" };
  if (["library.html", "videos.html", "ebooks.html", "ebook-detail.html", "resources.html"].includes(route)) return { group: "Knowledge", child: route === "ebook-detail.html" ? "ebooks.html" : route };
  if (route === "search.html") return { group: "Knowledge", top: "search" };
  if (pathname.includes("/events/") || ["seminar.html", "symposia.html"].includes(route)) return { group: "Learning", child: "seminar.html" };
  if (route === "login.html") return { top: "member" };
  if (route === "about.html") return { group: "About", child: "about.html" };
  if (route === "team.html" || route.endsWith("-profile.html")) return { group: "About", child: "team.html" };
  if (route === "traffic.html") return { group: "About", child: "traffic.html" };
  return { group: "About", child: route === "contact.html" ? "contact.html" : null };
};
const navigationLink = (item, className = "") => {
  const context = navigationContext();
  const current = item.href === HOME_NAVIGATION.href ? context.top === "home" : context.child === item.href;
  return `<a${className ? ` class="${className}"` : ""} href="${navigationHref(item.href)}"${current ? ' aria-current="page"' : ""}>${item.label}</a>`;
};
const navigationGroups = () => {
  const context = navigationContext();
  return PRIMARY_NAVIGATION.map((group) => `<details class="nav-group${context.group === group.label ? " nav-group--current" : ""}"><summary>${group.label}</summary><div class="nav-group__panel">${group.items.map(navigationLink).join("")}</div></details>`).join("");
};

function shell() {
  document.querySelectorAll("[data-shell]").forEach((target) => {
    const member = MEMBER_NAVIGATION;
    const groups = navigationGroups();
    const context = navigationContext();
    const home = navigationLink(HOME_NAVIGATION, "nav-main__home");
    const mobileHome = navigationLink(HOME_NAVIGATION, "nav-mobile__home");
    const memberCurrent = context.top === "member" ? ' aria-current="page"' : "";
    const searchCurrent = context.top === "search" ? ' aria-current="page"' : "";
    target.innerHTML = `<header class="site-header"><a class="brand" href="${navigationHref("index.html")}" aria-label="${BRAND.name} home"><img src="${navigationHref(BRAND.logo)}" alt="${BRAND.name} official logo"><span><b>${BRAND.name}</b><small>EST. 2024</small></span></a><nav class="nav-main" aria-label="Primary">${home}${groups}</nav><div class="nav-actions"><a class="search-button" href="${navigationHref("search.html")}" aria-label="Search ${BRAND.name}"${searchCurrent}>${icon("search")}</a><a class="button button-dark" href="${navigationHref(member.href)}"${memberCurrent}>${member.label}</a><button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-navigation">${icon("menu")}</button></div></header><nav class="nav-mobile" id="mobile-navigation" aria-label="Mobile navigation">${mobileHome}${groups}<a class="nav-mobile__search" href="${navigationHref("search.html")}"${searchCurrent}>${icon("search")}<span>Search</span></a><a class="button button-dark nav-mobile__member" href="${navigationHref(member.href)}"${memberCurrent}>${member.label}</a></nav>`;
  });
  document.querySelectorAll("[data-footer]").forEach((target) => {
    target.innerHTML = `<footer class="site-footer">
      <div class="footer-brand"><a class="brand brand--footer" href="${navigationHref("index.html")}"><img src="${navigationHref(BRAND.logo)}" alt="${BRAND.name} official logo"><span><b>${BRAND.name}</b><small>Physician-led medical education</small></span></a><p>Education across diseases and health conditions, with dedicated depth in cancer, neoplasia, and surgical oncology. Information supports learning and does not replace individualized medical care.</p></div>
      <div class="footer-group"><h2>Explore</h2><a href="${navigationHref("clinical.html")}">For Doctors</a><a href="${navigationHref("healthcare-workers.html")}">For Healthcare Professionals</a><a href="${navigationHref("public.html")}">For Public</a><a href="${navigationHref("library.html")}">Library &amp; Articles</a><a href="${navigationHref("seminar.html")}">Courses &amp; Seminars</a><a href="${navigationHref("ebooks.html")}">eBooks</a><a href="${navigationHref("videos.html")}">Videos</a><a href="${navigationHref("resources.html")}">Resources</a></div>
      <div class="footer-group"><h2>BA Medicale</h2><a href="${navigationHref("about.html")}">About BA Medicale</a><a href="${navigationHref("team.html")}">Team</a><a href="${navigationHref("traffic.html")}">Traffic</a><a href="${navigationHref("contact.html")}">Contact Us</a><a href="${navigationHref("privacy-policy.html")}">Privacy Policy</a></div>
      <div class="footer-group footer-connect"><h2>Contact</h2><address class="footer-contact-actions"><a class="footer-contact-action" href="mailto:${CONTACT.email}" aria-label="Email BA Medicale at ${CONTACT.email}"><span class="footer-contact-action__icon">${icon("email")}</span><span class="footer-contact-action__copy"><small>Email</small><strong>${CONTACT.email}</strong></span></a><a class="footer-contact-action" href="${CONTACT.whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="Contact BA Medicale on WhatsApp at ${CONTACT.whatsappDisplay}"><span class="footer-contact-action__icon">${icon("whatsapp")}</span><span class="footer-contact-action__copy"><small>WhatsApp</small><strong>${CONTACT.whatsappDisplay}</strong></span></a></address>
        <h2 class="footer-follow-heading">Follow</h2><nav class="footer-social" aria-label="Follow BA Medicale">
          <a href="https://www.instagram.com/bamedicale/" target="_blank" rel="noopener noreferrer" aria-label="Follow BA Medicale on Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg></a>
          <a href="https://www.youtube.com/@BAMedicale" target="_blank" rel="noopener noreferrer" aria-label="Watch BA Medicale on YouTube" title="YouTube"><svg class="footer-social__youtube" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 7.2a3 3 0 0 0-2.1-2.1C17.5 4.6 12 4.6 12 4.6s-5.5 0-7.3.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2.1 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.3.5 7.3.5s5.5 0 7.3-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z"/></svg></a>
        </nav>
      </div>
      <div class="footer-group"><h2>Editorial Sources</h2>${data.sources.map((item) => `<a href="${escapeHtml(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join("")}</div>
      <div class="footer-note"><small>© 2026 BA Medicale</small><nav aria-label="Footer legal and contact links"><a href="${navigationHref("privacy-policy.html")}">Privacy Policy</a><a href="${navigationHref("contact.html")}">Contact Us</a></nav></div>
    </footer>`;
  });
}

// Audience discovery uses one presentation; each caller retains its registry query and destination rules.
const audienceCategoryCard = (category, records, { href, id, emptyLabel, showLatest = false }) => {
  const publicIcons = {
    "public-tumor-cancer": "ribbon", "public-signs": "heart",
    "public-treatment": "aid", "public-living": "ribbon", "public-questions": "prevention"
  };
  const artwork = category.icon ? icon(category.icon) : category.id === "public-diagnosis" ? icon("search") : diseaseIcon(publicIcons[category.id]);
  const published = records.length > 0;
  const tag = href ? "a" : "article";
  const meta = published ? `${records.length} published ${records.length === 1 ? "item" : "items"}` : emptyLabel;
  return `<${tag} class="audience-card${published ? " audience-card--published" : " audience-card--coming-soon"}" data-artwork-context="${escapeHtml(category.id || category.anchor || "medical-learning")}" id="${escapeHtml(id)}"${href ? ` href="${escapeHtml(href)}"` : ""}>
    <div class="audience-card__heading"><div class="audience-card__icon">${artwork}</div><p class="audience-card__eyebrow">${escapeHtml(category.kicker || category.label)}</p></div>
    <h2>${escapeHtml(category.area)}</h2><p class="audience-card__description">${escapeHtml(category.description)}</p>
    <div class="audience-card__footer">${meta ? `<p class="audience-card__meta">${escapeHtml(meta)}</p>` : ""}${published && showLatest ? `<p class="audience-card__latest">Latest: ${escapeHtml(records[0].title)}</p>` : ""}${href ? `<span class="audience-card__action">${escapeHtml(published ? records.length === 1 ? "Open learning" : "Explore in Library" : category.fallbackLabel)}<b aria-hidden="true">→</b></span>` : ""}</div>
  </${tag}>`;
};
const renderAudienceCategories = (target, categories, render) => {
  if (!target) return;
  target.classList.add("audience-card-grid");
  target.classList.toggle("audience-card-grid--paired", categories.length === 4);
  target.innerHTML = categories.map(render).join("");
  target.closest("main")?.querySelectorAll(".track").forEach((card) => {
    card.classList.add("audience-support");
    if (!card.querySelector(".audience-card__icon")) card.insertAdjacentHTML("afterbegin", `<div class="audience-card__icon">${card.querySelector('a[href="search.html"]') ? icon("search") : diseaseIcon(card.querySelector('a[href="clinical.html"]') ? "dna" : "prevention")}</div>`);
  });
};

function renderHealthcareWorkerPage() {
  const categoriesTarget = document.querySelector("[data-healthcare-categories]");
  const chipsTarget = document.querySelector("[data-healthcare-category-chips]");
  const target = document.querySelector("[data-healthcare-worker-content]");
  const categories = healthcareContentCategories();
  if (chipsTarget) chipsTarget.innerHTML = categories.map((category) => {
    const records = healthcareContentForCategory(category.id);
    const href = records.length ? contentRegistry.destination(records, { audience: "HEALTHCARE WORKER", category: category.id }) : `#${category.anchor}`;
    return `<a class="${records.length ? "is-available" : ""}" href="${escapeHtml(href)}">${escapeHtml(category.label)}</a>`;
  }).join("");
  renderAudienceCategories(categoriesTarget, categories, (category) => {
    const records = healthcareContentForCategory(category.id);
    return audienceCategoryCard(category, records, {
      href: records.length ? contentRegistry.destination(records, { audience: "HEALTHCARE WORKER", category: category.id }) : "",
      id: category.anchor, emptyLabel: category.emptyLabel
    });
  });
  if (!target) return;
  // The latest collection is a section wrapper, never a legacy card grid.
  // Normalize stale markup defensively so its nested discovery grid keeps the
  // full page width instead of becoming a grid item inside another grid.
  target.classList.remove("knowledge-grid");
  target.classList.add("audience-learning-content");
  const records = publishedContentForAudience("HEALTHCARE WORKER");
  target.innerHTML = `<div class="section-head"><div><p class="eyebrow">Latest Healthcare Professional learning</p><h2>Multidisciplinary knowledge for patient care.</h2></div><a class="text-link" href="${escapeHtml(libraryPath({ audience: "HEALTHCARE WORKER" }))}">View Healthcare Professional learning <span>→</span></a></div>${records.length ? `<div class="discovery-grid">${records.slice(0, 6).map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false })).join("")}</div>` : comingSoonCard("Healthcare Professional learning", "Practical medical education for diagnostics, care coordination, and patient support will appear after editorial review.", "healthcare-worker")}`;
}

function renderHome() {
  const pathways = document.querySelector("[data-home-pathways]");
  if (pathways) {
    const pathwayDefinitions = [
      { audience: "DOCTOR", label: "For Doctors", title: "Move from evidence to clinical context.", description: "Scientific publications, diagnostic thinking, and professional learning organized around clinical questions.", icon: "path" },
      { audience: "HEALTHCARE WORKER", label: "For Healthcare Professionals", title: "Connect knowledge across the care team.", description: "Practical learning for diagnostics, care pathways, coordination, and multidisciplinary patient support.", icon: "book" },
      { audience: "PUBLIC", label: "For Public", title: "Understand health and navigate care.", description: "Clear information about symptoms, diagnosis, treatment context, and informed conversations with healthcare professionals.", icon: "cell" }
    ];
    pathways.innerHTML = `<header class="home-pathways__head"><p class="approved-kicker">Choose your pathway</p><h2>One medical-learning environment, shaped around your role in care.</h2></header><div class="home-pathways__grid">${pathwayDefinitions.map((pathway) => {
      const records = publishedContentForAudience(pathway.audience);
      const latest = records[0];
      const href = contentRegistry.destination(records, { audience: pathway.audience });
      const availability = `${records.length} published ${records.length === 1 ? "item" : "items"}`;
      return `<a class="home-pathway" href="${escapeHtml(href)}" data-pathway-audience="${escapeHtml(pathway.audience)}"><span class="home-pathway__icon">${icon(pathway.icon)}</span><span class="home-pathway__index">${escapeHtml(pathway.label)}</span><h3>${escapeHtml(pathway.title)}</h3><p>${escapeHtml(pathway.description)}</p><span class="home-pathway__context"><b>${escapeHtml(availability)}</b>${latest ? `<small>Latest: ${escapeHtml(latest.title)}</small>` : ""}</span><span class="home-pathway__action">Enter pathway <i aria-hidden="true">→</i></span></a>`;
    }).join("")}</div>`;
  }
  const diseaseExplorer = document.querySelector("[data-disease-explorer]");
  if (diseaseExplorer) {
    diseaseExplorer.innerHTML = `<header class="disease-explorer__head"><div><p class="approved-kicker">Disease Explorer</p><h2 id="disease-explorer-title">Explore medical knowledge by disease area.</h2></div><p>Explore diseases and health conditions across medical disciplines, with dedicated depth in cancer, neoplasia, and surgical oncology.</p></header><nav class="disease-explorer__grid" aria-label="Explore medical knowledge by disease group">${data.diseaseTaxonomy.map((group, index) => {
      const flagship = group.id === "cancer-neoplastic";
      const publishedContent = publishedContentForDisease(group.id);
      const hasPublishedContent = publishedContent.length > 0;
      const href = diseaseContentDestination(publishedContent, group.id);
      const availability = `${publishedContent.length} ${publishedContent.length === 1 ? "content" : "contents"} available`;
      const ariaLabel = hasPublishedContent ? `Open ${group.name}: ${availability}` : flagship ? "Explore Cancer and Neoplastic Diseases, BA Medicale flagship domain" : "";
      return `<a class="disease-group${flagship ? " disease-group--flagship" : ""}${hasPublishedContent ? " disease-group--available doctor-content-card--active" : ""}" href="${escapeHtml(href)}" data-disease-group="${escapeHtml(group.id)}"${ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : ""}><span class="disease-group__icon">${diseaseIcon(group.icon)}</span><span class="disease-group__copy">${flagship ? '<em class="disease-group__flagship">Flagship depth</em>' : ""}${hasPublishedContent ? `<em class="disease-group__available">${escapeHtml(availability)}</em>` : ""}<b><i>${String(index + 1).padStart(2, "0")}</i>${escapeHtml(group.name)}</b><small>${escapeHtml(group.descriptor)}</small></span><span class="disease-group__arrow" aria-hidden="true">›</span></a>`;
    }).join("")}</nav><footer class="disease-explorer__footer"><div>${icon("book")}<p><b>Find the knowledge you need.</b><span>Browse all education or filter the Library by audience and disease area.</span></p></div><a class="approved-button approved-button--primary" href="library.html">Explore Medical Library <span aria-hidden="true">→</span></a></footer>`;
  }
  const library = document.querySelector("[data-library-preview]");
  if (library) {
    const articles = contentRegistry.query({ family: "article" }).slice(0, 4);
    library.className = "discovery-grid discovery-grid--home-feature";
    library.innerHTML = articles.map((item, index) => discoveryCard(item, { eager: index < 2, showSummary: index === 0, variant: index === 0 ? "feature" : "standard" })).join("");
    initDiscoveryImageFallbacks(library);
  }
  const profile = document.querySelector("[data-profile]");
  if (profile) profile.innerHTML = `<img src="${data.profile.image}" alt="${data.profile.name}" loading="lazy" width="1254" height="1254"><div><p class="eyebrow">Physician-led education</p><h2>${data.profile.name}</h2><p class="profile-role">${data.profile.role}</p><p>${data.profile.text}</p><a href="about.html" class="button button-outline">About BA Medicale</a></div>`;
  const updates = document.querySelector("[data-home-updates]");
  if (updates) {
    const latest = contentRegistry.query().slice(0, 6);
    updates.innerHTML = `<div class="approved-home-updates__heading"><p class="approved-kicker">Latest updates</p><h2>Continue with what is new.</h2><p>Recent source-backed reading, events, presentations, eBooks, and video learning.</p></div>${latest.length ? `<div class="discovery-grid">${latest.map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false })).join("")}</div>` : comingSoonCard("Latest learning", "New verified learning is in editorial preparation.", "medical-learning")}`;
    initDiscoveryImageFallbacks(updates);
  }
}

const comingSoonCard = (title, description, context = "medical-learning") => `<article class="discovery-card discovery-card--coming-soon" data-artwork-context="${escapeHtml(context)}"><div class="discovery-artwork" data-artwork-context="${escapeHtml(context)}" role="img" aria-label="BA Medicale ${escapeHtml(title)} editorial artwork"><span class="discovery-artwork__grid" aria-hidden="true"></span><span class="discovery-artwork__orbit" aria-hidden="true"></span><span class="discovery-artwork__symbol" aria-hidden="true">${diseaseIcon(context === "healthcare-worker" ? "aid" : "dna")}</span><span class="discovery-artwork__type">BA Medicale</span><span class="discovery-artwork__context">Editorial preparation</span></div><div class="discovery-card__body"><div class="discovery-card__labels"><span>Coming Soon</span><span>Verified release only</span></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div></article>`;

function renderDoctorClinicalPage() {
  const categoriesTarget = document.querySelector("[data-doctor-categories]");
  const chipsTarget = document.querySelector("[data-doctor-category-chips]");
  const publicationsTarget = document.querySelector("[data-doctor-publications]");
  const categories = doctorContentCategories();
  if (chipsTarget) chipsTarget.innerHTML = categories.filter((category) => !category.independent).map((category) => {
    const records = doctorContentForCategory(category.id);
    const href = doctorContentDestination(records, { category: category.id });
    return `<a class="${records.length ? "is-available" : ""}" href="${escapeHtml(href)}"${records.length ? ` aria-label="Open ${escapeHtml(category.label)} content"` : ""}>${escapeHtml(category.label)}</a>`;
  }).join("");
  renderAudienceCategories(categoriesTarget, categories, (category) => {
    const records = doctorContentForCategory(category.id);
    return audienceCategoryCard(category, records, {
      href: records.length ? doctorContentDestination(records, { category: category.id }) : "",
      id: category.id, emptyLabel: category.independent ? "Coming soon" : "Growing collection", showLatest: true
    });
  });
  if (!publicationsTarget) return;
  const records = publishedDoctorScientificContent();
  publicationsTarget.innerHTML = `<div class="section-head"><div><p class="eyebrow">Latest doctor publications</p><h2>Recent scientific papers and case reports.</h2></div><a class="text-link" href="${escapeHtml(libraryPath({ audience: "DOCTOR" }))}">Browse professional publications in Library <span>→</span></a></div>${records.length ? `<div class="discovery-grid">${records.slice(0, 6).map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false })).join("")}</div>` : comingSoonCard("Doctor publications", "Scientific publications will appear after source and editorial validation.", "clinical-learning")}`;
  initDiscoveryImageFallbacks(publicationsTarget);
}

function renderPublicPage() {
  const categoriesTarget = document.querySelector("[data-public-categories]");
  const chipsTarget = document.querySelector("[data-public-category-chips]");
  const publicationsTarget = document.querySelector("[data-public-publications]");
  const categories = publicContentCategories();
  if (chipsTarget) chipsTarget.innerHTML = categories.filter((category) => !category.independent).map((category) => {
    const articles = publicContentForCategory(category.id);
    const href = articles.length ? publicContentDestination(articles, { category: category.id }) : `#${category.anchor}`;
    return `<a class="${articles.length ? "is-available" : ""}" href="${escapeHtml(href)}"${articles.length ? ` aria-label="Open ${escapeHtml(category.label)} articles"` : ""}>${escapeHtml(category.label)}</a>`;
  }).join("");
  renderAudienceCategories(categoriesTarget, categories, (category) => {
    const articles = publicContentForCategory(category.id);
    return audienceCategoryCard(category, articles, {
      href: articles.length ? publicContentDestination(articles, { category: category.id }) : category.fallbackHref,
      id: category.anchor, showLatest: true
    });
  });
  if (!publicationsTarget) return;
  const records = contentRegistry.query({ audience: "PUBLIC", primaryAudienceOnly: true, family: "article" });
  publicationsTarget.innerHTML = `<div class="section-head"><div><p class="eyebrow">Latest public education</p><h2>Recent public education.</h2></div><a class="text-link" href="${escapeHtml(libraryPath({ audience: "PUBLIC" }))}">Browse public education in Library <span>→</span></a></div>${records.length ? `<div class="discovery-grid">${records.slice(0, 6).map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false })).join("")}</div>` : comingSoonCard("Public education", "Approachable, source-grounded learning will appear after editorial review.", "public-education")}`;
  initDiscoveryImageFallbacks(publicationsTarget);
}

function renderLibrary() {
  const target = document.querySelector("[data-article-library]");
  if (!target) return;
  const records = contentRegistry.query();
  const topics = [...new Map(records.flatMap((record) => record.topics.map((topic) => [registryApi.slugify(topic), topic]))).entries()];
  const conditions = [...new Map(records.filter((record) => record.diseaseCondition).map((record) => [registryApi.slugify(record.diseaseCondition), record.diseaseCondition])).entries()];
  const types = [...new Map(records.map((record) => [record.typeId, record.contentType])).entries()];
  const authors = [...new Map(records.flatMap((record) => record.authors.map((author) => [registryApi.slugify(author), author]))).entries()];
  const categories = allContentCategories().filter((category) => !category.independent);
  const params = new URLSearchParams(window.location.search);
  const requestedDisease = params.get("disease") || "";
  const selectedDisease = diseaseGroupById(requestedDisease) ? requestedDisease : "";
  const selectedAudience = registryApi.normalizeAudience(params.get("audience"));
  const selectedCategory = contentCategoryById(params.get("category")) ? params.get("category") : "";
  const selectedCondition = conditions.some(([id]) => id === params.get("condition")) ? params.get("condition") : "";
  const selectedTopic = topics.some(([id]) => id === params.get("topic")) ? params.get("topic") : "";
  const selectedType = types.some(([id]) => id === registryApi.slugify(params.get("type"))) ? registryApi.slugify(params.get("type")) : "";
  const selectedAuthor = authors.some(([id]) => id === params.get("author")) ? params.get("author") : "";
  const option = (value, label = value, selected = false) => `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  target.innerHTML = `<section class="discovery-section" aria-labelledby="library-latest-title"><div class="discovery-heading"><div><p class="eyebrow">Latest updates</p><h2 id="library-latest-title">Newest in the Library.</h2></div><p>Six recent publications, selected from the real catalog.</p></div><div class="discovery-grid" data-library-latest></div></section><section class="discovery-section" aria-labelledby="library-all-title"><div class="discovery-heading"><div><p class="eyebrow">All learning</p><h2 id="library-all-title">Explore the complete collection.</h2></div><p data-library-latest-summary role="status"></p></div><form class="article-filters article-filters--library" data-article-filters><label class="article-filter-search">Search<input name="query" type="search" placeholder="Title, author, disease, or topic"></label><label>Audience<select name="audience"><option value="">All audiences</option>${registryApi.AUDIENCES.map((value) => option(value, audienceLabel(value), value === selectedAudience)).join("")}</select></label><label>Content type<select name="type"><option value="">All types</option>${types.map(([id, label]) => option(id, label, id === selectedType)).join("")}</select></label><details class="article-filter-details"><summary>More filters</summary><div class="article-filter-details__grid"><label>Content category<select name="category"><option value="">All categories</option>${categories.map((category) => option(category.id, category.label, category.id === selectedCategory)).join("")}</select></label><label>Disease group<select name="diseaseGroup"><option value="">All disease groups</option>${data.diseaseTaxonomy.map((group) => option(group.id, group.name, group.id === selectedDisease)).join("")}</select></label><label>Disease / condition<select name="condition"><option value="">All conditions</option>${conditions.map(([id, label]) => option(id, label, id === selectedCondition)).join("")}</select></label><label>Topic<select name="topic"><option value="">All topics</option>${topics.map(([id, label]) => option(id, label, id === selectedTopic)).join("")}</select></label><label>Author / source<select name="author"><option value="">All authors and sources</option>${authors.map(([id, label]) => option(id, label, id === selectedAuthor)).join("")}</select></label></div></details><button type="reset">Clear filters</button></form><p class="article-filter-context" data-library-filter-context></p><div class="discovery-grid" data-library-all></div><nav class="discovery-pagination" aria-label="Library pages"><button type="button" data-page="previous">Previous</button><span data-page-status></span><button type="button" data-page="next">Next</button></nav></section>`;
  const filterForm = target.querySelector("[data-article-filters]");
  const filterContext = target.querySelector("[data-library-filter-context]");
  const latestSummary = target.querySelector("[data-library-latest-summary]");
  target.querySelector(".article-filter-details").open = Boolean(selectedCategory || selectedDisease || selectedCondition || selectedTopic || selectedAuthor);
  let page = Math.max(1, Number(params.get("page")) || 1);
  const update = ({ syncUrl = false } = {}) => {
    const values = Object.fromEntries(new FormData(filterForm));
    const activeLabels = [
      values.audience && audienceLabel(values.audience),
      values.category && contentCategoryById(values.category)?.label,
      values.diseaseGroup && diseaseGroupById(values.diseaseGroup)?.name,
      values.condition,
      values.topic && topics.find(([id]) => id === values.topic)?.[1],
      values.type && types.find(([id]) => id === values.type)?.[1],
      values.author && authors.find(([id]) => id === values.author)?.[1],
      values.query && `Search: “${values.query.trim()}”`
    ].filter(Boolean);
    filterContext.textContent = activeLabels.length ? `Showing Library content for ${activeLabels.join(" · ")}.` : "Find your next read, watch, or learning session.";
    const matchingRecords = contentRegistry.query({ audience: values.audience, category: values.category, disease: values.diseaseGroup, condition: values.condition, topic: values.topic, type: values.type, author: values.author, text: values.query.trim() });
    const maxPage = Math.max(1, Math.ceil(matchingRecords.length / 18));
    page = Math.min(page, maxPage);
    latestSummary.textContent = `${matchingRecords.length} matching item${matchingRecords.length === 1 ? "" : "s"}, newest publication or update first.`;
    target.querySelector("[data-library-latest]").innerHTML = matchingRecords.length ? matchingRecords.slice(0, 6).map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false })).join("") : `<p class="discovery-empty">No published learning matches these filters yet.</p>`;
    target.querySelector("[data-library-all]").innerHTML = matchingRecords.length ? matchingRecords.slice((page - 1) * 18, page * 18).map(record => discoveryCard(record)).join("") : `<p class="discovery-empty">No published learning matches these filters yet.</p>`;
    initDiscoveryImageFallbacks(target);
    target.querySelector(".discovery-pagination").hidden = maxPage <= 1;
    target.querySelector("[data-page-status]").textContent = `Page ${page} of ${maxPage}`;
    target.querySelector('[data-page="previous"]').disabled = page <= 1;
    target.querySelector('[data-page="next"]').disabled = page >= maxPage;
    initSeminarPosterLightbox();
    if (syncUrl) {
      const next = contentRegistry.libraryPath({ audience: values.audience, category: values.category, disease: values.diseaseGroup, condition: values.condition, topic: values.topic, type: values.type, author: values.author });
      const nextUrl = new URL(next, window.location.href);
      if (page > 1) nextUrl.searchParams.set("page", String(page));
      if (`${location.pathname}${location.search}` !== `${nextUrl.pathname}${nextUrl.search}`) history.pushState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
    }
  };
  filterForm.addEventListener("input", (event) => { if (event.target.name === "query") { page = 1; update(); } });
  filterForm.addEventListener("change", () => { page = 1; update({ syncUrl: true }); });
  filterForm.addEventListener("reset", event => { event.preventDefault(); filterForm.querySelectorAll("input, select").forEach(control => { control.value = ""; }); page = 1; update({ syncUrl: true }); });
  window.addEventListener("popstate", () => {
    const routeParams = new URLSearchParams(location.search);
    const values = {
      audience: registryApi.normalizeAudience(routeParams.get("audience")), category: routeParams.get("category") || "", diseaseGroup: routeParams.get("disease") || "",
      condition: routeParams.get("condition") || "", topic: routeParams.get("topic") || "", type: routeParams.get("type") || "", author: routeParams.get("author") || ""
    };
    Object.entries(values).forEach(([name, value]) => { const control = filterForm.elements.namedItem(name); if (control && [...control.options].some((option) => option.value === value)) control.value = value; });
    page = Math.max(1, Number(routeParams.get("page")) || 1);
    update();
  });
  target.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
    page = Math.max(1, page + (button.dataset.page === "next" ? 1 : -1));
    update({ syncUrl: true });
    target.querySelector("#library-all-title").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));
  update();
}

function initArticleReader() {
  const triggers = document.querySelectorAll("[data-article-reader]");
  if ((!triggers.length && !document.querySelector("[data-article-library]")) || !data.articles) return;
  const dialog = document.createElement("dialog");
  dialog.className = "article-reader";
  dialog.innerHTML = `<div class="article-reader__shell"><div class="article-reader__bar"><p>BA Medicale digital reader</p><div><a data-article-pdf target="_blank" rel="noopener noreferrer">Open source PDF</a><button type="button" data-article-close aria-label="Close article reader">Close</button></div></div><article class="article-reader__body" tabindex="0"></article></div>`;
  document.body.append(dialog);
  const body = dialog.querySelector(".article-reader__body");
  const pdf = dialog.querySelector("[data-article-pdf]");
  const close = dialog.querySelector("[data-article-close]");
  const renderCompare = (rows = []) => {
    if (!rows.length) return "";
    const [head, ...bodyRows] = rows;
    return `<div class="article-reader__table" role="table" aria-label="Clinical comparison">${head.map((cell) => `<b role="columnheader">${escapeHtml(cell)}</b>`).join("")}${bodyRows.map((row) => row.map((cell) => `<span role="cell">${escapeHtml(cell)}</span>`).join("")).join("")}</div>`;
  };
  const renderSection = (section, index) => `<section class="article-reader__section"><span>${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(section.title)}</h2>${(section.body || []).map((item) => `<p>${escapeHtml(item)}</p>`).join("")}${renderCompare(section.compare)}${section.bullets ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}</section>`;
  let returnFocus;
  dialog.addEventListener("close", () => returnFocus?.focus());
  const open = (id, opener) => {
    returnFocus = opener;
    const presentation = data.presentations?.[id];
    const article = presentation || data.articles[id];
    if (!article) return;
    pdf.href = safeInternalUrl(presentation ? `/${presentation.sourceFile||presentation.sourcePdf||""}` : article.sourcePdf);
    body.innerHTML = presentation ? `<header class="article-reader__hero"><p class="eyebrow">Quick Read · Presentation summary</p><h1 id="presentation-quick-title">${escapeHtml(presentation.title)}</h1><p>${escapeHtml(presentation.author.name)}</p><small>${escapeHtml(data.seminars?.[presentation.eventId]?.title||"BA Medicale seminar")} · Source-grounded summary</small></header>${(presentation.quickRead||[]).map(section => `<section class="article-reader__section"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p><small>Source slides ${escapeHtml(section.pages)}</small></section>`).join("")}<section class="article-page-tools"><a class="button button-dark" href="${safeInternalUrl(`/${presentation.canonicalUrl}`)}">Full Read</a>${presentation.downloadable!==false&&(presentation.sourceFile||presentation.sourcePdf)?`<button class="button button-outline" type="button" data-download-material="${escapeHtml(presentation.id)}">Download Original ${escapeHtml(presentation.sourceFormat||"PDF")}</button>`:""}</section>` : `<header class="article-reader__hero"><p class="eyebrow">${escapeHtml(article.label)}</p><div class="article-page-badges"><span>${escapeHtml(articlePrimaryAudience(article))}</span><span>${escapeHtml(diseaseGroupById(article.primaryDiseaseGroup)?.name || "General medical education")}</span>${articleDiseaseCondition(article) ? `<span>${escapeHtml(articleDiseaseCondition(article))}</span>` : ""}</div><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.dek)}</p><small class="article-byline">By ${escapeHtml(articleAuthor(article))}${article.publishedDate ? ` · Published: ${escapeHtml(formatPublishedDate(article.publishedDate))}` : ""}</small>${article.stats?.length ? `<div class="article-reader__stats">${article.stats.map(([value, label]) => `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}</div>` : ""}</header><section class="article-reader__intro">${article.intro.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>${article.sections.map(renderSection).join("")}<section class="article-reader__takeaways"><p class="eyebrow">Key educational takeaways</p><h2>What to carry into the next conversation.</h2><ul>${article.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section class="article-reader__references"><p class="eyebrow">References and sources</p>${article.references.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>`;
    dialog.querySelector(".article-reader__actions")?.remove();
    dialog.classList.toggle("article-reader--presentation", Boolean(presentation));
    if (presentation) {
      const actions = body.querySelector(".article-page-tools");
      actions.className = "article-reader__actions";
      actions.setAttribute("aria-label", "Presentation actions");
      dialog.querySelector(".article-reader__shell").append(actions);
    }
    dialog.setAttribute("aria-label", presentation ? "Presentation Quick Read" : "Article reader");
    dialog.dataset.returnFocus = opener ? "true" : "false";
    dialog.showModal();
    body.scrollTop = 0;
    body.focus();
  };
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-article-reader]");
    if (!trigger || !(data.presentations?.[trigger.dataset.articleReader] || data.articles?.[trigger.dataset.articleReader])) return;
    event.preventDefault();
    open(trigger.dataset.articleReader, trigger);
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}

function renderEbooks() {
  document.querySelectorAll("[data-ebooks]").forEach((target) => {
    target.innerHTML = data.ebooks.map((item, index) => `<article class="ebook-card"><div class="ebook-visual ebook-visual--${index + 1}"><img src="${escapeHtml(safeImageUrl(item.cover))}" alt="Contextual editorial artwork for ${escapeHtml(item.title)}" width="1024" height="1024" loading="lazy"><span>${String(index + 1).padStart(2, "0")}</span></div><div><p class="eyebrow">${escapeHtml(item.state)}</p><h2>${escapeHtml(item.title)}</h2><p class="audience">${escapeHtml(item.audience)}</p><p>${escapeHtml(item.text)}</p><div class="ebook-actions"><strong>${escapeHtml(item.price)}</strong><a class="button button-outline" href="ebook-detail.html?book=${escapeHtml(item.slug)}">View detail</a><a class="button button-dark" href="login.html">Unlock on release</a></div></div></article>`).join("");
  });
}

function renderContentDiscovery() {
  document.querySelectorAll("[data-content-discovery]").forEach((target) => {
    const family = target.dataset.contentDiscovery;
    const records = contentRegistry.query({ family });
    const label = { ebook: "eBooks", article: "Articles", video: "Videos", seminar: "Seminars", presentation: "Presentations" }[family] || "Learning";
    const pageSize = family === "ebook" ? 18 : 18;
    const params = new URLSearchParams(location.search);
    let page = Math.max(1, Number(params.get("page")) || 1);
    target.innerHTML = `<section class="discovery-section" aria-labelledby="latest-${escapeHtml(family)}-title"><div class="discovery-heading"><div><p class="eyebrow">Latest ${escapeHtml(label)}</p><h2 id="latest-${escapeHtml(family)}-title">Newest published ${escapeHtml(label.toLowerCase())}.</h2></div><p>Source-backed editions, newest first.</p></div><div class="discovery-grid" data-discovery-latest></div></section><section class="discovery-section" aria-labelledby="all-${escapeHtml(family)}-title"><div class="discovery-heading"><div><p class="eyebrow">All ${escapeHtml(label)}</p><h2 id="all-${escapeHtml(family)}-title">Browse the complete collection.</h2></div><p data-discovery-status role="status"></p></div><form class="discovery-controls" data-discovery-controls><label>Search ${escapeHtml(label)}<input name="query" type="search" placeholder="Title, topic, or source"></label><button type="reset">Clear</button></form><div class="discovery-grid" data-discovery-all></div><nav class="discovery-pagination" aria-label="${escapeHtml(label)} pages"><button type="button" data-discovery-page="previous">Previous</button><span data-discovery-page-status></span><button type="button" data-discovery-page="next">Next</button></nav></section>`;
    const form = target.querySelector("[data-discovery-controls]");
    const update = ({ syncUrl = false } = {}) => {
      const query = String(new FormData(form).get("query") || "").trim().toLowerCase();
      const terms = query.split(/\s+/).filter(Boolean);
      const matching = records.filter((record) => terms.every((term) => record.searchable.includes(term)));
      const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
      page = Math.min(page, pageCount);
      target.querySelector("[data-discovery-latest]").innerHTML = matching.length ? matching.slice(0, 6).map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false })).join("") : `<p class="discovery-empty">No published ${escapeHtml(label.toLowerCase())} match this search.</p>`;
      target.querySelector("[data-discovery-all]").innerHTML = matching.length ? matching.slice((page - 1) * pageSize, page * pageSize).map(record => discoveryCard(record)).join("") : `<p class="discovery-empty">No published ${escapeHtml(label.toLowerCase())} match this search.</p>`;
      initDiscoveryImageFallbacks(target);
      target.querySelector("[data-discovery-status]").textContent = `${matching.length} published item${matching.length === 1 ? "" : "s"}.`;
      target.querySelector(".discovery-pagination").hidden = pageCount <= 1;
      target.querySelector("[data-discovery-page-status]").textContent = `Page ${page} of ${pageCount}`;
      target.querySelector('[data-discovery-page="previous"]').disabled = page <= 1;
      target.querySelector('[data-discovery-page="next"]').disabled = page >= pageCount;
      if (syncUrl) {
        const nextUrl = new URL(location.href);
        if (page > 1) nextUrl.searchParams.set("page", String(page)); else nextUrl.searchParams.delete("page");
        history.pushState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
      }
    };
    form.addEventListener("input", () => { page = 1; update(); });
    form.addEventListener("reset", (event) => { event.preventDefault(); form.querySelectorAll("input, select").forEach(control => { control.value = ""; }); page = 1; update({ syncUrl: true }); });
    target.querySelectorAll("[data-discovery-page]").forEach((button) => button.addEventListener("click", () => {
      page = Math.max(1, page + (button.dataset.discoveryPage === "next" ? 1 : -1));
      update({ syncUrl: true });
      target.querySelector(`[id="all-${family}-title"]`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }));
    window.addEventListener("popstate", () => { page = Math.max(1, Number(new URLSearchParams(location.search).get("page")) || 1); update(); });
    update();
  });
}

function renderContinueExploring() {
  const selectedLibraryType = route === "library" ? new URLSearchParams(location.search).get("type") : "";
  const libraryFamily = selectedLibraryType ? contentRegistry.query({ type: selectedLibraryType })[0]?.family || "" : "";
  const routeFamily = route === "ebooks" ? "ebook" : route === "videos" ? "video" : route === "seminar" ? "seminar" : libraryFamily;
  if (!routeFamily || document.querySelector("[data-continue-exploring]")) return;
  const records = contentRegistry.query().filter((record) => record.family !== routeFamily).slice(0, 6);
  if (!records.length) return;
  const section = document.createElement("section");
  section.className = "section continue-exploring";
  section.dataset.continueExploring = "";
  section.innerHTML = `<div class="discovery-heading"><div><p class="eyebrow">Continue exploring</p><h2>Keep learning across formats.</h2></div><a class="text-link" href="${navigationHref("library.html")}">Explore the full Library <span>→</span></a></div><div class="discovery-grid discovery-grid--compact">${records.map(record => discoveryCard(record, { showSummary: false, variant: "compact" })).join("")}</div>`;
  document.querySelector("main")?.append(section);
  initDiscoveryImageFallbacks(section);
  initSeminarPosterLightbox();
}

function enhanceRelatedLearning() {
  const records = contentRegistry.query();
  document.querySelectorAll(".seo-related a").forEach((link) => {
    const path = new URL(link.href, location.href).pathname.replace(/^\/+/, "");
    const record = records.find((item) => item.route.replace(/^\/+/, "") === path);
    if (!record || link.dataset.discoveryEnhanced) return;
    link.dataset.discoveryEnhanced = "true";
    link.dataset.contentId = record.id;
    link.classList.add("discovery-related-card");
    const image = record.cover ? `<img src="${escapeHtml(safeImageUrl(record.cover))}" alt="" width="320" height="180" loading="lazy"${record.family === "video" ? ' referrerpolicy="no-referrer"' : ""}>` : "";
    link.innerHTML = `<span class="discovery-related-card__media${record.cover ? "" : " is-default-artwork"}">${discoveryDefaultArtwork(record)}${image}</span><span class="discovery-related-card__copy"><span>${escapeHtml(discoveryTypeLabel(record))} · ${escapeHtml(recordAudience(record))}</span><b>${escapeHtml(record.title)}</b><small>${escapeHtml(record.topics[0] || record.diseaseCondition || "Medical learning")}</small><i aria-hidden="true">→</i></span>`;
  });
  initDiscoveryImageFallbacks(document);
}

function renderEbookDetail() {
  const target = document.querySelector("[data-ebook-detail]");
  if (!target) return;
  const slug = new URLSearchParams(window.location.search).get("book");
  const item = ebookBySlug(slug);
  if (item) location.replace(navigationRoot() + 'ebooks/' + item.slug + '.html');
  else target.innerHTML = '<p>This preview is no longer in the catalog.</p><a class="button button-outline" href="ebooks.html">Back to eBooks</a>';
}

function seminarRecords() {
  return Object.values(data.seminars || {}).filter((item) => item.startDate && item.endDate);
}

function seminarPosterDimensions(item) {
  return {
    width: Number(item.artworkWidth) || 1086,
    height: Number(item.artworkHeight) || 1448,
    ratio: /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(item.artworkAspectRatio || "") ? item.artworkAspectRatio : "3 / 4"
  };
}

function seminarPosterStyle(item) {
  const dimensions = seminarPosterDimensions(item);
  return `--poster-art:url('${escapeHtml(safeImageUrl(item.artwork))}');--poster-ratio:${dimensions.ratio}`;
}

function renderEvents() {
  const target = document.querySelector("[data-seminar-library]");
  if (!target) return;
  const records = seminarRecords();
  const now = new Date();
  let audience = "ALL";
  let pastPage = 0;
  const pageSize = 10;
  const groupName = (item) => diseaseGroupById(item.primaryDiseaseGroup)?.name || "General medical education";
  const isUpcoming = (item) => new Date(item.endDate) >= now;
  const filtered = () => records.filter((item) => audience === "ALL" || item.primaryAudience === audience);
  const upcomingCard = (item) => { const poster = seminarPosterDimensions(item); return `<article class="seminar-card"><div class="seminar-card__poster" style="${seminarPosterStyle(item)}"><button type="button" data-seminar-poster="${escapeHtml(safeImageUrl(item.artwork))}" data-seminar-poster-alt="Official event poster for ${escapeHtml(item.title)}" aria-label="Inspect official poster for ${escapeHtml(item.title)}"><img src="${escapeHtml(safeImageUrl(item.artwork))}" alt="Official event poster for ${escapeHtml(item.title)}" width="${poster.width}" height="${poster.height}" loading="eager"></button></div><div class="seminar-card__copy"><div class="seminar-card__badges"><span>${escapeHtml(audienceLabel(item.primaryAudience))}</span><span>${escapeHtml(groupName(item))}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><div class="seminar-card__facts"><time datetime="${escapeHtml(item.startDate)}">${escapeHtml(item.date)}</time><span>${escapeHtml(item.location)}</span></div><div class="seminar-card__actions"><button type="button" data-event-quick-read="${escapeHtml(item.id)}">Quick Read</button><a href="${escapeHtml(safeInternalUrl(item.detailUrl))}">View Seminar</a></div></div></article>`; };
  const render = () => {
    const visible = filtered();
    const upcoming = visible.filter(isUpcoming).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 6);
    const past = visible.filter((item) => !isUpcoming(item)).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    const pageCount = Math.max(1, Math.ceil(past.length / pageSize));
    pastPage = Math.min(pastPage, pageCount - 1);
    target.querySelector("[data-upcoming-events]").innerHTML = upcoming.length ? upcoming.map(upcomingCard).join("") : `<div class="seminar-empty"><h2>No upcoming events in this audience yet.</h2><p>Verified programs will appear here automatically when dates and official details are published.</p></div>`;
    target.querySelector("[data-past-events]").innerHTML = past.length ? past.slice(pastPage * pageSize, (pastPage + 1) * pageSize).map(upcomingCard).join("") : `<div class="seminar-empty"><h2>No past events in this audience yet.</h2><p>Completed programs will move here automatically while their event pages remain available.</p></div>`;
    const status = target.querySelector("[data-event-page-status]");
    status.textContent = past.length ? `Page ${pastPage + 1} of ${pageCount}` : "No archived events";
    target.querySelector('[data-event-page="previous"]').disabled = !past.length || pastPage === 0;
    target.querySelector('[data-event-page="next"]').disabled = !past.length || pastPage >= pageCount - 1;
    initSeminarPosterLightbox();
    bindEventQuickRead();
  };
  target.innerHTML = `<nav class="seminar-audience" aria-label="Filter events by audience"><button type="button" class="is-active" data-event-audience="ALL">All events</button><button type="button" data-event-audience="DOCTOR">Doctors</button><button type="button" data-event-audience="HEALTHCARE WORKER">Healthcare Professionals</button><button type="button" data-event-audience="PUBLIC">Public</button></nav><section class="seminar-library__section"><header class="seminar-library__heading"><div><p class="eyebrow">Upcoming events</p><h2>The nearest verified learning programs.</h2></div><p>Dates, participation details, and faculty information come from official event material.</p></header><div class="seminar-upcoming-rail" data-upcoming-events></div></section><section class="seminar-library__section"><header class="seminar-library__heading"><div><p class="eyebrow">Past events</p><h2>Programs retained for reference and discovery.</h2></div><p>Completed events remain available through their canonical event pages.</p></header><div class="seminar-past-list" data-past-events></div><nav class="seminar-pagination" aria-label="Past event pages"><button type="button" data-event-page="previous">Previous</button><span data-event-page-status></span><button type="button" data-event-page="next">Next</button></nav></section>`;
  target.querySelectorAll("[data-event-audience]").forEach((button) => button.addEventListener("click", () => { audience = button.dataset.eventAudience; pastPage = 0; target.querySelectorAll("[data-event-audience]").forEach((item) => item.classList.toggle("is-active", item === button)); render(); }));
  target.querySelector('[data-event-page="previous"]').addEventListener("click", () => { pastPage -= 1; render(); });
  target.querySelector('[data-event-page="next"]').addEventListener("click", () => { pastPage += 1; render(); });
  render();
}

function bindEventQuickRead() {
  let dialog = document.querySelector("[data-event-reader]");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "event-reader";
    dialog.dataset.eventReader = "";
    dialog.innerHTML = `<div class="event-reader__bar"><b>BA Medicale Event Quick Reader</b><button type="button" data-event-reader-close>Close</button></div><div class="event-reader__body" tabindex="-1"></div>`;
    document.body.append(dialog);
    dialog.querySelector("[data-event-reader-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  }
  document.querySelectorAll("[data-event-quick-read]:not([data-event-reader-bound])").forEach((button) => {
    button.dataset.eventReaderBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const item = data.seminars?.[button.dataset.eventQuickRead];
      if (!item) return;
      const group = diseaseGroupById(item.primaryDiseaseGroup)?.name || "General medical education";
      const poster = seminarPosterDimensions(item);
      const registrationUrl = safeExternalUrl(/^https?:\/\//i.test(item.registration || "") ? item.registration : `https://${item.registration || ""}`);
      const registration = registrationUrl ? `<a class="button button-dark" href="${escapeHtml(registrationUrl)}" target="_blank" rel="noopener noreferrer">Open registration</a>` : "";
      dialog.querySelector(".event-reader__body").innerHTML = `<header><div><p class="eyebrow">${escapeHtml(item.format)}</p><div class="seminar-card__badges"><span>${escapeHtml(audienceLabel(item.primaryAudience))}</span><span>${escapeHtml(group)}</span><span>${escapeHtml(item.diseaseCondition)}</span></div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p><dl><div><dt>Date</dt><dd>${escapeHtml(item.date)}</dd></div><div><dt>Time</dt><dd>${escapeHtml(item.time)}</dd></div><div><dt>Format</dt><dd>${escapeHtml(item.location)}</dd></div></dl>${item.publishedDate ? `<small class="event-published">Published: ${escapeHtml(formatPublishedDate(item.publishedDate))}</small>` : ""}${registration}<a class="text-link" href="${escapeHtml(safeInternalUrl(item.detailUrl))}">View full Event page <span>→</span></a></div><button class="seminar-poster-frame" type="button" style="${seminarPosterStyle(item)}" data-seminar-poster="${escapeHtml(safeImageUrl(item.artwork))}" data-seminar-poster-alt="Official event poster for ${escapeHtml(item.title)}"><img src="${escapeHtml(safeImageUrl(item.artwork))}" alt="Official event poster for ${escapeHtml(item.title)}" width="${poster.width}" height="${poster.height}"></button></header><section><p class="eyebrow">Program focus</p><ol>${item.sessions.map(([title, speaker]) => `<li><h2>${escapeHtml(title)}</h2><p>${escapeHtml(speaker)}</p></li>`).join("")}</ol></section><section><p class="eyebrow">Faculty and moderation</p><ul>${item.faculty.map(([role, name]) => `<li><b>${escapeHtml(role)}</b><span>${escapeHtml(name)}</span></li>`).join("")}</ul></section><footer><span>${escapeHtml(item.topics.join(" · "))}</span><small>${escapeHtml(item.organizer)}</small></footer>`;
      dialog.showModal();
      dialog.querySelector(".event-reader__body").focus();
      initSeminarPosterLightbox();
    });
  });
}

function initSeminarPosterLightbox() {
  const triggers = document.querySelectorAll("[data-seminar-poster]:not([data-poster-bound])");
  if (!triggers.length) return;
  let dialog = document.querySelector(".seminar-poster-lightbox");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "seminar-poster-lightbox";
    dialog.innerHTML = `<div class="seminar-poster-lightbox__bar"><p>Program poster</p><div><button type="button" data-poster-zoom aria-pressed="false">Zoom</button><button type="button" data-poster-close aria-label="Close full program poster">Close</button></div></div><div class="seminar-poster-lightbox__viewport" tabindex="0"><img alt=""></div>`;
    document.body.append(dialog);
  }
  const image = dialog.querySelector("img");
  const viewport = dialog.querySelector(".seminar-poster-lightbox__viewport");
  const zoom = dialog.querySelector("[data-poster-zoom]");
  const close = dialog.querySelector("[data-poster-close]");
  const setZoom = (expanded) => { dialog.classList.toggle("is-zoomed", expanded); zoom.setAttribute("aria-pressed", String(expanded)); zoom.textContent = expanded ? "Fit" : "Zoom"; };
  triggers.forEach((trigger) => {
    trigger.dataset.posterBound = "true";
    trigger.addEventListener("click", () => {
      const source = safeInternalUrl(trigger.dataset.seminarPoster);
      if (!source) return;
      image.src = source;
      image.alt = trigger.dataset.seminarPosterAlt || "Official program poster";
      dialog.querySelector(".seminar-poster-lightbox__bar p").textContent = trigger.dataset.posterTitle || "Program poster";
      close.setAttribute("aria-label", trigger.dataset.posterTitle ? "Close presentation infographic" : "Close full program poster");
      setZoom(false);
      dialog.showModal();
      close.focus();
    });
  });
  if (dialog.dataset.bound) return;
  dialog.dataset.bound = "true";
  zoom.addEventListener("click", () => { setZoom(!dialog.classList.contains("is-zoomed")); viewport.focus(); });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", (event) => { if (event.key === "+" || event.key === "=") { event.preventDefault(); setZoom(true); viewport.focus(); } if (event.key === "-") { event.preventDefault(); setZoom(false); viewport.focus(); } });
}

function renderSources() {
  document.querySelectorAll("[data-sources]").forEach((target) => target.innerHTML = data.sources.map((item) => `<a href="${escapeHtml(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer"><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.note)}</span><i>↗</i></a>`).join(""));
}

function renderResources() {
  const target = document.querySelector("[data-resource-categories]") || (route === "resources" ? document.querySelector(".resource-grid") : null);
  if (!target) return;
  target.innerHTML = (data.resourceCategories || []).map((category) => {
    const records = contentRegistry.query({ family: "resource", category: category.id });
    const artwork = `<div class="resource-card__art discovery-artwork" data-artwork-context="${escapeHtml(category.artworkContext || "clinical-learning")}" role="img" aria-label="BA Medicale editorial artwork for ${escapeHtml(category.label)}"><span class="discovery-artwork__grid" aria-hidden="true"></span><span class="discovery-artwork__orbit" aria-hidden="true"></span><span class="discovery-artwork__symbol" aria-hidden="true">${icon(category.icon)}</span><span class="discovery-artwork__type">Resource</span><span class="discovery-artwork__context">${escapeHtml(category.topic || category.label)}</span></div>`;
    const content = `${artwork}<div class="resource-card__body"><div class="resource-card__labels"><span>Resource</span><span>${escapeHtml(category.audience || "All")}</span></div><h2>${escapeHtml(category.label)}</h2><p>${escapeHtml(category.description)}</p><span class="resource-card__status">${records.length ? `${records.length} available` : "Coming soon"}</span></div>`;
    return records.length ? `<a class="resource-card resource-card--available doctor-content-card--active"${category.anchor ? ` id="${escapeHtml(category.anchor)}"` : ""} href="${escapeHtml(contentRegistry.destination(records, { type: "resource", category: category.id }))}">${content}</a>` : `<article class="resource-card resource-card--coming-soon"${category.anchor ? ` id="${escapeHtml(category.anchor)}"` : ""}>${content}</article>`;
  }).join("");
}

function initSearch() {
  const input = document.querySelector("[data-search-input]");
  const output = document.querySelector("[data-search-results]");
  if (!input || !output) return;
  const show = (query = "") => {
    const filtered = contentRegistry.search(query);
    output.classList.toggle("discovery-grid", Boolean(filtered.length));
    output.classList.toggle("discovery-grid--search", Boolean(filtered.length));
    output.innerHTML = filtered.length ? filtered.map((record, index) => discoveryCard(record, { eager: index < 2, showSummary: false, variant: "compact" })).join("") : `<div class="empty-panel"><p class="eyebrow">No exact result</p><h2>Try a condition, test, disease group, author, or treatment term.</h2><p>Published content and controlled navigation topics are indexed automatically from the canonical registry.</p></div>`;
    initDiscoveryImageFallbacks(output);
  };
  let searchTracked = false;
  input.addEventListener("input", () => {
    if (!searchTracked && input.value.trim()) {
      searchTracked = true;
      trackAnalytics("search_used");
    }
    show(input.value);
  }); show();
}

function initShell() {
  const header = document.querySelector(".site-header");
  const button = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav-mobile");
  const groups = [...document.querySelectorAll(".nav-group")];
  const closeGroups = () => groups.forEach((group) => { group.open = false; });
  const closeMobile = () => {
    nav?.removeAttribute("data-open");
    button?.setAttribute("aria-expanded", "false");
    button?.setAttribute("aria-label", "Open navigation");
    closeGroups();
  };
  button?.addEventListener("click", () => {
    if (nav.hasAttribute("data-open")) closeMobile();
    else {
      nav.setAttribute("data-open", "");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close navigation");
    }
  });
  nav?.addEventListener("click", (event) => { if (event.target.closest("a")) closeMobile(); });
  groups.forEach((group) => {
    group.addEventListener("toggle", () => {
      if (group.open) groups.forEach((other) => { if (other !== group) other.open = false; });
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" && event.target.tagName === "SUMMARY") {
        event.preventDefault();
        group.open = true;
        group.querySelector("a")?.focus();
      }
      if (event.key === "Escape" && group.open) {
        event.preventDefault();
        event.stopPropagation();
        group.open = false;
        group.querySelector("summary").focus();
      }
    });
    group.addEventListener("focusout", (event) => {
      // Safari mouse clicks can blur the summary without focusing the link.
      // Keep the menu visible until click; outside clicks and Escape close it below.
      if (group.closest(".nav-main") && event.relatedTarget && !group.contains(event.relatedTarget)) group.open = false;
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-group")) closeGroups();
    if (!event.target.closest(".site-header,.nav-mobile")) closeMobile();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.hasAttribute("data-open")) {
      closeMobile();
      button?.focus();
    }
  });
  window.matchMedia("(max-width: 1050px)").addEventListener("change", closeMobile);
  const update = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  update(); window.addEventListener("scroll", update, { passive: true });
}

function initHeroMedia() {
  const video = document.querySelector("[data-hero-video]");
  if (!video) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  video.muted = true;
  video.defaultMuted = true;
  const update = () => {
    if (!visible || document.hidden || reducedMotion.matches) {
      video.pause();
      return;
    }
    // Some mobile browsers defer autoplay until the media is visibly on screen.
    if (video.paused) video.play().catch(() => {});
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .05 }).observe(video);
  } else {
    visible = true;
    update();
  }
  video.addEventListener("loadeddata", update);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("pageshow", update);
  reducedMotion.addEventListener("change", update);
  document.addEventListener("pointerdown", update, { once: true, passive: true });
}

function initMotion() {
  // Content is visible before enhancement and never waits for an observer.
  document.querySelectorAll(".reveal").forEach(item => item.classList.add("is-visible"));
}

function initImmersiveExperience() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const immersive = document.body.classList.contains("immersion-high") || document.body.classList.contains("immersion-medium");
  const sections = [...document.querySelectorAll("main > section, main > article, .company-section, .team-directory, .contact-layout")];
  sections.forEach((section, index) => {
    section.classList.add("immersive-section");
    section.style.setProperty("--section-order", String(index));
  });
  if (!immersive || reducedMotion.matches) return;

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle("is-immersive-active", entry.isIntersecting);
    }), { rootMargin: "-24% 0px -42%", threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  let scrollFrame = 0;
  const updateScrollDepth = () => {
    scrollFrame = 0;
    const shift = Math.min(window.scrollY * .018, 24);
    const range = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    document.body.style.setProperty("--ambient-shift", `${-shift}px`);
    document.body.style.setProperty("--scroll-progress", String(Math.min(window.scrollY / range, 1)));
  };
  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollDepth);
  }, { passive: true });
  updateScrollDepth();

  if (document.body.classList.contains("immersion-high") && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let pointerFrame = 0;
    let pointerX = 50;
    let pointerY = 20;
    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX / window.innerWidth * 100;
      pointerY = event.clientY / window.innerHeight * 100;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        document.body.style.setProperty("--pointer-x", `${pointerX}%`);
        document.body.style.setProperty("--pointer-y", `${pointerY}%`);
      });
    }, { passive: true });
  }
}

function initLightbox() {
  const triggers = document.querySelectorAll("[data-lightbox-image]");
  if (!triggers.length) return;
  const dialog = document.createElement("dialog");
  dialog.className = "medical-lightbox";
  dialog.innerHTML = `<button type="button" aria-label="Close image">×</button><img alt="">`;
  document.body.append(dialog);
  const image = dialog.querySelector("img");
  triggers.forEach((trigger) => trigger.addEventListener("click", () => {
    const source = safeInternalUrl(trigger.dataset.lightboxImage);
    if (!source) return;
    image.src = source;
    image.alt = trigger.dataset.lightboxAlt || "Medical education illustration";
    dialog.showModal();
  }));
  dialog.addEventListener("click", (event) => { if (event.target === dialog || event.target.matches("button")) dialog.close(); });
}

function shouldShowHomeSeminarPromotion(now = new Date()) {
  return now <= new Date(2026, 8, 19, 23, 59, 59, 999);
}

function initHomeSeminarPromotion() {
  const isHomepage = /^\/(?:index\.html)?$/i.test(window.location.pathname);
  if (!isHomepage || !document.body.classList.contains("approved-home") || !shouldShowHomeSeminarPromotion()) return;
  const seminar = data.seminars?.["management-thyroid-nodules-2026"];
  const destination = safeInternalUrl(seminar?.detailUrl);
  const poster = safeImageUrl(seminar?.promoArtwork || seminar?.artwork);
  if (!seminar || !destination || !poster) return;

  const dialog = document.createElement("dialog");
  dialog.className = "home-seminar-promo";
  dialog.setAttribute("aria-labelledby", "home-seminar-promo-title");
  const posterDimensions = seminarPosterDimensions(seminar.promoArtwork ? {artworkWidth:seminar.promoArtworkWidth,artworkHeight:seminar.promoArtworkHeight} : seminar);
  dialog.innerHTML = `<button class="home-seminar-promo__close" type="button" aria-label="Close seminar promotion">×</button><div class="home-seminar-promo__content"><a class="home-seminar-promo__poster" href="${escapeHtml(destination)}" aria-label="View seminar details"><img src="${escapeHtml(poster)}" alt="Official poster for ${escapeHtml(seminar.title)}" width="${posterDimensions.width}" height="${posterDimensions.height}"></a><div class="home-seminar-promo__copy"><p class="eyebrow">Upcoming live webinar</p><h2 id="home-seminar-promo-title">${escapeHtml(seminar.title)}</h2><p>${escapeHtml(seminar.date)} · ${escapeHtml(seminar.time)} · ${escapeHtml(seminar.location)}</p><a class="button button-dark" href="${escapeHtml(destination)}">View Seminar Details</a></div></div>`;
  document.body.append(dialog);

  const close = dialog.querySelector(".home-seminar-promo__close");
  const body = document.body;
  let restoreScroll = null;
  const lockScroll = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    restoreScroll = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
  };
  const unlockScroll = () => {
    if (!restoreScroll) return;
    body.style.overflow = restoreScroll.overflow;
    body.style.paddingRight = restoreScroll.paddingRight;
    restoreScroll = null;
  };
  const dismiss = () => dialog.close();

  close.addEventListener("click", dismiss);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dismiss(); });
  dialog.addEventListener("close", unlockScroll);
  dialog.addEventListener("cancel", () => unlockScroll());
  lockScroll();
  dialog.showModal();
  close.focus();
}

function renderVideoHub() {
  const hub = document.querySelector("[data-video-hub]");
  const preview = document.querySelector("[data-video-preview-list]");
  if (!hub && !preview) return;
  const videoRecords = contentRegistry.query({ family: "video" });
  const videos = videoRecords.filter((record) => record.sourceRecord.source !== "ba-medicale").map((record) => ({ ...record.sourceRecord, title: record.title }));
  const originalVideos = videoRecords.filter((record) => record.sourceRecord.source === "ba-medicale").map((record) => record.sourceRecord);
  if (!videos.length && !originalVideos.length) {
    if (hub) hub.innerHTML = `<div class="video-hub__empty"><p class="eyebrow">Video collection</p><h2>The public video catalog is being refreshed.</h2><p>Source verification is required before a video is shown here.</p></div>`;
    return;
  }
  const localThumbnail = (video) => safeImageUrl(video.thumbnail);
  const latestOriginals = originalVideos.slice(-4).reverse();
  const latestYouTube = videos.slice().sort((a, b) => String(b.publish_date || "").localeCompare(String(a.publish_date || ""))).slice(0, 4);
  const previewLocalCard = (video) => `<article class="video-preview video-preview--original"><button type="button" data-video-local="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(localThumbnail(video))}" alt="Preview of ${escapeHtml(video.title)}" width="960" height="540" loading="lazy"><span>▶</span></button><p>${escapeHtml(video.source_label)}</p><h3>${escapeHtml(video.title)}</h3></article>`;
  const previewYouTubeCard = (video) => `<article class="video-preview"><button type="button" data-video-play="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(safeImageUrl(video.thumbnail))}" alt="${escapeHtml(video.title)}" width="480" height="360" loading="eager" referrerpolicy="no-referrer"><span>▶</span></button><p>${escapeHtml(video.source_label)}</p><h3>${escapeHtml(video.title)}</h3></article>`;
  if (hub) {
    const topics = [...new Set(videoRecords.flatMap((record) => record.topics).filter(Boolean))].sort();
    const videoCard = (record, options = {}) => {
      const original = record.sourceRecord.source === "ba-medicale";
      return discoveryCard(record, {
        ...options,
        identityLabel: original ? "BA Medicale Original" : "YouTube · Dr. Bob",
        metaLabel: original ? record.topics[0] || "BA Medicale" : record.sourceRecord.source_label || "YouTube"
      });
    };
    const latest = videoRecords.slice(0, 6);
    hub.innerHTML = `<section class="discovery-section" aria-labelledby="latest-videos-title"><div class="discovery-heading"><div><p class="eyebrow">Latest Videos</p><h2 id="latest-videos-title">The newest medical video learning.</h2></div><p>Recent BA Medicale Originals and Dr. Bob videos on YouTube, ordered by their available publication dates.</p></div><div class="video-coverflow" data-video-latest data-video-coverflow role="region" aria-roledescription="carousel" aria-label="Latest Videos coverflow" tabindex="0"><div class="video-coverflow__stage"><div class="video-coverflow__track">${latest.map(videoCoverflowCard).join("")}</div><button class="video-coverflow__nav video-coverflow__nav--previous" type="button" data-video-coverflow-nav="previous" aria-label="Previous latest video">←</button><button class="video-coverflow__nav video-coverflow__nav--next" type="button" data-video-coverflow-nav="next" aria-label="Next latest video">→</button></div><div class="video-coverflow__footer"><p class="video-coverflow__status" data-video-coverflow-status aria-live="polite"></p><div class="video-coverflow__indicators" data-video-coverflow-indicators aria-label="Choose a latest video"></div></div></div></section><form class="discovery-controls discovery-controls--video" data-video-controls aria-label="Filter the video collection"><label>Search Videos<input name="query" type="search" placeholder="Title, topic, or publisher"></label><label>Source<select name="source"><option value="">All Videos</option><option value="ba-medicale">BA Medicale Originals</option><option value="youtube">Dr. Bob on YouTube</option></select></label><label>Topic<select name="topic"><option value="">All topics</option>${topics.map(topic => `<option value="${escapeHtml(registryApi.slugify(topic))}">${escapeHtml(topic)}</option>`).join("")}</select></label><button type="reset">Clear</button></form><section class="discovery-section video-source-collection" data-video-originals-section aria-labelledby="original-videos-title"><div class="discovery-heading"><div><p class="eyebrow">BA Medicale Originals</p><h2 id="original-videos-title">Published directly by BA Medicale.</h2></div><p><span data-video-originals-status role="status"></span> Approved first-party videos play in the native BA Medicale player.</p></div><div class="discovery-grid" data-video-originals></div></section><section class="discovery-section video-source-collection" data-video-youtube-section aria-labelledby="youtube-videos-title"><div class="discovery-heading"><div><p class="eyebrow">Dr. Bob on YouTube</p><h2 id="youtube-videos-title">Source-attributed public video appearances.</h2></div><p><span data-video-youtube-status role="status"></span> Each video retains its original YouTube publisher and destination.</p></div><div class="discovery-grid" data-video-youtube></div><nav class="discovery-pagination" aria-label="Dr. Bob YouTube video pages"><button type="button" data-video-page="previous">Previous</button><span data-video-page-status></span><button type="button" data-video-page="next">Next</button></nav></section><aside class="video-source-note"><b>Source integrity</b><span>BA Medicale Originals use approved local media. Dr. Bob videos on YouTube remain externally published and retain their original attribution.</span></aside>`;
    initVideoCoverflow(hub.querySelector("[data-video-coverflow]"));
    const form = hub.querySelector("[data-video-controls]");
    const controlsFromUrl = () => {
      const params = new URLSearchParams(location.search);
      form.elements.source.value = ["ba-medicale", "youtube"].includes(params.get("source")) ? params.get("source") : "";
      form.elements.topic.value = topics.some(topic => registryApi.slugify(topic) === params.get("topic")) ? params.get("topic") : "";
      return Math.max(1, Number(params.get("page")) || 1);
    };
    let page = controlsFromUrl();
    const render = ({ syncUrl = false } = {}) => {
      const values = Object.fromEntries(new FormData(form));
      const terms = String(values.query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
      const matches = (record) => (!values.topic || record.topics.some(topic => registryApi.slugify(topic) === values.topic)) && terms.every(term => record.searchable.includes(term));
      const matchingOriginals = videoRecords.filter(record => record.sourceRecord.source === "ba-medicale" && matches(record));
      const matchingYouTube = videoRecords.filter(record => record.sourceRecord.source === "youtube" && matches(record));
      const showOriginals = values.source !== "youtube";
      const showYouTube = values.source !== "ba-medicale";
      const pageCount = Math.max(1, Math.ceil(matchingYouTube.length / 18));
      page = Math.min(page, pageCount);
      hub.querySelector("[data-video-originals-section]").hidden = !showOriginals;
      hub.querySelector("[data-video-youtube-section]").hidden = !showYouTube;
      hub.querySelector("[data-video-originals]").innerHTML = matchingOriginals.length ? matchingOriginals.map(record => videoCard(record)).join("") : `<p class="discovery-empty">No BA Medicale Originals match these filters.</p>`;
      hub.querySelector("[data-video-youtube]").innerHTML = matchingYouTube.length ? matchingYouTube.slice((page - 1) * 18, page * 18).map(record => videoCard(record)).join("") : `<p class="discovery-empty">No Dr. Bob YouTube videos match these filters.</p>`;
      hub.querySelector("[data-video-originals-status]").textContent = `${matchingOriginals.length} original video${matchingOriginals.length === 1 ? "" : "s"}.`;
      hub.querySelector("[data-video-youtube-status]").textContent = `${matchingYouTube.length} YouTube video${matchingYouTube.length === 1 ? "" : "s"}.`;
      const pagination = hub.querySelector(".discovery-pagination");
      pagination.hidden = !showYouTube || pageCount <= 1;
      hub.querySelector("[data-video-page-status]").textContent = `Page ${page} of ${pageCount}`;
      hub.querySelector('[data-video-page="previous"]').disabled = page <= 1;
      hub.querySelector('[data-video-page="next"]').disabled = page >= pageCount;
      initDiscoveryImageFallbacks(hub);
      if (syncUrl) {
        const nextUrl = new URL(location.href);
        nextUrl.searchParams.delete("video");
        if (values.source) nextUrl.searchParams.set("source", values.source); else nextUrl.searchParams.delete("source");
        if (values.topic) nextUrl.searchParams.set("topic", values.topic); else nextUrl.searchParams.delete("topic");
        if (showYouTube && page > 1) nextUrl.searchParams.set("page", String(page)); else nextUrl.searchParams.delete("page");
        history.pushState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
      }
    };
    form.addEventListener("input", () => { page = 1; render(); });
    form.addEventListener("change", () => { page = 1; render({ syncUrl: true }); });
    form.addEventListener("reset", event => { event.preventDefault(); form.querySelectorAll("input, select").forEach(control => { control.value = ""; }); page = 1; render({ syncUrl: true }); });
    hub.querySelectorAll("[data-video-page]").forEach(button => button.addEventListener("click", () => { page = Math.max(1, page + (button.dataset.videoPage === "next" ? 1 : -1)); render({ syncUrl: true }); hub.querySelector("#youtube-videos-title").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }));
    window.addEventListener("popstate", () => { page = controlsFromUrl(); render(); });
    render();
  }
  if (preview) preview.innerHTML = `${latestOriginals.map(previewLocalCard).join("")}${latestYouTube.map(previewYouTubeCard).join("")}`;
  const dialog = document.createElement("dialog");
  dialog.className = "video-player";
  dialog.innerHTML = `<button type="button" aria-label="Close video">×</button><div></div><a target="_blank" rel="noopener noreferrer">View original source ↗</a>`;
  document.body.append(dialog);
  const player = dialog.querySelector("div");
  const sourceLink = dialog.querySelector("a");
  const openVideo = (id) => {
    const video = videos.find((item) => item.id === id);
    if (!video) return;
    const embedUrl = safeYouTubeEmbedUrl(video.embed_url);
    const sourceUrl = safeExternalUrl(video.url);
    if (!embedUrl || !sourceUrl) return;
    embedUrl.searchParams.set("autoplay", "1");
    const frame = document.createElement("iframe");
    frame.src = embedUrl.href;
    frame.title = String(video.title || "BA Medicale video");
    frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
    frame.allowFullscreen = true;
    player.replaceChildren(frame);
    sourceLink.href = sourceUrl;
    dialog.showModal();
  };
  const openLocalVideo = (id) => {
    const video = originalVideos.find((item) => item.id === id);
    if (!video) return;
    const videoUrl = safeInternalUrl(video.video_url);
    if (!videoUrl) return;
    const media = document.createElement("video");
    media.src = videoUrl;
    media.title = String(video.title || "BA Medicale video");
    media.controls = true;
    media.autoplay = true;
    media.playsInline = true;
    player.replaceChildren(media);
    sourceLink.href = videoUrl;
    dialog.showModal();
  };
  document.querySelectorAll("[data-video-play]").forEach((button) => button.addEventListener("click", () => openVideo(button.dataset.videoPlay)));
  document.querySelectorAll("[data-video-local]").forEach((button) => button.addEventListener("click", () => openLocalVideo(button.dataset.videoLocal)));
  const requestedVideo = new URLSearchParams(location.search).get("video");
  if (requestedVideo) requestAnimationFrame(() => originalVideos.some(item => item.id === requestedVideo) ? openLocalVideo(requestedVideo) : openVideo(requestedVideo));
  dialog.addEventListener("close", () => { player.replaceChildren(); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog || event.target.matches("button")) dialog.close(); });
}

function initArticlePageTools() {
  const shareToggle = document.querySelector("[data-share-toggle]");
  const shareMenu = document.querySelector("[data-share-menu]");
  const closeShare = () => {
    if (!shareMenu) return;
    shareMenu.setAttribute("hidden", "");
    shareToggle?.setAttribute("aria-expanded", "false");
  };
  shareToggle?.addEventListener("click", () => {
    const open = shareMenu.hasAttribute("hidden");
    shareMenu.toggleAttribute("hidden", !open);
    shareToggle.setAttribute("aria-expanded", String(open));
  });
  shareMenu?.querySelector("[data-share-close]")?.addEventListener("click", closeShare);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".article-share")) closeShare();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeShare();
  });
  document.querySelectorAll("[data-copy-link]").forEach((button) => button.addEventListener("click", async () => {
    const value = safeExternalUrl(button.dataset.copyLink);
    if (!value) return;
    await copyText(value);
    button.textContent = "Link copied";
    closeShare();
  }));
  const dialog = document.querySelector("[data-promotion-dialog]");
  document.querySelector("[data-promote-open]")?.addEventListener("click", () => dialog?.showModal());
  dialog?.querySelector("[data-promote-close]")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog?.querySelectorAll("[data-copy-promotion]").forEach((button) => button.addEventListener("click", async () => {
    let copy = "";
    try {
      const bytes = Uint8Array.from(atob(button.dataset.copyPromotion || ""), (character) => character.charCodeAt(0));
      copy = new TextDecoder().decode(bytes);
    } catch {}
    if (!copy) return;
    await copyText(copy);
    button.textContent = "Copy ready";
  }));
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!(form instanceof HTMLFormElement)) return;
  const status = form.querySelector("[data-contact-status]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const name = String(fields.get("name") || "").trim();
    const email = String(fields.get("email") || "").trim();
    const topic = String(fields.get("topic") || "").trim();
    const message = String(fields.get("message") || "").trim();
    const subject = `BA Medicale enquiry: ${topic}`;
    const body = [`Name: ${name}`, `Email: ${email}`, `Topic: ${topic}`, "", "Message:", message].join("\n");
    const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (status) status.textContent = "Your email application is opening. Review the message before sending.";
    window.location.assign(mailto);
  });
}

function initAnalytics() {
  if (!analyticsEnabled() || window.__baMedicaleAnalyticsReady) return;
  window.__baMedicaleAnalyticsReady = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    page_location: analyticsPageUrl(),
    page_path: window.location.pathname,
    page_referrer: analyticsReferrer()
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
  script.referrerPolicy = "strict-origin-when-cross-origin";
  document.head.append(script);

  const currentArticle = articleByPath();
  const currentSeminar = seminarByPath();
  const currentBook = ebookBySlug(new URLSearchParams(window.location.search).get("book")) || (data.ebooks || []).find(book => window.location.pathname === `/ebooks/${book.slug}.html`);
  if (currentArticle) trackAnalytics("content_open", analyticsContent("article", currentArticle));
  if (currentSeminar) trackAnalytics("content_open", analyticsContent("seminar", currentSeminar));
  if (currentBook) trackAnalytics("ebook_open", analyticsContent("ebook", currentBook));

  document.addEventListener("click", (event) => {
    const control = event.target.closest("a, button");
    if (!control) return;
    if (control.matches(".disease-group")) {
      const disease = control.dataset.diseaseGroup || new URL(control.href, window.location.href).searchParams.get("disease");
      trackAnalytics("disease_explorer_click", { disease_group: disease || "" });
      return;
    }
    if (control.matches(".home-pathway")) {
      trackAnalytics("audience_pathway_click", { audience: control.dataset.pathwayAudience || "" });
      return;
    }
    if (control.matches("[data-article-reader]")) {
      trackAnalytics("quick_read_open", analyticsContent("article", data.articles?.[control.dataset.articleReader]));
      return;
    }
    if (control.matches("[data-event-quick-read]")) {
      trackAnalytics("quick_read_open", analyticsContent("seminar", data.seminars?.[control.dataset.eventQuickRead]));
      return;
    }
    if (control.matches("[data-seminar-poster]")) {
      trackAnalytics("poster_zoom", analyticsContent("seminar", seminarByArtwork(control.dataset.seminarPoster) || currentSeminar));
      return;
    }
    if (control.matches("[data-video-play], [data-video-local]")) {
      const videoCard = control.closest("[data-video-topic]");
      trackAnalytics("video_engagement", analyticsParams({ content_type: "video", content_id: control.dataset.videoPlay || control.dataset.videoLocal || "", topic: videoCard?.dataset.videoTopic || "", destination: "play" }));
      return;
    }
    if (control.matches("[data-share-toggle]")) {
      trackAnalytics("share", analyticsContent(currentArticle ? "article" : "seminar", currentArticle || currentSeminar));
      return;
    }
    if (control.closest("[data-share-menu]") && (control.matches("a") || control.matches("[data-copy-link]"))) {
      const destination = control.matches("[data-copy-link]") ? "copy_link" : control.textContent.trim().toLowerCase().replace(/\s+/g, "_");
      trackAnalytics("share", analyticsParams({ ...analyticsContent(currentArticle ? "article" : "seminar", currentArticle || currentSeminar), share_destination: destination }));
      return;
    }
    if (control.matches("[data-promote-open], [data-copy-promotion]")) {
      trackAnalytics("promote_content", analyticsParams({ ...analyticsContent(currentArticle ? "article" : "seminar", currentArticle || currentSeminar), destination: control.matches("[data-copy-promotion]") ? "copy" : "open" }));
      return;
    }
    if (control.matches("[data-event-audience]")) {
      trackAnalytics("audience_filter", { primary_audience: control.dataset.eventAudience || "all", content_type: "seminar" });
      return;
    }
    if (control.matches("[data-video-filter]")) {
      trackAnalytics("content_type_filter", { content_type: "video", topic: control.dataset.videoFilter || "all" });
      return;
    }
    const contentCard = control.closest("[data-content-id]");
    if (contentCard) {
      const record = contentRegistry.byId(contentCard.dataset.contentId);
      if (record) trackAnalytics("content_open", analyticsParams({ content_type: record.typeId, content_id: record.id, primary_audience: record.primaryAudience, disease_group: record.primaryDiseaseGroup, topic: record.topics[0] || "" }));
    }
    if (control.matches('a[target="_blank"]') && /open registration|register/i.test(control.textContent)) {
      trackAnalytics("outbound_registration", analyticsContent("seminar", currentSeminar));
    }
  });

  document.addEventListener("change", (event) => {
    const control = event.target;
    if (!(control instanceof HTMLSelectElement)) return;
    if (control.name === "audience") trackAnalytics("audience_filter", { primary_audience: control.value || "all" });
    if (control.name === "diseaseGroup") trackAnalytics("disease_filter", { disease_group: control.value || "all" });
    if (control.name === "type") trackAnalytics("content_type_filter", { content_type: control.value || "all" });
  });
}

async function bootstrap() {
  initAnalytics();
  shell();
  renderEbooks();
  renderEbookDetail();
  renderEvents();
  renderSources();

  initShell();
  initHeroMedia();
  initLightbox();
  initSeminarPosterLightbox();
  initArticlePageTools();
  initContactForm();
  initHomeSeminarPromotion();
  await loadContentRegistry();
  renderContentDiscovery();
  renderHome();
  renderDoctorClinicalPage();
  renderPublicPage();
  renderLibrary();
  initArticleReader();
  bindEventQuickRead();
  renderHealthcareWorkerPage();
  renderResources();
  initSearch();
  renderVideoHub();
  renderContinueExploring();
  enhanceRelatedLearning();
  initImmersiveExperience();
  initMotion();
  protectExternalLinks();
}

bootstrap();

// Download intent is separate from public reading and analytics.
document.addEventListener("click", async event => {
  const trigger=event.target.closest("[data-download-material]");
  if(!trigger)return;
  const presentation=data.presentations?.[trigger.dataset.downloadMaterial];
  if(!presentation||presentation.downloadable===false||!(presentation.sourceFile||presentation.sourcePdf))return;
  try {const module=await import("/download-client.js");module.openDownload(presentation,trigger);} catch {trigger.textContent="Download unavailable — try again";}
});
