# Public traffic dashboard setup

The public dashboard at `traffic.html` reads the validated `data/growth-analytics.json` cache. One GitHub Action refreshes every dashboard module every six hours. Credentials are used only inside GitHub Actions and are never written to the public site. The browser reads the single public aggregate JSON from the repository's raw-content CDN, with a same-origin fallback, so bot-written data updates do not depend on a GitHub Pages rebuild. This is not a privileged API endpoint.

`traffic-model.js` is the shared completed-day comparison and calculation engine. `scripts/fetch-growth-analytics.js` is the server-only collector; `traffic-dashboard.js` is the renderer. The canonical public shell remains the shared `app.js` header/footer. GA4 collection, its Measurement ID and event schema are unchanged.

## Public measurement contract

- The GA4 response supplies the authoritative property timezone (currently Asia/Jakarta). Yesterday excludes today. 7D/28D compare preceding equal-length completed ranges. MTD compares equal elapsed days, capped to the shorter month. Monthly compares complete calendar months of potentially different lengths.
- Distinct active users and returning active users are queried for the whole period. Do not sum daily users, source users or page users to produce totals.
- Returning Users = `activeUsers` filtered to `newVsReturning=returning`. A visitor may appear in both new and returning categories in a period. The audience donut therefore shows **session attribution**, not a falsely exclusive user partition.
- Engagement seconds per active user and engaged sessions / sessions use their respective actual denominators. Missing denominators return null. Zero previous values produce no percentage comparison.
- Source and device chart shares use the returned breakdown total; GA4 estimates can differ from headline totals. Country counts are single-dimension aggregates suppressed below five active users. No city, precise geography, personal identifiers or participant data is added to the new cache.
- An explicit allowlist of published public page paths and production hostnames excludes private/admin pages. Titles and content groups come from repository metadata and the canonical registry, never arbitrary GA4 page titles. `/` and `/index.html` are one canonical homepage, with users deduplicated through an additional query.
- Every preset's current and previous totals are independently re-queried and compared before publication. Failed reconciliation retains the prior valid period. Module failures are independently marked unavailable; current and stale modules are never silently mixed.
- Recent completed days may be revised by GA4 processing. These figures measure website engagement, not learning outcomes or seminar participation.

## Custom ranges and Recently Active

GitHub Pages cannot execute arbitrary server queries. A public custom range is available only when its exact aggregate has been published. Use this workflow's `start_date` and `end_date` inputs to publish an arbitrary completed range (maximum 366 days), compared with its immediately preceding equal-length range. The UI does not approximate uncached distinct-user totals from daily data. General visitor-selected custom ranges require an approved, rate-limited server endpoint; credentials must remain server-side. The public Custom control only exposes an already-published custom range; it is disabled when none exists. No arbitrary query form or browser-to-GA request is exposed.

The card is labeled Recently Active. During the same normal six-hour job, the server-side collector uses GA4's trailing 30-minute active-user count filtered to known public screen titles and embeds that snapshot in `data/growth-analytics.json`. There is no separate realtime workflow, cache, or browser polling. A failed, malformed, mismatched, or stale snapshot displays `Temporarily unavailable`; an older successful value is never carried forward after a failed current query. No realtime value is fabricated. The browser reads only the shared aggregate cache, never GA4. Public JSON is not listed in the sitemap and contains no private endpoint/configuration.

## One-time Google setup

1. In a Google Cloud project, enable the **Google Analytics Data API**.
2. Create a dedicated service account for the BA Medicale traffic refresh and create one JSON key for it.
3. In the BA Medicale GA4 property, open **Admin → Property access management** and add the service account email with the read-only **Viewer** role. Do not grant Editor or Administrator access.
4. Note the numeric GA4 property ID. This is different from the public measurement ID beginning with `G-`.

## One-time GitHub setup

In the repository, open **Settings → Secrets and variables → Actions** and add:

- `GA4_PROPERTY_ID`: the numeric GA4 property ID.
- `GA4_SERVICE_ACCOUNT_JSON`: the complete service-account JSON key as one repository secret.

Do not commit the key, paste it into HTML or JavaScript, or expose either secret in logs. After adding both secrets, run **Refresh public traffic data** manually from the Actions tab. The workflow validates the output and commits only the shared growth aggregate and compatibility summary. The old `data/traffic-summary.json` remains a compatibility snapshot; its useful page/acquisition reports are represented in the new detailed report rather than duplicated as KPI sections.

## Operations

- Complete dashboard schedule: `0 */6 * * *` (every six hours, UTC), including Recently Active.
- Manual refresh: use `workflow_dispatch` from the Actions tab.
- Local contract check: `npm run traffic:test`.
- Local JSON validation: `npm run traffic:validate` (the bootstrap file requires `--allow-pending` until the first successful refresh).
- Missing or invalid aggregates retain the last valid report when available; otherwise the dashboard shows an unavailable state.

The output contains aggregate counts and labels only. It must never be expanded to include user-level, device-level, event-level, identity, medical, or free-text data.
