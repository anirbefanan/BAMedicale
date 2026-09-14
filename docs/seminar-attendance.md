# Seminar attendance

Reuse the existing **Seminar Tracker - BA Medicale 2026** and its bound **Seminar Tracker** Apps Script. Verify the owner in Google's account and sharing panels; do not create another tracker or project, reuse GA4 credentials, or request Gmail permissions. Keep the Sheet **Restricted**. Share with Melati only when her authorized email is provided.

## Provision an event

1. Add the approved seminar to the canonical `content.js` registry.
2. Run `npm run attendance:build -- --event=EVENT-ID` through Codex. This generates the single attendance page, SVG and high-resolution PNG QR, and the seeded `scripts/attendance/Code.gs` bundle. Run `npm run content:build` for the seminar attendance action.
3. Update the **existing** bound project's Code.gs from that bundle and keep the minimal scopes in `scripts/attendance/appsscript.json`. Run `setupAttendance` as the tracker owner. Existing submissions and certificate fields must survive reruns.
4. Update the existing web app deployment to the new code version; execute as the owner, with **Anyone** participant access. Set its public `/exec` URL in `attendance/config.json` and rebuild. Never put a Sheet URL, credentials, or participant data in website files.

Tab names use **DD MMM YYYY**, with ` - Short Topic` for same-date seminars. Routing uses immutable Event ID plus a stored numeric sheet ID; renaming a tab cannot redirect submissions. The original empty `19092026` tab is reused as `19 Sep 2026`. Do not remove/recreate mapped tabs or hand-edit protected identifier columns.

## Open and close

The private **Events** tab controls **Manual Override (G)**, **Open At (H)** and **Close At (I)**. Use date/time cells formatted `dd mmm yyyy hh:mm`, or explicit text `YYYY-MM-DD HH:mm`. All dates are **Asia/Jakarta (WIB)**.

- **AUTO:** closed before Open At, open from Open At inclusive, closed at Close At and afterwards.
- **OPEN / CLOSED:** force that state regardless of time.
- New seminars default to AUTO with blank dates, safely closed until an explicit valid schedule is entered. Missing, invalid or reversed dates fail closed. Never invent a schedule.

Changes apply on the next status check or submission, without website/Apps Script redeployment or Codex. The server checks the clock on every submission; the visible page refreshes availability every minute and when returning to the page. No timed trigger is needed.

Current approved window: **19 Sep 2026 08:45–23:59 WIB**, override **AUTO**. The close boundary is exclusive: 23:59 is already closed.

Each Event ID owns one permanent `/attendance/<event-id>.html` URL and QR pair. Existing QR assets are reused and decoded during checks; schedule edits never change or regenerate them. Provision future events from canonical record → immutable ID/URL → QR → mapped numeric tab → explicit schedule. Do not rename published IDs or URLs.

## Participant and certificate workflow

The first eight columns are Date Submitted, Time Submitted, Email, Full Name, Follow IG Y/N, Follow YT Y/N, Your Score for the Seminar, and Your Feedback for Seminar. Date/time use Asia/Jakarta. Score is 1–5 using the approved labels; short feedback is bounded to 300 characters. Both social checkboxes are self-declarations, never verified follower claims.

Deduplication is Event ID plus trimmed, lowercased email. Dots and plus aliases stay intact. Locked writes and acknowledged persistence support safe retries without overwriting review work. The browser sends a native POST and reads a short-lived acknowledgement through Google Content Service JSONP, correlated by a random 128-bit request ID. This read-only response contains status only, never attendee data; callback names are strictly validated. There is no public attendee lookup or list. Attendance routes do not initialize analytics.

Melati reviews attendees, manually emails the same high-resolution blank-name certificate image from the official BA Medicale email, and updates Certificate Status (Pending/Sent/Failed), Certificate Sent Date, Sent By, and Notes. Full Name is attendance data only. No automatic email, personalization, certificate generation, or SKP processing is implemented.

## Validation and release

Run `npm run attendance:check` and `npm run content:check`. Generated QR codes encode only the canonical attendance URL and are decoded during build/check. Validate the deployed browser acknowledgement against one isolated test row in the correct private tab, preserve the two existing proof submissions, and restore the approved schedule with AUTO after testing. Never delete those proof records or alter their certificate fields. Unit tests do not replace this live check. Do not report the system operational until it passes.

Google consent or deployment approval must be completed at the actual browser prompt. Browser sign-in alone does not establish API authorization. If blocked, preserve existing resources and report the exact remaining step.

Scheduling release verified 15 Sep 2026: original two proof rows unchanged after setup/migration/rerun; isolated browser submission stored in the mapped tab, duplicate acknowledged without another row, only the additional QA row cleared. Manual OPEN/CLOSED verified without redeployment; final AUTO restored to the approved window. Controlled-time tests cover both exact WIB boundaries and invalid schedules.
