# BA Medicale Static-Site Security Boundary

BA Medicale is currently delivered as a public static site through GitHub Pages. Public HTML, CSS, JavaScript, JSON, and referenced media must therefore be treated as readable by anyone.

- Secrets, private API credentials, authentication decisions, and protected medical data must never be implemented in client-side code.
- Medical or symptom input must remain ephemeral unless a future, approved backend and privacy architecture explicitly requires storage.
- HTTP response headers such as a fully enforced Content Security Policy must be configured through supported hosting or edge infrastructure. HTML must not imitate server-side controls that the platform cannot enforce.
- Local admin intake, draft data, and test artifacts are excluded from the published Pages build and are not production authentication systems.

Security concerns can be reported privately to the repository owner. Do not include patient information or credentials in a public issue.
