const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const adminDir = path.join(rootDir, "admin");
const draftsDir = path.join(rootDir, "admin-drafts", "items");
const host = "127.0.0.1";
const port = Number(process.env.BA_ADMIN_PORT || 8787);
const maxJsonBytes = 140 * 1024 * 1024;
const maxCopiedFiles = 80;
const maxCopiedBytes = 300 * 1024 * 1024;

const enums = {
  contentType: ["article", "seminar", "video", "ebook", "course", "resource"],
  destination: ["auto", "library", "courses", "seminar", "videos", "ebooks", "resources"],
  audience: ["auto", "public", "doctors", "both"],
  status: ["draft", "ready", "needs-info", "published", "archived"]
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function json(res, code, payload) {
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function text(res, code, body) {
  res.writeHead(code, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

function cleanText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function lines(value) {
  return cleanText(value).split("\n").map((item) => item.trim()).filter(Boolean);
}

function pickEnum(name, value) {
  return enums[name].includes(value) ? value : enums[name][0];
}

function slugify(value) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "untitled";
}

function safeName(value) {
  const parsed = path.parse(String(value || "file"));
  const base = slugify(parsed.name).slice(0, 70) || "file";
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 12);
  return `${base}${ext || ""}`;
}

function draftPath(id) {
  return path.join(draftsDir, id, "draft.json");
}

function publicDraft(draft) {
  return {
    ...draft,
    _path: path.relative(rootDir, draftPath(draft.id)).replace(/\\/g, "/")
  };
}

async function ensureDirs() {
  await fsp.mkdir(draftsDir, { recursive: true });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxJsonBytes) {
        reject(new Error("Request is too large. Use local path mode for big assets."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8") || "{}";
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });
    req.on("error", reject);
  });
}

async function readDraft(id) {
  const raw = await fsp.readFile(draftPath(id), "utf8");
  return JSON.parse(raw);
}

async function writeDraft(draft) {
  draft.updatedAt = new Date().toISOString();
  const folder = path.dirname(draftPath(draft.id));
  await fsp.mkdir(folder, { recursive: true });
  const tmp = path.join(folder, "draft.tmp.json");
  await fsp.writeFile(tmp, JSON.stringify(draft, null, 2));
  await fsp.rename(tmp, draftPath(draft.id));
}

async function listDrafts() {
  await ensureDirs();
  const dirs = await fsp.readdir(draftsDir, { withFileTypes: true });
  const drafts = [];
  for (const dirent of dirs) {
    if (!dirent.isDirectory()) continue;
    try {
      drafts.push(publicDraft(await readDraft(dirent.name)));
    } catch {
      drafts.push({
        id: dirent.name,
        status: "needs-info",
        topicHint: "Unreadable draft",
        intakeIssues: ["draft.json could not be parsed."]
      });
    }
  }
  return drafts.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

async function saveUploadedFiles(id, files = []) {
  const saved = [];
  const assetDir = path.join(draftsDir, id, "assets");
  await fsp.mkdir(assetDir, { recursive: true });
  for (const file of Array.isArray(files) ? files : []) {
    if (!file || !file.name || !file.dataBase64) continue;
    const data = String(file.dataBase64).includes(",")
      ? String(file.dataBase64).split(",").pop()
      : String(file.dataBase64);
    const buffer = Buffer.from(data, "base64");
    const storedName = `${Date.now()}-${safeName(file.name)}`;
    const storedPath = path.join(assetDir, storedName);
    await fsp.writeFile(storedPath, buffer);
    saved.push({
      originalName: String(file.name),
      storedPath: path.relative(rootDir, storedPath).replace(/\\/g, "/"),
      mimeType: String(file.type || "application/octet-stream"),
      category: cleanText(file.category) || "uploaded-source",
      size: buffer.length,
      kind: "uploaded",
      addedAt: new Date().toISOString()
    });
  }
  return saved;
}

async function collectFiles(inputPath, state) {
  const resolved = path.resolve(inputPath);
  const stat = await fsp.stat(resolved);
  if (stat.isFile()) return [resolved];
  if (!stat.isDirectory()) return [];
  const entries = await fsp.readdir(resolved, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (state.count >= maxCopiedFiles) break;
    const child = path.join(resolved, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(child, state));
    } else if (entry.isFile()) {
      state.count += 1;
      files.push(child);
    }
  }
  return files;
}

