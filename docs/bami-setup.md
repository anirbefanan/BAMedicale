# BAMI V1 deployment boundary

BAMI is a separate public Apps Script project. It must **never** share the private JUMI or anonymous attendance deployment. The public service has only Sheets and outbound-request scopes. JUMI retains its signed-in Google allowlist and reads the two new tabs from the existing restricted `Tracker - BA Medicale 2026` spreadsheet.

## What is already prepared

- Public knowledge is generated from the published canonical registry by `npm run content:build` into `data/bami-knowledge.json`; `npm run content:check` detects drift. Team profiles are taken from their published team/profile pages. No draft, `Material/`, JUMI, or visitor data enters the knowledge file.
- `scripts/bami/Code.gs`, `Index.html`, and `appsscript.json` are the three generated deployment files. `.claspignore` excludes all source, tests, and local binding files. `npm run bami:build` and `npm run bami:check` validate them.
- The BAMI Apps Script project is [BAMI — BA Medicale Intelligence](https://script.google.com/d/1MCAa8FSXIwezFHRBLuJYTtaOZZDGZVfj7RRIU4gQB8uEzx9IUTgF5r93/edit). The ignored `scripts/bami/.clasp.json` holds its local binding. Do not run `clasp create` again.
- `AI_Visitors` and `AI_Inquiries` are additive empty tabs in the existing restricted tracker. The BAMI project already has its `BAMI_TRACKER_ID` Script Property bound to that tracker. `setupBami` validates the exact headers and does not clear or replace records.
- `data/bami-config.json` is intentionally disabled until the public service, secret, JUMI update, and browser QA are verified. A disabled config keeps the launcher hidden.

## Owner-only setup

1. In the [BAMI Apps Script project](https://script.google.com/d/1MCAa8FSXIwezFHRBLuJYTtaOZZDGZVfj7RRIU4gQB8uEzx9IUTgF5r93/edit), run `setupBami` once as the project owner and approve the requested Sheets and external-request scopes. This creates a random `BAMI_SIGNING_KEY` in Script Properties and checks both tab schemas. The owner check rejects anonymous public execution.
2. Create a Gemini API key in [Google AI Studio API keys](https://aistudio.google.com/app/apikey) under the BA Medicale-controlled Google account. Store it **only** in the BAMI Apps Script **Project Settings → Script Properties** as `BAMI_GEMINI_API_KEY`. Do not paste it into chat, source, GitHub, screenshots, or browser code. `BAMI_MODEL` is optional; default `gemini-3.5-flash-lite`. Use a paid tier with appropriate data-processing terms for production chat, subject to account billing. The model receives only the redacted question, audience label, and up to five selected published records; it does not receive onboarding email or phone.
3. Run `npm run bami:check` and `npm run jumi:check`. Push only the three BAMI runtime files with `clasp status` verification, create a version, and deploy the BAMI project as **Web app → Execute as me → Anyone**. Record its `/exec` URL. Keep the generated deployment ID stable for later updates.
4. Update the existing private JUMI deployment in place with `npm run jumi:deploy`; preserve its Google login and allowlist. Set `data/bami-config.json` to `enabled: true` and the verified BAMI `/exec` URL only after the public service passes authenticated owner setup, request/answer, privacy, and abuse checks. Then commit/push the activation and verify GitHub Pages and live browser behavior.

## Operating constraints

The visitor token is opaque and signed server-side. The public launcher stores only that token; contact details are held in the restricted tracker. Every BAMI API action is narrow and token-gated after onboarding. Questions containing obvious personal medical context are withheld from inquiry logs; email/phone patterns are redacted. AI errors stay generic. A 5-second visitor throttle, 30-request visitor-hour limit, 30-onboarding-per-minute limit, and 200-model-call daily cap bound V1 usage. No PII or question text is sent to GA4.

Questions and answers in the private tracker still require normal restricted access, retention review, and deletion handling through `support@bamedicale.com`. The public Privacy Policy describes BAMI's processing. Do not enable the launcher until the provider account and consent flow have been verified on the live service.
