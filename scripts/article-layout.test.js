const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), context);
const records = context.window.BAMEDICALE_DATA;
const escape = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

test("generated publications match their canonical templates", () => {
  execFileSync(process.execPath, [path.join(__dirname, "build-articles.js"), "--check"], { cwd: root });
});

for (const article of Object.values(records.articles)) {
  test(`${article.slug}: media-first layout preserves source content and metadata`, () => {
    const html = fs.readFileSync(path.join(root, "articles", `${article.slug}.html`), "utf8");
    const markers = [
      'class="seo-article-artwork"', 'class="article-page-badges"',
      `<h1>${escape(article.title)}</h1>`, `<p>${escape(article.dek)}</p>`,
      'class="article-byline"', 'class="article-source-meta"',
      'class="seo-article-body"', 'class="article-page-tools"'
    ];
    let previous = -1;
    for (const marker of markers) {
      const position = html.indexOf(marker);
      assert.ok(position > previous, `${marker} must follow the preceding publication element`);
      previous = position;
    }
    assert.ok(html.includes(`<span>${escape(article.primaryTopic)}</span>`));
    assert.ok(html.includes(`src="../${article.cover.replace(/^\//, "")}"`));
    assert.ok(fs.existsSync(path.join(root, article.cover.replace(/^\//, ""))));
    for (const text of [...(article.intro || []), ...(article.paper?.abstract || []), ...(article.takeaways || []), ...article.references]) assert.ok(html.includes(escape(text)), `Missing source text: ${text}`);
    for (const section of article.sections) {
      const comparisonText = section.compare?.length ? [...section.compare[0].slice(1), ...section.compare.slice(1).flat()] : [];
      const figureCaptions = (section.figures || []).map((figure) => figure.caption);
      const subsectionText = (section.subsections || []).flatMap((subsection) => [subsection.title, ...(subsection.body || [])]);
      for (const text of [section.title, ...(section.body || []), ...(section.bullets || []), ...comparisonText, ...figureCaptions, ...subsectionText]) {
        assert.ok(html.includes(escape(text)), `Missing section content: ${text}`);
      }
    }
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const schema = schemas.find(item => item["@type"] === "Article");
    assert.equal(schema.headline, article.title);
    const expectedAuthors = article.authors || [article.author];
    const schemaAuthors = Array.isArray(schema.author) ? schema.author : [schema.author];
    assert.equal(schemaAuthors.map((author) => author.name).join("|"), expectedAuthors.map((author) => author.name).join("|"));
    if (article.publishedDate) assert.equal(schema.datePublished, article.publishedDate);
    else assert.equal(schema.datePublished, undefined);
    assert.equal(schema.mainEntityOfPage, `https://bamedicale.com/articles/${article.slug}.html`);
  });
}

test("shared reading style reserves landscape media without cropping", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(css, /\.seo-article-hero\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.seo-article-hero>\.seo-article-artwork\{[^}]*aspect-ratio:16\/9/);
  assert.match(css, /\.seo-article-artwork img\{[^}]*object-fit:contain/);
  assert.match(css, /--reading-surface:\s*rgba\(255,253,249,\.84\)/);
});
