const data = window.BAMEDICALE_DATA;
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;

function shell() {
  document.querySelectorAll("[data-shell]").forEach((target) => {
    target.innerHTML = `<header class="site-header"><a class="brand" href="index.html" aria-label="BAMedicale home"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BAMedicale official logo"><span><b>BAMedicale</b><small>EST. 2024</small></span></a><nav class="nav-main" aria-label="Primary"><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Library</a><a href="seminar.html">Courses</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a></nav><div class="nav-actions"><a class="search-button" href="search.html" aria-label="Search BAMedicale">${icon("search")}</a><a class="button button-dark" href="login.html">Member access</a><button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false">${icon("menu")}</button></div></header><nav class="nav-mobile" aria-label="Mobile navigation"><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Library</a><a href="seminar.html">Courses & seminars</a><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a><a href="about.html">About BAMedicale</a><a href="login.html">Member access</a></nav>`;
  });
  document.querySelectorAll("[data-footer]").forEach((target) => {
    target.innerHTML = `<footer class="site-footer"><div><a class="brand brand--footer" href="index.html"><img src="assets/brand/bamedicale-approved-logo.jpg" alt="BAMedicale official logo"><span><b>BAMedicale</b><small>Comprehensive tumor and cancer education</small></span></a><p>Education for public understanding and professional cancer practice. Information on this site supports learning and is not a substitute for personal medical care.</p></div><div><h2>Explore</h2><a href="public.html">For public</a><a href="clinical.html">For doctors</a><a href="library.html">Medical Library</a><a href="seminar.html">Courses & seminars</a></div><div><h2>Knowledge</h2><a href="ebooks.html">eBooks</a><a href="videos.html">Videos</a><a href="resources.html">Resources</a><a href="about.html">About</a></div><div><h2>Editorial sources</h2>${data.sources.map((item) => `<a href="${item.url}" target="_blank" rel="noreferrer">${item.label} ↗</a>`).join("")}</div><small class="footer-note">© 2026 BAMedicale. Site content and features are under continuing editorial development.</small></footer>`;
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
      explorer.querySelector("[data-explorer-detail]").innerHTML = `<p class="eyebrow">Body system</p><h3>${button.dataset.title}</h3><p>${button.dataset.text}. BAMedicale will connect this system to public guides, diagnosis, treatment concepts, clinical references, and related learning.</p><a class="text-link" href="library.html">Open related learning <span>→</span></a>`;
    });
  }
  const updates = document.querySelector("[data-mosaic]");
  if (updates) updates.innerHTML = data.updates.map((item, index) => `<a class="mosaic-card mosaic-card--${item.tone}" href="${item.href}"><span>${item.eyebrow}</span><h3>${item.title}</h3><p>${item.text}</p>${index === 0 ? `<b>${icon("spark")}</b>` : `<b>→</b>`}</a>`).join("");
  const library = document.querySelector("[data-library-preview]");
  if (library) library.innerHTML = data.library.map((item) => `<article class="knowledge-card"><span>${item.type}</span><h3>${item.title}</h3><p>${item.text}</p><a href="${item.href}" class="text-link">Read guide <span>→</span></a></article>`).join("");
  const profile = document.querySelector("[data-profile]");
  if (profile) profile.innerHTML = `<img src="${data.profile.image}" alt="${data.profile.name}" loading="lazy" width="1254" height="1254"><div><p class="eyebrow">Physician-led education</p><h2>${data.profile.name}</h2><p class="profile-role">${data.profile.role}</p><p>${data.profile.text}</p><a href="about.html" class="button button-outline">About BAMedicale</a></div>`;
  const journey = document.querySelector("[data-journey]");
  if (journey) journey.innerHTML = data.journey.map(([number, title, text], index) => `<details class="journey-step" ${index === 0 ? "open" : ""}><summary><span>${number}</span><b>${title}</b>${icon("plus")}</summary><p>${text}</p></details>`).join("");
}

