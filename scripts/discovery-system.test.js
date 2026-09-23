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
  assert.match(content, /audience:\s*"Doctors \+ Other HCP"/);
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
  assert.equal((ebooks.match(/data-family="ebook"/g) || []).length, 4);
});

test('video discovery keeps originals and attributed external sources distinct', () => {
  assert.match(app, /record\.sourceRecord\.source === "ba-medicale"/);
  assert.match(app, /BA Medicale Originals/);
  assert.match(app, /Verified public sources/);
  assert.match(app, /originalVideos\.some\(item => item\.id === requestedVideo\)/);
});
