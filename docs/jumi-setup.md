# JUMI secure deployment boundary

JUMI is a private seminar operations interface entered at `/jumi/`. GitHub Pages serves only its zero-data launcher. The operational application is served by a separate JUMI Apps Script deployment. Google authenticates the signed-in user before execution, and every server function checks `Session.getActiveUser()` against the server-side admin allowlist before reading or mutating data.

The existing anonymous attendance/quiz web app must remain unchanged. Never paste JUMI into that deployment or grant it JUMI scopes. Use `scripts/jumi/Code.gs` and `scripts/jumi/appsscript.json` in a separate Apps Script project owned by Nana. That project uses the existing `Tracker - BA Medicale 2026` spreadsheet and creates only the prefixed JUMI compatibility tabs; existing attendance, quiz, download, and event tabs remain untouched.

## Required owner setup

1. Create a separate Apps Script project and add `Code.gs`, `Index.html`, and the manifest from `scripts/jumi/`. Do not modify the anonymous attendance/quiz project.
2. In Apps Script **Script Properties**, set `JUMI_TRACKER_ID` to the existing restricted tracker spreadsheet ID, `JUMI_ADMIN_ALLOWLIST` to a JSON array containing Nana's normalized Google-account email, and `JUMI_PAYMENT_ROOT_FOLDER_ID` to the existing private `BA Medicale / Payment Validation` Drive folder ID. Add future admins only after explicit authorization.
3. Run `setupJumi` as the tracker owner. Confirm the spreadsheet and payment-evidence folder remain Restricted. This creates only prefixed JUMI compatibility tabs and imports the approved 19 September event record without copying participant rows. Event/year evidence subfolders are created only when an authorized admin uploads evidence.
4. Deploy the JUMI project as a web app with **Execute as: User accessing the web app** and access limited to signed-in Google users. Each authorized admin must have the required private Sheet/Drive access. The Apps Script platform performs Google sign-in; `doGet` and every `jumiApi` call then enforce the allowlist server-side.
5. Put the resulting JUMI `/exec` URL in `jumi/config.js` as `secureAppUrl`. Run `npm run jumi:check`, commit, and publish.

Until all steps are complete, `/jumi/` intentionally shows **Secure setup required** and cannot load data or perform actions. Email, WhatsApp/Meta, and GitHub publishing stay `Not Connected`. Drive evidence storage becomes available only after the separate JUMI project is authorized; newly created files remain private and only opaque file IDs are stored in the tracker.

GitHub Pages cannot emit an `X-Robots-Tag` response header. JUMI therefore uses strict page-level robots directives and is excluded from sitemap, navigation, footer, Library, Search, and structured data. These controls reduce discovery; authentication and backend authorization provide security.
