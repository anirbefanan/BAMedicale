const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"../.."),read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("clasp is repository-managed but authentication and binding remain local",()=>{
  const pkg=JSON.parse(read("package.json")),ignore=read(".gitignore"),claspIgnore=read(".claspignore");
  assert.match(pkg.devDependencies["@google/clasp"],/^\^/);
  assert.equal(pkg.scripts["jumi:deploy"],"npm run jumi:check && node scripts/jumi/deploy.js");
  assert.match(ignore,/^\.clasp\.json$/m);assert.match(ignore,/^\.clasprc\.json$/m);
  for(const file of["Code.gs","Index.html","appsscript.json"])assert.match(claspIgnore,new RegExp(`^!${file.replace(".","\\.")}$`,"m"));
  assert.doesNotMatch(claspIgnore,/backend\.js|\.test\.js|deploy\.js/);
});

test("deployment wrapper fails closed and updates only the existing production deployment",()=>{
  const source=read("scripts/jumi/deploy.js");
  assert.match(source,/Missing local \.clasp\.json/);
  assert.match(source,/rootDir scripts\/jumi/);
  assert.match(source,/allowed=\["Code\.gs","Index\.html","appsscript\.json"\]/);
  assert.match(source,/path\.join\(root,"jumi","config\.js"\)/);
  assert.match(source,/The local clasp project is not bound to the existing production JUMI deployment/);
  assert.match(source,/require\.resolve\("@google\/clasp"\)/);
  assert.match(source,/execFileSync\(process\.execPath,\[claspCli,\.\.\.args\]/);
  assert.doesNotMatch(source,/clasp\.cmd|node_modules","\.bin/);
  assert.match(source,/process\.argv\.includes\("--verify-only"\)/);
  assert.match(source,/if\(verifyOnly\).*process\.exit\(0\)/);
  assert.match(source,/\["push","--force"\]/);
  assert.match(source,/"--deploymentId",endpoint/);
  assert.doesNotMatch(source,/create-script|ScriptProperties|JUMI_GITHUB_TOKEN|JUMI_CONTENT_ROOT_FOLDER_ID/);
});
