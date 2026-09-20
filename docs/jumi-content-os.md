# JUMI Content OS architecture

JUMI extends the production seminar CRM; it does not replace it. Seminar records remain in `JUMI Events`, so Event Scope, registrations, payments, attendance, notifications, certificates, community, and reports keep their current data paths. Article and eBook records use the additive `JUMI Content` tab.

## Canonical content record

`JUMI Content` stores shared fields for identity, type, title, subtitle, slug, lifecycle state, private Drive file IDs, validation/preview state, public URL, authorship timestamps, publication timestamp, and version. Type-specific source metadata is stored as inspectable JSON rather than flattening unrelated Article and eBook fields into the event schema.

The controlled lifecycle is:

`Draft → Generated → Validation Required or Ready for Preview → Ready to Publish → Published or Failed`

Validation requires source-supported metadata and private source/media references. JUMI does not infer missing authors, dates, publishers, sources, credentials, references, identifiers, or medical claims. Preview remains inside the authenticated Apps Script application and creates no indexable public artifact.

## Private source storage

`JUMI_CONTENT_ROOT_FOLDER_ID` points to a restricted `BA Medicale / Content Sources` Drive folder. JUMI creates type/content subfolders only during an authorized upload. Browser clients receive only `stored` state; opaque Drive file IDs remain in the tracker, and privileged credentials or private Drive URLs are not published.

Article intake expects an original PDF and approved 16:9 artwork. eBook intake expects an unchanged original PDF and approved cover. The cover is recorded as visual Reader Page 1; original PDF Page 1 remains Reader Page 2 and source citations retain original PDF numbering. Existing public generators remain the authority for final HTML, registry, search, SEO, reader, sitemap, and social metadata.

## Secure publishing boundary

Current infrastructure has no authenticated server-side path from Apps Script to the GitHub repository. JUMI therefore records validation and preview approval but rejects publication with `Publisher Not Connected`; the blocked attempt is audited. No GitHub credential, Google credential, repository path, or arbitrary output is accepted from browser code.

One external integration remains: an approved server-side publisher must accept only authenticated JUMI release manifests, validate content type/slug/allowed asset destinations, run the existing repository generators and integrity checks, commit generated files only, and return an auditable result. Its repository credential must live only in the server-side integration (prefer a least-privilege GitHub App or fine-grained token), never in Apps Script HTML, Git, or browser storage. Until that bridge is approved and configured, Publish stays unavailable by design.
