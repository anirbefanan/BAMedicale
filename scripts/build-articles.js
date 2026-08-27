const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const renderEventPage = require("./event-template");

const root = path.resolve(__dirname, "..");
const domain = "https://bamedicale.com";
const checkOnly = process.argv.includes("--check");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context, { filename: "content.js" });
const diseaseTaxonomy = context.window.BAMEDICALE_DATA.diseaseTaxonomy || [];
const diseaseGroups = new Map(diseaseTaxonomy.map((group) => [group.id, group]));
const articles = Object.values(context.window.BAMEDICALE_DATA.articles || {}).sort((a, b) => {
  const dateOrder = String(b.updatedDate || b.publishedDate || "").localeCompare(String(a.updatedDate || a.publishedDate || ""));
  return dateOrder || Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
});
const seminars = Object.values(context.window.BAMEDICALE_DATA.seminars || {}).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));

const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const absolute = (value) => `${domain}/${String(value || "").replace(/^\//, "")}`;
const relative = (value) => `../${String(value || "").replace(/^\//, "")}`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const formatPublishedDate = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  assert(match, `invalid publishedDate: ${value || "missing"}`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
};

for (const article of articles) {
  for (const field of ["id", "slug", "title", "dek", "excerpt", "cover", "primaryTopic", "contentType", "sourceAttribution", "publishedDate"]) assert(article[field], `${article.id || "Article"}: missing ${field}`);
  formatPublishedDate(article.publishedDate);
  assert(["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"].includes(article.primaryAudience), `${article.id}: valid primaryAudience is required`);
  assert(diseaseGroups.has(article.primaryDiseaseGroup), `${article.id}: valid primaryDiseaseGroup is required`);
  assert(article.author?.name && ["Organization", "Person"].includes(article.author.type), `${article.id}: valid author metadata is required`);
  assert(Array.isArray(article.sections) && article.sections.length, `${article.id}: article body is required`);
  assert(article.promotion && article.promotion.hook && Array.isArray(article.promotion.teaser) && article.promotion.teaser.length, `${article.id}: source-specific promotion hook and teaser are required`);
  assert(Array.isArray(article.promotion.hashtags) && article.promotion.hashtags.length >= 2 && article.promotion.hashtags.length <= 3, `${article.id}: use two or three source-specific promotion hashtags`);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug), `${article.id}: invalid slug`);
}
for (const seminar of seminars) {
  for (const field of ["id", "slug", "title", "summary", "startDate", "endDate", "date", "time", "format", "artwork", "detailUrl", "publishedDate"]) assert(seminar[field], `${seminar.id || "Seminar"}: missing ${field}`);
  formatPublishedDate(seminar.publishedDate);
  assert(["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"].includes(seminar.primaryAudience), `${seminar.id}: valid primaryAudience is required`);
  assert(diseaseGroups.has(seminar.primaryDiseaseGroup), `${seminar.id}: valid primaryDiseaseGroup is required`);
  assert(Array.isArray(seminar.sessions) && seminar.sessions.length, `${seminar.id}: verified program sessions are required`);
  assert(Array.isArray(seminar.faculty) && seminar.faculty.length, `${seminar.id}: verified faculty is required`);
  assert(seminar.promotion?.hook && seminar.promotion?.teaser?.length, `${seminar.id}: source-specific event promotion is required`);
  assert(seminar.detailUrl === `events/${seminar.slug}.html`, `${seminar.id}: detailUrl must match its canonical event slug`);
}

