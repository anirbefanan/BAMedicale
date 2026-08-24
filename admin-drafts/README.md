# BA Medicale Local Admin Drafts

This folder stores local intake drafts created from the admin page.

Workflow:

1. Run `npm run admin`.
2. Open `http://127.0.0.1:8787/admin.html`.
3. Create as many drafts as needed for articles, seminars, videos, eBooks, courses, or resources.
4. Attach files by upload or by local path/folder path.
5. Mark finished items as `Ready for Codex`.
6. Tell Codex: `Process admin drafts and publish.`

Draft assets are intentionally ignored by Git so large or sensitive source files are not committed accidentally.
Codex will read local drafts and source files from this machine when processing publication.
