# BA Medicale digital editions

`content.js` → `ebooks` is the canonical catalog. The shared registry supplies routes and the approved default cover. `scripts/ebook-template.js` generates the shelf and dedicated readers through `npm run content:build`; `npm run content:check` checks all generated routes. Run `node --test scripts/ebook.test.js` for batching, page pairing and text-search behavior.

The five current records are explicitly `demo: true`, `publicationStatus: coming-soon`, not purchasable and not indexed. Their dates are demonstration catalog dates. Preview pages are neutral UI samples, not medical content. Keep these entries out of published content counts and the sitemap.

Future records retain id, slug, title, publishedDate, publicationStatus, state, cover, author, description, sourcePdf, pages, primaryAudience, topics, downloadable, access and commerceStatus. An approved cover overrides the default. `pages` supports `{ title, text, image }` in reading order after the cover; `text` is also the search/OCR index and accessible representation. Use verified source text, never generated medical substitutes. The same model supplies magazine, thumbnails, search and accessible reading. Images are contained without cropping. The shelf mounts at most 25 records at a time.

Like and Favorite are local browser preferences keyed by immutable book ID; no global counts. No medical or search inputs are persisted or sent to analytics. Existing shared GA4 initializes once and tracks the reader with the existing ebook_open event.

`access` and `commerceStatus` are metadata, not access controls. Before publishing member-only or paid content, add an authorized backend that checks entitlement and supplies protected content. Never put restricted PDF/page payloads in public Git or treat this static reader as a paywall. No authentication, payment or fulfillment is implemented here.

The old query-based detail route forwards known catalog slugs to their canonical readers and offers the catalog for retired slugs. Preview readers remain noindex; real release metadata and indexing require the normal source-verified publishing workflow.
