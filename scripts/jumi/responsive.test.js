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
test('period trend and mix remain accessible and share a zero-based scale',()=>{
  const source=client.slice(client.indexOf('  function distribution('),client.indexOf('  function dashboardBase('));
  const context={esc:String,fmt:String};vm.createContext(context);vm.runInContext(source,context);
  const bars=context.distribution([{label:'Article',count:2},{label:'eBook',count:1},{label:'Video',count:0}]);
  assert.match(bars,/width:100%/);assert.match(bars,/width:50%/);assert.match(bars,/width:0%/);
  const trend=context.trendPlot({rows:[{period:'2026-08',count:2},{period:'2026-09',count:0}]});
  assert.match(trend,/role="img"/);assert.match(trend,/Publishing trend/);assert.match(trend,/View period values/);
});test('negative operational statuses cannot appear healthy',()=>{
  const source=client.match(/const statusClass=[^\r\n]+/)[0],context={};vm.createContext(context);vm.runInContext(source+'this.classify=statusClass',context);
  for(const state of ['Not Connected','Not Eligible','Not Sent','Attention needed'])assert.equal(context.classify(state),'wait');
  assert.equal(context.classify('Not Attended'),'bad');assert.equal(context.classify('Connected'),'good');
});
