# JUMI secure deployment boundary

JUMI is the private BA Medicale Content OS entered at `/jumi/`. It combines controlled Article/eBook publishing intake with the existing seminar operations interface. GitHub Pages serves only its zero-data launcher. The operational application is served by a separate JUMI Apps Script deployment. Google authenticates the signed-in user before execution, and every server function checks `Session.getActiveUser()` against the server-side admin allowlist before reading or mutating data.

The existing anonymous attendance/quiz web app must remain unchanged. Never paste JUMI into that deployment or grant it JUMI scopes. Use `scripts/jumi/Code.gs` and `scripts/jumi/appsscript.json` in a separate Apps Script project owned by Nana. That project uses the existing `Tracker - BA Medicale 2026` spreadsheet and creates only the prefixed JUMI compatibility tabs; existing attendance, quiz, download, and event tabs remain untouched.

## Required owner setup

1. Create a separate Apps Script project and add `Code.gs`, `Index.html`, and the manifest from `scripts/jumi/`. Do not modify the anonymous attendance/quiz project.
2. In Apps Script **Script Properties**, set `JUMI_TRACKER_ID` to the existing restricted tracker spreadsheet ID, `JUMI_ADMIN_ALLOWLIST` to a JSON array containing Nana's normalized Google-account email, and `JUMI_PAYMENT_ROOT_FOLDER_ID` to the existing private `BA Medicale / Payment Validation` Drive folder ID. Run `setupJumiContentStorage` once as Nana to create the restricted `JUMI Content Sources` root and store `JUMI_CONTENT_ROOT_FOLDER_ID`; if a folder with that name already exists, inspect it and set the verified folder ID manually instead of creating a duplicate. Add `JUMI_GITHUB_TOKEN` only after creating a fine-grained GitHub token restricted to `anirbefanan/BAMedicale` with **Contents: Read and write**, **Actions: Read and write**, and **Pages: Read and write**. Add future admins only after explicit authorization.
3. Run `setupJumi` as the tracker owner. Confirm the spreadsheet and both Drive roots remain Restricted. This creates only prefixed JUMI compatibility tabs, including the additive `JUMI Content` registry, and imports the approved 19 September event record without copying participant rows. It prepares the private `Articles`, `eBooks`, and `Seminars` folders; content-specific folders are created only when an authorized admin uploads a file.
4. Deploy the JUMI project as a web app with **Execute as: User accessing the web app** and access limited to signed-in Google users. Each authorized admin must have the required private Sheet/Drive access. The Apps Script platform performs Google sign-in; `doGet` and every `jumiApi` call then enforce the allowlist server-side.
5. Put the resulting JUMI `/exec` URL in `jumi/config.js` as `secureAppUrl`. Run `npm run jumi:check`, commit, and publish.

Until all steps are complete, `/jumi/` intentionally shows **Secure setup required** and cannot load data or perform actions. Email and WhatsApp/Meta stay `Not Connected`. Drive evidence/source storage becomes available only after the separate JUMI project is authorized; newly created files remain private and only opaque file IDs are stored in the tracker. Article/eBook publication remains blocked until both the private content root and `JUMI_GITHUB_TOKEN` are configured, the updated manifest scopes are authorized, and a new web-app version is deployed. Do not deploy the repository bundle while either server-side setting is unverified.

## Transactional email setup

JUMI uses a server-side Resend adapter for Seminar transactional email. It never uses a personal Gmail sender. Before enabling delivery:

1. Create or reuse a Resend account controlled by BA Medicale and verify `bamedicale.com` with the DNS records shown by Resend. Complete SPF and DKIM verification in the domain's DNS manager.
2. Create a **Sending access** API key restricted to the verified `bamedicale.com` domain. Store it only as the Apps Script property `JUMI_RESEND_API_KEY`.
3. After Resend shows the domain as verified, set the Apps Script property `JUMI_EMAIL_SENDER_VERIFIED` to `true`. The sender is locked in server code as `BA Medicale <support@bamedicale.com>`.
4. Optionally set `JUMI_NOTIFICATION_DEFAULT_LANGUAGE` to `English`; otherwise the deterministic default is `Bahasa Indonesia`. A participant-level language value, when available, takes precedence.
5. Run `setupJumiNotifications` once as Nana. It validates the server-side configuration and replaces any duplicate queue triggers with one 15-minute Apps Script trigger. Do not run it until the provider key and domain verification are complete.

The provider is reported as `Not Connected` until both server-side settings exist. JUMI records `Sent` only after the provider accepts the request and returns a message ID. It does not claim `Delivered` because no authenticated delivery webhook endpoint is configured. Resend receives only the recipient, sender, subject, and deterministic transactional message. API keys, Drive IDs, payment evidence, internal notes, and participant lists never enter the browser or public site. WhatsApp remains `Not Connected`; no personal WhatsApp session or browser automation is supported.

GitHub Pages cannot emit an `X-Robots-Tag` response header. JUMI therefore uses strict page-level robots directives and is excluded from sitemap, navigation, footer, Library, Search, and structured data. These controls reduce discovery; authentication and backend authorization provide security.
