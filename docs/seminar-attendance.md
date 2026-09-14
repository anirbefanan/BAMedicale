# Seminar attendance

Reuse the existing **Seminar Tracker - BA Medicale 2026** and its bound **Seminar Tracker** Apps Script. Verify the owner in Google's account and sharing panels; do not create another tracker or project, reuse GA4 credentials, or request Gmail permissions. Keep the Sheet **Restricted**. Share with Melati only when her authorized email is provided.

## Provision an event

1. Add the approved seminar to the canonical `content.js` registry.
2. Run `npm run attendance:build -- --event=EVENT-ID` through Codex. This generates the single attendance page, SVG and high-resolution PNG QR, and the seeded `scripts/attendance/Code.gs` bundle. Run `npm run content:build` for the seminar attendance action.
3. Update the **existing** bound project's Code.gs from that bundle and keep the minimal scopes in `scripts/attendance/appsscript.json`. Run `setupAttendance` as the tracker owner. Existing submissions and certificate fields must survive reruns.
4. Update the existing web app deployment to the new code version; execute as the owner, with **Anyone** participant access. Set its public `/exec` URL in `attendance/config.json` and rebuild. Never put a Sheet URL, credentials, or participant data in website files.

Tab names use **DD MMM YYYY**, with ` - Short Topic` for same-date seminars. Routing uses immutable Event ID plus a stored numeric sheet ID; renaming a tab cannot redirect submissions. The original empty `19092026` tab is reused as `19 Sep 2026`. Do not remove/recreate mapped tabs or hand-edit protected identifier columns.

## Open and close

New Events rows default to **Closed**. The owner changes only the Attendance status cell in the private **Events** tab to **Open** or **Closed**. This takes effect without a website deployment. Do not invent a schedule or open real attendance without organizer approval.

## Participant and certificate workflow

The first eight columns are Date Submitted, Time Submitted, Email, Full Name, Follow IG Y/N, Follow YT Y/N, Your Score for the Seminar, and Your Feedback for Seminar. Date/time use Asia/Jakarta. Score is 1–5 using the approved labels; short feedback is bounded to 300 characters. Both social checkboxes are self-declarations, never verified follower claims.

Deduplication is Event ID plus trimmed, lowercased email. Dots and plus aliases stay intact. Locked writes and acknowledged persistence support safe retries without overwriting review work. The browser sends a native POST and reads a short-lived acknowledgement through Google Content Service JSONP, correlated by a random 128-bit request ID. This read-only response contains status only, never attendee data; callback names are strictly validated. There is no public attendee lookup or list. Attendance routes do not initialize analytics.

Melati reviews attendees, manually emails the same high-resolution blank-name certificate image from the official BA Medicale email, and updates Certificate Status (Pending/Sent/Failed), Certificate Sent Date, Sent By, and Notes. Full Name is attendance data only. No automatic email, personalization, certificate generation, or SKP processing is implemented.

## Validation and release

Run `npm run attendance:check` and `npm run content:check`. Generated QR codes encode only the canonical attendance URL and are decoded during build/check. Validate the deployed browser acknowledgement against one isolated test row in the correct private tab, then remove only that test row and leave attendance Closed. Unit tests do not replace this live check. Do not report the system operational until it passes.

Google consent or deployment approval must be completed at the actual browser prompt. Browser sign-in alone does not establish API authorization. If blocked, preserve existing resources and report the exact remaining step.
