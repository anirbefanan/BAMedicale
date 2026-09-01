# Public traffic dashboard setup

The public dashboard at `traffic.html` reads aggregate data from `data/traffic-summary.json`. A scheduled GitHub Action refreshes that file every six hours through the Google Analytics Data API. Credentials are used only inside GitHub Actions and are never written to the public site.

## One-time Google setup

1. In a Google Cloud project, enable the **Google Analytics Data API**.
2. Create a dedicated service account for the BA Medicale traffic refresh and create one JSON key for it.
3. In the BA Medicale GA4 property, open **Admin → Property access management** and add the service account email with the read-only **Viewer** role. Do not grant Editor or Administrator access.
4. Note the numeric GA4 property ID. This is different from the public measurement ID beginning with `G-`.

## One-time GitHub setup

In the repository, open **Settings → Secrets and variables → Actions** and add:

- `GA4_PROPERTY_ID`: the numeric GA4 property ID.
- `GA4_SERVICE_ACCOUNT_JSON`: the complete service-account JSON key as one repository secret.

Do not commit the key, paste it into HTML or JavaScript, or expose either secret in logs. After adding both secrets, run **Refresh public traffic data** manually from the Actions tab. The workflow tests the schema, requests five aggregate reports, validates the output, and commits only `data/traffic-summary.json` when it changes.

## Operations

- Schedule: `0 */6 * * *` (every six hours, UTC).
- Manual refresh: use `workflow_dispatch` from the Actions tab.
- Local contract check: `npm run traffic:test`.
- Local JSON validation: `npm run traffic:validate` (the bootstrap file requires `--allow-pending` until the first successful refresh).
- A missing or invalid public JSON file leaves the page in the visitor-safe `Traffic data is being prepared.` state.

The output contains aggregate counts and labels only. It must never be expanded to include user-level, device-level, event-level, identity, medical, or free-text data.
