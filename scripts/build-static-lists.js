"use strict";
// Writes crawlable, no-JavaScript content lists into the registry-driven list pages.
// app.js replaces each container's contents on load, so visitors see the normal UI;
// search engines and no-JS readers get real links derived from the same canonical registry.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const registryApi = require("../content-registry");

const root = path.resolve(__dirname, "..");
const checkOnly = process.argv.includes("--check");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context, { filename: "content.js" });
const sourceData = context.window.BAMEDICALE_DATA;
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
const registry = registryApi.create(sourceData, { videos: read("videos.json").videos || [], originalVideos: read("original-videos.json").videos || [] });

const escape = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const item = (record) => `<li><a href="${escape(record.route)}">${escape(record.title)}</a>${record.summary ? ` <span>${escape(record.summary)}</span>` : ""}</li>`;
const START = "<!-- static-list:start -->";
const END = "<!-- static-list:end -->";

const audienceList = (audience) => {
  const records = registry.query({ audience, family: "article" });
  return records.length ? `<ul>${records.map(item).join("")}</ul>` : "";
};
const libraryList = () => {
  const groups = new Map();
  for (const record of registry.query()) {
    if (!record.route || /^https?:/i.test(record.route)) continue;
    const key = record.contentType || "Content";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups].map(([type, records]) => `<h2>${escape(type)}</h2><ul>${records.map(item).join("")}</ul>`).join("");
};

const targets = [
  { file: "clinical.html", open: /(<section class="section audience-publications-section" data-education-articles="DOCTOR">)/, html: () => audienceList("DOCTOR") },
  { file: "public.html", open: /(<section class="section audience-publications-section" data-education-articles="PUBLIC">)/, html: () => audienceList("PUBLIC") },
  { file: "healthcare-workers.html", open: /(<section class="section audience-publications-section" data-education-articles="HEALTHCARE WORKER">)/, html: () => audienceList("HEALTHCARE WORKER") },
  { file: "library.html", open: /(<div class="article-library" data-article-library>)/, html: libraryList }
];

let stale = 0;
for (const target of targets) {
  const file = path.join(root, target.file);
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(target.open);
  if (!match) throw new Error(`${target.file}: list container not found`);
  const afterOpen = match.index + match[0].length;
  const closeTag = target.file === "library.html" ? "</div>" : "</section>";
  const markerStart = html.indexOf(START, afterOpen);
  const hasMarkers = markerStart === afterOpen;
  const bodyEnd = hasMarkers ? html.indexOf(END, afterOpen) + END.length : html.indexOf(closeTag, afterOpen);
  if (bodyEnd < afterOpen) throw new Error(`${target.file}: list container is not closed`);
  const block = `${START}${target.html()}${END}`;
  const next = html.slice(0, afterOpen) + block + html.slice(bodyEnd);
  if (next !== html) {
    stale += 1;
    if (checkOnly) console.error(`${target.file}: static content list is stale; run npm run content:build`);
    else { fs.writeFileSync(file, next); console.log(`generated ${target.file}`); }
  }
}
if (checkOnly && stale) process.exit(1);
if (!stale) console.log("static content lists current");
