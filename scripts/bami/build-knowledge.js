"use strict";
// content:build (also used by JUMI publishing) regenerates this public corpus;
// the deployed BAMI service reads it with a bounded ten-minute cache.

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const registryApi = require("../../content-registry");

const root = path.resolve(__dirname, "../..");
const outputPath = path.join(root, "data/bami-knowledge.json");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context);
const data = context.window.BAMEDICALE_DATA;
const videos = JSON.parse(fs.readFileSync(path.join(root, "data/videos.json"), "utf8")).videos;
const originalVideos = JSON.parse(fs.readFileSync(path.join(root, "data/original-videos.json"), "utf8")).videos;
const registry = registryApi.create(data, { videos, originalVideos });

const plain = value => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const excerpt = (value, limit = 1800) => plain(value).slice(0, limit);
const textParts = value => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(textParts);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).filter(([key]) => !/^(?:id|url|href|src|image|cover|file|path|sha\w*|hash)$/i.test(key)).flatMap(([, part]) => textParts(part));
};
const sourceText = (record, base = root) => {
  const source = record.sourceRecord || {};
  const parts = [source.intro, source.sections, source.takeaways, source.highlights, source.paper?.abstract, source.paper?.keywords, source.quickRead,
    source.programFocus, source.schedule, source.program, source.description, source.short_description,
    source.sessions, source.speakers, source.transcript, source.captions];
  const manifest = record.family === "ebook" ? source.pageManifest : record.family === "presentation" ? source.sourceManifest : "";
  if (manifest) {
    const file = path.resolve(base, manifest);
    if (!file.startsWith(base + path.sep) || !/\.json$/i.test(file) || !fs.existsSync(file)) throw new Error(`BAMI source manifest unavailable: ${record.id}`);
    const pages = JSON.parse(fs.readFileSync(file, "utf8")).pages;
    if (!Array.isArray(pages)) throw new Error(`BAMI source manifest has no pages: ${record.id}`);
    parts.push(pages.map(page => page.text));
  }
  return plain(textParts(parts).join(" "));
};
const safeRoute = route => {
  const value = String(route || "");
  if (/^https:\/\/bamedicale\.com\//i.test(value)) return value;
  if (/^(?!\/|.*\.\.)(?:[a-z0-9_-]+\/)*[a-z0-9_?=&%./-]+$/i.test(value)) return `https://bamedicale.com/${value}`;
  return "";
};
const eligible = registry.query();
const fromRegistry = (records, base = root) => records.map(record => ({
  id: record.id,
  contentId: record.id,
  type: record.contentType,
  contentType: record.contentType,
  family: record.family,
  title: record.title,
  subtitle: excerpt(record.sourceRecord?.subtitle, 300),
  summary: excerpt(record.summary, 600),
  content: sourceText(record, base),
  authors: record.authors,
  author: record.authors,
  audience: record.primaryAudience,
  audiences: record.audiences,
  disease: record.diseaseGroups,
  diseases: record.diseaseGroups,
  condition: record.diseaseCondition,
  categories: record.categories,
  category: record.categories,
  topics: record.topics,
  source: record.source,
  date: record.videoPublishedDate || record.publishedDate || record.originalPublicationDate || "",
  publishedDate: record.videoPublishedDate || record.publishedDate || record.originalPublicationDate || "",
  status: record.publicationStatus,
  eventStart: record.family === "seminar" ? String(record.sourceRecord?.startDate || "") : "",
  eventEnd: record.family === "seminar" ? String(record.sourceRecord?.endDate || "") : "",
  eventDate: record.family === "seminar" ? String(record.sourceRecord?.startDate || "").slice(0, 10) : record.family === "presentation" ? String(record.sourceRecord?.presentationDate || "") : "",
  eventId: record.family !== "seminar" ? String(record.sourceRecord?.eventId || "") : "",
  speakers: record.family === "seminar" ? (record.sourceRecord?.faculty || []).filter(row => Array.isArray(row) && /speaker|keynote/i.test(row[0])).map(row => row[1]) : [],
  presenters: record.family === "presentation" ? record.authors : [],
  tags: record.sourceRecord?.tags || [],
  relatedContentIds: record.family !== "seminar" && record.sourceRecord?.eventId ? [record.sourceRecord.eventId] : [],
  sourceMedia: safeRoute(record.cover),
  url: safeRoute(record.route)
}));
const items = fromRegistry(eligible);
for (const item of items.filter(entry => entry.family === "seminar")) {
  item.relatedContentIds = items.filter(entry => entry.eventId === item.id).map(entry => entry.id);
}
if (items.some(item => !item.id || !item.title || !item.url) || new Set(items.map(item => item.id)).size !== eligible.length) {
  throw new Error("BAMI coverage failed: a published canonical record is missing, duplicated, or has an invalid public route.");
}

const team = fs.readFileSync(path.join(root, "team.html"), "utf8");
const cardPattern = /<a class="team-card[^"\n]*" href="([a-z0-9-]+-profile\.html)"[^>]*>[\s\S]*?<div class="team-card__copy"><span>([^<]+)<\/span><h3>([^<]+)<\/h3>/gi;
for (const match of team.matchAll(cardPattern)) {
  const file = path.join(root, match[1]);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || "";
  const name = plain(match[3].replace(/&amp;/g, "&"));
  items.push({ id: `profile-${path.basename(match[1], ".html")}`, type: "Person", family: "profile", title: name,
    summary: excerpt(`${plain(match[2])}. ${description}`, 600), content: "", authors: [], audience: "",
    disease: [], topics: [], date: "", status: "published", url: `https://bamedicale.com/${match[1]}` });
}

const output = JSON.stringify({ schemaVersion: 1, items }, null, 2) + "\n";
if (items.filter(item => item.family !== "profile").length !== eligible.length) throw new Error("BAMI coverage differs from the published registry.");
if (require.main === module) {
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output) {
      console.error("BAMI published knowledge is stale. Run npm run bami:build.");
      process.exitCode = 1;
    } else console.log(`BAMI published knowledge current (${items.length} records).`);
  } else {
    fs.writeFileSync(outputPath, output);
    console.log(`BAMI published knowledge generated (${items.length} records).`);
  }
}

module.exports = { items, safeRoute, sourceText, fromRegistry };
