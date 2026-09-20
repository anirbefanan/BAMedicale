const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const SOCIAL_IMAGE = Object.freeze({
  url: "https://bamedicale.com/assets/brand/bamedicale-approved-logo.jpg",
  alt: "BA Medicale",
  type: "image/jpeg",
  width: "1440",
  height: "1440"
});
const PRIVATE_PREFIXES = ["admin/", "admin-drafts/", "jumi/", "scripts/jumi/", "Material/"];

const escapeAttribute = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const attribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? match[2] : "";
};

const metaTags = (html) => [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
const metaValue = (html, attributeName, attributeValue) => {
  const tag = metaTags(html).find((candidate) => attribute(candidate, attributeName).toLowerCase() === attributeValue.toLowerCase());
  return tag ? attribute(tag, "content") : "";
};

const isNoindex = (html) => metaTags(html).some((tag) => attribute(tag, "name").toLowerCase() === "robots" && /(?:^|[,\s])noindex(?:$|[,\s])/i.test(attribute(tag, "content")));
const isPrivatePath = (relativePath) => PRIVATE_PREFIXES.some((prefix) => relativePath.replace(/\\/g, "/").startsWith(prefix));
const isPublicHtml = (relativePath, html) => relativePath.toLowerCase().endsWith(".html") && !isPrivatePath(relativePath) && !isNoindex(html);

const imageBlock = () => [
  `<meta property="og:image" content="${SOCIAL_IMAGE.url}">`,
  `<meta property="og:image:secure_url" content="${SOCIAL_IMAGE.url}">`,
  `<meta property="og:image:type" content="${SOCIAL_IMAGE.type}">`,
  `<meta property="og:image:width" content="${SOCIAL_IMAGE.width}">`,
  `<meta property="og:image:height" content="${SOCIAL_IMAGE.height}">`,
  `<meta property="og:image:alt" content="${SOCIAL_IMAGE.alt}">`,
  `<meta name="twitter:image" content="${SOCIAL_IMAGE.url}">`,
  `<meta name="twitter:image:alt" content="${SOCIAL_IMAGE.alt}">`
].join("\n  ");

const titleValue = (html) => (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || "";
const canonicalValue = (html) => {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]).find((candidate) => attribute(candidate, "rel").toLowerCase() === "canonical");
  return tag ? attribute(tag, "href") : "";
};

const ensureMeta = (html, attributeName, attributeValue, content) => {
  if (!content || metaValue(html, attributeName, attributeValue)) return html;
  const tag = `<meta ${attributeName}="${attributeValue}" content="${escapeAttribute(content)}">`;
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
};

const normalizePublicHtml = (html) => {
  try {
    validatePublicHtml("document", html);
    return html;
  } catch {
    // Normalize only pages that are missing or disagree with the canonical contract.
  }
  const title = titleValue(html);
  const description = metaValue(html, "name", "description");
  const canonical = canonicalValue(html);
  let output = html.replace(/(?:^[ \t]*)?<meta\b[^>]*>(?:[ \t]*\r?\n)?/gim, (tag) => {
    const property = attribute(tag, "property").toLowerCase();
    const name = attribute(tag, "name").toLowerCase();
    return property === "og:image" || property.startsWith("og:image:") || name === "twitter:image" || name === "twitter:image:alt" ? "" : tag;
  });
  output = ensureMeta(output, "property", "og:type", "website");
  output = ensureMeta(output, "property", "og:site_name", "BA Medicale");
  output = ensureMeta(output, "property", "og:title", title);
  output = ensureMeta(output, "property", "og:description", description);
  output = ensureMeta(output, "property", "og:url", canonical);
  output = ensureMeta(output, "name", "twitter:card", "summary_large_image");
  output = ensureMeta(output, "name", "twitter:title", metaValue(output, "property", "og:title") || title);
  output = ensureMeta(output, "name", "twitter:description", metaValue(output, "property", "og:description") || description);
  const anchor = [...output.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]).find((tag) => attribute(tag, "property").toLowerCase() === "og:url");
  return anchor ? output.replace(anchor, `${anchor}\n  ${imageBlock()}`) : output.replace(/<\/head>/i, `${imageBlock()}\n</head>`);
};

const validatePublicHtml = (relativePath, html) => {
  const expected = {
    "og:image": SOCIAL_IMAGE.url,
    "og:image:secure_url": SOCIAL_IMAGE.url,
    "og:image:type": SOCIAL_IMAGE.type,
    "og:image:width": SOCIAL_IMAGE.width,
    "og:image:height": SOCIAL_IMAGE.height,
    "og:image:alt": SOCIAL_IMAGE.alt
  };
  for (const [name, value] of Object.entries(expected)) {
    const tags = metaTags(html).filter((tag) => attribute(tag, "property").toLowerCase() === name);
    if (tags.length !== 1 || attribute(tags[0], "content") !== value) throw new Error(`${relativePath}: expected one ${name}=${value}`);
  }
  for (const [name, value] of [["twitter:image", SOCIAL_IMAGE.url], ["twitter:image:alt", SOCIAL_IMAGE.alt]]) {
    const tags = metaTags(html).filter((tag) => attribute(tag, "name").toLowerCase() === name);
    if (tags.length !== 1 || attribute(tags[0], "content") !== value) throw new Error(`${relativePath}: expected one ${name}=${value}`);
  }
  for (const [kind, name] of [["property", "og:type"], ["property", "og:site_name"], ["property", "og:title"], ["property", "og:description"], ["property", "og:url"], ["name", "twitter:card"], ["name", "twitter:title"], ["name", "twitter:description"]]) {
    const tags = metaTags(html).filter((tag) => attribute(tag, kind).toLowerCase() === name);
    if (tags.length !== 1 || !attribute(tags[0], "content")) throw new Error(`${relativePath}: expected one non-empty ${name}`);
  }
  const canonical = canonicalValue(html);
  if (!/^https:\/\/bamedicale\.com\//.test(canonical)) throw new Error(`${relativePath}: canonical must use the production HTTPS domain`);
  if (metaValue(html, "property", "og:url") !== canonical) throw new Error(`${relativePath}: og:url must match canonical`);
};

const trackedHtmlFiles = () => {
  const result = spawnSync("git", ["ls-files", "*.html"], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Unable to list tracked HTML files");
  return result.stdout.split(/\r?\n/).filter(Boolean);
};

const audit = ({ write = false } = {}) => {
  const files = trackedHtmlFiles();
  const report = { total: files.length, public: [], noindex: [], private: [], changed: [] };
  for (const relativePath of files) {
    const file = path.join(ROOT, relativePath);
    const html = fs.readFileSync(file, "utf8");
    if (isPrivatePath(relativePath)) { report.private.push(relativePath); continue; }
    if (isNoindex(html)) { report.noindex.push(relativePath); continue; }
    report.public.push(relativePath);
    const normalized = normalizePublicHtml(html);
    if (normalized !== html) {
      report.changed.push(relativePath);
      if (write) fs.writeFileSync(file, normalized, "utf8");
    }
    validatePublicHtml(relativePath, normalized);
  }
  return report;
};

if (require.main === module) {
  try {
    const write = process.argv.includes("--write");
    const report = audit({ write });
    if (!write && report.changed.length) throw new Error(`social metadata out of date:\n${report.changed.join("\n")}`);
    console.log(`social metadata valid (${report.public.length} public HTML; ${report.noindex.length} noindex; ${report.private.length} private)`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { ROOT, SOCIAL_IMAGE, imageBlock, normalizePublicHtml, validatePublicHtml, isNoindex, isPrivatePath, isPublicHtml, trackedHtmlFiles, audit };
