# JUMI Content OS architecture

JUMI extends the production seminar CRM; it does not replace it. Seminar records remain in `JUMI Events`, so Event Scope, registrations, payments, attendance, notifications, certificates, community, and reports keep their current data paths. Article and eBook records use the additive `JUMI Content` tab.

## Canonical content record

`JUMI Content` stores shared fields for identity, type, title, subtitle, slug, lifecycle state, private Drive file IDs, validation/preview state, public URL, authorship timestamps, publication timestamp, and version. Type-specific source metadata is stored as inspectable JSON rather than flattening unrelated Article and eBook fields into the event schema.

The controlled lifecycle is:

`Draft → Generated → Validation Required or Ready for Preview → Ready to Publish → Published or Failed`

Validation requires source-supported metadata and private source/media references. JUMI does not infer missing authors, dates, publishers, sources, credentials, references, identifiers, or medical claims. Preview remains inside the authenticated Apps Script application and creates no indexable public artifact.

## Private source storage

`JUMI_CONTENT_ROOT_FOLDER_ID` points to a restricted `JUMI Content Sources` Drive folder. Owner setup verifies that root is private and prepares `Articles`, `eBooks`, and `Seminars`; per-content folders are created only during an authorized upload. Browser clients receive only `stored` state; opaque Drive file IDs remain in the tracker, and privileged credentials or private Drive URLs are not published.

Article intake expects an original PDF and approved 16:9 artwork. eBook intake expects an unchanged original PDF and approved cover. The cover is recorded as visual Reader Page 1; original PDF Page 1 remains Reader Page 2 and source citations retain original PDF numbering. Existing public generators remain the authority for final HTML, registry, search, SEO, reader, sitemap, and social metadata.

## Secure publishing boundary

The authenticated Apps Script backend is the only publisher caller. After server-side allowlist, lifecycle, evidence, classification, slug, MIME, size, and Preview checks, it reads approved private Drive files and creates one controlled release branch in `anirbefanan/BAMedicale`. The branch contains only server-derived public asset paths and a versioned release manifest; it contains no private Drive identifiers, admin identity, audit notes, or credentials. Apps Script dispatches `.github/workflows/publish-jumi-content.yml`, which validates the contract and asset hashes, prepares eBook source pages when required, runs the canonical generators and integrity checks, enforces an output-path allowlist, and fast-forwards `main` only when the captured base commit still matches current `main`. A receipt committed by the workflow lets JUMI reconcile the content to `Published`; dispatch alone never claims publication success.

The repository credential is the Script Property `JUMI_GITHUB_TOKEN`. Use a fine-grained personal access token restricted to the single `anirbefanan/BAMedicale` repository with **Contents: Read and write**, **Actions: Read and write**, and **Pages: Read and write**; set a short practical expiry and rotate it in Script Properties. Pages permission is needed because GitHub does not trigger a Pages build from a commit pushed with a workflow `GITHUB_TOKEN`; after the validated commit lands, Apps Script explicitly requests the existing branch-based Pages build and confirms its successful current-main result before marking the record Published. The credential never belongs in `Index.html`, Git, browser storage, logs, or responses. Without this property, JUMI reports the publisher as `Not Connected` and publication fails closed. Workflow or Pages failure leaves the previous public version intact, preserves the private source/draft, records a controlled failed audit state, and can be retried only after validation and Preview are approved again.
