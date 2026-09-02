const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const renderEventPage = require("./event-template");
const registryApi = require("../content-registry");

const root = path.resolve(__dirname, "..");
const domain = "https://bamedicale.com";
const checkOnly = process.argv.includes("--check");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context, { filename: "content.js" });
const sourceData = context.window.BAMEDICALE_DATA;
const videoCatalog = JSON.parse(fs.readFileSync(path.join(root, "data", "videos.json"), "utf8"));
const originalVideoCatalog = JSON.parse(fs.readFileSync(path.join(root, "data", "original-videos.json"), "utf8"));
const contentRegistry = registryApi.create(sourceData, { videos: videoCatalog.videos || [], originalVideos: originalVideoCatalog.videos || [] });
registryApi.validate(contentRegistry, sourceData, { root, exists: (base, asset) => fs.existsSync(path.join(base, asset)) });
const diseaseTaxonomy = sourceData.diseaseTaxonomy || [];
const diseaseGroups = new Map(diseaseTaxonomy.map((group) => [group.id, group]));
const articles = Object.values(sourceData.articles || {}).sort((a, b) => {
  const dateOrder = String(b.updatedDate || b.publishedDate || "").localeCompare(String(a.updatedDate || a.publishedDate || ""));
  return dateOrder || Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
});
const seminars = Object.values(sourceData.seminars || {}).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));

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
  for (const field of ["id", "slug", "title", "dek", "excerpt", "cover", "primaryTopic", "contentType", "sourceAttribution"]) assert(article[field], `${article.id || "Article"}: missing ${field}`);
  assert(article.publishedDate || article.publicationDateLabel, `${article.id}: publishedDate or publicationDateLabel is required`);
  if (article.publishedDate) formatPublishedDate(article.publishedDate);
  assert(["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"].includes(article.primaryAudience), `${article.id}: valid primaryAudience is required`);
  assert(diseaseGroups.has(article.primaryDiseaseGroup), `${article.id}: valid primaryDiseaseGroup is required`);
  const authors = article.authors?.length ? article.authors : [article.author];
  assert(authors.every((author) => author?.name && ["Organization", "Person"].includes(author.type)), `${article.id}: valid author metadata is required`);
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
const renderFigures = (figures = []) => figures.length ? `<div class="seo-article-figure-grid">${figures.map((figure) => `<figure class="seo-article-figure"><button type="button" data-lightbox-image="${relative(figure.src)}" data-lightbox-alt="${escape(figure.caption)}" aria-label="Open ${escape(figure.caption)}"><img src="${relative(figure.src)}" alt="${escape(figure.caption)}" loading="lazy"></button><figcaption>${escape(figure.caption)}</figcaption></figure>`).join("")}</div>` : "";
const renderSubsections = (subsections = []) => subsections.map((subsection) => `<section class="seo-article-subsection"><h3>${escape(subsection.title)}</h3>${(subsection.body || []).map((text) => `<p>${escape(text)}</p>`).join("")}</section>`).join("");
const renderSection = (section) => `<section class="seo-article-section"><h2>${escape(section.title)}</h2>${(section.body || []).map((text) => `<p>${escape(text)}</p>`).join("")}${renderCompare(section.compare)}${section.bullets ? `<ul>${section.bullets.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>` : ""}${renderFigures(section.figures)}${renderSubsections(section.subsections)}</section>`;
const renderPaperSource = (article, authorNames) => {
  const paper = article.paper;
  if (!paper) return "";
  return `<section class="seo-paper-source"><p class="eyebrow">Full paper</p><h2>${escape(paper.sourceTitle || article.title)}</h2><p class="seo-paper-source__authors">${escape(paper.authorsText || authorNames)}</p>${paper.publicationDetails ? `<p class="seo-paper-source__publication">${escape(paper.publicationDetails)}</p>` : ""}${paper.affiliations?.length ? `<ol class="seo-paper-source__affiliations">${paper.affiliations.map((affiliation) => `<li>${escape(affiliation)}</li>`).join("")}</ol>` : ""}<div class="seo-paper-source__details">${paper.articleInfo?.length ? `<dl>${paper.articleInfo.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}${paper.keywords ? `<div><dt>Keywords</dt><dd>${escape(paper.keywords)}</dd></div>` : ""}</dl>` : ""}${paper.correspondence?.length ? `<address><b>Corresponding author</b>${paper.correspondence.map((line) => `<span>${escape(line)}</span>`).join("")}</address>` : ""}</div>${paper.abstract?.length ? `<section class="seo-paper-source__abstract"><h3>Abstract</h3>${paper.abstract.map((text) => `<p>${escape(text)}</p>`).join("")}</section>` : ""}</section>`;
};
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
  const authors = article.authors?.length ? article.authors : [article.author];
  const author = authors.map((entry) => entry.type === "Person"
    ? { "@type": "Person", name: entry.name }
    : { "@type": "Organization", name: entry.name, url: `${domain}/` });
  const schemaAuthor = author.length === 1 ? author[0] : author;
  const authorNames = authors.map((entry) => entry.name).join(", ");
  const publicationDate = article.publishedDate ? formatPublishedDate(article.publishedDate) : article.publicationDateLabel;
  const originalPublication = article.originalPublicationDateLabel || (article.scientificWork ? article.publicationDateLabel : "");
  const navigableArticles = article.inArticleNavigation === false ? [] : articles.filter((entry) => entry.inArticleNavigation !== false);
  const navigationIndex = navigableArticles.indexOf(article);
  const previous = navigableArticles[navigationIndex - 1];
  const next = navigableArticles[navigationIndex + 1];
  const promotion = socialPromotion(article, canonical);
  const diseaseGroup = diseaseGroups.get(article.primaryDiseaseGroup);
  const relatedContent = contentRegistry.related(article.id);
  const socialText = `${article.title} — ${canonical}`;
  const renderedReferences = `<section class="seo-article-section seo-article-references"><h2>${escape(article.referencesTitle || "References and sources")}</h2>${article.referencesOrdered ? `<ol>${article.references.map((text) => `<li>${escape(text)}</li>`).join("")}</ol>` : `<ul>${article.references.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>`}${article.sourcePdf ? `<a class="button button-outline" href="${relative(article.sourcePdf)}">Open source PDF</a>` : ""}</section>`;
  const renderedSections = article.sections.map(renderSection).join("");
  const bodySections = article.paper ? [
    renderPaperSource(article, authorNames),
    renderedSections,
    article.takeaways?.length ? `<section class="seo-article-section"><h2>Key educational takeaways</h2><ul>${article.takeaways.map((text) => `<li>${escape(text)}</li>`).join("")}</ul></section>` : "",
    renderedReferences
  ].filter(Boolean).join("\n      ") : [
    article.stats?.length ? `<section class="seo-article-stats">${article.stats.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join("")}</section>` : "",
    article.intro?.length ? `<section class="seo-article-section">${article.intro.map((text) => `<p>${escape(text)}</p>`).join("")}</section>` : "",
    renderedSections,
    article.takeaways?.length ? `<section class="seo-article-section"><h2>Key educational takeaways</h2><ul>${article.takeaways.map((text) => `<li>${escape(text)}</li>`).join("")}</ul></section>` : "",
    renderedReferences
  ].join("\n      ");
  const schema = {
    "@context": "https://schema.org",
    "@type": article.schemaType === "ScholarlyArticle" ? "ScholarlyArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    image: absolute(article.cover),
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "BA Medicale", url: `${domain}/`, logo: { "@type": "ImageObject", url: `${domain}/assets/brand/bamedicale-approved-logo.jpg` } },
    author: schemaAuthor,
    audience: audienceTypes.map((audienceType) => ({ "@type": "Audience", audienceType })),
    about: [diseaseGroup.name, article.diseaseCondition, article.primaryTopic, ...(article.tags || [])].filter(Boolean)
  };
  if (article.publishedDate) schema.datePublished = article.publishedDate;
  if (article.updatedDate) schema.dateModified = article.updatedDate;
  if (article.scientificWork && article.paper?.publicationDetails) schema.citation = article.paper.publicationDetails;
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
  <meta name="description" content="${escape(article.excerpt)}"><meta name="author" content="${escape(authorNames)}"><link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article"><meta property="og:site_name" content="BA Medicale"><meta property="og:title" content="${escape(article.title)}"><meta property="og:description" content="${escape(article.excerpt)}"><meta property="og:url" content="${canonical}">${article.publishedDate ? `<meta property="article:published_time" content="${escape(article.publishedDate)}">` : ""}<meta property="og:image" content="${absolute(article.cover)}"><meta property="og:image:alt" content="${escape(article.title)} editorial artwork">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(article.title)}"><meta name="twitter:description" content="${escape(article.excerpt)}"><meta name="twitter:image" content="${absolute(article.cover)}">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png"><link rel="stylesheet" href="../styles.css?v=shared-navigation-20260901">
  <script type="application/ld+json">${json(schema)}</script><script type="application/ld+json">${json(breadcrumb)}</script>
</head>
<body class="route-article">
  <div data-shell></div>
  <main class="seo-article-page"><nav class="seo-breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span>/</span><a href="../library.html?disease=${encodeURIComponent(article.primaryDiseaseGroup)}">${escape(diseaseGroup.name)}</a><span>/</span><span>${escape(article.primaryTopic)}</span></nav>
    <article>
      <header class="seo-article-hero seo-article-hero--publication">
        <button class="seo-article-artwork" type="button" data-lightbox-image="${relative(article.cover)}" data-lightbox-alt="${escape(article.title)} editorial artwork" aria-label="Open article artwork"><img src="${relative(article.cover)}" alt="${escape(article.title)} editorial artwork" width="1280" height="720" fetchpriority="high"></button>
        <div class="seo-article-heading"><p class="eyebrow">${escape(article.label)}</p><div class="article-page-badges">${article.scientificWork ? [article.primaryAudience, ...(article.secondaryDiseaseGroups || []).map((id) => diseaseGroups.get(id)?.name).filter(Boolean), diseaseGroup.name, article.primaryTopic].map((label) => `<span>${escape(label)}</span>`).join("") : `<span>${escape(article.primaryAudience)}</span><span>${escape(diseaseGroup.name)}</span>${article.diseaseCondition ? `<span>${escape(article.diseaseCondition)}</span>` : ""}<span>${escape(article.primaryTopic)}</span>`}</div><h1>${escape(article.title)}</h1><p>${escape(article.dek)}</p><div class="seo-article-meta"><small class="article-byline">By ${escape(authorNames)} · Published: ${escape(publicationDate)}</small>${originalPublication ? `<small class="article-source-meta">Original publication: ${escape(originalPublication)}</small>` : ""}<small class="article-source-meta">${article.scientificWork ? "Journal" : "Sources"}: ${escape(article.sourceAttribution)}</small></div></div>
      </header>
      <div class="seo-article-body">
      ${bodySections}
      </div>${relatedContent.length ? `
      <section class="seo-related seo-related--publications"><h2>Related learning</h2><div>${relatedContent.map((related) => `<a href="${relative(related.route)}"><span>${escape(related.contentType)}</span><b>${escape(related.title)}</b></a>`).join("")}</div></section>` : ""}
      <section class="article-page-tools"><div class="article-share"><button type="button" class="button button-outline" data-share-toggle aria-expanded="false">Share</button><div class="article-share__menu" data-share-menu hidden><div class="article-share__menu-head"><b>Share article</b><button type="button" data-share-close aria-label="Close share options">Close</button></div><a target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(socialText)}">WhatsApp</a><a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}">Facebook</a><a target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonical)}">X</a><a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}">LinkedIn</a><button type="button" data-copy-link="${canonical}">Copy Link</button></div></div><button type="button" class="button button-dark" data-promote-open>Promote Article</button></section>
      <nav class="article-page-nav" aria-label="Article navigation">${previous ? `<a href="${previous.slug}.html">← <span>Previous Article</span><b>${escape(previous.title)}</b></a>` : `<span aria-hidden="true"></span>`}<a href="../library.html"><span>Back to</span><b>Medical Library</b></a>${next ? `<a href="${next.slug}.html"><span>Next Article</span><b>${escape(next.title)}</b> →</a>` : `<span aria-hidden="true"></span>`}</nav>
    </article>
  </main>
  <dialog class="article-promotion" data-promotion-dialog><div class="article-promotion__bar"><p>BA Medicale promotion toolkit</p><button type="button" data-promote-close>Close</button></div><div class="article-promotion__body"><p>This prepares source-faithful social teasers; it does not publish to social platforms.</p><div class="article-promotion__grid">${formats.map((format) => `<article><span>${format}</span><h2>${escape(promotion.hook)}</h2>${promotion.teaser.map((text) => `<p>${escape(text)}</p>`).join("")}<b>${escape(promotion.cta)}</b><small>${canonical}</small><p>${escape(promotion.hashtags.join(" "))}</p><button type="button" data-copy-promotion="${Buffer.from(promotion.text).toString("base64")}">Copy ${format} copy</button></article>`).join("")}</div></div></dialog>
  <footer class="seo-static-footer"><p>BA Medicale provides education, not individual diagnosis or treatment advice.</p><a href="../library.html">Return to the Medical Library</a><a href="../privacy-policy.html">Privacy Policy</a></footer>
  <script src="../content.js?v=doctor-papers-20260901"></script><script src="../content-registry.js"></script><script src="../app.js?v=doctor-papers-20260901"></script>
