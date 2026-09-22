const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {validateManifest}=require('./apply-publication.js');

const root=path.resolve(__dirname,'../..');
const backend=fs.readFileSync(path.join(__dirname,'backend.js'),'utf8');
const client=fs.readFileSync(path.join(root,'jumi/app.js'),'utf8');
const context={console};
vm.createContext(context);
vm.runInContext(backend,context);

const freeOnline={format:'Online',commercial:'Free',platform:'Google Meet',meetingUrl:'https://meet.google.com/example',address:'',price:'',paymentInstructions:'',capacity:'250'};
const paidOffline={format:'Offline',commercial:'Paid',platform:'BA Medicale Learning Center',meetingUrl:'',address:'Jakarta, Indonesia',price:'250000',paymentInstructions:'Private payment workflow reference',capacity:'100'};

test('Seminar input rejects contradictory Online/Offline and Free/Paid states',()=>{
  assert.deepEqual({...context.jumiSeminarInput_(freeOnline)},{format:'Online',commercial:'Free',platform:'Google Meet',meetingUrl:'https://meet.google.com/example',address:'',paymentRef:'',price:0,capacity:250});
  assert.deepEqual({...context.jumiSeminarInput_(paidOffline)},{format:'Offline',commercial:'Paid',platform:'BA Medicale Learning Center',meetingUrl:'',address:'Jakarta, Indonesia',paymentRef:'Private payment workflow reference',price:250000,capacity:100});
  assert.throws(()=>context.jumiSeminarInput_({...freeOnline,platform:''}),/approved platform/);
  assert.throws(()=>context.jumiSeminarInput_({...freeOnline,address:'Jakarta'}),/must not include an offline address/);
  assert.throws(()=>context.jumiSeminarInput_({...paidOffline,meetingUrl:'https:\/\/example.test'}),/must not include a meeting URL/);
  assert.throws(()=>context.jumiSeminarInput_({...paidOffline,price:0}),/positive price/);
  assert.throws(()=>context.jumiSeminarInput_({...freeOnline,price:1}),/Free Seminars must not include/);
});

test('Seminar source intake accepts only bounded PDF/DOC/DOCX signatures and extracts reviewable evidence',()=>{
  const blob=(mime,bytes)=>({getContentType:()=>mime,getBytes:()=>Array.from(bytes)});
  assert.equal(context.jumiSeminarSourceValid_(blob('application/pdf',Buffer.from('%PDF-1.7 source'))),true);
  assert.equal(context.jumiSeminarSourceValid_(blob('application/msword',Buffer.from([208,207,17,224,1,2,3,4,5]))),true);
  assert.equal(context.jumiSeminarSourceValid_(blob('application/vnd.openxmlformats-officedocument.wordprocessingml.document',Buffer.from([80,75,3,4,1,2,3,4,5]))),true);
  assert.equal(context.jumiSeminarSourceValid_(blob('application/pdf',Buffer.from('not-pdf'))),false);
  context.Utilities={formatDate:()=> '2026-11-10'};
  const evidence=context.jumiSeminarEvidence_('Thyroid Imaging Seminar\n10 November 2026\n09:00 - 11:00\nOnline via Zoom\nFree for doctors\ndr. Evidence, Sp.Rad | Speaker | TIRADS\nSource-supported seminar description for participating doctors.','source.pdf');
  assert.equal(evidence.title,'Thyroid Imaging Seminar');assert.equal(evidence.format,'Online');assert.equal(evidence.platform,'Zoom');assert.equal(evidence.commercial,'Free');assert.equal(evidence.startTime,'09:00');assert.equal(evidence.status,'Extracted — Review Required');
});

test('Seminar schedules are normalized to Asia/Jakarta and registration windows are ordered',()=>{
  assert.deepEqual({...context.jumiSeminarSchedule_({date:'2026-10-20',startTime:'09:00',endTime:'11:00',registrationOpen:'2026-09-20T09:00',registrationClose:'2026-10-20T08:00'})},{start:'2026-10-20T09:00:00+07:00',end:'2026-10-20T11:00:00+07:00',open:'2026-09-20T09:00:00+07:00',close:'2026-10-20T08:00:00+07:00'});
  assert.throws(()=>context.jumiSeminarSchedule_({date:'2026-10-20',startTime:'09:00',endTime:'08:00'}),/End time/);
  assert.throws(()=>context.jumiSeminarSchedule_({date:'2026-10-20',startTime:'09:00',endTime:'11:00',registrationOpen:'2026-09-20T09:00'}),/both registration/);
  assert.throws(()=>context.jumiSeminarSchedule_({date:'2026-10-20',startTime:'09:00',endTime:'11:00',registrationOpen:'2026-09-20T09:00',registrationClose:'2026-10-20T10:00'}),/close no later/);
});

