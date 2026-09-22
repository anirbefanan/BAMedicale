const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const client=fs.readFileSync(path.join(root,'jumi/app.js'),'utf8');
const shell=fs.readFileSync(path.join(root,'jumi/index.html'),'utf8');

test('Create Content has one canonical action per relevant view',()=>{
  assert.match(shell,/id="global-create-content"/);
  assert.match(client,/global-create-content"\)\.hidden=state\.view!=="Dashboard"/);
  assert.match(client,/state\.contentSection==="Seminars"\?"":`<button[^>]+data-action="new-content"/);
  const list=client.slice(client.indexOf('function contentList'),client.indexOf('function presentationState'));
  assert.doesNotMatch(list,/data-action="new-content"/);
});

test('Seminar workspace sections have one canonical tab location',()=>{
  assert.match(client,/function seminarRecords/);
  assert.match(client,/function seminarPipeline/);
  assert.match(client,/function seminarTools/);
  const workspace=client.slice(client.indexOf('function seminarWorkspace'),client.indexOf('function contentView'));
  assert.doesNotMatch(workspace,/Overview[^;]+eventsView/);
  assert.match(workspace,/Event Tools"\)body=seminarTools\(scoped\)\+presentationWorkspace/);
});

test('obsolete controls and handlers are absent',()=>{
  for(const stale of ['Bulk actions','select-filtered','data-select-id','notification-channel','Send — Provider Not Connected'])assert.doesNotMatch(client,new RegExp(stale));
  assert.equal((client.match(/data-refresh/g)||[]).length,0);
});

test('published content and presentations expose only useful actions',()=>{
  assert.match(client,/function contentActions[\s\S]+item\.status==="Published"[\s\S]+View published[\s\S]+data-content/);
  assert.match(client,/function presentationActions[\s\S]+item\.status==="Published"[\s\S]+Update \/ Replace[\s\S]+View published/);
  assert.match(client,/certificateState==="Approved"&&integration\("email"\)==="Connected"/);
  assert.match(client,/Provider Not Connected/);
});