</body></html>`.replace(/[ \t]+\n/g, "\n");
};

const outputs = new Map(articles.map((article, index) => [path.join(root, "articles", `${article.slug}.html`), renderPage(article, index)]));
seminars.forEach((event, index) => outputs.set(path.join(root, "events", `${event.slug}.html`), renderEventPage({ event, index, seminars, diseaseGroup: diseaseGroups.get(event.primaryDiseaseGroup), relatedContent: contentRegistry.related(event.id), domain })));
const baseUrls = ["/", "/public.html", "/clinical.html", "/healthcare-workers.html", "/library.html", "/seminar.html", "/ebooks.html", "/videos.html", "/resources.html", "/symposia.html", "/about.html", "/team.html", "/traffic.html", "/dr-bob-profile.html", "/nana-febrina-profile.html", "/melati-noerwa-profile.html", "/adlina-karisyah-profile.html", "/yudi-febriadi-profile.html", "/contact.html", "/privacy-policy.html"];
const indexableContentUrls = contentRegistry.query().filter((record) => record.indexable).map((record) => `/${record.route.replace(/^\//, "")}`);
const sitemapUrls = [...new Set([...baseUrls, ...indexableContentUrls])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${domain}${url}</loc></url>`).join("\n")}\n</urlset>\n`;
outputs.set(path.join(root, "sitemap.xml"), sitemap);

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if ([".git", "Material", "node_modules"].includes(entry.name)) return [];
  const fullPath = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(fullPath) : [fullPath];
});
const htmlFiles = walk(root).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = outputs.get(file) || fs.readFileSync(file, "utf8");
  if (/app\.js[^"']*["']><\/script>/.test(html)) {
    assert(/content-registry\.js[^"']*["']><\/script>/.test(html), `${path.relative(root, file)}: app.js requires content-registry.js`);
    assert(html.indexOf("content-registry.js") < html.indexOf("app.js"), `${path.relative(root, file)}: content-registry.js must load before app.js`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (!reference || reference.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(reference)) continue;
    const pathname = decodeURIComponent(reference.split(/[?#]/)[0]);
    if (!pathname) continue;
    const target = pathname.startsWith("/") ? path.join(root, pathname.replace(/^\/+/, "")) : path.resolve(path.dirname(file), pathname);
    const resolved = pathname.endsWith("/") ? path.join(target, "index.html") : target;
    assert(fs.existsSync(resolved) || outputs.has(resolved), `${path.relative(root, file)}: broken internal reference ${reference}`);
  }
}

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
if (!mismatches) console.log(`content outputs current (${contentRegistry.query().length} published registry items; ${articles.length} article${articles.length === 1 ? "" : "s"}, ${seminars.length} seminar${seminars.length === 1 ? "" : "s"})`);
