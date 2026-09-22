const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const backend=fs.readFileSync(path.join(__dirname,'backend.js'),'utf8');
const client=fs.readFileSync(path.join(root,'jumi/app.js'),'utf8');
const styles=fs.readFileSync(path.join(root,'jumi/styles.css'),'utf8');
const publisher=fs.readFileSync(path.join(__dirname,'apply-publication.js'),'utf8');

test('Create Content is source-first for all four BAU types',()=>{
  assert.match(client,/function sourceFirstForm\(type\)/);
  for(const label of ['Article','eBook','Seminar','Video'])assert.match(client,new RegExp(`data-create-type="${label}"`));
  assert.match(client,/data-bau-source required/);
  assert.match(client,/data-bau-artwork required/);
  assert.match(client,/data-bau-publish/);
  assert.match(client,/Upload the approved source/);
  const intake=client.slice(client.indexOf('function sourceFirstForm'),client.indexOf('function contentForm'));
  assert.doesNotMatch(intake,/(?:slug|schema|GitHub|renderer)/i);
});

test('Audience uses only the locked multi-select taxonomy',()=>{
  const context={console};vm.createContext(context);vm.runInContext(backend,context);
  assert.deepEqual([...vm.runInContext('JUMI_BAU_AUDIENCES',context)],['Doctors','Other HCP','Public','All']);
  assert.deepEqual([...context.jumiBauAudienceSelection_(['Doctors','Other HCP'],'').audiences],['Doctors','Other HCP']);
  assert.deepEqual([...context.jumiBauAudienceSelection_([],'Healthcare Professionals').audiences],['Other HCP']);
  assert.equal(context.jumiBauAudienceSelection_([], '').status,'Needs Review');
  assert.throws(()=>context.jumiBauAudienceSelection_(['All','Public'],''),/All cannot be combined/);
  assert.match(client,/\["Doctors","Other HCP","Public","All"\]/);
});

test('one authorized action preserves every controlled publication gate',()=>{
  assert.match(backend,/function jumiAutoPublishContent_/);
  assert.match(backend,/jumiApplyBauAudience_.*jumiValidateContent_.*jumiPreviewVideo_.*jumiRecordContentPreview_.*jumiPublishContent_/s);
  assert.match(backend,/BAU_AUTOMATION/);
  assert.match(backend,/needsReview:true,issues:validation\.issues/);
  assert.match(client,/auto_publish_content/);
  assert.match(client,/auto_publish_seminar/);
  assert.match(client,/Publication queued/);
});

test('exceptions remain precise and private sources retain provenance',()=>{
  assert.match(client,/One decision is required/);
  assert.match(client,/draft and private source are safe/i);
  assert.match(backend,/originalName:String\(data\.fileName/);
  assert.match(backend,/getSharingAccess\(\)===DriveApp\.Access\.PRIVATE/);
  assert.doesNotMatch(client,/JUMI_GITHUB_TOKEN|api\.github\.com|drive\.google\.com/);
});

test('responsive intake retains mobile touch targets and one-column forms',()=>{
  assert.match(styles,/\.audience-picker label span\{[^}]*min-height:44px/);
  assert.match(styles,/@media\(max-width:520px\)[\s\S]*\.form-grid[^}]*grid-template-columns:1fr/);
  assert.match(styles,/\.dialog-actions[^}]*flex-wrap:wrap/);
});

test('public adapters map editorial labels into the established public taxonomy',()=>{
  assert.match(publisher,/"Other HCP":"HEALTHCARE WORKER"/);
  assert.match(publisher,/All:"PUBLIC"/);
  assert.match(publisher,/d\.primaryAudience==="All"\?\["DOCTOR","HEALTHCARE WORKER"\]/);
});