async function copyLocalPaths(id, localPaths = []) {
  const saved = [];
  const issues = [];
  const assetDir = path.join(draftsDir, id, "assets");
  await fsp.mkdir(assetDir, { recursive: true });
  let copiedBytes = 0;
  const state = { count: 0 };

  for (const item of Array.isArray(localPaths) ? localPaths : []) {
    if (!item) continue;
    try {
      const sourceFiles = await collectFiles(item, state);
      for (const source of sourceFiles) {
        const stat = await fsp.stat(source);
        if (copiedBytes + stat.size > maxCopiedBytes) {
          issues.push(`Copy limit reached before ${source}`);
          continue;
        }
        copiedBytes += stat.size;
        const storedName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${safeName(path.basename(source))}`;
        const storedPath = path.join(assetDir, storedName);
        await fsp.copyFile(source, storedPath);
        saved.push({
          originalName: path.basename(source),
          sourcePath: source,
          storedPath: path.relative(rootDir, storedPath).replace(/\\/g, "/"),
          mimeType: "application/octet-stream",
          category: "local-path-source",
          size: stat.size,
          kind: "local-copy",
          addedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      issues.push(`${item}: ${error.message}`);
    }
  }
  return { saved, issues };
}

function draftFromBody(body, existing = {}) {
  return {
    ...existing,
    contentType: pickEnum("contentType", body.contentType || existing.contentType),
    destination: pickEnum("destination", body.destination || existing.destination),
    audience: pickEnum("audience", body.audience || existing.audience),
    status: pickEnum("status", body.status || existing.status || "draft"),
    topicHint: cleanText(body.topicHint ?? existing.topicHint),
    sourceNotes: cleanText(body.sourceNotes ?? existing.sourceNotes),
    sourceLinks: Array.isArray(body.sourceLinks) ? body.sourceLinks.map(cleanText).filter(Boolean) : lines(body.sourceLinks ?? existing.sourceLinks),
    requirements: {
      autoTitle: body.autoTitle ?? existing.requirements?.autoTitle ?? true,
      autoSummary: body.autoSummary ?? existing.requirements?.autoSummary ?? true,
      autoPlacement: body.autoPlacement ?? existing.requirements?.autoPlacement ?? true,
      autoVisualTreatment: body.autoVisualTreatment ?? existing.requirements?.autoVisualTreatment ?? true,
      createDetailPage: body.createDetailPage ?? existing.requirements?.createDetailPage ?? true
    },
    requestedAction: cleanText(body.requestedAction ?? existing.requestedAction),
    liveSource: body.liveSource ?? existing.liveSource
  };
}

async function createDraft(body) {
  const now = new Date().toISOString();
  const id = `${now.replace(/[-:.TZ]/g, "").slice(0, 14)}-${slugify(body.topicHint || body.contentType)}-${crypto.randomBytes(3).toString("hex")}`;
  let draft = draftFromBody(body, {
    id,
    createdAt: now,
    updatedAt: now,
    files: [],
    intakeIssues: [],
    publication: {
      instruction: "When the user says 'Process admin drafts and publish', inspect this draft and its files, then create polished BA Medicale website content with appropriate page placement, media treatment, links, QA, commit, push, and staging verification when Git access is available."
    }
  });
  const uploaded = await saveUploadedFiles(id, body.files);
  const copied = await copyLocalPaths(id, lines(body.localPaths));
  draft.files = [...uploaded, ...copied.saved];
  draft.intakeIssues = copied.issues;
  await writeDraft(draft);
  return publicDraft(draft);
}

async function loadWebsiteData() {
  const contentRaw = await fsp.readFile(path.join(rootDir, "content.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(contentRaw, sandbox, { filename: "content.js" });
  let videoData = { videos: [] };
  let originalVideoData = { videos: [] };
  try {
    videoData = JSON.parse(await fsp.readFile(path.join(rootDir, "data", "videos.json"), "utf8"));
  } catch {
    videoData = { videos: [] };
  }
  try {
    originalVideoData = JSON.parse(await fsp.readFile(path.join(rootDir, "data", "original-videos.json"), "utf8"));
  } catch {
    originalVideoData = { videos: [] };
  }
  return { data: sandbox.window.BAMEDICALE_DATA || {}, videoData, originalVideoData };
}

function publishedItem(id, type, destination, title, summary, route, sourceFile, sourcePath, raw) {
  return {
    id,
    type,
    destination,
    title: cleanText(title) || "Untitled live item",
    summary: cleanText(summary),
    route,
    sourceFile,
    sourcePath,
    raw
  };
}

async function listPublishedItems() {
  const { data, videoData, originalVideoData } = await loadWebsiteData();
  const items = [];
  (data.library || []).forEach((item, index) => items.push(publishedItem(`library-${index}`, "Library", "library", item.title, item.text, item.href || "library.html", "content.js", `BAMEDICALE_DATA.library[${index}]`, item)));
  (data.ebooks || []).forEach((item, index) => items.push(publishedItem(`ebook-${item.slug || index}`, "eBook", "ebooks", item.title, `${item.audience || ""} ${item.text || ""}`.trim(), `ebook-detail.html?book=${item.slug}`, "content.js", `BAMEDICALE_DATA.ebooks[${index}]`, item)));
  (data.events || []).forEach((item, index) => items.push(publishedItem(`event-${index}`, "Course / seminar", "seminar", item.title, item.text, "seminar.html", "content.js", `BAMEDICALE_DATA.events[${index}]`, item)));
  if (data.featuredSeminar) {
    items.push(publishedItem("featured-seminar", "Featured seminar", "seminar", data.featuredSeminar.title, `${data.featuredSeminar.subtitle || ""} ${data.featuredSeminar.date || ""} ${data.featuredSeminar.time || ""}`.trim(), "seminar.html", "content.js", "BAMEDICALE_DATA.featuredSeminar", data.featuredSeminar));
  }
  (videoData.videos || []).forEach((item, index) => items.push(publishedItem(`video-${item.youtube_id || index}`, "Video", "videos", item.title, item.short_description, "videos.html", "data/videos.json", `videos[${index}]`, item)));
  (originalVideoData.videos || []).forEach((item, index) => items.push(publishedItem(`original-video-${item.id || index}`, "BA Medicale original video", "videos", item.title, item.short_description, "videos.html", "data/original-videos.json", `videos[${index}]`, item)));
  return items;
}

async function createDraftFromPublished(id, body) {
  const item = (await listPublishedItems()).find((entry) => entry.id === id);
  if (!item) throw new Error("Live item not found.");
  const action = cleanText(body.requestedAction) || "edit";
  const actionLabel = { edit: "Edit live item", remove: "Remove from website", republish: "Republish live item" }[action] || "Edit live item";
  return createDraft({
    contentType: item.destination === "seminar" ? "seminar" : item.destination === "videos" ? "video" : item.destination === "ebooks" ? "ebook" : item.destination === "resources" ? "resource" : "article",
    destination: item.destination,
    audience: "auto",
    status: "ready",
    topicHint: `${actionLabel}: ${item.title}`,
    sourceLinks: item.raw?.url ? [item.raw.url] : [],
    sourceNotes: [`${actionLabel}.`, cleanText(body.notes), "", "Current live website item:", JSON.stringify(item.raw, null, 2)].filter(Boolean).join("\n"),
    requestedAction: action,
    liveSource: item,
    autoTitle: action !== "remove",
    autoSummary: action !== "remove",
    autoPlacement: true,
    autoVisualTreatment: action !== "remove",
    createDetailPage: action !== "remove"
  });
}

async function patchDraft(id, body) {
  const draft = await readDraft(id);
  const next = draftFromBody(body, draft);
  const uploaded = await saveUploadedFiles(id, body.files);
  const copied = await copyLocalPaths(id, lines(body.localPaths));
  next.files = [...(draft.files || []), ...uploaded, ...copied.saved];
  next.intakeIssues = [...(draft.intakeIssues || []), ...copied.issues];
  await writeDraft(next);
  return publicDraft(next);
}

async function deleteDraft(id) {
  const folder = path.join(draftsDir, id);
  const resolved = path.resolve(folder);
  if (!resolved.startsWith(path.resolve(draftsDir))) {
    throw new Error("Refusing to delete outside draft storage.");
  }
  await fsp.rm(resolved, { recursive: true, force: true });
}

async function serveStatic(req, res, pathname) {
  const page = pathname === "/" || pathname === "/admin" || pathname === "/admin.html"
    ? path.join(adminDir, "index.html")
    : path.join(adminDir, pathname.replace(/^\/+/, ""));
  const resolved = path.resolve(page);
  if (!resolved.startsWith(adminDir)) {
    text(res, 403, "Forbidden");
    return;
  }
  try {
    const data = await fsp.readFile(resolved);
    res.writeHead(200, {
      "content-type": mime[path.extname(resolved).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(data);
  } catch {
    text(res, 404, "Not found");
  }
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    json(res, 200, { ok: true, rootDir, draftsDir });
    return;
  }
  if (req.method === "GET" && pathname === "/api/drafts") {
    json(res, 200, { drafts: await listDrafts() });
    return;
  }
  if (req.method === "POST" && pathname === "/api/drafts") {
    json(res, 201, { draft: await createDraft(await readBody(req)) });
    return;
  }
  if (req.method === "GET" && pathname === "/api/published") {
    json(res, 200, { items: await listPublishedItems() });
    return;
  }

  const publishedMatch = pathname.match(/^\/api\/published\/([^/]+)\/draft$/);
  if (publishedMatch && req.method === "POST") {
    json(res, 201, { draft: await createDraftFromPublished(publishedMatch[1], await readBody(req)) });
    return;
  }

  const match = pathname.match(/^\/api\/drafts\/([^/]+)$/);
  if (match) {
    const id = match[1];
    if (req.method === "GET") {
      json(res, 200, { draft: publicDraft(await readDraft(id)) });
      return;
    }
    if (req.method === "PATCH") {
      json(res, 200, { draft: await patchDraft(id, await readBody(req)) });
      return;
    }
    if (req.method === "DELETE") {
      await deleteDraft(id);
      json(res, 200, { ok: true });
      return;
    }
  }

  json(res, 404, { error: "Unknown API route." });
}

async function requestHandler(req, res) {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}

async function start() {
  await ensureDirs();
  if (process.argv.includes("--check")) {
    console.log(`Admin intake check OK: ${draftsDir}`);
    return;
  }
  const server = http.createServer(requestHandler);
  server.listen(port, host, () => {
    console.log(`BA Medicale Local Admin Intake`);
    console.log(`Open http://${host}:${port}/admin.html`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