const renderCompare = (rows = []) => {
  if (!rows.length) return "";
  const [, ...body] = rows;
  return `<div class="seo-article-compare">${body.map((row) => `<article><h3>${escape(row[0])}</h3><p><b>${escape(rows[0][1])}:</b> ${escape(row[1])}</p><p><b>${escape(rows[0][2])}:</b> ${escape(row[2])}</p></article>`).join("")}</div>`;
};
const renderSection = (section) => `<section class="seo-article-section"><h2>${escape(section.title)}</h2>${(section.body || []).map((text) => `<p>${escape(text)}</p>`).join("")}${renderCompare(section.compare)}${section.bullets ? `<ul>${section.bullets.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>` : ""}</section>`;
const shareUrl = (article) => `${domain}/articles/${article.slug}.html`;
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const socialPromotion = (article, canonical) => {
  const promotion = article.promotion;
  const teaser = promotion.teaser.filter(Boolean).slice(0, 2);
  const hashtags = [...new Set(promotion.hashtags.map((tag) => String(tag || "").trim()).filter(Boolean))].slice(0, 3);
  return {
    hook: promotion.hook,
    teaser,
    cta: promotion.cta || "Read the full article at BAMedicale.com",
    hashtags,
    text: [promotion.hook, ...teaser, promotion.cta || "Read the full article at BAMedicale.com", canonical, hashtags.join(" ")].filter(Boolean).join("\n\n")
  };
};

const renderPage = (article, index) => {
  const canonical = shareUrl(article);
  const audienceTypes = [article.primaryAudience, ...(article.secondaryAudiences || [])];
  const author = article.author.type === "Person"
    ? { "@type": "Person", name: article.author.name }
    : { "@type": "Organization", name: article.author.name, url: `${domain}/` };
  const previous = articles[index - 1];
  const next = articles[index + 1];
  const promotion = socialPromotion(article, canonical);
  const diseaseGroup = diseaseGroups.get(article.primaryDiseaseGroup);
  const socialText = `${article.title} — ${canonical}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: absolute(article.cover),
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "BA Medicale", url: `${domain}/`, logo: { "@type": "ImageObject", url: `${domain}/assets/brand/bamedicale-approved-logo.jpg` } },
    author,
    audience: audienceTypes.map((audienceType) => ({ "@type": "Audience", audienceType })),
    about: [diseaseGroup.name, article.diseaseCondition, article.primaryTopic, ...(article.tags || [])].filter(Boolean)
  };
  if (article.publishedDate) schema.datePublished = article.publishedDate;
  if (article.updatedDate) schema.dateModified = article.updatedDate;
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${domain}/` },
    { "@type": "ListItem", position: 2, name: "Medical Library", item: `${domain}/library.html` },
    { "@type": "ListItem", position: 3, name: article.title, item: canonical }
  ] };
  const formats = ["Instagram Post", "Instagram Reel", "Instagram Story", "YouTube Short"];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(article.seoTitle || `${article.title} | BA Medicale`)}</title>
  <meta name="description" content="${escape(article.excerpt)}"><meta name="author" content="${escape(article.author.name)}"><link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article"><meta property="og:site_name" content="BA Medicale"><meta property="og:title" content="${escape(article.title)}"><meta property="og:description" content="${escape(article.excerpt)}"><meta property="og:url" content="${canonical}"><meta property="article:published_time" content="${escape(article.publishedDate)}"><meta property="og:image" content="${absolute(article.cover)}"><meta property="og:image:alt" content="${escape(article.title)} editorial artwork">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(article.title)}"><meta name="twitter:description" content="${escape(article.excerpt)}"><meta name="twitter:image" content="${absolute(article.cover)}">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png"><link rel="stylesheet" href="../styles.css?v=disease-explorer-20260825">
  <script type="application/ld+json">${json(schema)}</script><script type="application/ld+json">${json(breadcrumb)}</script>
