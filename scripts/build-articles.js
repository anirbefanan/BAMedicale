const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const domain = "https://bamedicale.com";
const checkOnly = process.argv.includes("--check");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context, { filename: "content.js" });
const articles = Object.values(context.window.BAMEDICALE_DATA.articles || {}).sort((a, b) => {
  const dateOrder = String(b.updatedDate || b.publishedDate || "").localeCompare(String(a.updatedDate || a.publishedDate || ""));
  return dateOrder || Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
});

const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const absolute = (value) => `${domain}/${String(value || "").replace(/^\//, "")}`;
const relative = (value) => `../${String(value || "").replace(/^\//, "")}`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const article of articles) {
  for (const field of ["id", "slug", "title", "dek", "excerpt", "cover", "primaryTopic", "contentType", "sourceAttribution"]) assert(article[field], `${article.id || "Article"}: missing ${field}`);
  assert(Array.isArray(article.audiences) && article.audiences.length, `${article.id}: audiences are required`);
  assert(Array.isArray(article.sections) && article.sections.length, `${article.id}: article body is required`);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug), `${article.id}: invalid slug`);
}

const renderCompare = (rows = []) => {
  if (!rows.length) return "";
  const [, ...body] = rows;
  return `<div class="seo-article-compare">${body.map((row) => `<article><h3>${escape(row[0])}</h3><p><b>${escape(rows[0][1])}:</b> ${escape(row[1])}</p><p><b>${escape(rows[0][2])}:</b> ${escape(row[2])}</p></article>`).join("")}</div>`;
};
const renderSection = (section) => `<section class="seo-article-section"><h2>${escape(section.title)}</h2>${(section.body || []).map((text) => `<p>${escape(text)}</p>`).join("")}${renderCompare(section.compare)}${section.bullets ? `<ul>${section.bullets.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>` : ""}</section>`;
const shareUrl = (article) => `${domain}/articles/${article.slug}.html`;
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

const renderPage = (article, index) => {
  const canonical = shareUrl(article);
  const previous = articles[index - 1];
  const next = articles[index + 1];
  const promotion = article.promotion || {};
  const socialText = `${article.title} — ${canonical}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: absolute(article.cover),
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "BA Medicale", url: `${domain}/`, logo: { "@type": "ImageObject", url: `${domain}/assets/brand/bamedicale-approved-logo.jpg` } },
    audience: article.audiences.map((audienceType) => ({ "@type": "Audience", audienceType })),
    about: [article.primaryTopic, ...(article.tags || [])]
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
  <meta name="description" content="${escape(article.excerpt)}"><link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article"><meta property="og:site_name" content="BA Medicale"><meta property="og:title" content="${escape(article.title)}"><meta property="og:description" content="${escape(article.excerpt)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${absolute(article.cover)}"><meta property="og:image:alt" content="${escape(article.title)} editorial artwork">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(article.title)}"><meta name="twitter:description" content="${escape(article.excerpt)}"><meta name="twitter:image" content="${absolute(article.cover)}">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png"><link rel="stylesheet" href="../styles.css?v=article-library-system-20260825">
  <script type="application/ld+json">${json(schema)}</script><script type="application/ld+json">${json(breadcrumb)}</script>
</head>
<body class="route-article">
  <header class="seo-static-header"><a class="brand" href="../index.html"><img src="../assets/brand/bamedicale-approved-logo.jpg" alt="BA Medicale official logo" width="64" height="64"><span><b>BA Medicale</b><small>EST. 2024</small></span></a><a class="button button-outline" href="../library.html">Medical Library</a></header>
  <main class="seo-article-page"><nav class="seo-breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span>/</span><a href="../library.html">Medical Library</a><span>/</span><span>${escape(article.primaryTopic)}</span></nav>
    <article>
      <header class="seo-article-hero seo-article-hero--publication"><div><p class="eyebrow">${escape(article.label)}</p><div class="article-page-badges">${article.audiences.map((audience) => `<span>${escape(audience)}</span>`).join("")}<span>${escape(article.primaryTopic)}</span></div><h1>${escape(article.title)}</h1><p>${escape(article.dek)}</p><small>Sources: ${escape(article.sourceAttribution)}</small></div><button type="button" data-lightbox-image="${relative(article.cover)}" data-lightbox-alt="${escape(article.title)} editorial artwork" aria-label="Open article artwork"><img src="${relative(article.cover)}" alt="${escape(article.title)} editorial artwork" width="1280" height="720" fetchpriority="high"></button></header>
      ${article.stats?.length ? `<section class="seo-article-stats">${article.stats.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join("")}</section>` : ""}
      <section class="seo-article-section">${article.intro.map((text) => `<p>${escape(text)}</p>`).join("")}</section>
      ${article.sections.map(renderSection).join("")}
      <section class="seo-article-section"><h2>Key educational takeaways</h2><ul>${article.takeaways.map((text) => `<li>${escape(text)}</li>`).join("")}</ul></section>
      <section class="seo-article-section seo-article-references"><h2>References and sources</h2><ul>${article.references.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>${article.sourcePdf ? `<a class="button button-outline" href="${relative(article.sourcePdf)}">Open source PDF</a>` : ""}</section>
      <section class="article-page-tools"><div class="article-share"><button type="button" class="button button-outline" data-share-toggle aria-expanded="false">Share</button><div class="article-share__menu" data-share-menu hidden><div class="article-share__menu-head"><b>Share article</b><button type="button" data-share-close aria-label="Close share options">Close</button></div><a target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(socialText)}">WhatsApp</a><a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}">Facebook</a><a target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(canonical)}">X</a><a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}">LinkedIn</a><button type="button" data-copy-link="${canonical}">Copy Link</button></div></div><button type="button" class="button button-dark" data-promote-open>Promote Article</button></section>
      <nav class="article-page-nav" aria-label="Article navigation">${previous ? `<a href="${previous.slug}.html">← <span>Previous Article</span><b>${escape(previous.title)}</b></a>` : `<span aria-hidden="true"></span>`}<a href="../library.html"><span>Back to</span><b>Medical Library</b></a>${next ? `<a href="${next.slug}.html"><span>Next Article</span><b>${escape(next.title)}</b> →</a>` : `<span aria-hidden="true"></span>`}</nav>
    </article>
  </main>
  <dialog class="article-promotion" data-promotion-dialog><div class="article-promotion__bar"><p>BA Medicale promotion toolkit</p><button type="button" data-promote-close>Close</button></div><div class="article-promotion__body"><p>This prepares source-faithful copy; it does not publish to social platforms.</p><div class="article-promotion__grid">${formats.map((format) => `<article><span>${format}</span><h2>${escape(promotion.hook || article.title)}</h2><p>${escape(promotion.caption || article.excerpt)}</p><ul>${(promotion.value || article.takeaways.slice(0, 3)).map((text) => `<li>${escape(text)}</li>`).join("")}</ul><b>Read the full article at BAMedicale.com</b><small>${canonical}</small><p>${escape((promotion.hashtags || []).join(" "))}</p><button type="button" data-copy-promotion>Copy ${format} copy</button></article>`).join("")}</div></div></dialog>
  <footer class="seo-static-footer"><p>BA Medicale provides education, not individual diagnosis or treatment advice.</p><a href="../library.html">Return to the Medical Library</a></footer>
  <script src="../content.js?v=article-library-system-20260825"></script><script src="../app.js?v=article-library-system-20260825"></script>
</body></html>`;
};

const outputs = new Map(articles.map((article, index) => [path.join(root, "articles", `${article.slug}.html`), renderPage(article, index)]));
const baseUrls = ["/", "/public.html", "/clinical.html", "/library.html", "/seminar.html", "/events/management-thyroid-nodules-2026.html", "/ebooks.html", "/videos.html", "/resources.html", "/symposia.html", "/about.html"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${baseUrls.concat(articles.map((article) => `/articles/${article.slug}.html`)).map((url) => `  <url><loc>${domain}${url}</loc></url>`).join("\n")}\n</urlset>\n`;
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
if (!mismatches) console.log(`article outputs current (${articles.length} article${articles.length === 1 ? "" : "s"})`);
