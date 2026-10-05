"use strict";
const fs = require("node:fs");
const path = require("node:path");
const dir = __dirname;
const code = ["schema.js", "core.js", "backend.js"].map(name => fs.readFileSync(path.join(dir, name), "utf8").trim()).join("\n\n") + "\n";
const html = fs.readFileSync(path.join(dir, "frame.html"), "utf8");
const outputs = [["Code.gs", code], ["Index.html", html]];
if (process.argv.includes("--check")) {
  for (const [name, expected] of outputs) if (!fs.existsSync(path.join(dir, name)) || fs.readFileSync(path.join(dir, name), "utf8") !== expected) {
    console.error(`BAMI Apps Script ${name} is stale. Run npm run bami:build.`);
    process.exitCode = 1;
  }
  if (!process.exitCode) console.log("BAMI Apps Script bundle is current.");
} else {
  for (const [name, value] of outputs) fs.writeFileSync(path.join(dir, name), value);
  console.log("BAMI Apps Script bundle generated.");
}
