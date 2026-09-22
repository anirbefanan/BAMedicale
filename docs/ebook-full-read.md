# Canonical eBook web edition

`scripts/jumi/prepare-ebook.js` retains the approved PDF and original Magazine
page rendering. It then invokes `scripts/ebook-full-read.py` with pinned
pdfplumber/Pillow dependencies in the existing controlled publisher workflow.
There are no new JUMI inputs or Apps Script services.

The preparation produces `full-read.json` and source-rendered region PNGs beside
`pages.json`. Layout geometry and actual font evidence determine reading order,
headings and paragraphs. Source figures retain their surrounding captions.
Rectangular tables with supported glyphs become semantic tables. Ambiguous
tables/glyphs remain exact source-rendered regions, with enlargement and original
PDF links. Scanned/vector-heavy pages remain faithful source representations;
the pipeline never invents OCR, chapters, medical wording or diagrams.

Every non-whitespace source character must be covered by a text segment or a
source region. An uncovered character blocks preparation. The renderer verifies
the original PDF SHA-256, page count and every region-image SHA-256. These checks
run before the existing guarded publication and production reconciliation.

`scripts/ebook-full-read.js` is the single HTML renderer. The existing eBook
template supplies the cover, metadata, approved summary and reader shell. Full
Read is the default continuous edition; Magazine, search and thumbnails continue
to use unchanged original-PDF page numbering. Captions and references remain
source content. New images load lazily with reserved dimensions.

The public shelf derives from `BA_EBOOKS.published`: published, non-demo records,
ordered by publication date, sort order and stable identity. It displays exactly
18 items per page, with `?page=N` state and browser history support. Coming Soon
records retain their compatibility URLs but are not advertised as published.

Validation: `npm run content:check`, `npm run jumi:check`, source coverage during
preparation, and focused rendered-reader/pagination checks. Original PDFs,
approved covers, Magazine page images and `Material/` must remain unchanged.
