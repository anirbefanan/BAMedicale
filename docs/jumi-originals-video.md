# BA Medicale Originals in JUMI

Videos is the fourth Content workspace. It manages Originals only; the external
YouTube collection, its attribution and discovery pipeline are unchanged.

## Normal operation

1. Create Content → Video. Supply the approved MP4 and approved 9:16 portrait
   JPG/PNG poster. Existing production posters are 720 × 1280.
2. Enter source-backed title, description, attribution and classification. Review
   the audience explicitly. Source date is optional; BA Medicale publication date
   is assigned by the publisher. No transcription or visual understanding is claimed.
3. Validate Files & Generate, then Validate. Open the private playable Preview and
   review it before approval. Publish explicitly approves public copies of both assets.
4. The controlled publisher prepares a release, verifies integrity and decodability,
   updates the Originals catalog, rebuilds canonical discovery/related metadata,
   checks allowed paths and main concurrency, and publishes. JUMI remains pending
   until its exact receipt and a successful current Pages build reconcile.

Editing a managed Video preserves its slug/URL and original publication date.
New media resets generation, validation and preview. Prior source hashes remain
in private provenance; private source files remain retained. Failed releases do
not change main. Retry by validating and previewing the retained draft again.
The five historical Originals remain unchanged and viewable; they are not silently
imported into editable private drafts or overwritten by new IDs.

## Storage and operational limits

- Private masters: existing private Content Sources root → Videos → content ID.
  Folder creation is lazy. No new Sheet columns, Script Properties, scopes or setup
  function are required. Private previews use authenticated bytes and temporary
  browser Blob URLs, revoked on close; never public Drive URLs.
- Public delivery adapter: approved MP4 and poster under `assets/videos/` and
  `assets/videos/posters/`, with `data/original-videos.json` as the canonical catalog.
  New catalog records append deterministically; updates retain their existing position.
  The public registry retains its established date/title presentation ordering.
- New MP4: **20 MiB maximum**, warning above **15 MiB**, at most **10 minutes**.
  This conservative transport budget leaves room below Apps Script's 50 MB fetch
  POST limit after base64 expansion. Existing larger assets are grandfathered.
- Browser-compatible H.264 video with AAC audio if present. The release checks
  container, hashes and full decoding. It never transcodes or recompresses.
- Poster: **4 MiB maximum**, JPG/PNG, 9:16 with absolute ratio tolerance 0.02.
  Server reads actual image bytes; supplied dimensions are not trusted.
- Repository tracked-content budget: warning at **650 MiB**, stop at **800 MiB**.
  GitHub repository history approaching **1 GiB** also blocks new Video releases.
  Size/collision guards run before GitHub blob writes; release checks run again
  before main can change.

GitHub documents a 100 MiB per-file Git limit and 1 GB published Pages site limit;
these are outer constraints, not healthy BAU targets. Plan dedicated media delivery
before the warning budgets, sustained video growth or Pages bandwidth pressure.
Do not use Git LFS for Pages delivery. A future public-media adapter can replace
the asset destinations without changing the private master, workflow or canonical
catalog/player model. No delivery migration is performed in this release.

References: [GitHub large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github),
[Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits),
[Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).

## Discovery, performance and safety

The shared registry supplies Library, Search, audience/topic discovery and related
learning. Originals receive factual VideoObject metadata; the existing page's
official logo social image is preserved. Social Kit defaults use only the approved
title, description and tags; Nana can review/edit them. Share the canonical
`https://bamedicale.com/videos.html?video=<slug>` target.

Opening JUMI or using Refresh revalidates the public content catalog, retaining
the last valid catalog on a network failure. This does not change the GA4 cache.

Control Tower includes Videos in counts, comparisons, trend, recent activity,
calendar and attention. No weekly Video cadence is imposed. The existing six-hour
GA4 page aggregates do not reliably distinguish individual modal videos, so JUMI
shows unavailable rather than assigning collection-page metrics to a Video.

Validation uses temporary, non-public fixtures and mocked private storage/provider
calls. No test video, notification or certificate is published or sent.