</head>
<body class="route-article">
  <header class="seo-static-header"><a class="brand" href="../index.html"><img src="../assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo" width="64" height="64"><span><b>BA Medicale</b><small>EST. 2024</small></span></a><a class="button button-outline" href="../library.html">Medical Library</a></header>
  <main class="seo-article-page"><nav class="seo-breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span>/</span><a href="../library.html?disease=${encodeURIComponent(article.primaryDiseaseGroup)}">${escape(diseaseGroup.name)}</a><span>/</span><span>${escape(article.primaryTopic)}</span></nav>
    <article>
      <header class="seo-article-hero seo-article-hero--publication"><div><p class="eyebrow">${escape(article.label)}</p><div class="article-page-badges"><span>${escape(article.primaryAudience)}</span><span>${escape(diseaseGroup.name)}</span>${article.diseaseCondition ? `<span>${escape(article.diseaseCondition)}</span>` : ""}</div><h1>${escape(article.title)}</h1><p>${escape(article.dek)}</p><small class="article-byline">By ${escape(article.author.name)} · Published: ${escape(formatPublishedDate(article.publishedDate))}</small><small class="article-source-meta">Sources: ${escape(article.sourceAttribution)}</small></div><button type="button" data-lightbox-image="${relative(article.cover)}" data-lightbox-alt="${escape(article.title)} editorial artwork" aria-label="Open article artwork"><img src="${relative(article.cover)}" alt="${escape(article.title)} editorial artwork" width="1280" height="720" fetchpriority="high"></button></header>
      ${article.stats?.length ? `<section class="seo-article-stats">${article.stats.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join("")}</section>` : ""}
      <section class="seo-article-section">${article.intro.map((text) => `<p>${escape(text)}</p>`).join("")}</section>
      ${article.sections.map(renderSection).join("")}
      <section class="seo-article-section"><h2>Key educational takeaways</h2><ul>${article.takeaways.map((text) => `<li>${escape(text)}</li>`).join("")}</ul></section>
      <section class="seo-article-section seo-article-references"><h2>References and sources</h2><ul>${article.references.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>${article.sourcePdf ? `<a class="button button-outline" href="${relative(article.sourcePdf)}">Open source PDF</a>` : ""}</section>
      <section class="article-page-tools"><div class="article-share"><button type="button" class="button button-outline" data-share-toggle aria-expanded="false">Share</button><div class="article-share__menu" data-share-menu hidden><div class="article-share__menu-head"><b>Share article</b><button type="button" data-share-close aria-label="Close share options">Close</button></div><a target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(socialText)}">WhatsApp</a><a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}">Facebook</a><a target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonical)}">X</a><a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}">LinkedIn</a><button type="button" data-copy-link="${canonical}">Copy Link</button></div></div><button type="button" class="button button-dark" data-promote-open>Promote Article</button></section>
      <nav class="article-page-nav" aria-label="Article navigation">${previous ? `<a href="${previous.slug}.html">← <span>Previous Article</span><b>${escape(previous.title)}</b></a>` : `<span aria-hidden="true"></span>`}<a href="../library.html"><span>Back to</span><b>Medical Library</b></a>${next ? `<a href="${next.slug}.html"><span>Next Article</span><b>${escape(next.title)}</b> →</a>` : `<span aria-hidden="true"></span>`}</nav>
    </article>
  </main>
  <dialog class="article-promotion" data-promotion-dialog><div class="article-promotion__bar"><p>BA Medicale promotion toolkit</p><button type="button" data-promote-close>Close</button></div><div class="article-promotion__body"><p>This prepares source-faithful social teasers; it does not publish to social platforms.</p><div class="article-promotion__grid">${formats.map((format) => `<article><span>${format}</span><h2>${escape(promotion.hook)}</h2>${promotion.teaser.map((text) => `<p>${escape(text)}</p>`).join("")}<b>${escape(promotion.cta)}</b><small>${canonical}</small><p>${escape(promotion.hashtags.join(" "))}</p><button type="button" data-copy-promotion="${Buffer.from(promotion.text).toString("base64")}">Copy ${format} copy</button></article>`).join("")}</div></div></dialog>
  <footer class="seo-static-footer"><p>BA Medicale provides education, not individual diagnosis or treatment advice.</p><a href="../library.html">Return to the Medical Library</a><a href="../privacy-policy.html">Privacy Policy</a></footer>
  <script src="../content.js?v=disease-explorer-20260825"></script><script src="../app.js?v=disease-explorer-20260825"></script>
</body></html>`.replace(/[ \t]+\n/g, "\n");
};

const outputs = new Map(articles.map((article, index) => [path.join(root, "articles", `${article.slug}.html`), renderPage(article, index)]));
seminars.forEach((event, index) => outputs.set(path.join(root, "events", `${event.slug}.html`), renderEventPage({ event, index, seminars, diseaseGroup: diseaseGroups.get(event.primaryDiseaseGroup), domain })));
const baseUrls = ["/", "/public.html", "/clinical.html", "/healthcare-workers.html", "/library.html", "/seminar.html", "/ebooks.html", "/videos.html", "/resources.html", "/symposia.html", "/about.html", "/privacy-policy.html"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${baseUrls.concat(articles.map((article) => `/articles/${article.slug}.html`), seminars.map((event) => `/${event.detailUrl}`)).map((url) => `  <url><loc>${domain}${url}</loc></url>`).join("\n")}\n</urlset>\n`;
outputs.set(path.join(root, "sitemap.xml"), sitemap);

let mismatches = 0;
for (const [file, expected] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current !== expected) {
    mismatches += 1;
    if (!checkOnly) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, expected, "utf8");
      console.log(`generated ${path.relative(root, file)}`);
    } else {
      console.error(`out of date: ${path.relative(root, file)}`);
    }
  }
}
if (checkOnly && mismatches) process.exitCode = 1;
if (!mismatches) console.log(`content outputs current (${articles.length} article${articles.length === 1 ? "" : "s"}, ${seminars.length} seminar${seminars.length === 1 ? "" : "s"})`);
