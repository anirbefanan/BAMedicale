const data = window.BAMEDICALE_DATA;
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
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
const compactAudience = (audiences = []) => audiences.length > 1 ? `${audiences[0]} +${audiences.length - 1}` : (audiences[0] || "GENERAL");

function shell() {
  document.querySelectorAll("[data-shell]").forEach((target) => {
    target.innerHTML = `<header class="site-header"><a class="brand" href="index.html" aria-label="BA Medicale home"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo"><span><b>BA Medicale</b><small>EST. 2024</small></span></a><nav class="nav-main" aria-label="Primary"><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Library</a><a href="seminar.html">Courses</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a></nav><div class="nav-actions"><a class="search-button" href="search.html" aria-label="Search BA Medicale">${icon("search")}</a><a class="button button-dark" href="login.html">Member access</a><button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false">${icon("menu")}</button></div></header><nav class="nav-mobile" aria-label="Mobile navigation"><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Library</a><a href="seminar.html">Courses & seminars</a><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a><a href="about.html">About BA Medicale</a><a href="login.html">Member access</a></nav>`;
  });
  document.querySelectorAll("[data-footer]").forEach((target) => {
    target.innerHTML = `<footer class="site-footer"><div><a class="brand brand--footer" href="index.html"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo"><span><b>BA Medicale</b><small>Comprehensive tumor and cancer education</small></span></a><p>Education for public understanding and professional cancer practice. Information on this site supports learning and is not a substitute for personal medical care.</p></div><div><h2>Explore</h2><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Medical Library</a><a href="seminar.html">Courses & seminars</a></div><div><h2>Knowledge</h2><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a><a href="about.html">About</a></div><div><h2>Editorial sources</h2>${data.sources.map((item) => `<a href="${escapeHtml(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join("")}</div><small class="footer-note">© 2026 BA Medicale. Site content and features are under continuing editorial development.</small></footer>`;
  });
}

function renderHome() {
  const explorer = document.querySelector("[data-explorer]");
  if (explorer) {
    explorer.innerHTML = `<div class="body-visual" aria-hidden="true"><span class="body-head"></span><span class="body-torso"></span><span class="body-arm body-arm--left"></span><span class="body-arm body-arm--right"></span><span class="body-leg body-leg--left"></span><span class="body-leg body-leg--right"></span><i class="organ organ--brain"></i><i class="organ organ--thyroid"></i><i class="organ organ--breast"></i><i class="organ organ--lung"></i><i class="organ organ--liver"></i><i class="organ organ--gi"></i><i class="organ organ--gu"></i></div><div class="explorer-list">${data.systems.map(([id, title, text], index) => `<button class="system-chip ${index === 0 ? "is-active" : ""}" type="button" data-system="${id}" data-title="${title}" data-text="${text}"><span>${String(index + 1).padStart(2, "0")}</span>${title}</button>`).join("")}</div><aside class="explorer-detail" data-explorer-detail><p class="eyebrow">Body system</p><h3>Brain & CNS</h3><p>Brain, spinal cord, and neuro-oncology. Explore a system to see where public education and clinical learning connect.</p><a class="text-link" href="library.html">Open related learning <span>→</span></a></aside>`;
    explorer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-system]");
      if (!button) return;
      explorer.querySelectorAll("[data-system]").forEach((item) => item.classList.toggle("is-active", item === button));
      explorer.querySelector("[data-explorer-detail]").innerHTML = `<p class="eyebrow">Body system</p><h3>${button.dataset.title}</h3><p>${button.dataset.text}. BA Medicale will connect this system to public guides, diagnosis, treatment concepts, clinical references, and related learning.</p><a class="text-link" href="library.html">Open related learning <span>→</span></a>`;
    });
  }
  const library = document.querySelector("[data-library-preview]");
  if (library) library.innerHTML = data.library.map((item) => `<article class="knowledge-card"><span>${item.type}</span><h3>${item.title}</h3><p>${item.text}</p><a href="${item.href}" class="text-link">Read guide <span>→</span></a></article>`).join("");
  const profile = document.querySelector("[data-profile]");
  if (profile) profile.innerHTML = `<img src="${data.profile.image}" alt="${data.profile.name}" loading="lazy" width="1254" height="1254"><div><p class="eyebrow">Physician-led education</p><h2>${data.profile.name}</h2><p class="profile-role">${data.profile.role}</p><p>${data.profile.text}</p><a href="about.html" class="button button-outline">About BA Medicale</a></div>`;
  const journey = document.querySelector("[data-journey]");
  if (journey) journey.innerHTML = data.journey.map(([number, title, text], index) => `<details class="journey-step" ${index === 0 ? "open" : ""}><summary><span>${number}</span><b>${title}</b>${icon("plus")}</summary><p>${text}</p></details>`).join("");
  const updates = document.querySelector("[data-home-updates]");
  if (updates) {
    const fillToFive = (items) => items.concat(Array.from({ length: Math.max(0, 5 - items.length) }, () => ({ title: "Coming soon", meta: "New learning update in preparation", pending: true })));
    const list = (items, href) => fillToFive(items).slice(0, 5).map((item) => `<a class="home-update-item${item.pending ? " is-pending" : ""}" href="${href}"><span>${escapeHtml(item.meta)}</span><b>${escapeHtml(item.title)}</b><i aria-hidden="true">→</i></a>`).join("");
    const articles = articleRecords().map((item) => ({ title: item.title, meta: item.primaryTopic }));
    const seminars = [{ title: data.featuredSeminar.title, meta: `${data.featuredSeminar.date} · ${data.featuredSeminar.time}` }].concat(data.events.map((item) => ({ title: item.title, meta: `${item.date} · ${item.format}` })));
    const ebooks = data.ebooks.map((item) => ({ title: item.title, meta: item.state }));
    updates.innerHTML = `<div class="approved-home-updates__heading"><p class="approved-kicker">Latest updates</p><h2>Continue with what is new.</h2><p>New reading, upcoming learning, and recently added eBooks in one practical overview.</p></div><div class="approved-home-updates__grid"><section class="home-update-card"><div><p>Articles</p><h3>Latest reading</h3></div>${list(articles, "library.html")}</section><section class="home-update-card"><div><p>Upcoming event</p><h3>Seminars &amp; courses</h3></div>${list(seminars, "seminar.html")}</section><section class="home-update-card"><div><p>eBooks</p><h3>Recently added</h3></div>${list(ebooks, "ebooks.html")}</section></div>`;
  }
}

