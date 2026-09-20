const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"../..");
const backend = fs.readFileSync(path.join(__dirname,"backend.js"),"utf8");
const html = fs.readFileSync(path.join(root,"jumi/index.html"),"utf8");
const client = fs.readFileSync(path.join(root,"jumi/app.js"),"utf8");
const config = fs.readFileSync(path.join(root,"jumi/config.js"),"utf8");
const sitemap = fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
const robots = fs.readFileSync(path.join(root,"robots.txt"),"utf8");

test("JUMI ships as a zero-data authentication gate",()=>{
  assert.match(html,/noindex,nofollow,noarchive,nosnippet/);
  assert.match(html,/Google identity is verified by the private backend/);
  assert.match(config,/secureAppUrl:\s*"https:\/\/script\.google\.com\/macros\/s\/AKfy[a-zA-Z0-9_-]+\/exec"/);
  assert.doesNotMatch(html,/iniemailnana|@[a-z0-9.-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(config,/apps\.googleusercontent\.com|AIza[a-zA-Z0-9_-]+|16LZq20tinfUf5jcA0rUgaoqSw42lQZ75i_xUcTDxIQk/);
  assert.match(client,/location\.hostname==="127\.0\.0\.1"/);
  assert.doesNotMatch(client,/location\.hostname===?"bamedicale\.com".*qa/);
  assert.match(client,/\$\$\("#primary-nav \[data-view\]"\).*navigate\(button\.dataset\.view\)/);
  assert.match(client,/registrant-search.*addEventListener\("keydown".*event\.key==="Enter".*render\(\)/);
  assert.match(client,/community-search.*addEventListener\("change",render\)/);
});

test("JUMI reuses the canonical production BA Medicale logo",()=>{
  const canonicalLogo="../assets/brand/bamedicale-approved-logo.jpg";
  assert.equal(html.split(canonicalLogo).length-1,3);
  assert.doesNotMatch(html,/brand-mark|<svg[^>]+(?:logo|brand)/i);
  assert.match(html,/brand-logo--gate/);
  assert.match(html,/brand-logo--nav/);
  assert.match(html,/brand-logo--mobile/);
  assert.match(html,/styles\.css\?v=design-system-20260920/);
  assert.match(html,/scope\.js\?v=20260919-functional-audit/);
});

test("dashboard separates KPI status, participant progression, and operational signals",()=>{
  assert.match(client,/Participant Journey/);
  assert.match(client,/participantJourney\(scoped\.journeys\)/);
  assert.match(client,/Free and Paid progression remain separate/);
  assert.match(client,/signalList\(scoped\.signals\)/);
  assert.doesNotMatch(client,/Participant funnel/);
  assert.doesNotMatch(client,/\["Active Doctors",m\.activeDoctors\]/);
  assert.doesNotMatch(client,/Registration → attendance/);
});

test("authorization is server enforced and client-provided email is never authentication",()=>{
  assert.match(backend,/Session\.getActiveUser\(\)\.getEmail\(\)/);
  assert.match(backend,/allowlist\.includes\(email\)/);
  assert.match(backend,/function jumiApi\(action,data\)/);
  assert.match(client,/google\.script\.run/);
  assert.doesNotMatch(backend,/tokeninfo|idToken|payload\.email.*allow/i);
});

test("private mutations use independent statuses, locks, audit rows, and confirmation",()=>{
  for(const value of ["Submitted","Registered","Cancelled","Not Required","Pending","Paid","Not Sent","Queued","Delivered","Not Checked","Attended","Not Attended","Not Eligible","Eligible","Generated","Approved"]){assert.match(backend,new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));}
  assert.match(backend,/LockService\.getScriptLock/);
  assert.match(backend,/MARK_PAID/);
  assert.match(backend,/UPLOAD_PAYMENT_PROOF/);
  assert.match(client,/Confirm this payment as received/);
  assert.match(client,/Provider Not Connected/);
  assert.match(backend,/\['H-1 Day',start-86400000\]/);
  assert.match(backend,/\['H-1 Hour',start-3600000\]/);
  assert.match(client,/calendar\.google\.com\/calendar\/render/);
  assert.match(client,/BEGIN:VCALENDAR/);
  assert.match(client,/Uploading or replacing evidence does not mark the payment paid/);
  assert.match(backend,/certificateStatus:String\(row\[8\].*\?'Sent':'Not Eligible'/);
  assert.match(backend,/Quiz Control/);
  assert.match(backend,/getSheetById\(Number\(map\[2\]\)\)/);
  assert.match(backend,/sheet\.getSheetId\(\)/);
  assert.doesNotMatch(backend,/Games19Sept|LMSGames19Sept/);
  assert.match(backend,/Download Material/);
  assert.match(backend,/downloads,community/);
  assert.match(backend,/function jumiStamp_\(dateValue,timeValue\)/);
  assert.match(backend,/registeredAt:jumiStamp_\(row\[0\],row\[1\]\)/);
  assert.match(backend,/completedAt:jumiStamp_\(/);
  assert.match(backend,/Lifecycle':found\?found\.Lifecycle:'Draft'/);
  assert.match(backend,/JUMI_PAYMENT_ROOT_FOLDER_ID.*existing private Payment Validation folder/);
});

test("JUMI remains absent from public discovery surfaces",()=>{
  assert.doesNotMatch(sitemap,/\/jumi\//);
  assert.match(robots,/Disallow:\s*\/jumi\//);
  for(const file of ["index.html","about.html","library.html","search.html"]){const content=fs.readFileSync(path.join(root,file),"utf8");assert.doesNotMatch(content,/href=["'][^"']*jumi/i);}
});

test("backend is isolated from the anonymous attendance deployment",()=>{
  const attendance = fs.readFileSync(path.join(root,"scripts/attendance/backend.js"),"utf8");
  assert.doesNotMatch(attendance,/jumi_/i);
  assert.match(backend,/Separate private JUMI Apps Script deployment/);
});

test("server rejects anonymous and non-allowlisted users before dispatch",()=>{
  const properties=new Map([["JUMI_ADMIN_ALLOWLIST",JSON.stringify(["nana@example.invalid"])],["JUMI_OWNER","nana@example.invalid"]]);
  let active="";
  const context={PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key)||null})},Session:{getActiveUser:()=>({getEmail:()=>active})},HtmlService:{createHtmlOutput:html=>({html}),createHtmlOutputFromFile:()=>({setTitle(){return this},setXFrameOptionsMode(){return this}}),XFrameOptionsMode:{DEFAULT:"default"}},console};
  vm.createContext(context);vm.runInContext(backend,context);
  assert.throws(()=>context.jumiAuthorize_(),/Access denied/);
  active="outsider@example.invalid";assert.throws(()=>context.jumiAuthorize_(),/Access denied/);
  active="nana@example.invalid";assert.deepEqual({...context.jumiAuthorize_()},{email:"nana@example.invalid",role:"Owner"});
  assert.throws(()=>context.jumiApi("unknown",{}),/Unsupported action/);
});

test("generated Apps Script UI is self-contained and server mode only",()=>{
  const generated=fs.readFileSync(path.join(__dirname,"Index.html"),"utf8");
  assert.match(generated,/window\.JUMI_SERVER_MODE=true/);
  assert.match(generated,/JUMI_SCOPE/);
  assert.match(generated,/document\.addEventListener\("DOMContentLoaded"/);
  assert.doesNotMatch(generated,/src="(?:config|app)\.js"|href="styles\.css"/);
  assert.match(generated,/noindex,nofollow,noarchive,nosnippet/);
  assert.equal((generated.match(/https:\/\/bamedicale\.com\/assets\/brand\/bamedicale-approved-logo\.jpg/g)||[]).length,3);
  assert.doesNotMatch(generated,/brand-mark/);
  const inline=generated.match(/<script>document\.addEventListener[\s\S]*?<\/script>/)[0].slice(8,-9);
  assert.doesNotThrow(()=>new vm.Script(inline));
  assert.match(inline,/const \$=.*\$\$=/);
});
