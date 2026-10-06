const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('./core');
const registryApi = require('../../content-registry');
const { items, fromRegistry } = require('./build-knowledge');
const root = path.resolve(__dirname, '../..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context);
const videoData = JSON.parse(fs.readFileSync(path.join(root, 'data/videos.json'), 'utf8')).videos;
const originals = JSON.parse(fs.readFileSync(path.join(root, 'data/original-videos.json'), 'utf8')).videos;
const registry = registryApi.create(context.window.BAMEDICALE_DATA, { videos: videoData, originalVideos: originals });

test('every published discoverable record is in BAMI, including full canonical eBook and presentation text', () => {
  const records = registry.query();
  assert.deepEqual(new Set(items.filter(item => item.family !== 'profile').map(item => item.id)), new Set(records.map(record => record.id)));
  for (const item of items.filter(item => ['ebook', 'presentation'].includes(item.family))) {
    assert.ok(item.content.length > 1000, `${item.id} source text is incomplete`);
  }
  assert.deepEqual(fromRegistry([]), []);
});

test('bilingual queries retrieve the same source without inventing a content gap', () => {
  for (const query of ['kucing', 'ada hal yang berkaitan dengan kucing?', 'jamur dari kucing', 'cat', 'feline', 'anything related to cats?', 'ebook about cats']) {
    assert.ok(core.retrieve(query, items).some(item => /Feline Fungal Zoonoses/.test(item.title)), query);
  }
  for (const query of ['tiroid', 'thyroid', 'thyroid nodule']) assert.ok(core.retrieve(query, items).length, query);
  for (const query of ['kanker payudara', 'breast cancer']) assert.ok(core.retrieve(query, items).some(item => /breast|payudara/i.test(item.title)), query);
  for (const query of ['benjolan tiroid', 'thyroid nodules', 'video tentang tiroid', 'thyroid video', 'ebook kanker', 'cancer ebook', 'seminar kanker', 'cancer seminar']) {
    const results = core.retrieve(query, items);
    assert.ok(results.length, query);
    if (/video/i.test(query)) assert.ok(results.every(item => item.family === 'video'), query);
    if (/ebook/i.test(query)) assert.ok(results.every(item => item.family === 'ebook'), query);
    if (/seminar/i.test(query)) assert.ok(results.every(item => item.family === 'seminar'), query);
  }
  assert.deepEqual(core.retrieve('a wholly invented quantum pancreas topic', items), []);
});

test('each published record is discoverable by its canonical title', () => {
  for (const item of items.filter(item => item.family !== 'profile')) {
    assert.ok(core.retrieve(item.title, items, 8).some(found => found.id === item.id), item.title);
  }
});

test('new publication, update, and removal derive from the registry input without a BAMI-specific record', () => {
  for (const family of ['article', 'ebook', 'video', 'seminar']) {
    const fixture = { id: `fixture-${family}`, family, contentType: family, title: 'Novel clinical learning fixture', summary: 'A published educational source', route: 'library.html', sourceRecord: { sections: [{ heading: 'Novel clinical learning fixture' }] }, authors: [], diseaseGroups: [], topics: ['Novel clinical learning'], primaryAudience: 'PUBLIC' };
    const added = fromRegistry([fixture]);
    assert.equal(added.length, 1);
    assert.ok(core.retrieve('novel clinical learning', added).some(item => item.id === fixture.id));
    assert.equal(fromRegistry([{ ...fixture, title: 'Updated novel learning fixture' }])[0].title, 'Updated novel learning fixture');
    assert.deepEqual(fromRegistry([]), []);
  }
});
