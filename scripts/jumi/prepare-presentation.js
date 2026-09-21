const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed without modifying publication state.`);
  return result.stdout;
}

function prepare(source, output, repoRoot, { video = "" } = {}) {
  assert(fs.existsSync(source) && path.extname(source).toLowerCase() === ".pdf", "Presentation source must be a PDF.");
  fs.mkdirSync(output, { recursive: true });
  const info = run("pdfinfo", [source]);
  const count = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
  const size = info.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
  assert(count > 0 && size, "Unable to read Presentation page geometry.");
  run("pdftoppm", ["-png", "-r", "160", source, path.join(output, "page")]);
  const base = path.relative(repoRoot, output).replace(/\\/g, "/");
  const digits = String(count).length;
  const pages = [];
  for (let page = 1; page <= count; page += 1) {
    const plain = path.join(output, `page-${page}.png`);
    const padded = path.join(output, `page-${String(page).padStart(digits, "0")}.png`);
    const file = fs.existsSync(plain) ? plain : padded;
    assert(fs.existsSync(file), `Missing rendered Presentation page ${page}.`);
    if (file !== plain) fs.renameSync(file, plain);
    const text = run("pdftotext", ["-layout", "-f", String(page), "-l", String(page), source, "-"]).replace(/\f/g, "").trim();
    pages.push({ page, image: `${base}/page-${page}.png`, imageSha256: hashFile(plain), text, textAvailable: Boolean(text), width: Math.round(Number(size[1]) * 160 / 72), height: Math.round(Number(size[2]) * 160 / 72), figures: [] });
  }
  const manifest = { schemaVersion: 1, sourceSha256: hashFile(source), pageAspect: Number(size[2]) / Number(size[1]), pages };
  if (video) {
    assert(fs.existsSync(video) && path.extname(video).toLowerCase() === ".mp4", "Presentation video must be an approved MP4.");
    manifest.videoSha256 = hashFile(video);
  }
  fs.writeFileSync(path.join(output, "pages.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const source = args[args.indexOf("--source") + 1];
  const output = args[args.indexOf("--output") + 1];
  const videoIndex = args.indexOf("--video");
  const video = videoIndex >= 0 ? args[videoIndex + 1] : "";
  const root = path.resolve(__dirname, "../..");
  assert(source && output, "Use --source <pdf> --output <asset-directory> [--video <mp4>].");
  const result = prepare(path.resolve(root, source), path.resolve(root, output), root, { video: video ? path.resolve(root, video) : "" });
  console.log(`prepared ${result.pages.length} Presentation page(s)`);
}

module.exports = { prepare, hashFile };
