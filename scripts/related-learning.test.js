const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const registryApi = require('../content-registry');
const { renderCard, safeCover } = require('./related-learning');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context);
const videos = JSON.parse(fs.readFileSync(path.join(root, 'data/videos.json'), 'utf8')).videos;
const originals = JSON.parse(fs.readFileSync(path.join(root, 'data/original-videos.json'), 'utf8')).videos;
const records = registryApi.create(context.window.BAMEDICALE_DATA, { videos, originalVideos: originals }).query();

test('published related cards use canonical media and routes for every supported content family', () => {
  for (const family of ['article', 'ebook', 'video', 'seminar', 'presentation']) {
    const record = records.find(item => item.family === family);
    assert.ok(record, family);
    const html = renderCard(record);
    assert.ok(html.includes(`href="/${record.route.replace(/&/g, '&amp;')}"`), family);
    assert.ok(html.includes(`src="${record.cover.replace(/&/g, '&amp;').replace(/^assets\//, '/assets/')}"`), family);
    assert.ok(html.includes(record.title.replace(/&/g, '&amp;')), family);
    if (!/^https:/.test(record.cover)) assert.ok(fs.existsSync(path.join(root, record.cover)), record.cover);
  }
});

test('missing or untrusted media receives a deliberate fallback', () => {
  assert.equal(safeCover('javascript:alert(1)'), '');
  assert.match(renderCard({ family: 'video', contentType: 'Video', route: 'videos.html?video=future', title: 'Future video' }), /seo-related-card__fallback/);
});

test('every current published record has a renderable canonical media source', () => {
  for (const record of records) {
    const cover = safeCover(record.cover);
    assert.ok(cover, `${record.id} has no safe canonical media`);
    if (cover.startsWith('/')) assert.ok(fs.existsSync(path.join(root, cover)), `${record.id} media is missing`);
    assert.match(renderCard(record), /seo-related-card__media/);
  }
});
