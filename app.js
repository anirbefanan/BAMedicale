const data = window.BAMEDICALE_DATA;
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const route = window.location.pathname.split("/").pop().replace(".html", "") || "index";
document.body.classList.add(`route-${route}`);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));

function shell() {
  document.querySelectorAll("[data-shell]").forEach((target) => {
    target.innerHTML = `<header class="site-header"><a class="brand" href="index.html" aria-label="BA Medicale home"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo"><span><b>BA Medicale</b><small>EST. 2024</small></span></a><nav class="nav-main" aria-label="Primary"><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Library</a><a href="seminar.html">Courses</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a></nav><div class="nav-actions"><a class="search-button" href="search.html" aria-label="Search BA Medicale">${icon("search")}</a><a class="button button-dark" href="login.html">Member access</a><button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false">${icon("menu")}</button></div></header><nav class="nav-mobile" aria-label="Mobile navigation"><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Library</a><a href="seminar.html">Courses & seminars</a><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a><a href="about.html">About BA Medicale</a><a href="login.html">Member access</a></nav>`;
  });
  document.querySelectorAll("[data-footer]").forEach((target) => {
    target.innerHTML = `<footer class="site-footer"><div><a class="brand brand--footer" href="index.html"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo"><span><b>BA Medicale</b><small>Comprehensive tumor and cancer education</small></span></a><p>Education for public understanding and professional cancer practice. Information on this site supports learning and is not a substitute for personal medical care.</p></div><div><h2>Explore</h2><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Medical Library</a><a href="seminar.html">Courses & seminars</a></div><div><h2>Knowledge</h2><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a><a href="about.html">About</a></div><div><h2>Editorial sources</h2>${data.sources.map((item) => `<a href="${item.url}" target="_blank" rel="noreferrer">${item.label} ↗</a>`).join("")}</div><small class="footer-note">© 2026 BA Medicale. Site content and features are under continuing editorial development.</small></footer>`;
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
}

function renderLibrary() {
  document.querySelectorAll("[data-library-list]").forEach((target) => {
    target.innerHTML = data.library.concat(data.library.filter((item) => item.type !== "Indonesia report")).map((item, index) => {
      const article = item.reader && data.articles ? data.articles[item.reader] : null;
      const action = item.reader ? `<a href="${item.href}" class="text-link" data-article-reader="${item.reader}">Open overview <span>→</span></a>` : `<a href="${item.href}" class="text-link">Open overview <span>→</span></a>`;
      const media = article?.cover ? `<figure class="knowledge-card__media"><img src="${escapeHtml(article.cover)}" alt="Editorial visual for ${escapeHtml(item.title)}" width="1448" height="1086" loading="lazy"></figure>` : "";
      return `<article class="knowledge-card ${article?.cover ? "knowledge-card--with-media" : ""} ${index > 4 ? "is-pro" : ""}">${media}<span>${index > 4 ? "Member library" : item.type}</span><h3>${item.title}</h3><p>${item.text}</p><div>${action}${index > 4 ? `<i>Professional depth</i>` : ""}</div></article>`;
    }).join("");
  });
}

function initArticleReader() {
  const triggers = document.querySelectorAll("[data-article-reader]");
  if (!triggers.length || !data.articles) return;
  const dialog = document.createElement("dialog");
  dialog.className = "article-reader";
  dialog.innerHTML = `<div class="article-reader__shell"><div class="article-reader__bar"><p>BA Medicale digital reader</p><div><a data-article-pdf target="_blank" rel="noreferrer">Open source PDF</a><button type="button" data-article-close aria-label="Close article reader">Close</button></div></div><article class="article-reader__body" tabindex="0"></article></div>`;
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
    pdf.href = article.sourcePdf;
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
  target.innerHTML = `<div class="featured-seminar__hero"><div class="featured-seminar__intro"><p class="eyebrow">Upcoming program</p><p class="featured-seminar__format">${seminar.format}</p><h1>${seminar.title}</h1>${seminar.subtitle ? `<p class="featured-seminar__subtitle">${seminar.subtitle}</p>` : ""}<p class="featured-seminar__lead">A live physician webinar that connects initial assessment, ultrasound interpretation, cytology reporting, and treatment decision-making for thyroid nodules.</p><dl class="featured-seminar__meta">${meta.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl></div><figure class="featured-seminar__poster"><button type="button" class="featured-seminar__poster-trigger" data-seminar-poster="${seminar.artwork}" data-seminar-poster-alt="Official event poster for ${seminar.title}" aria-haspopup="dialog"><img src="${seminar.artwork}" alt="Official event poster for ${seminar.title}" width="1440" height="2048" loading="eager"><span>Inspect full program poster <b aria-hidden="true">↗</b></span></button><figcaption>Original official program artwork</figcaption></figure></div><div class="featured-seminar__details"><article class="featured-seminar__context"><p class="eyebrow">Program context</p><h2>Department-led thyroid nodule education, presented with Kemenkes accreditation.</h2><p>${seminar.host} ${seminar.organizer}</p><p>Accreditation: ${seminar.accreditation}</p></article><article class="featured-seminar__audience"><p class="eyebrow">Who it is for</p><h2>Open to doctors and specialists across Indonesia.</h2><ul>${seminar.audience.map((item) => `<li>${item}</li>`).join("")}</ul></article><article class="featured-seminar__access"><p class="eyebrow">Registration and access</p><h2>Live on Zoom with limited seats.</h2><p>${seminar.quota}</p><p>${seminar.contact}</p><a class="button button-dark" href="https://${seminar.registration}" target="_blank" rel="noreferrer">Open registration</a><p class="featured-seminar__access-link">${seminar.registration}</p></article></div><section class="featured-seminar__program" aria-labelledby="featured-program-title"><div class="featured-seminar__section-head"><p class="eyebrow">Program schedule</p><h2 id="featured-program-title">Three focused clinical sessions.</h2></div><ol>${seminar.sessions.map(([time, title, speaker], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><time>${time}</time><h3>${title}</h3><p>${speaker}</p></li>`).join("")}</ol></section><section class="featured-seminar__outcomes" aria-labelledby="featured-outcomes-title"><div class="featured-seminar__section-head"><p class="eyebrow">Learning focus</p><h2 id="featured-outcomes-title">What the program will cover.</h2></div><div>${seminar.outcomes.map((item, index) => `<p><span>${String(index + 1).padStart(2, "0")}</span>${item}</p>`).join("")}</div></section><section class="featured-seminar__faculty" aria-labelledby="featured-faculty-title"><div class="featured-seminar__section-head"><p class="eyebrow">Faculty and moderation</p><h2 id="featured-faculty-title">A focused multidisciplinary faculty.</h2></div><div>${seminar.faculty.map(([role, name]) => `<article><span>${role}</span><h3>${name}</h3></article>`).join("")}</div></section>`;
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
  trigger.addEventListener("click", () => { image.src = trigger.dataset.seminarPoster; image.alt = trigger.dataset.seminarPosterAlt; setZoom(false); dialog.showModal(); close.focus(); });
  zoom.addEventListener("click", () => { setZoom(!dialog.classList.contains("is-zoomed")); viewport.focus(); });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", (event) => { if (event.key === "+" || event.key === "=") { event.preventDefault(); setZoom(true); viewport.focus(); } if (event.key === "-") { event.preventDefault(); setZoom(false); viewport.focus(); } });
}

function renderSources() {
  document.querySelectorAll("[data-sources]").forEach((target) => target.innerHTML = data.sources.map((item) => `<a href="${item.url}" target="_blank" rel="noreferrer"><b>${item.label}</b><span>${item.note}</span><i>↗</i></a>`).join(""));
}

function initSearch() {
  const input = document.querySelector("[data-search-input]");
  const output = document.querySelector("[data-search-results]");
  if (!input || !output) return;
  const results = [
    ["I found a lump", "Public guide", "A lump can have many causes. Learn how clinical evaluation, imaging, and biopsy may each contribute.", "public.html#diagnosis"], ["Tumor vs cancer", "Public guide", "Understand why a tumor is not always cancer, and why a malignant tumor can invade or spread.", "public.html#tumor-cancer"], ["Biopsy", "Diagnosis", "How tissue or cell sampling can help establish a diagnosis and guide further testing.", "public.html#diagnosis"], ["Cancer staging", "Professional", "An orientation to stage, TNM language, and how staging supports treatment planning.", "clinical.html#staging"], ["Immunotherapy", "Treatment", "A treatment concept that uses the immune system in selected cancer settings.", "public.html#treatment"], ["Thyroid nodule", "Disease explorer", "Start with thyroid and endocrine neoplasms, then follow diagnosis and clinical routes.", "index.html#explorer"]
  ].concat(data.library.map((item) => [item.title, item.type, item.text, item.href]));
  const show = (query = "") => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = results.filter((item) => terms.every((term) => item.join(" ").toLowerCase().includes(term)));
    output.innerHTML = filtered.length ? filtered.map(([title, label, text, href]) => `<a class="search-result" href="${href}"><span>${label}</span><h2>${title}</h2><p>${text}</p><b>→</b></a>`).join("") : `<div class="empty-panel"><p class="eyebrow">No exact result</p><h2>Try a symptom, test, body system, or treatment term.</h2><p>Search is currently an editorial navigation tool. More indexed content can be added through the central content registry.</p></div>`;
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
    image.src = trigger.dataset.lightboxImage;
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
    const response = await fetch("data/videos.json?v=doctor-lounge-gap-20260822");
    if (!response.ok) throw new Error("Video catalog unavailable");
    videos = (await response.json()).videos.filter((video) => video.verified_identity);
    try {
      const originalResponse = await fetch("data/original-videos.json?v=original-video-5-20260824");
      if (originalResponse.ok) originalVideos = (await originalResponse.json()).videos || [];
    } catch {
      originalVideos = [];
    }
  } catch (error) {
    if (hub) hub.innerHTML = `<div class="video-hub__empty"><p class="eyebrow">Video collection</p><h2>The public video catalog is being refreshed.</h2><p>Source verification is required before a video is shown here.</p></div>`;
    return;
  }
  const card = (video, featured = false) => `<article class="video-card ${featured ? "video-card--featured" : ""}" data-video-topic="${video.topic}"><button type="button" class="video-card__play" data-video-play="${video.id}" aria-label="Play ${video.title}"><img src="${video.thumbnail}" alt="${video.title}" width="480" height="360" loading="eager"><span>Play</span></button><div class="video-card__copy"><p><b>${video.source_label}</b><i>${video.topic}</i></p><h2>${video.title}</h2><small>${video.person}</small><a href="${video.url}" target="_blank" rel="noreferrer">View original source <strong>↗</strong></a></div></article>`;
  const localCard = (video) => `<article class="video-card video-card--original" data-video-topic="${video.topic}"><button type="button" class="video-card__play video-card__play--local" data-video-local="${video.id}" aria-label="Play ${video.title}"><video src="${video.video_url}" muted playsinline preload="metadata"></video><span>Watch</span></button><div class="video-card__copy"><p><b>${video.source_label}</b><i>${video.topic}</i></p><h2>${video.title}</h2><small>${video.short_description}</small><a href="${video.video_url}" target="_blank" rel="noreferrer">Open video file <strong>↗</strong></a></div></article>`;
  const latestOriginals = originalVideos.slice(-4).reverse();
  const latestYouTube = videos.slice().sort((a, b) => String(b.publish_date || "").localeCompare(String(a.publish_date || ""))).slice(0, 4);
  const previewLocalCard = (video) => `<article class="video-preview video-preview--original"><button type="button" data-video-local="${video.id}" aria-label="Play ${video.title}"><video src="${video.video_url}" muted playsinline preload="metadata"></video><span>▶</span></button><p>${video.source_label}</p><h3>${video.title}</h3></article>`;
  const previewYouTubeCard = (video) => `<article class="video-preview"><button type="button" data-video-play="${video.id}" aria-label="Play ${video.title}"><img src="${video.thumbnail}" alt="${video.title}" width="480" height="360" loading="eager"><span>▶</span></button><p>${video.source_label}</p><h3>${video.title}</h3></article>`;
  const featured = videos.find((video) => video.featured) || videos[0];
  const remaining = videos.filter((video) => video.id !== featured.id);
  if (hub) { const topics = [...new Set(videos.map((video) => video.topic))]; const originalSection = originalVideos.length ? `<section class="video-hub__section video-originals"><div class="section-head"><div><p class="eyebrow">BA Medicale originals</p><h2>Original videos prepared for the BA Medicale learning experience.</h2></div><p>These videos are hosted by BA Medicale and use the original uploaded media assets.</p></div><div class="video-grid video-grid--original">${originalVideos.map((video) => localCard(video)).join("")}</div></section>` : ""; hub.innerHTML = `${originalSection}<section class="video-feature"><div>${card(featured, true)}</div><aside><p class="eyebrow">Verified physician appearances</p><h2>Public educational videos with source attribution.</h2><p>Each entry is retained only when the public title and publisher clearly identify Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K).</p><div class="video-topics" role="group" aria-label="Filter verified videos"><button class="is-active" type="button" data-video-filter="all">All topics</button>${topics.map((topic) => `<button type="button" data-video-filter="${topic}">${topic}</button>`).join("")}</div></aside></section><section class="video-hub__section"><div class="section-head"><div><p class="eyebrow">Latest verified videos</p><h2>Watch and learn in context.</h2></div></div><div class="video-grid">${remaining.map((video) => card(video)).join("")}</div></section><section class="video-hub__section video-source-state"><div><p class="eyebrow">BA Medicale Instagram</p><h2>Public reels will appear after public discovery exposes verifiable post links.</h2></div><p>The profile was reachable during the latest scan, but its unauthenticated response did not expose reel URLs. No Instagram entries are displayed rather than guessing or linking to unavailable posts.</p></section>`; hub.querySelectorAll("[data-video-filter]").forEach((filter) => filter.addEventListener("click", () => { const topic = filter.dataset.videoFilter; hub.querySelectorAll("[data-video-filter]").forEach((item) => item.classList.toggle("is-active", item === filter)); hub.querySelectorAll(".video-grid .video-card:not(.video-card--original)").forEach((item) => { item.hidden = topic !== "all" && item.dataset.videoTopic !== topic; }); })); }
  if (preview) preview.innerHTML = `${latestOriginals.map(previewLocalCard).join("")}${latestYouTube.map(previewYouTubeCard).join("")}`;
  const dialog = document.createElement("dialog");
  dialog.className = "video-player";
  dialog.innerHTML = `<button type="button" aria-label="Close video">×</button><div></div><a target="_blank" rel="noreferrer">View original source ↗</a>`;
  document.body.append(dialog);
  const openVideo = (id) => {
    const video = videos.find((item) => item.id === id);
    if (!video) return;
    dialog.querySelector("div").innerHTML = `<iframe src="${video.embed_url}?autoplay=1" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    dialog.querySelector("a").href = video.url;
    dialog.showModal();
  };
  const openLocalVideo = (id) => {
    const video = originalVideos.find((item) => item.id === id);
    if (!video) return;
    dialog.querySelector("div").innerHTML = `<video src="${video.video_url}" title="${video.title}" controls autoplay playsinline></video>`;
    dialog.querySelector("a").href = video.video_url;
    dialog.showModal();
  };
  document.querySelectorAll("[data-video-play]").forEach((button) => button.addEventListener("click", () => openVideo(button.dataset.videoPlay)));
  document.querySelectorAll("[data-video-local]").forEach((button) => button.addEventListener("click", () => openLocalVideo(button.dataset.videoLocal)));
  dialog.addEventListener("close", () => { dialog.querySelector("div").innerHTML = ""; });
  dialog.addEventListener("click", (event) => { if (event.target === dialog || event.target.matches("button")) dialog.close(); });
}

shell(); renderHome(); renderLibrary(); initArticleReader(); renderEbooks(); renderEbookDetail(); renderEvents(); renderFeaturedSeminar(); renderSources(); initShell(); initSearch(); initMotion(); initLightbox(); initSeminarPosterLightbox(); renderVideoHub();
