const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const backend=fs.readFileSync(__dirname+'/backend.js','utf8'),client=fs.readFileSync(__dirname+'/../../jumi/app.js','utf8');
test('Apps Script registers the real mobile viewport after authorization',()=>{
  const calls=[],output={addMetaTag(...args){calls.push(args);return this},setTitle(){return this},setXFrameOptionsMode(){return this}};
  const context={HtmlService:{createHtmlOutputFromFile(){calls.push('private');return output},createHtmlOutput(){return 'denied'},XFrameOptionsMode:{DEFAULT:'default'}}};
  vm.createContext(context);vm.runInContext(backend,context);
  context.jumiAuthorize_=()=>calls.push('authorized');
  assert.equal(context.doGet(),output);assert.equal(calls[0],'authorized');
  assert.deepEqual(calls[2],['viewport','width=device-width, initial-scale=1']);
  calls.length=0;context.jumiAuthorize_=()=>{throw Error('denied')};assert.equal(context.doGet(),'denied');assert.equal(calls.length,0);
});
test('publishing bars encode counts on one shared zero-based scale',()=>{
  const source=client.slice(client.indexOf('  function publishingTrend('),client.indexOf('  function dashboardBase('));
  const context={esc:String,fmt:String,empty:String};vm.createContext(context);vm.runInContext(source,context);
  const html=context.publishingTrend([{period:'2026-08',Article:2,eBook:1,Seminar:1},{period:'2026-09',Article:0,eBook:0,Seminar:0}]);
  assert.match(html,/width:50%/);assert.equal((html.match(/width:25%/g)||[]).length,2);assert.equal((html.match(/width:0%/g)||[]).length,3);
  assert.match(html,/Article: 2 · eBook: 1 · Seminar: 1/);assert.match(html,/shared scale 0–4/);
});
test('negative operational statuses cannot appear healthy',()=>{
  const source=client.match(/const statusClass=[^\r\n]+/)[0],context={};vm.createContext(context);vm.runInContext(source+'this.classify=statusClass',context);
  for(const state of ['Not Connected','Not Eligible','Not Sent','Attention needed'])assert.equal(context.classify(state),'wait');
  assert.equal(context.classify('Not Attended'),'bad');assert.equal(context.classify('Connected'),'good');
});