function renderLibrary() {
  document.querySelectorAll("[data-library-list]").forEach((target) => {
    target.innerHTML = data.library.concat(data.library).map((item, index) => `<article class="knowledge-card ${index > 3 ? "is-pro" : ""}"><span>${index > 3 ? "Member library" : item.type}</span><h3>${item.title}</h3><p>${item.text}</p><div><a href="${item.href}" class="text-link">Open overview <span>→</span></a>${index > 3 ? `<i>Professional depth</i>` : ""}</div></article>`).join("");
  });
}

function renderEbooks() {
  document.querySelectorAll("[data-ebooks]").forEach((target) => {
    target.innerHTML = data.ebooks.map((item, index) => `<article class="ebook-card"><div class="ebook-visual ebook-visual--${index + 1}">${icon(["book", "scalpel", "cell"][index])}<span>${String(index + 1).padStart(2, "0")}</span></div><div><p class="eyebrow">${item.state}</p><h2>${item.title}</h2><p class="audience">${item.audience}</p><p>${item.text}</p><div class="ebook-actions"><strong>${item.price}</strong><a class="button button-outline" href="ebook-detail.html?book=${item.slug}">View detail</a><a class="button button-dark" href="login.html">Unlock on release</a></div></div></article>`).join("");
  });
}

function renderEbookDetail() {
  const target = document.querySelector("[data-ebook-detail]");
  if (!target) return;
  const slug = new URLSearchParams(window.location.search).get("book");
  const item = data.ebooks.find((book) => book.slug === slug) || data.ebooks[0];
  target.innerHTML = `<article class="ebook-card"><div class="ebook-visual ebook-visual--1">${icon("book")}<span>01</span></div><div><p class="eyebrow">${item.state}</p><h2>${item.title}</h2><p class="audience">${item.audience}</p><p>${item.text}</p><div class="ebook-actions"><strong>${item.price}</strong><a class="button button-outline" href="ebooks.html">Back to catalog</a><a class="button button-dark" href="login.html">Unlock on release</a></div></div></article>`;
}

function renderEvents() {
  document.querySelectorAll("[data-events]").forEach((target) => target.innerHTML = data.events.map((item) => `<article class="event-card"><div><span>${item.date}</span><i>${item.format}</i></div><h2>${item.title}</h2><p>${item.text}</p><a class="text-link" href="resources.html">Explore related resources <span>→</span></a></article>`).join(""));
}

function renderSources() {
  document.querySelectorAll("[data-sources]").forEach((target) => target.innerHTML = data.sources.map((item) => `<a href="${item.url}" target="_blank" rel="noreferrer"><b>${item.label}</b><span>${item.note}</span><i>↗</i></a>`).join(""));
}

function initSearch() {
  const input = document.querySelector("[data-search-input]");
  const output = document.querySelector("[data-search-results]");
  if (!input || !output) return;
  const results = [
    ["I found a lump", "Public guide", "A lump can have many causes. Learn how clinical evaluation, imaging, and biopsy may each contribute.", "public.html#diagnosis"], ["Tumor vs cancer", "Public guide", "Understand why a tumor is not always cancer, and why malignant tumors can invade or spread.", "public.html#tumor-cancer"], ["Biopsy", "Diagnosis", "How tissue or cell sampling can help establish a diagnosis and guide further testing.", "public.html#diagnosis"], ["Cancer staging", "Professional", "An orientation to stage, TNM language, and how staging supports treatment planning.", "clinical.html#staging"], ["Immunotherapy", "Treatment", "A treatment concept that uses the immune system in selected cancer settings.", "public.html#treatment"], ["Thyroid nodule", "Disease explorer", "Start with thyroid and endocrine neoplasms, then follow diagnosis and clinical routes.", "index.html#explorer"]
  ];
  const show = (query = "") => {
    const filtered = results.filter((item) => item.join(" ").toLowerCase().includes(query.toLowerCase()));
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

shell(); renderHome(); renderLibrary(); renderEbooks(); renderEbookDetail(); renderEvents(); renderSources(); initShell(); initSearch(); initMotion();
