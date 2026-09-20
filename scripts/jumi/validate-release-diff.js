const fs=require("fs");
const path=require("path");

function allowedPaths(manifest){const base=manifest.contentType==="Article"?`assets/articles/${manifest.slug}/`:`assets/ebooks/${manifest.slug}/`,page=manifest.contentType==="Article"?`articles/${manifest.slug}.html`:`ebooks/${manifest.slug}.html`;return file=>file==="content.js"||file==="sitemap.xml"||file===page||file===`data/jumi-publications/${manifest.contentId}.json`||(manifest.contentType==="eBook"&&file==="ebooks.html")||file.startsWith(base)||file===`data/jumi-publication-requests/${manifest.contentId}.json`;}
function validate(manifest,files){const allow=allowedPaths(manifest),rejected=files.filter(file=>!allow(file)||file.includes("..")||file.startsWith("Material/")||file.startsWith(".github/")||file.startsWith("scripts/")||file.startsWith("jumi/"));if(rejected.length)throw new Error(`Publication changed disallowed paths: ${rejected.join(", ")}`);return true;}
if(require.main===module){const manifest=JSON.parse(fs.readFileSync(process.argv[2],"utf8")),files=fs.readFileSync(0,"utf8").split(/\r?\n/).filter(Boolean);validate(manifest,files);console.log(`validated ${files.length} release path(s)`);}
module.exports={allowedPaths,validate};
