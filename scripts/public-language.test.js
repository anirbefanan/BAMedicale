const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const registry = require('../content-registry');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('public audience terminology and order have one shared source', () => {
  assert.deepEqual(registry.AUDIENCES, ['DOCTOR', 'HEALTHCARE WORKER', 'PUBLIC']);
  assert.equal(registry.publicAudienceLabel('DOCTOR'), 'Doctors');
  assert.equal(registry.publicAudienceLabel('Other HCP'), 'Healthcare Professionals');
  assert.equal(registry.publicAudienceLabel('HEALTHCARE WORKERS'), 'Healthcare Professionals');
  assert.equal(registry.publicAudienceLabel('PUBLIC'), 'Public');
  assert.equal(registry.publicAudienceList(['PUBLIC', 'DOCTOR', 'HEALTHCARE WORKER']), 'All');
  assert.equal(registry.publicAudienceList(['PUBLIC', 'HEALTHCARE WORKER']), 'Healthcare Professionals + Public');
});

test('public renderers contain no legacy audience display terms', () => {
  const files = [
    'app.js', 'content.js', 'index.html', 'about.html', 'team.html',
    'healthcare-workers.html', 'library.html', 'scripts/ebook-template.js',
    'scripts/build-articles.js', 'scripts/event-template.js', 'scripts/presentation-template.js'
  ];
  const legacy = /Other HCP|\bHCP\b|\bHCW\b|For Healthcare Workers?|Healthcare Workers? (?:collection|content|education|learning|topic)|Health Workers?/i;
  for (const file of files) assert.doesNotMatch(read(file), legacy, `${file} contains a legacy public audience term`);
});

test('canonical audience hierarchy is preserved in shared public views', () => {
  const app = read('app.js');
  const about = read('about.html');
  const pathwayBlock = app.slice(app.indexOf('const pathwayDefinitions = ['), app.indexOf('];', app.indexOf('const pathwayDefinitions = [')));
  const appOrder = [pathwayBlock.indexOf('audience: "DOCTOR"'), pathwayBlock.indexOf('audience: "HEALTHCARE WORKER"'), pathwayBlock.indexOf('audience: "PUBLIC"')];
  const aboutOrder = [about.indexOf('<span>01</span><h3>Doctors</h3>'), about.indexOf('<span>02</span><h3>Healthcare Professionals</h3>'), about.indexOf('<span>03</span><h3>Public</h3>')];
  assert.ok(appOrder.every(value => value >= 0) && appOrder[0] < appOrder[1] && appOrder[1] < appOrder[2]);
  assert.ok(aboutOrder.every(value => value >= 0) && aboutOrder[0] < aboutOrder[1] && aboutOrder[1] < aboutOrder[2]);
  assert.match(app, /All events[\s\S]*Doctors[\s\S]*Healthcare Professionals[\s\S]*Public/);
});

test('authoritative professional names remain complete and wrapping-safe', () => {
  const content = read('content.js');
  const event = read('events/management-thyroid-nodules-2026.html');
  const styles = read('styles.css');
  const names = [
    'Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)',
    'dr. Achmad Fachri, Sp.Rad(K)',
    'Dr. Vinesia Lestari Riddi, SpPA, MPH',
    'dr. Adlina Karisyah, SpB.'
  ];
  for (const name of names) {
    assert.match(content, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(event, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(styles, /\.team-card__copy h3[\s\S]*overflow-wrap:break-word[\s\S]*-webkit-line-clamp:unset/);
  assert.doesNotMatch(styles, /\.team-card__copy h3\{[^}]*text-overflow:ellipsis/);
});

test('legacy doctor-name variants normalize only at the public display layer', () => {
  const canonical = 'Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)';
  assert.equal(registry.publicProfessionalText('Talk with dr. Bob Andinata, Sp.B.Subsp.Onk (K)'), `Talk with ${canonical}`);
  assert.equal(registry.publicProfessionalText('Talk with dr. Bob Andinata, Sp.B (K) Onk'), `Talk with ${canonical}`);
  assert.equal(registry.publicProfessionalText('Talk with dr. Bob Andinata, SpB(K)Onk'), `Talk with ${canonical}`);
  const sourceCatalog = read('data/videos.json');
  assert.match(sourceCatalog, /dr\. Bob Andinata, Sp\.B\.Subsp\.Onk \(K\)/);
});

test('source-locked scientific attribution is retained separately from public professional display names', () => {
  const content = read('content.js');
  assert.match(content, /authorsText: "Bob Andinata¹, Dewi Iriani², Adlina Karisyah¹"/);
  assert.match(content, /name: "Dr\. dr\. Bob Andinata, Sp\.B\., Subsp\. Onk\(K\)"/);
  assert.match(content, /name: "dr\. Adlina Karisyah, SpB\."/);
});

test('metadata-grounded default copy uses the intended audience voice', () => {
  assert.match(registry.defaultEditorialDescription({ primaryAudience: 'DOCTOR', contentType: 'Article', primaryTopic: 'Thyroid nodules' }), /clinical reasoning/);
  assert.match(registry.defaultEditorialDescription({ primaryAudience: 'HEALTHCARE WORKER', contentType: 'Video', primaryTopic: 'Pathology' }), /multidisciplinary care/);
  assert.match(registry.defaultEditorialDescription({ primaryAudience: 'PUBLIC', contentType: 'eBook', primaryTopic: 'High blood pressure' }), /informed discussions with Healthcare Professionals/);
});