test('Seminar validation gates require canonical registration, coherent commerce, location, and speakers',()=>{
  const publication={eventId:'fixture-seminar',startDate:'2026-10-20T09:00:00+07:00',endDate:'2026-10-20T11:00:00+07:00',registrationOpen:'2026-09-20T09:00:00+07:00',registrationClose:'2026-10-20T08:00:00+07:00',format:'Live webinar',attendanceMode:'Online',platform:'Google Meet',venue:'',address:'',commercial:'Free',price:0,currency:'IDR',isAccessibleForFree:true,registration:'registration.example.test/fixture',primaryAudience:'Doctors',primaryDiseaseGroup:'endocrine-metabolic',faculty:[['Speaker','Source-supported doctor']],sessions:[['Source-supported topic','Source-supported doctor','source-supported-doctor']]};
  const record={type:'Seminar',title:'Fixture Seminar',slug:'fixture-seminar',artworkStored:true,typeData:{artwork:{valid:true},publication}};
  assert.deepEqual([...context.jumiContentIssues_(record)],[]);
  assert.match(context.jumiContentIssues_({...record,typeData:{...record.typeData,publication:{...publication,registration:''}}}).join(' '),/Permanent registration URL/);
  assert.match(context.jumiContentIssues_({...record,typeData:{...record.typeData,publication:{...publication,commercial:'Paid',isAccessibleForFree:false,price:0}}}).join(' '),/Paid Seminar price/);
  assert.match(context.jumiContentIssues_({...record,typeData:{...record.typeData,publication:{...publication,attendanceMode:'Offline',platform:'',venue:'',address:''}}}).join(' '),/venue and address/);
});

test('Seminar public contract excludes private meeting, payment, participant, and Drive data',()=>{
  assert.match(backend,/Stored payment evidence is required before verification/);
  assert.match(backend,/MARK_PAID/);
  assert.match(backend,/jumiAudit_\(ss,admin,'MARK_PAID'/);
  const allowlist=backend.match(/const allowed=\[([^\]]+)\]/)?.[1]||'';
  assert.doesNotMatch(allowlist,/meetingUrl|paymentInstructions|Proof File|Registrant|Drive/);
  assert.match(allowlist,/registrationOpen/);
  assert.match(allowlist,/commercial/);
  assert.match(allowlist,/currency/);
});

test('paid Offline Seminar contract validates as a non-public fixture and rejects private fields',t=>{
  const fixtureRoot=fs.mkdtempSync(path.join(os.tmpdir(),'jumi-seminar-bau-'));t.after(()=>fs.rmSync(fixtureRoot,{recursive:true,force:true}));
  const slug='qa-paid-offline-seminar',asset=`assets/events/${slug}/poster.jpg`,bytes=Buffer.from('approved A4 portrait fixture');
  fs.mkdirSync(path.dirname(path.join(fixtureRoot,asset)),{recursive:true});fs.writeFileSync(path.join(fixtureRoot,asset),bytes);
  const publication={eventId:slug,primaryAudience:'Doctors',primaryDiseaseGroup:'endocrine-metabolic',topics:['Thyroid'],publishedDate:'2026-09-21',format:'In-person seminar',startDate:'2026-10-20T09:00:00+07:00',endDate:'2026-10-20T11:00:00+07:00',registrationOpen:'2026-09-20T09:00:00+07:00',registrationClose:'2026-10-20T08:00:00+07:00',date:'20 October 2026',time:'09.00–11.00 WIB',location:'BA Medicale Learning Center, Jakarta, Indonesia',attendanceMode:'Offline',platform:'',venue:'BA Medicale Learning Center',address:'Jakarta, Indonesia',commercial:'Paid',price:250000,currency:'IDR',isAccessibleForFree:false,maximumAttendeeCapacity:100,registration:'registration.example.test/qa-paid-offline',faculty:[['Speaker','Source-supported doctor']],sessions:[['Source-supported topic','Source-supported doctor','source-supported-doctor']],summary:'Source-supported fixture summary.',artworkAspectRatio:'1 / 1.4142',artworkWidth:707,artworkHeight:1000};
  const manifest={schemaVersion:1,contentId:'content_1234567890abcdef',contentType:'Seminar',slug,version:1,baseSha:'1'.repeat(40),requestedAt:'2026-09-21T10:00:00+07:00',metadata:{title:'Non-public paid offline fixture',subtitle:'Source-supported fixture',tags:['Thyroid'],quickSummary:'Source-supported fixture summary.',publication},assets:{source:null,artwork:{path:asset,mimeType:'image/jpeg',extension:'jpg',sha256:crypto.createHash('sha256').update(bytes).digest('hex')}}};
  assert.doesNotThrow(()=>validateManifest(manifest,fixtureRoot,{requirePrepared:false}));
  manifest.metadata.publication.meetingUrl='https://private.example.test';
  assert.throws(()=>validateManifest(manifest,fixtureRoot,{requirePrepared:false}),/Unsupported Seminar publication field/);
});

