# BA Medicale

Local website for BA Medicale: medical learning library, ebook commerce preview,
symposium hub, login area, and video wall for Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K) content.

## Run locally

```powershell
# From the repository root selected in Codex:
python -m http.server 8000
```

Open `http://127.0.0.1:8000`.

Use Node.js 22 and its bundled npm, matching the current GitHub workflow. On a fresh clone, run `npm ci`, then `npm run content:check`, `npm run attendance:check`, `npm run traffic:test`, and `npm run traffic:validate`. In PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`. Python is only needed for this static preview; Codex's bundled Python is sufficient. Do not upgrade dependencies or regenerate content merely to set up a new machine. The targeted LF rules in `.gitattributes` preserve byte-checked outputs and attendance asset hashes on Windows.

`AGENTS.md` is the portable operating contract. Normal work runs through Codex: read instructions, fetch and safely sync `main`, edit intended files, check, commit, push, verify remote sync and the affected production route. No custom skill is currently required by this repository; restore any optional old-machine skill only from its verified original source, never from memory. Keep authentication and machine-specific configuration outside Git.

## Edit content

Update `content.js` to change:

- library categories
- ebook catalog and pricing
- symposium schedule
- YouTube/Instagram video thumbnails

## Next integrations

- Google OAuth for Gmail login
- Xendit or QRIS payment flow
- member database and purchase status
- lightweight CMS/admin editor for non-code content changes
