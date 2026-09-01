const data = window.BAMEDICALE_DATA;
const GA4_MEASUREMENT_ID = "G-5Q36DG7PTC";
const ANALYTICS_SAFE_QUERY_KEYS = new Set(["disease", "book"]);
const analyticsEnabled = () => /(^|\.)bamedicale\.com$/i.test(window.location.hostname);
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
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>'
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
const articleDate = (article) => article.updatedDate || article.publishedDate || "";
const formatPublishedDate = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
};
const articlePrimaryAudience = (article) => article.primaryAudience || "PUBLIC";
const articleAudiences = (article) => [articlePrimaryAudience(article), ...(article.secondaryAudiences || [])];
const articleAuthor = (article) => article.author?.name || "BA Medicale";
const diseaseGroupById = (id) => (data.diseaseTaxonomy || []).find((group) => group.id === id);
const articleDiseaseGroups = (article) => [article.primaryDiseaseGroup, ...(article.secondaryDiseaseGroups || [])].filter(Boolean);
const articleDiseaseCondition = (article) => article.diseaseCondition || article.diseaseSite || "";
const groupLabelForSearch = (article) => diseaseGroupById(article.primaryDiseaseGroup)?.name || "General medical education";
const PRIMARY_NAVIGATION = Object.freeze([
  { label: "Education", items: [
    { label: "For Doctors", href: "clinical.html" },
    { label: "For Healthcare Workers", href: "healthcare-workers.html" },
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
    target.innerHTML = `<header class="site-header"><a class="brand" href="${navigationHref("index.html")}" aria-label="BA Medicale home"><img src="${navigationHref("assets/brand/bamedicale-approved-logo.jpg")}" alt="BA Medicale official logo"><span><b>BA Medicale</b><small>EST. 2024</small></span></a><nav class="nav-main" aria-label="Primary">${home}${groups}</nav><div class="nav-actions"><a class="search-button" href="${navigationHref("search.html")}" aria-label="Search BA Medicale"${searchCurrent}>${icon("search")}</a><a class="button button-dark" href="${navigationHref(member.href)}"${memberCurrent}>${member.label}</a><button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-navigation">${icon("menu")}</button></div></header><nav class="nav-mobile" id="mobile-navigation" aria-label="Mobile navigation">${mobileHome}${groups}<a class="nav-mobile__search" href="${navigationHref("search.html")}"${searchCurrent}>${icon("search")}<span>Search</span></a><a class="button button-dark nav-mobile__member" href="${navigationHref(member.href)}"${memberCurrent}>${member.label}</a></nav>`;
  });
  document.querySelectorAll("[data-footer]").forEach((target) => {
    target.innerHTML = `<footer class="site-footer">
      <div class="footer-brand"><a class="brand brand--footer" href="index.html"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo"><span><b>BA Medicale</b><small>Physician-led medical education</small></span></a><p>Education across diseases and health conditions, with dedicated depth in cancer, neoplasia, and surgical oncology. Information supports learning and does not replace individualized medical care.</p></div>
      <div class="footer-group"><h2>Explore</h2><a href="public.html">For Public</a><a href="clinical.html">For Doctors</a><a href="healthcare-workers.html">For Healthcare Workers</a><a href="library.html">Medical Library</a><a href="seminar.html">Courses &amp; Seminars</a><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a></div>
      <div class="footer-group"><h2>BA Medicale</h2><a href="about.html">About BA Medicale</a><a href="team.html">Team</a><a href="contact.html">Contact Us</a><a href="privacy-policy.html">Privacy Policy</a></div>
      <div class="footer-group footer-connect"><h2>Contact</h2><address><span>Email</span><a href="mailto:support@bamedicale.com">support@bamedicale.com</a><span>WhatsApp</span><a href="https://wa.me/628212366331" target="_blank" rel="noopener noreferrer">+62 821-236-6331</a></address>
        <h2 class="footer-follow-heading">Follow</h2><nav class="footer-social" aria-label="Follow BA Medicale">
          <a href="https://www.instagram.com/bamedicale/" target="_blank" rel="noopener noreferrer" aria-label="Follow BA Medicale on Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg></a>
          <a href="https://www.youtube.com/@BAMedicale" target="_blank" rel="noopener noreferrer" aria-label="Watch BA Medicale on YouTube" title="YouTube"><svg class="footer-social__youtube" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 7.2a3 3 0 0 0-2.1-2.1C17.5 4.6 12 4.6 12 4.6s-5.5 0-7.3.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2.1 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.3.5 7.3.5s5.5 0 7.3-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z"/></svg></a>
        </nav>
      </div>
      <div class="footer-group"><h2>Editorial Sources</h2>${data.sources.map((item) => `<a href="${escapeHtml(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join("")}</div>
      <div class="footer-note"><small>© 2026 BA Medicale</small><nav aria-label="Footer legal and contact links"><a href="privacy-policy.html">Privacy Policy</a><a href="contact.html">Contact Us</a></nav></div>
    </footer>`;
  });
}

async function renderHealthcareWorkerPage() {
  const target = document.querySelector("[data-healthcare-worker-content]");
  if (!target) return;
  const audience = "HEALTHCARE WORKER";
  const baseRecords = [
    ...articleRecords().map((item) => ({ audience: articlePrimaryAudience(item), type: "Article", title: item.title, text: item.excerpt, href: articlePath(item), topic: item.primaryTopic })),
    ...Object.values(data.seminars || {}).map((item) => ({ audience: item.primaryAudience, type: "Course & seminar", title: item.title, text: item.summary || item.description || "Verified seminar information will appear here.", href: item.detailUrl || "seminar.html", topic: (item.topics || [])[0] || "Professional learning" })),
    ...(data.ebooks || []).map((item) => ({ audience: item.primaryAudience, type: "eBook", title: item.title, text: item.text, href: "ebooks.html", topic: (item.topics || [])[0] || "Professional learning" }))
  ].filter((item) => item.audience === audience);
  const show = (records) => {
    target.innerHTML = records.length
    ? records.map((item) => `<article class="knowledge-card"><span>${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><i>${escapeHtml(item.topic)}</i><a class="text-link" href="${escapeHtml(item.href)}">Open learning <span>→</span></a></article>`).join("")
    : `<article class="audience-content-empty"><p class="eyebrow">Growing collection</p><h2>Healthcare Worker learning is being prepared.</h2><p>New articles, courses, videos, eBooks, and resources will appear here when they are published with Healthcare Worker as their primary audience.</p><a class="text-link" href="library.html">Browse the full Library <span>→</span></a></article>`;
  };
  show(baseRecords.slice(0, 6));
  try {
    const response = await fetch("data/videos.json?v=video-catalog-20260824-2");
    if (!response.ok) return;
    const videos = ((await response.json()).videos || []).filter((item) => item.primaryAudience === audience).map((item) => ({
      type: "Video", title: item.title, text: item.short_description || "Verified educational video.", href: "videos.html", topic: item.topic || "Professional learning"
    }));
    show([...baseRecords, ...videos].slice(0, 6));
  } catch {
    // The empty state remains available when the video catalog cannot be loaded.
  }
}

function renderHome() {
  const diseaseExplorer = document.querySelector("[data-disease-explorer]");
  if (diseaseExplorer) {
    diseaseExplorer.innerHTML = `<header class="disease-explorer__head"><div><p class="approved-kicker">Disease Explorer</p><h2 id="disease-explorer-title">Explore medical knowledge by disease area.</h2></div><p>Explore diseases and health conditions across medical disciplines, with dedicated depth in cancer, neoplasia, and surgical oncology.</p></header><nav class="disease-explorer__grid" aria-label="Explore medical knowledge by disease group">${data.diseaseTaxonomy.map((group, index) => {
      const flagship = group.id === "cancer-neoplastic";
      return `<a class="disease-group${flagship ? " disease-group--flagship" : ""}" href="library.html?disease=${encodeURIComponent(group.id)}"${flagship ? ' aria-label="Explore Cancer and Neoplastic Diseases, BA Medicale flagship domain"' : ""}><span class="disease-group__icon">${diseaseIcon(group.icon)}</span><span class="disease-group__copy">${flagship ? '<em class="disease-group__flagship">Flagship depth</em>' : ""}<b><i>${String(index + 1).padStart(2, "0")}</i>${escapeHtml(group.name)}</b><small>${escapeHtml(group.descriptor)}</small></span><span class="disease-group__arrow" aria-hidden="true">›</span></a>`;
    }).join("")}</nav><footer class="disease-explorer__footer"><div>${icon("book")}<p><b>Find the knowledge you need.</b><span>Browse all education or filter the Library by audience and disease area.</span></p></div><a class="approved-button approved-button--primary" href="library.html">Explore Medical Library <span aria-hidden="true">→</span></a></footer>`;
  }
  const library = document.querySelector("[data-library-preview]");
  if (library) library.innerHTML = data.library.map((item) => `<article class="knowledge-card"><span>${item.type}</span><h3>${item.title}</h3><p>${item.text}</p><a href="${item.href}" class="text-link">Read guide <span>→</span></a></article>`).join("");
  const profile = document.querySelector("[data-profile]");
  if (profile) profile.innerHTML = `<img src="${data.profile.image}" alt="${data.profile.name}" loading="lazy" width="1254" height="1254"><div><p class="eyebrow">Physician-led education</p><h2>${data.profile.name}</h2><p class="profile-role">${data.profile.role}</p><p>${data.profile.text}</p><a href="about.html" class="button button-outline">About BA Medicale</a></div>`;
  const updates = document.querySelector("[data-home-updates]");
  if (updates) {
    const fillToFive = (items) => items.concat(Array.from({ length: Math.max(0, 5 - items.length) }, () => ({ title: "Coming soon", meta: "New learning update in preparation", pending: true })));
    const list = (items, href) => fillToFive(items).slice(0, 5).map((item) => `<a class="home-update-item${item.pending ? " is-pending" : ""}" href="${href}"><span>${escapeHtml(item.meta)}</span><b>${escapeHtml(item.title)}</b><i aria-hidden="true">→</i></a>`).join("");
    const articles = articleRecords().map((item) => ({ title: item.title, meta: item.primaryTopic }));
    const seminars = Object.values(data.seminars || {}).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))).map((item) => ({ title: item.title, meta: `${item.date} · ${item.time}` }));
    const ebooks = data.ebooks.map((item) => ({ title: item.title, meta: item.state }));
    updates.innerHTML = `<div class="approved-home-updates__heading"><p class="approved-kicker">Latest updates</p><h2>Continue with what is new.</h2><p>New reading, upcoming learning, and recently added eBooks in one practical overview.</p></div><div class="approved-home-updates__grid"><section class="home-update-card"><div><p>Articles</p><h3>Latest reading</h3></div>${list(articles, "library.html")}</section><section class="home-update-card"><div><p>Upcoming event</p><h3>Seminars &amp; courses</h3></div>${list(seminars, "seminar.html")}</section><section class="home-update-card"><div><p>eBooks</p><h3>Recently added</h3></div>${list(ebooks, "ebooks.html")}</section></div>`;
  }
}

function renderLibrary() {
  const target = document.querySelector("[data-article-library]");
  if (!target) return;
  const records = articleRecords();
  const topics = [...new Set(records.map((article) => article.primaryTopic))];
  const conditions = [...new Set(records.map(articleDiseaseCondition).filter(Boolean))];
  const types = [...new Set(records.map((article) => article.contentType).filter(Boolean))];
  const requestedDisease = new URLSearchParams(window.location.search).get("disease") || "";
  const selectedDisease = diseaseGroupById(requestedDisease) ? requestedDisease : "";
  const option = (value, label = value, selected = false) => `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  const groupLabel = (article) => diseaseGroupById(article.primaryDiseaseGroup)?.name || "General medical education";
  const latestCard = (article) => `<article class="article-latest-card"><img src="${escapeHtml(safeImageUrl(article.cover))}" alt="${escapeHtml(article.title)} editorial artwork" width="1280" height="720" loading="lazy"><div><span>${escapeHtml(articlePrimaryAudience(article))}</span><p>${escapeHtml(groupLabel(article))}</p><h3>${escapeHtml(article.title)}</h3><small>By ${escapeHtml(articleAuthor(article))}</small><a href="${escapeHtml(articlePath(article))}">Read full article <b aria-hidden="true">→</b></a></div></article>`;
  const listItem = (article) => `<article class="article-list-item"><img src="${escapeHtml(safeImageUrl(article.cover))}" alt="" width="320" height="180" loading="lazy"><div class="article-list-item__copy"><div class="article-list-item__meta"><span>${escapeHtml(articlePrimaryAudience(article))}</span><b>${escapeHtml(groupLabel(article))}</b>${articleDiseaseCondition(article) ? `<i>${escapeHtml(articleDiseaseCondition(article))}</i>` : ""}${articleDate(article) ? `<time datetime="${escapeHtml(articleDate(article))}">${escapeHtml(articleDate(article))}</time>` : ""}</div><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.excerpt)}</p><div class="article-list-item__tags">${(article.tags || []).slice(0, 3).map((tag) => `<i>${escapeHtml(tag)}</i>`).join("")}</div><small>By ${escapeHtml(articleAuthor(article))} · Sources: ${escapeHtml(article.sourceAttribution)}</small></div><div class="article-list-item__actions"><a href="${escapeHtml(articlePath(article))}" data-article-reader="${escapeHtml(article.id)}">Quick Read</a><a href="${escapeHtml(articlePath(article))}">Read Full Article</a></div></article>`;
  const sections = [
    ["PUBLIC", "Public Education", "Clear explanations for patients, families, and anyone building a stronger understanding."],
    ["DOCTOR", "Professional Education — Doctors", "Clinical context for doctors, specialists, and physician-level learners."],
    ["HEALTHCARE WORKER", "Professional Education — Healthcare Workers", "Practical learning for nursing, allied health, pharmacy, laboratory, imaging, and multidisciplinary care."]
  ];
  target.innerHTML = `<section class="article-latest"><div class="article-library__heading"><div><p class="eyebrow">Latest articles</p><h2>Recently published and updated.</h2></div><p>${records.length >= 5 ? "Five current entry points" : `${records.length} current article${records.length === 1 ? "" : "s"}`}, ordered automatically from the article registry.</p></div><div class="article-latest__rail">${records.slice(0, 5).map(latestCard).join("")}</div></section><form class="article-filters" data-article-filters><label>Audience<select name="audience"><option value="">All audiences</option>${["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"].map((value) => option(value)).join("")}</select></label><label>Disease group<select name="diseaseGroup"><option value="">All disease groups</option>${data.diseaseTaxonomy.map((group) => option(group.id, group.name, group.id === selectedDisease)).join("")}</select></label><label>Disease / condition<select name="condition"><option value="">All conditions</option>${conditions.map((value) => option(value)).join("")}</select></label><label>Primary topic<select name="topic"><option value="">All topics</option>${topics.map((value) => option(value)).join("")}</select></label><label>Content type<select name="type"><option value="">All types</option>${types.map((value) => option(value)).join("")}</select></label><button type="reset">Clear filters</button></form>${selectedDisease ? `<p class="article-filter-context">Exploring <b>${escapeHtml(diseaseGroupById(selectedDisease).name)}</b>. Available Library content is shown below; additional resources will appear here as they are published.</p>` : ""}<div data-article-audiences>${sections.map(([audience, title, description]) => `<section class="article-audience" data-article-audience="${audience}"><header><div><p class="eyebrow">${title}</p><h2>${description}</h2></div><span data-article-count></span></header><div class="article-list" data-article-list></div><nav class="article-pagination" aria-label="${title} pages"><button type="button" data-page="previous">Previous</button><span data-page-status></span><button type="button" data-page="next">Next</button></nav></section>`).join("")}</div>`;
  const filterForm = target.querySelector("[data-article-filters]");
  const pages = new Map();
  const update = () => {
    const values = Object.fromEntries(new FormData(filterForm));
    target.querySelectorAll("[data-article-audience]").forEach((section) => {
      const audience = section.dataset.articleAudience;
      const filtered = records.filter((article) => articlePrimaryAudience(article) === audience && (!values.audience || articleAudiences(article).includes(values.audience)) && (!values.diseaseGroup || articleDiseaseGroups(article).includes(values.diseaseGroup)) && (!values.condition || articleDiseaseCondition(article) === values.condition) && (!values.topic || article.primaryTopic === values.topic) && (!values.type || article.contentType === values.type));
      const maxPage = Math.max(1, Math.ceil(filtered.length / 10));
      const page = Math.min(pages.get(audience) || 1, maxPage);
      pages.set(audience, page);
      const hasFilters = Object.values(values).some(Boolean);
      section.querySelector("[data-article-list]").innerHTML = filtered.length ? filtered.slice((page - 1) * 10, page * 10).map(listItem).join("") : `<p class="article-list__empty">${hasFilters ? "No articles match these filters yet." : "Articles for this primary audience are in preparation."}</p>`;
      section.querySelector("[data-article-count]").textContent = `${filtered.length} article${filtered.length === 1 ? "" : "s"}`;
      section.querySelector("[data-page-status]").textContent = `Page ${page} of ${maxPage}`;
      section.querySelector('[data-page="previous"]').disabled = page <= 1;
      section.querySelector('[data-page="next"]').disabled = page >= maxPage;
    });
  };
  filterForm.addEventListener("change", () => { pages.clear(); update(); });
  filterForm.addEventListener("reset", () => { pages.clear(); requestAnimationFrame(update); });
  target.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
    const section = button.closest("[data-article-audience]");
    const audience = section.dataset.articleAudience;
    pages.set(audience, Math.max(1, (pages.get(audience) || 1) + (button.dataset.page === "next" ? 1 : -1)));
    update();
    section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));
  update();
}

function initArticleReader() {
  const triggers = document.querySelectorAll("[data-article-reader]");
  if (!triggers.length || !data.articles) return;
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
  const open = (id, opener) => {
    const article = data.articles[id];
    if (!article) return;
    pdf.href = safeInternalUrl(article.sourcePdf);
    body.innerHTML = `<header class="article-reader__hero"><p class="eyebrow">${escapeHtml(article.label)}</p><div class="article-page-badges"><span>${escapeHtml(articlePrimaryAudience(article))}</span><span>${escapeHtml(diseaseGroupById(article.primaryDiseaseGroup)?.name || "General medical education")}</span>${articleDiseaseCondition(article) ? `<span>${escapeHtml(articleDiseaseCondition(article))}</span>` : ""}</div><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.dek)}</p><small class="article-byline">By ${escapeHtml(articleAuthor(article))}${article.publishedDate ? ` · Published: ${escapeHtml(formatPublishedDate(article.publishedDate))}` : ""}</small>${article.stats?.length ? `<div class="article-reader__stats">${article.stats.map(([value, label]) => `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}</div>` : ""}</header><section class="article-reader__intro">${article.intro.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>${article.sections.map(renderSection).join("")}<section class="article-reader__takeaways"><p class="eyebrow">Key educational takeaways</p><h2>What to carry into the next conversation.</h2><ul>${article.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section class="article-reader__references"><p class="eyebrow">References and sources</p>${article.references.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>`;
    dialog.dataset.returnFocus = opener ? "true" : "false";
    dialog.showModal();
    body.scrollTop = 0;
    body.focus();
  };
  triggers.forEach((trigger) => trigger.addEventListener("click", (event) => {
    event.preventDefault();
    open(trigger.dataset.articleReader, trigger);
  }));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}

function renderEbooks() {
  const ebookArt = ["assets/ebooks/clinical-oncology-foundations.png", "assets/ebooks/practical-surgical-oncology.png", "assets/ebooks/breast-cancer-clinical-guide.png"];
  document.querySelectorAll("[data-ebooks]").forEach((target) => {
    target.innerHTML = data.ebooks.map((item, index) => `<article class="ebook-card"><div class="ebook-visual ebook-visual--${index + 1}"><img src="${ebookArt[index]}" alt="Contextual editorial artwork for ${item.title}" width="1024" height="1024" loading="lazy"><span>${String(index + 1).padStart(2, "0")}</span></div><div><p class="eyebrow">${item.state}</p><h2>${item.title}</h2><p class="audience">${item.audience}</p><p>${item.text}</p><div class="ebook-actions"><strong>${item.price}</strong><a class="button button-outline" href="ebook-detail.html?book=${item.slug}">View detail</a><a class="button button-dark" href="login.html">Unlock on release</a></div></div></article>`).join("");
  });
}

function renderEbookDetail() {
  const target = document.querySelector("[data-ebook-detail]");
  if (!target) return;
  const slug = new URLSearchParams(window.location.search).get("book");
  const item = data.ebooks.find((book) => book.slug === slug) || data.ebooks[0];
  const art = { "clinical-oncology-foundations": "assets/ebooks/clinical-oncology-foundations.png", "practical-surgical-oncology": "assets/ebooks/practical-surgical-oncology.png", "breast-cancer-clinical-guide": "assets/ebooks/breast-cancer-clinical-guide.png" }[item.slug];
  target.innerHTML = `<article class="ebook-card"><div class="ebook-visual ebook-visual--1"><img src="${art}" alt="Contextual editorial artwork for ${item.title}" width="1024" height="1024" loading="lazy"><span>01</span></div><div><p class="eyebrow">${item.state}</p><h2>${item.title}</h2><p class="audience">${item.audience}</p><p>${item.text}</p><div class="ebook-actions"><strong>${item.price}</strong><a class="button button-outline" href="ebooks.html">Back to catalog</a><a class="button button-dark" href="login.html">Unlock on release</a></div></div></article>`;
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
  const upcomingCard = (item) => { const poster = seminarPosterDimensions(item); return `<article class="seminar-card"><div class="seminar-card__poster" style="${seminarPosterStyle(item)}"><button type="button" data-seminar-poster="${escapeHtml(safeImageUrl(item.artwork))}" data-seminar-poster-alt="Official event poster for ${escapeHtml(item.title)}" aria-label="Inspect official poster for ${escapeHtml(item.title)}"><img src="${escapeHtml(safeImageUrl(item.artwork))}" alt="Official event poster for ${escapeHtml(item.title)}" width="${poster.width}" height="${poster.height}" loading="eager"></button></div><div class="seminar-card__copy"><div class="seminar-card__badges"><span>${escapeHtml(item.primaryAudience)}</span><span>${escapeHtml(groupName(item))}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><dl><div><dt>Date</dt><dd>${escapeHtml(item.date)}</dd></div><div><dt>Time</dt><dd>${escapeHtml(item.time)}</dd></div><div><dt>Format</dt><dd>${escapeHtml(item.location)}</dd></div></dl><div class="seminar-card__actions"><button type="button" data-event-quick-read="${escapeHtml(item.id)}">Quick Read</button><a href="${escapeHtml(safeInternalUrl(item.detailUrl))}">View Event</a></div></div></article>`; };
  const pastRow = (item) => `<article class="seminar-past-row"><img src="${escapeHtml(safeImageUrl(item.artwork))}" alt="Official event poster for ${escapeHtml(item.title)}" width="1086" height="1448" loading="lazy"><div><div class="seminar-card__badges"><span>${escapeHtml(item.primaryAudience)}</span><span>${escapeHtml(groupName(item))}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><small>${escapeHtml(item.date)} · ${escapeHtml(item.topics.slice(0, 2).join(" · "))}</small></div><div class="seminar-past-row__actions"><button type="button" data-event-quick-read="${escapeHtml(item.id)}">Quick Read</button><a href="${escapeHtml(safeInternalUrl(item.detailUrl))}">View Event</a></div></article>`;
  const render = () => {
    const visible = filtered();
    const upcoming = visible.filter(isUpcoming).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 5);
    const past = visible.filter((item) => !isUpcoming(item)).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    const pageCount = Math.max(1, Math.ceil(past.length / pageSize));
    pastPage = Math.min(pastPage, pageCount - 1);
    target.querySelector("[data-upcoming-events]").innerHTML = upcoming.length ? upcoming.map(upcomingCard).join("") : `<div class="seminar-empty"><h2>No upcoming events in this audience yet.</h2><p>Verified programs will appear here automatically when dates and official details are published.</p></div>`;
    target.querySelector("[data-past-events]").innerHTML = past.length ? past.slice(pastPage * pageSize, (pastPage + 1) * pageSize).map(pastRow).join("") : `<div class="seminar-empty"><h2>No past events in this audience yet.</h2><p>Completed programs will move here automatically while their event pages remain available.</p></div>`;
    const status = target.querySelector("[data-event-page-status]");
    status.textContent = past.length ? `Page ${pastPage + 1} of ${pageCount}` : "No archived events";
    target.querySelector('[data-event-page="previous"]').disabled = !past.length || pastPage === 0;
    target.querySelector('[data-event-page="next"]').disabled = !past.length || pastPage >= pageCount - 1;
    initSeminarPosterLightbox();
    bindEventQuickRead();
  };
  target.innerHTML = `<nav class="seminar-audience" aria-label="Filter events by audience"><button type="button" class="is-active" data-event-audience="ALL">All events</button><button type="button" data-event-audience="PUBLIC">Public</button><button type="button" data-event-audience="DOCTOR">Doctors</button><button type="button" data-event-audience="HEALTHCARE WORKER">Healthcare workers</button></nav><section class="seminar-library__section"><header class="seminar-library__heading"><div><p class="eyebrow">Upcoming events</p><h2>The nearest verified learning programs.</h2></div><p>Dates, participation details, and faculty information come from official event material.</p></header><div class="seminar-upcoming-rail" data-upcoming-events></div></section><section class="seminar-library__section"><header class="seminar-library__heading"><div><p class="eyebrow">Past events</p><h2>Programs retained for reference and discovery.</h2></div><p>Completed events remain available through their canonical event pages.</p></header><div class="seminar-past-list" data-past-events></div><nav class="seminar-pagination" aria-label="Past event pages"><button type="button" data-event-page="previous">Previous</button><span data-event-page-status></span><button type="button" data-event-page="next">Next</button></nav></section>`;
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
    button.addEventListener("click", () => {
      const item = data.seminars?.[button.dataset.eventQuickRead];
      if (!item) return;
      const group = diseaseGroupById(item.primaryDiseaseGroup)?.name || "General medical education";
      const poster = seminarPosterDimensions(item);
      const registrationUrl = safeExternalUrl(/^https?:\/\//i.test(item.registration || "") ? item.registration : `https://${item.registration || ""}`);
      const registration = registrationUrl ? `<a class="button button-dark" href="${escapeHtml(registrationUrl)}" target="_blank" rel="noopener noreferrer">Open registration</a>` : "";
      dialog.querySelector(".event-reader__body").innerHTML = `<header><div><p class="eyebrow">${escapeHtml(item.format)}</p><div class="seminar-card__badges"><span>${escapeHtml(item.primaryAudience)}</span><span>${escapeHtml(group)}</span><span>${escapeHtml(item.diseaseCondition)}</span></div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p><dl><div><dt>Date</dt><dd>${escapeHtml(item.date)}</dd></div><div><dt>Time</dt><dd>${escapeHtml(item.time)}</dd></div><div><dt>Format</dt><dd>${escapeHtml(item.location)}</dd></div></dl>${item.publishedDate ? `<small class="event-published">Published: ${escapeHtml(formatPublishedDate(item.publishedDate))}</small>` : ""}${registration}<a class="text-link" href="${escapeHtml(safeInternalUrl(item.detailUrl))}">View full Event page <span>→</span></a></div><button class="seminar-poster-frame" type="button" style="${seminarPosterStyle(item)}" data-seminar-poster="${escapeHtml(safeImageUrl(item.artwork))}" data-seminar-poster-alt="Official event poster for ${escapeHtml(item.title)}"><img src="${escapeHtml(safeImageUrl(item.artwork))}" alt="Official event poster for ${escapeHtml(item.title)}" width="${poster.width}" height="${poster.height}"></button></header><section><p class="eyebrow">Program focus</p><ol>${item.sessions.map(([title, speaker]) => `<li><h2>${escapeHtml(title)}</h2><p>${escapeHtml(speaker)}</p></li>`).join("")}</ol></section><section><p class="eyebrow">Faculty and moderation</p><ul>${item.faculty.map(([role, name]) => `<li><b>${escapeHtml(role)}</b><span>${escapeHtml(name)}</span></li>`).join("")}</ul></section><footer><span>${escapeHtml(item.topics.join(" · "))}</span><small>${escapeHtml(item.organizer)}</small></footer>`;
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

function initSearch() {
  const input = document.querySelector("[data-search-input]");
  const output = document.querySelector("[data-search-results]");
  if (!input || !output) return;
  const results = [
    ["I found a lump", "Public guide", "A lump can have many causes. Learn how clinical evaluation, imaging, and biopsy may each contribute.", "public.html#diagnosis"], ["Tumor vs cancer", "Public guide", "Understand why a tumor is not always cancer, and why a malignant tumor can invade or spread.", "public.html#tumor-cancer"], ["Biopsy", "Diagnosis", "How tissue or cell sampling can help establish a diagnosis and guide further testing.", "public.html#diagnosis"], ["Cancer staging", "Professional", "An orientation to stage, TNM language, and how staging supports treatment planning.", "clinical.html#staging"], ["Immunotherapy", "Treatment", "A treatment concept that uses the immune system in selected cancer settings.", "public.html#treatment"], ["Thyroid nodule", "Disease Explorer", "Explore thyroid and endocrine learning across public and professional education.", "library.html?disease=endocrine-metabolic"]
  ].concat(data.library.map((item) => [item.title, item.type, item.text, item.href])).concat(articleRecords().map((article) => [article.title, `${groupLabelForSearch(article)} · ${article.primaryTopic}`, `${articleDiseaseCondition(article)} ${article.excerpt}`, articlePath(article)]));
  const show = (query = "") => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = results.filter((item) => terms.every((term) => item.join(" ").toLowerCase().includes(term)));
    output.innerHTML = filtered.length ? filtered.map(([title, label, text, href]) => `<a class="search-result" href="${escapeHtml(safeInternalUrl(href))}"><span>${escapeHtml(label)}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><b>→</b></a>`).join("") : `<div class="empty-panel"><p class="eyebrow">No exact result</p><h2>Try a symptom, test, body system, or treatment term.</h2><p>Search is currently an editorial navigation tool. More indexed content can be added through the central content registry.</p></div>`;
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
      if (group.closest(".nav-main") && !group.contains(event.relatedTarget)) group.open = false;
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
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .05 }).observe(video);
  video.addEventListener("loadeddata", update);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("pageshow", update);
  reducedMotion.addEventListener("change", update);
  document.addEventListener("pointerdown", update, { once: true, passive: true });
}

function initMotion() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = new Set(document.querySelectorAll([
    ".section",
    ".editorial-band",
    ".company-values",
    ".company-section",
    ".company-learning",
    ".company-direction",
    ".company-closing",
    ".team-directory",
    ".physician-profile",
    ".contact-layout",
    ".contact-note",
    ".disease-explorer",
    ".approved-infographics",
    ".approved-discovery-shell",
    ".approved-videos",
    ".approved-home-updates",
    ".profile-page__hero"
  ].join(", ")));
  const groups = document.querySelectorAll([
    ".knowledge-grid",
    ".mosaic",
    ".ebook-grid",
    ".event-grid",
    ".source-grid",
    ".resource-grid",
    ".article-latest-grid",
    ".article-latest__rail",
    ".article-list",
    ".seminar-grid",
    ".seminar-upcoming-rail",
    ".seminar-past-list",
    ".video-grid",
    ".disease-explorer-grid",
    ".team-grid",
    ".contact-methods",
    ".profile-record",
    ".profile-detail-grid",
    ".company-offerings",
    ".disease-explorer__grid",
    ".approved-discovery",
    ".approved-videos__rail",
    ".approved-home-updates__grid"
  ].join(", "));

  groups.forEach((group) => [...group.children].forEach((item, index) => {
    if (!(item instanceof HTMLElement) || item.hidden) return;
    item.style.setProperty("--reveal-order", String(Math.min(index, 5)));
    targets.add(item);
  }));

  if (!targets.size || reducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  document.documentElement.classList.add("motion-enabled");
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }), { rootMargin: "0px 0px -6%", threshold: .06 });

  targets.forEach((item) => {
    item.classList.add("reveal");
    observer.observe(item);
  });
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
  const poster = safeImageUrl(seminar?.artwork);
  if (!seminar || !destination || !poster) return;

  const dialog = document.createElement("dialog");
  dialog.className = "home-seminar-promo";
  dialog.setAttribute("aria-labelledby", "home-seminar-promo-title");
  const posterDimensions = seminarPosterDimensions(seminar);
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

async function renderVideoHub() {
  const hub = document.querySelector("[data-video-hub]");
  const preview = document.querySelector("[data-video-preview-list]");
  if (!hub && !preview) return;
  let videos = [];
  let originalVideos = [];
  try {
    const response = await fetch("data/videos.json?v=video-catalog-20260824-2");
    if (!response.ok) throw new Error("Video catalog unavailable");
    videos = (await response.json()).videos.filter((video) => video.verified_identity);
    try {
      const originalResponse = await fetch("data/original-videos.json?v=video-frame-posters-20260825");
      if (originalResponse.ok) originalVideos = (await originalResponse.json()).videos || [];
    } catch {
      originalVideos = [];
    }
  } catch (error) {
    if (hub) hub.innerHTML = `<div class="video-hub__empty"><p class="eyebrow">Video collection</p><h2>The public video catalog is being refreshed.</h2><p>Source verification is required before a video is shown here.</p></div>`;
    return;
  }
  const card = (video, featured = false) => `<article class="video-card ${featured ? "video-card--featured" : ""}" data-video-topic="${escapeHtml(video.topic)}"><button type="button" class="video-card__play" data-video-play="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(safeImageUrl(video.thumbnail))}" alt="${escapeHtml(video.title)}" width="480" height="360" loading="eager" referrerpolicy="no-referrer"><span>Play</span></button><div class="video-card__copy"><p><b>${escapeHtml(video.source_label)}</b><i>${escapeHtml(video.topic)}</i></p><h2>${escapeHtml(video.title)}</h2><small>${escapeHtml(video.person)}</small><a href="${escapeHtml(safeExternalUrl(video.url))}" target="_blank" rel="noopener noreferrer">View original source <strong>↗</strong></a></div></article>`;
  const localThumbnail = (video) => safeImageUrl(video.thumbnail);
  const localCard = (video) => `<article class="video-card video-card--original" data-video-topic="${escapeHtml(video.topic)}"><button type="button" class="video-card__play video-card__play--local" data-video-local="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(localThumbnail(video))}" alt="Preview of ${escapeHtml(video.title)}" width="960" height="540" loading="lazy"><span>Watch</span></button><div class="video-card__copy"><p><b>${escapeHtml(video.source_label)}</b><i>${escapeHtml(video.topic)}</i></p><h2>${escapeHtml(video.title)}</h2><small>${escapeHtml(video.short_description)}</small>${video.publishedDate ? `<small class="video-card__published">Published: ${escapeHtml(formatPublishedDate(video.publishedDate))}</small>` : ""}<a href="${escapeHtml(safeInternalUrl(video.video_url))}" target="_blank" rel="noopener noreferrer">Open video file <strong>↗</strong></a></div></article>`;
  const latestOriginals = originalVideos.slice(-4).reverse();
  const latestYouTube = videos.slice().sort((a, b) => String(b.publish_date || "").localeCompare(String(a.publish_date || ""))).slice(0, 4);
  const previewLocalCard = (video) => `<article class="video-preview video-preview--original"><button type="button" data-video-local="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(localThumbnail(video))}" alt="Preview of ${escapeHtml(video.title)}" width="960" height="540" loading="lazy"><span>▶</span></button><p>${escapeHtml(video.source_label)}</p><h3>${escapeHtml(video.title)}</h3></article>`;
  const previewYouTubeCard = (video) => `<article class="video-preview"><button type="button" data-video-play="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(safeImageUrl(video.thumbnail))}" alt="${escapeHtml(video.title)}" width="480" height="360" loading="eager" referrerpolicy="no-referrer"><span>▶</span></button><p>${escapeHtml(video.source_label)}</p><h3>${escapeHtml(video.title)}</h3></article>`;
  const featured = videos.find((video) => video.featured) || videos[0];
  const remaining = videos.filter((video) => video.id !== featured.id);
  if (hub) { const topics = [...new Set(videos.map((video) => video.topic))]; const originalSection = originalVideos.length ? `<section class="video-hub__section video-originals"><div class="section-head"><div><p class="eyebrow">BA Medicale originals</p><h2>Original videos prepared for the BA Medicale learning experience.</h2></div><p>These videos are hosted by BA Medicale and use the original uploaded media assets.</p></div><div class="video-grid video-grid--original">${originalVideos.map((video) => localCard(video)).join("")}</div></section>` : ""; hub.innerHTML = `${originalSection}<section class="video-feature"><div>${card(featured, true)}</div><aside><p class="eyebrow">Verified physician appearances</p><h2>Public educational videos with source attribution.</h2><p>Each entry is retained only when the public title and publisher clearly identify Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K).</p><div class="video-topics" role="group" aria-label="Filter verified videos"><button class="is-active" type="button" data-video-filter="all">All topics</button>${topics.map((topic) => `<button type="button" data-video-filter="${topic}">${topic}</button>`).join("")}</div></aside></section><section class="video-hub__section"><div class="section-head"><div><p class="eyebrow">Latest verified videos</p><h2>Watch and learn in context.</h2></div></div><div class="video-grid">${remaining.map((video) => card(video)).join("")}</div></section><section class="video-hub__section video-source-state"><div><p class="eyebrow">BA Medicale Instagram</p><h2>Public reels will appear after public discovery exposes verifiable post links.</h2></div><p>The profile was reachable during the latest scan, but its unauthenticated response did not expose reel URLs. No Instagram entries are displayed rather than guessing or linking to unavailable posts.</p></section>`; hub.querySelectorAll("[data-video-filter]").forEach((filter) => filter.addEventListener("click", () => { const topic = filter.dataset.videoFilter; hub.querySelectorAll("[data-video-filter]").forEach((item) => item.classList.toggle("is-active", item === filter)); hub.querySelectorAll(".video-grid .video-card:not(.video-card--original)").forEach((item) => { item.hidden = topic !== "all" && item.dataset.videoTopic !== topic; }); })); }
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
    const mailto = `mailto:support@bamedicale.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
  const currentBook = ebookBySlug(new URLSearchParams(window.location.search).get("book"));
  if (currentArticle) trackAnalytics("content_open", analyticsContent("article", currentArticle));
  if (currentSeminar) trackAnalytics("content_open", analyticsContent("seminar", currentSeminar));
  if (currentBook) trackAnalytics("ebook_open", analyticsContent("ebook", currentBook));

  document.addEventListener("click", (event) => {
    const control = event.target.closest("a, button");
    if (!control) return;
    if (control.matches(".disease-group")) {
      const disease = new URL(control.href, window.location.href).searchParams.get("disease");
      trackAnalytics("disease_explorer_click", { disease_group: disease || "" });
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

initAnalytics(); shell(); renderHome(); renderLibrary(); renderHealthcareWorkerPage(); initArticleReader(); renderEbooks(); renderEbookDetail(); renderEvents(); renderSources(); initShell(); initHeroMedia(); initSearch(); initMotion(); initLightbox(); initSeminarPosterLightbox(); initArticlePageTools(); initContactForm(); renderVideoHub(); initHomeSeminarPromotion(); protectExternalLinks();
