const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const motion=source.slice(source.indexOf('function initMotion()'),source.indexOf('function initImmersiveExperience()'));
function run(reading,reduced=false){
 const classes=new Set();let options;
 const item={classList:{add:v=>classes.add(v)},style:{setProperty(){}}};
 const context={HTMLElement:Object,document:{body:{classList:{contains:()=>reading}},documentElement:{classList:{add(){}}},querySelectorAll:selector=>selector.startsWith('.section')?[item]:[]},window:{matchMedia:()=>({matches:reduced}),IntersectionObserver:true},IntersectionObserver:class{constructor(callback,config){options=config;}observe(){}unobserve(){}}};
 vm.runInNewContext(motion+';initMotion()',context);return {classes,options};
}
test('reading/discovery pages remain visible without intersection callbacks',()=>{const r=run(true);assert(r.classes.has('is-visible'));assert(!r.classes.has('reveal'));assert.equal(r.options,undefined);});
test('large non-reading sections never require a percentage of their total height',()=>{assert.equal(run(false).options.threshold,0);});
test('reduced motion keeps all content visible',()=>{assert(run(false,true).classes.has('is-visible'));});
