const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('app.js', 'utf8');
const styles = fs.readFileSync('styles.css', 'utf8');
const ebooks = fs.readFileSync('ebooks.html', 'utf8');

test('shared discovery cards use locked hierarchy and contextual actions', () => {
  assert.match(app, /const discoveryCard =/);
  for (const label of ['Read Article', 'Open eBook', 'View Seminar', 'Watch Video', 'Full Read']) assert.match(app, new RegExp(label));
  assert.match(app, /data-library-latest/);
  assert.equal(fs.existsSync('articles.html'), false);
  assert.doesNotMatch(app, /Library & Articles|Latest Articles|All Articles/);
  assert.match(app, /slice\(0, 6\)/);
  assert.match(app, /Math\.ceil\(matchingRecords\.length \/ 18\)/);
});

test('listing thumbnails share a non-distorting crop frame at every grid size', () => {
  assert.match(styles, /\.discovery-card__media\{[^}]*aspect-ratio:16\/9/);
  assert.match(styles, /\.discovery-card__media img\{[^}]*object-fit:cover/);
  assert.match(styles, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media\(max-width:640px\)[\s\S]*\.discovery-grid[^}]*grid-template-columns:1fr/);
});

test('canonical variants and deterministic editorial fallback remain source-safe', () => {
  assert.match(app, /variant = "standard"/);
  assert.match(app, /discovery-card--coming-soon/);
  assert.match(app, /const discoveryArtworkProfile =/);
  assert.match(app, /record\.primaryDiseaseGroup/);
  assert.match(app, /image\.classList\.add\('is-unavailable'\)/);
  assert.doesNotMatch(app, /image\.src = navigationHref\(BRAND\.logo\)/);
  assert.match(styles, /\.discovery-card--feature/);
  assert.match(styles, /\.discovery-card--compact/);
  assert.match(styles, /\.discovery-artwork\[data-artwork-context="oncology"\]/);
});

test('coming-soon resources use contextual artwork and explicit intended audiences', () => {
  const content = fs.readFileSync('content.js', 'utf8');
  assert.match(content, /artworkContext:\s*"diagnosis"/);
  assert.match(content, /audience:\s*"Doctors \+ Healthcare Professionals"/);
  assert.match(app, /resource-card__art discovery-artwork/);
  assert.match(app, /resource-card--coming-soon/);
  assert.match(app, /category\.audience \|\| "All"/);
});

test('search, homepage, audience recents and related learning reuse discovery primitives', () => {
  assert.match(app, /discovery-grid--home-feature/);
  assert.match(app, /discovery-grid--search/);
  assert.match(app, /function enhanceRelatedLearning/);
  assert.match(app, /classList\.add\("discovery-related-card"\)/);
  assert.match(styles, /\.discovery-related-card/);
});

test('eBook listing keeps server-rendered content and gains shared Latest and All sections', () => {
  assert.match(ebooks, /data-content-discovery="ebook"/);
  assert.match(ebooks, /Latest eBooks/);
  assert.match(ebooks, /All eBooks/);
  assert.equal((ebooks.match(/data-family="ebook"/g) || []).length, 6);
});

test('video discovery keeps originals and attributed external sources distinct', () => {
  const originals = JSON.parse(fs.readFileSync('data/original-videos.json', 'utf8')).videos;
  const youtube = JSON.parse(fs.readFileSync('data/videos.json', 'utf8')).videos;
  assert.ok(originals.length >= 1);
  assert.equal(youtube.length, 19);
  assert.ok(originals.every(record => record.source === 'ba-medicale'));
  assert.ok(youtube.every(record => record.source === 'youtube'));
  assert.equal(new Set([...originals, ...youtube].map(record => record.id)).size, originals.length + youtube.length);
  assert.match(app, /record\.sourceRecord\.source === "ba-medicale"/);
  assert.match(app, /record\.sourceRecord\.source === "youtube"/);
  assert.match(app, /Latest Videos/);
  assert.match(app, /BA Medicale Originals/);
  assert.match(app, /Dr\. Bob on YouTube/);
  assert.match(app, /YouTube · Dr\. Bob/);
  assert.match(app, /sourceRecord\.source_label/);
  assert.match(app, /searchParams\.set\("source", values\.source\)/);
  assert.match(app, /requestedRecord\(requestedVideo\)/);
});

test('Latest Videos, mixed Library updates and eBooks use one native accessible coverflow without changing canonical records', () => {
  assert.match(app, /function initLatestCoverflow\(root\)/);
  assert.match(app, /latestCoverflowMarkup\(latest, "video", "Videos"\)/);
  assert.match(app, /latestCoverflowMarkup\(matchingRecords\.slice\(0, 6\), "library", "Library updates"\)/);
  assert.match(app, /latestCoverflowMarkup\(matching\.slice\(0, 6\), "ebook", "eBooks"\)/);
  assert.match(app, /data-latest-coverflow-nav="previous"/);
  assert.match(app, /event\.key === "ArrowLeft"/);
  assert.match(app, /stage\.addEventListener\("pointerdown"/);
  assert.match(app, /const normalizeIndex = index => \(\(index % cards\.length\) \+ cards\.length\) % cards\.length/);
  assert.match(app, /const circularPosition = index =>/);
  assert.match(app, /latestcoverflowopen/);
  assert.doesNotMatch(app, /data-video-coverflow-play|video-coverflow__action/);
  assert.doesNotMatch(app, /cloneNode\(|setInterval\([^)]*coverflow|new Swiper|THREE\.|gsap\./);
  assert.match(styles, /\.video-coverflow__stage\{[^}]*perspective:1700px/);
  assert.match(styles, /\.video-coverflow__card\{[\s\S]*rotateY\(var\(--coverflow-rotate\)\)/);
  assert.match(styles, /\.video-coverflow--article\{[^}]*--coverflow-card-width/);
  assert.match(styles, /\.video-coverflow--ebook\{[^}]*--coverflow-card-width/);
  assert.doesNotMatch(styles, /\.video-coverflow__action/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.video-coverflow__card/);
});
