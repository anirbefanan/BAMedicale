const fs=require("fs"),path=require("path"),{execFileSync}=require("child_process");
const root=path.resolve(__dirname,"../.."),configFile=path.join(root,".clasp.json"),allowed=["Code.gs","Index.html","appsscript.json"];
function fail(message){throw new Error(message)}
function run(args){const executable=path.join(root,"node_modules",".bin",process.platform==="win32"?"clasp.cmd":"clasp");if(!fs.existsSync(executable))fail("Official @google/clasp is not installed. Run npm install first.");return execFileSync(executable,args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","inherit"]}).trim()}
if(!fs.existsSync(configFile))fail("Missing local .clasp.json. Bind this checkout to the existing private JUMI Apps Script project first.");
const config=JSON.parse(fs.readFileSync(configFile,"utf8"));
if(!/^[A-Za-z0-9_-]{20,}$/.test(String(config.scriptId||""))||config.rootDir!=="scripts/jumi")fail(".clasp.json must bind the existing JUMI scriptId with rootDir scripts/jumi.");
for(const name of allowed)if(!fs.existsSync(path.join(root,"scripts/jumi",name)))fail(`Missing validated Apps Script bundle file ${name}.`);
const status=run(["status"]),tracked=status.split(/Untracked files:/)[0];for(const name of allowed)if(!tracked.includes(name))fail(`clasp status does not include ${name}.`);
if(/backend\.js|\.test\.js|deploy\.js|build\.js/.test(tracked))fail("clasp would push an unapproved repository file.");
const endpoint=fs.readFileSync(path.join(root,"jumi","config.js"),"utf8").match(/\/macros\/s\/([A-Za-z0-9_-]+)\/exec/)?.[1];
if(!endpoint)fail("The existing production JUMI deployment ID could not be resolved.");
const deployments=run(["deployments"]);if(!deployments.includes(endpoint))fail("The local clasp project is not bound to the existing production JUMI deployment.");
run(["push","--force"]);
const versionOutput=run(["version",`JUMI validated bundle ${new Date().toISOString()}`]),version=versionOutput.match(/(?:version|Version)\s+(\d+)/)?.[1];
if(!version)fail("clasp did not return a new Apps Script version.");
const deployed=run(["deploy","--deploymentId",endpoint,"--versionNumber",version,"--description",`JUMI Content OS Version ${version}`]);
if(!deployed.includes(endpoint))fail("clasp did not confirm the existing JUMI deployment update.");
console.log(`Updated existing JUMI deployment in place to Apps Script Version ${version}.`);
