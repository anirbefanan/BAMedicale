"use strict";

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
const bodyOf = source => {
  const sections = Array.isArray(source.sections) ? source.sections : [];
  return excerpt(sections.map(section => [section.heading || section.title, section.body, section.text,
    ...(section.paragraphs || [])].filter(Boolean).join(" ")).join(" "));
};
const safeRoute = route => {
  const value = String(route || "");
  if (/^https:\/\/bamedicale\.com\//i.test(value)) return value;
  if (/^(?!\/|.*\.\.)(?:[a-z0-9_-]+\/)*[a-z0-9_?=&%./-]+$/i.test(value)) return `https://bamedicale.com/${value}`;
  return "";
};
const items = registry.query().map(record => ({
  id: record.id,
  type: record.contentType,
  family: record.family,
  title: record.title,
  summary: excerpt(record.summary, 600),
  content: bodyOf(record.sourceRecord),
  authors: record.authors,
  audience: record.primaryAudience,
  disease: record.diseaseGroups,
  topics: record.topics,
  date: record.publishedDate || record.originalPublicationDate || "",
  url: safeRoute(record.route)
})).filter(item => item.url);

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
    disease: [], topics: [], date: "", url: `https://bamedicale.com/${match[1]}` });
}

const output = JSON.stringify({ schemaVersion: 1, items }, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output) {
    console.error("BAMI published knowledge is stale. Run npm run bami:build.");
    process.exitCode = 1;
  } else console.log(`BAMI published knowledge current (${items.length} records).`);
} else {
  fs.writeFileSync(outputPath, output);
  console.log(`BAMI published knowledge generated (${items.length} records).`);
}

module.exports = { items, safeRoute };