function initJourneyWorkflow() {
  const workflow = document.querySelector(".approved-journey--timeline");
  if (!workflow) return;
  const stages = workflow.querySelectorAll("[data-journey-stage]");
  stages.forEach((stage) => stage.addEventListener("click", () => {
    stages.forEach((item) => {
      const active = item === stage;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  }));
}

function renderLibrary() {
  const target = document.querySelector("[data-article-library]");
  if (!target) return;
  const records = articleRecords();
  const topics = [...new Set(records.map((article) => article.primaryTopic))];
  const sites = [...new Set(records.map((article) => article.diseaseSite).filter(Boolean))];
  const types = [...new Set(records.map((article) => article.contentType).filter(Boolean))];
  const option = (value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;
  const latestCard = (article) => `<article class="article-latest-card"><img src="${escapeHtml(safeImageUrl(article.cover))}" alt="${escapeHtml(article.title)} editorial artwork" width="1280" height="720" loading="lazy"><div><span>${escapeHtml(compactAudience(article.audiences))}</span><p>${escapeHtml(article.primaryTopic)}</p><h3>${escapeHtml(article.title)}</h3><small>${escapeHtml(article.sourceAttribution)}</small><a href="${escapeHtml(articlePath(article))}">Read full article <b aria-hidden="true">→</b></a></div></article>`;
  const listItem = (article) => `<article class="article-list-item"><img src="${escapeHtml(safeImageUrl(article.cover))}" alt="" width="320" height="180" loading="lazy"><div class="article-list-item__copy"><div class="article-list-item__meta"><span>${escapeHtml(compactAudience(article.audiences))}</span><b>${escapeHtml(article.primaryTopic)}</b>${articleDate(article) ? `<time datetime="${escapeHtml(articleDate(article))}">${escapeHtml(articleDate(article))}</time>` : ""}</div><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.excerpt)}</p><div class="article-list-item__tags">${(article.tags || []).slice(0, 3).map((tag) => `<i>${escapeHtml(tag)}</i>`).join("")}</div><small>Sources: ${escapeHtml(article.sourceAttribution)}</small></div><div class="article-list-item__actions"><a href="${escapeHtml(articlePath(article))}" data-article-reader="${escapeHtml(article.id)}">Quick Read</a><a href="${escapeHtml(articlePath(article))}">Read Full Article</a></div></article>`;
  const sections = [
    ["PUBLIC", "Public Education", "Clear explanations for patients, families, and anyone building a stronger understanding."],
    ["DOCTOR", "Professional Education — Doctors", "Clinical context for doctors, specialists, and physician-level learners."],
    ["HEALTHCARE WORKER", "Professional Education — Healthcare Workers", "Practical learning for nursing, allied health, pharmacy, laboratory, imaging, and multidisciplinary care."]
  ];
  target.innerHTML = `<section class="article-latest"><div class="article-library__heading"><div><p class="eyebrow">Latest articles</p><h2>Recently published and updated.</h2></div><p>${records.length >= 5 ? "Five current entry points" : `${records.length} current article${records.length === 1 ? "" : "s"}`}, ordered automatically from the article registry.</p></div><div class="article-latest__rail">${records.slice(0, 5).map(latestCard).join("")}</div></section><form class="article-filters" data-article-filters><label>Audience<select name="audience"><option value="">All audiences</option>${["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"].map(option).join("")}</select></label><label>Primary topic<select name="topic"><option value="">All topics</option>${topics.map(option).join("")}</select></label><label>Disease or site<select name="site"><option value="">All sites</option>${sites.map(option).join("")}</select></label><label>Content type<select name="type"><option value="">All types</option>${types.map(option).join("")}</select></label><button type="reset">Clear filters</button></form><div data-article-audiences>${sections.map(([audience, title, description]) => `<section class="article-audience" data-article-audience="${audience}"><header><div><p class="eyebrow">${title}</p><h2>${description}</h2></div><span data-article-count></span></header><div class="article-list" data-article-list></div><nav class="article-pagination" aria-label="${title} pages"><button type="button" data-page="previous">Previous</button><span data-page-status></span><button type="button" data-page="next">Next</button></nav></section>`).join("")}</div>`;
  const filterForm = target.querySelector("[data-article-filters]");
  const pages = new Map();
  const update = () => {
    const values = Object.fromEntries(new FormData(filterForm));
    target.querySelectorAll("[data-article-audience]").forEach((section) => {
      const audience = section.dataset.articleAudience;
      const filtered = records.filter((article) => article.audiences.includes(audience) && (!values.audience || article.audiences.includes(values.audience)) && (!values.topic || article.primaryTopic === values.topic) && (!values.site || article.diseaseSite === values.site) && (!values.type || article.contentType === values.type));
      const maxPage = Math.max(1, Math.ceil(filtered.length / 10));
      const page = Math.min(pages.get(audience) || 1, maxPage);
      pages.set(audience, page);
      section.querySelector("[data-article-list]").innerHTML = filtered.length ? filtered.slice((page - 1) * 10, page * 10).map(listItem).join("") : `<p class="article-list__empty">No articles match these filters yet.</p>`;
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
    body.innerHTML = `<header class="article-reader__hero"><p class="eyebrow">${escapeHtml(article.label)}</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.dek)}</p><div class="article-reader__stats">${article.stats.map(([value, label]) => `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}</div></header><section class="article-reader__intro">${article.intro.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>${article.sections.map(renderSection).join("")}<section class="article-reader__takeaways"><p class="eyebrow">Key policy takeaways</p><h2>What this means for public education.</h2><ul>${article.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section class="article-reader__references"><p class="eyebrow">References and sources</p>${article.references.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>`;
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

function renderEvents() {
  document.querySelectorAll("[data-events]").forEach((target) => target.innerHTML = data.events.map((item) => `<article class="event-card"><div><span>${item.date}</span><i>${item.format}</i></div><h2>${item.title}</h2><p>${item.text}</p><a class="text-link" href="resources.html">Explore related resources <span>→</span></a></article>`).join(""));
}

function renderFeaturedSeminar() {
  const target = document.querySelector("[data-featured-seminar]");
  const seminar = data.featuredSeminar;
  if (!target || !seminar) return;
  const meta = [
    ["Date", seminar.date],
    ["Time", seminar.time],
    ["Format", seminar.location]
  ];
  target.innerHTML = `<div class="featured-seminar__hero"><div class="featured-seminar__intro"><p class="eyebrow">Upcoming program</p><p class="featured-seminar__format">${seminar.format}</p><h1>${seminar.title}</h1>${seminar.subtitle ? `<p class="featured-seminar__subtitle">${seminar.subtitle}</p>` : ""}<p class="featured-seminar__lead">A live physician webinar that connects initial assessment, ultrasound interpretation, cytology reporting, and treatment decision-making for thyroid nodules.</p><dl class="featured-seminar__meta">${meta.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>${seminar.detailUrl ? `<a class="text-link" href="${seminar.detailUrl}">Open crawlable event details <span>→</span></a>` : ""}</div><figure class="featured-seminar__poster"><button type="button" class="featured-seminar__poster-trigger" data-seminar-poster="${seminar.artwork}" data-seminar-poster-alt="Official event poster for ${seminar.title}" aria-haspopup="dialog"><img src="${seminar.artwork}" alt="Official event poster for ${seminar.title}" width="1440" height="2048" loading="eager"><span>Inspect full program poster <b aria-hidden="true">↗</b></span></button><figcaption>Original official program artwork</figcaption></figure></div><div class="featured-seminar__details"><article class="featured-seminar__context"><p class="eyebrow">Program context</p><h2>Department-led thyroid nodule education, presented with Kemenkes accreditation.</h2><p>${seminar.host} ${seminar.organizer}</p><p>Accreditation: ${seminar.accreditation}</p></article><article class="featured-seminar__audience"><p class="eyebrow">Who it is for</p><h2>Open to doctors and specialists across Indonesia.</h2><ul>${seminar.audience.map((item) => `<li>${item}</li>`).join("")}</ul></article><article class="featured-seminar__access"><p class="eyebrow">Registration and access</p><h2>Live on Zoom with limited seats.</h2><p>${seminar.quota}</p><p>${seminar.contact}</p><a class="button button-dark" href="https://${seminar.registration}" target="_blank" rel="noreferrer">Open registration</a><p class="featured-seminar__access-link">${seminar.registration}</p></article></div><section class="featured-seminar__program" aria-labelledby="featured-program-title"><div class="featured-seminar__section-head"><p class="eyebrow">Program schedule</p><h2 id="featured-program-title">Three focused clinical sessions.</h2></div><ol>${seminar.sessions.map(([time, title, speaker], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><time>${time}</time><h3>${title}</h3><p>${speaker}</p></li>`).join("")}</ol></section><section class="featured-seminar__outcomes" aria-labelledby="featured-outcomes-title"><div class="featured-seminar__section-head"><p class="eyebrow">Learning focus</p><h2 id="featured-outcomes-title">What the program will cover.</h2></div><div>${seminar.outcomes.map((item, index) => `<p><span>${String(index + 1).padStart(2, "0")}</span>${item}</p>`).join("")}</div></section><section class="featured-seminar__faculty" aria-labelledby="featured-faculty-title"><div class="featured-seminar__section-head"><p class="eyebrow">Faculty and moderation</p><h2 id="featured-faculty-title">A focused multidisciplinary faculty.</h2></div><div>${seminar.faculty.map(([role, name]) => `<article><span>${role}</span><h3>${name}</h3></article>`).join("")}</div></section>`;
}

function initSeminarPosterLightbox() {
  const trigger = document.querySelector("[data-seminar-poster]");
  if (!trigger) return;
  const dialog = document.createElement("dialog");
  dialog.className = "seminar-poster-lightbox";
  dialog.innerHTML = `<div class="seminar-poster-lightbox__bar"><p>Program poster</p><div><button type="button" data-poster-zoom aria-pressed="false">Zoom</button><button type="button" data-poster-close aria-label="Close full program poster">Close</button></div></div><div class="seminar-poster-lightbox__viewport" tabindex="0"><img alt=""></div>`;
  document.body.append(dialog);
  const image = dialog.querySelector("img");
  const viewport = dialog.querySelector(".seminar-poster-lightbox__viewport");
  const zoom = dialog.querySelector("[data-poster-zoom]");
  const close = dialog.querySelector("[data-poster-close]");
  const setZoom = (expanded) => { dialog.classList.toggle("is-zoomed", expanded); zoom.setAttribute("aria-pressed", String(expanded)); zoom.textContent = expanded ? "Fit" : "Zoom"; };
  trigger.addEventListener("click", () => {
    const source = safeInternalUrl(trigger.dataset.seminarPoster);
    if (!source) return;
    image.src = source;
    image.alt = trigger.dataset.seminarPosterAlt || "Official program poster";
    setZoom(false);
    dialog.showModal();
    close.focus();
  });
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
    ["I found a lump", "Public guide", "A lump can have many causes. Learn how clinical evaluation, imaging, and biopsy may each contribute.", "public.html#diagnosis"], ["Tumor vs cancer", "Public guide", "Understand why a tumor is not always cancer, and why a malignant tumor can invade or spread.", "public.html#tumor-cancer"], ["Biopsy", "Diagnosis", "How tissue or cell sampling can help establish a diagnosis and guide further testing.", "public.html#diagnosis"], ["Cancer staging", "Professional", "An orientation to stage, TNM language, and how staging supports treatment planning.", "clinical.html#staging"], ["Immunotherapy", "Treatment", "A treatment concept that uses the immune system in selected cancer settings.", "public.html#treatment"], ["Thyroid nodule", "Disease explorer", "Start with thyroid and endocrine neoplasms, then follow diagnosis and clinical routes.", "index.html#explorer"]
  ].concat(data.library.map((item) => [item.title, item.type, item.text, item.href])).concat(articleRecords().map((article) => [article.title, article.primaryTopic, article.excerpt, articlePath(article)]));
  const show = (query = "") => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = results.filter((item) => terms.every((term) => item.join(" ").toLowerCase().includes(term)));
    output.innerHTML = filtered.length ? filtered.map(([title, label, text, href]) => `<a class="search-result" href="${escapeHtml(safeInternalUrl(href))}"><span>${escapeHtml(label)}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><b>→</b></a>`).join("") : `<div class="empty-panel"><p class="eyebrow">No exact result</p><h2>Try a symptom, test, body system, or treatment term.</h2><p>Search is currently an editorial navigation tool. More indexed content can be added through the central content registry.</p></div>`;
  };
  input.addEventListener("input", () => show(input.value)); show();
}

function initShell() {
  const header = document.querySelector(".site-header");
  const button = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav-mobile");
  button?.addEventListener("click", () => { const open = nav.toggleAttribute("data-open"); button.setAttribute("aria-expanded", String(open)); });
  nav?.addEventListener("click", () => { nav.removeAttribute("data-open"); button?.setAttribute("aria-expanded", "false"); });
  const update = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  update(); window.addEventListener("scroll", update, { passive: true });
}

function initMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll(".section, .knowledge-card, .mosaic-card, .event-card, .ebook-card, .source-card").forEach((item) => { item.classList.add("reveal"); observer.observe(item); });
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
  const localCard = (video) => `<article class="video-card video-card--original" data-video-topic="${escapeHtml(video.topic)}"><button type="button" class="video-card__play video-card__play--local" data-video-local="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}"><img src="${escapeHtml(localThumbnail(video))}" alt="Preview of ${escapeHtml(video.title)}" width="960" height="540" loading="lazy"><span>Watch</span></button><div class="video-card__copy"><p><b>${escapeHtml(video.source_label)}</b><i>${escapeHtml(video.topic)}</i></p><h2>${escapeHtml(video.title)}</h2><small>${escapeHtml(video.short_description)}</small><a href="${escapeHtml(safeInternalUrl(video.video_url))}" target="_blank" rel="noopener noreferrer">Open video file <strong>↗</strong></a></div></article>`;
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
    await navigator.clipboard?.writeText(value);
    button.textContent = "Link copied";
    closeShare();
  }));
  const dialog = document.querySelector("[data-promotion-dialog]");
  document.querySelector("[data-promote-open]")?.addEventListener("click", () => dialog?.showModal());
  dialog?.querySelector("[data-promote-close]")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog?.querySelectorAll("[data-copy-promotion]").forEach((button) => button.addEventListener("click", async () => {
    const card = button.closest("article");
    const copy = Array.from(card.querySelectorAll("h2,p,li,b,small")).map((node) => node.textContent.trim()).filter(Boolean).join("\n");
    await navigator.clipboard?.writeText(copy);
    button.textContent = "Copy ready";
  }));
}

shell(); renderHome(); renderLibrary(); initArticleReader(); renderEbooks(); renderEbookDetail(); renderEvents(); renderFeaturedSeminar(); renderSources(); initShell(); initSearch(); initMotion(); initLightbox(); initSeminarPosterLightbox(); initJourneyWorkflow(); initArticlePageTools(); renderVideoHub(); protectExternalLinks();