test('Seminar UI exposes deterministic fields, private preview facts, and optional presentations',()=>{
  for(const value of ['Registration Open','Registration Close','Meeting/Event URL','Full Address','Payment instructions reference','A4 portrait','Public registration host/path'])assert.match(client,new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(client,/Registration URL \/ QR/);
  assert.match(client,/Google Calendar and \.ics ready/);
  assert.match(client,/Presentations are optional, independent publications/);
  assert.match(client,/One missing deck never blocks the Seminar/);
  assert.match(client,/data-new-presentation/);
  assert.match(client,/input\.disabled=!active/);
  assert.match(client,/element=>element\.name&&!element\.disabled/);
  assert.match(client,/Seminar source PDF or Word document/);
  assert.match(client,/data-analyze-seminar/);
  assert.match(client,/Analyze → Review\/Edit → Save Draft → Preview → Publish/);
  assert.match(client,/data\.saveDraft=true/);
  assert.match(client,/button\.formNoValidate=true/);
});

test('canonical Seminar renderer remains locked and displays new commercial data without exposing private meeting URLs',()=>{
  const render=require('../event-template.js');
  const event={id:'fixture-seminar',slug:'fixture-seminar',detailUrl:'events/fixture-seminar.html',title:'Fixture Seminar',subtitle:'Source-supported theme',summary:'Source-supported summary.',format:'Live webinar',primaryAudience:'DOCTOR',primaryDiseaseGroup:'endocrine-metabolic',diseaseCondition:'Thyroid',topics:['Thyroid'],date:'20 October 2026',time:'09.00–11.00 WIB',startDate:'2026-10-20T09:00:00+07:00',endDate:'2026-10-20T11:00:00+07:00',location:'Google Meet',attendanceMode:'Online',commercial:'Paid',price:250000,currency:'IDR',isAccessibleForFree:false,registration:'registration.example.test/fixture',calendarIcs:'assets/events/fixture-seminar/fixture-seminar.ics',registrationQrSvg:'assets/events/fixture-seminar/registration-qr.svg',artwork:'assets/events/fixture-seminar/poster.jpg',artworkWidth:707,artworkHeight:1000,artworkAspectRatio:'1 / 1.4142',organizer:'BA Medicale',host:'',audience:['Doctors'],faculty:[['Speaker','Source-supported doctor']],sessions:[['Source-supported topic','Source-supported doctor','source-supported-doctor']],outcomes:[],quota:'Limited to 100 participants.',contact:'',publishedDate:'2026-09-21',promotion:{hook:'Fixture Seminar',teaser:['Source-supported summary.'],cta:'View seminar details at BAMedicale.com',hashtags:['#BAMedicaleCom']}};
  const html=render({event,index:0,seminars:[event],diseaseGroup:{name:'Endocrine and metabolic'},relatedContent:[],presentations:[],domain:'https://bamedicale.com'});
  assert.match(html,/Registration<\/dt><dd>Rp\s?250\.000/);
  assert.match(html,/registration\.example\.test\/fixture/);
  assert.doesNotMatch(html,/meet\.google\.com|payment instructions|Drive|registrant/i);
  assert.match(html,/bamedicale-approved-logo\.jpg/);
});

test('responsive Seminar safeguards remain present at desktop, tablet, and mobile layouts',()=>{
  const css=fs.readFileSync(path.join(root,'jumi/styles.css'),'utf8');
  assert.match(css,/\.event-row\{grid-template-columns:minmax\(0,1fr\) auto\}/);
  assert.match(css,/@media\(max-width:820px\)/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(css,/overflow-wrap:break-word;word-break:normal/);
});

test('19 Sep Seminar, attendance, quizzes, presentation, lifecycle hooks, and Control Tower stay connected',()=>{
  const content=fs.readFileSync(path.join(root,'content.js'),'utf8');
  const eventPage=fs.readFileSync(path.join(root,'events/management-thyroid-nodules-2026.html'),'utf8');
  const attendance=JSON.parse(fs.readFileSync(path.join(root,'attendance/config.json'),'utf8'));
  const quiz=JSON.parse(fs.readFileSync(path.join(root,'quiz/config.json'),'utf8'));
  assert.match(content,/Management of Thyroid Nodules — How to Make a Good Diagnosis\?/);
  assert.match(content,/current-diagnostic-approach-and-therapy-selection-for-thyroid-nodules/);
  assert.ok(attendance.events.includes('management-thyroid-nodules-2026'));
  assert.ok(quiz.events.includes('management-thyroid-nodules-2026'));
  assert.match(eventPage,/BA Medicale Seminar Attendance/);
  assert.match(eventPage,/LMS Seminar Attendance/);
  assert.match(eventPage,/BA Medicale Live Quiz/);
  assert.match(eventPage,/LMS Live Quiz/);
  assert.match(eventPage,/Read presentation/);
  assert.match(backend,/type==='H-1 Day'.*start-24\*3600000/);
  assert.match(backend,/type==='H-1 Hour'.*start-3600000/);
  assert.match(client,/Attendance validation → eligibility → review → generate → approve → send/);
  assert.match(client,/BA Medicale participation certificates remain separate from official SKP\/LMS certificates/);
  assert.match(client,/Seminar Operations/);
  assert.match(backend,/traffic-summary\.json/);
});
