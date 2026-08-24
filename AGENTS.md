# BA Medicale Website Steward

## CORE RULE

Use the simplest, shortest, safest path that completes the user's request.

Default:

**FIND → EDIT → CHECK ONCE → COMMIT → PUSH → VERIFY ONCE → STOP.**

Minimum changes. Minimum commands. Minimum testing. Maximum correctness.

Use existing templates, components, renderers, data structures, CSS, assets, routes, and workflows whenever possible.

Never turn a small update into a redesign, refactor, architecture review, full-site audit, cache investigation, or infrastructure troubleshooting session.

Autonomously handle normal spacing, typography, crop, hierarchy, responsive composition, CTA placement, and visual consistency within the requested scope.

Autonomy does NOT mean expanding scope.

---

# FAST TEMPLATE MODE — DEFAULT

Use this for routine work:

- article/PDF/resource
- image/poster/icon
- seminar/event
- wording/metadata/link
- card/content update
- minor CSS/layout adjustment
- existing admin-intake item

Workflow:

1. Find the canonical content/data/component.
2. Change only what was requested.
3. Use the existing template/renderer.
4. Make only necessary adjacent adjustments.
5. Check the affected result once.
6. Commit relevant files only.
7. Push `main`.
8. Verify the affected staging route once.
9. STOP.

Do NOT automatically:

- rebuild templates/renderers
- refactor working code
- inspect unrelated pages
- search broadly after the source is found
- perform unrelated cleanup
- run full-site tests
- run exhaustive breakpoint tests
- run full Playwright suites
- create temporary QA scripts
- install dependencies
- take repeated screenshots
- optimize unrelated code
- change architecture
- investigate unrelated warnings
- preemptively cache-bust

For routine content:

**USE THE EXISTING TEMPLATE. CHANGE ONLY THE CONTENT.**

---

# TASK SIZE

## SMALL — DEFAULT

Content, article, PDF, image, poster, icon, wording, card, metadata, link, seminar, minor styling.

Check only the affected page/section.

## MEDIUM

One section redesign, new module/interaction, several connected components, meaningful responsive change.

Check affected dependencies + representative mobile/desktop behavior.

## LARGE

New page architecture, major homepage redesign, authentication, navigation architecture, site-wide components, cross-site data architecture.

Only LARGE tasks justify broad QA.

When uncertain, choose the smaller classification.

---

# SCOPE

Stay strictly within the request.

Example:

“Replace seminar poster and update seminar information.”

Do:

poster → canonical seminar data → directly related presentation → quick check → commit → push → verify → stop.

Do not rebuild the seminar system or inspect unrelated routes.

Fix adjacent issues only when:

1. caused by the requested change; or
2. directly blocking the requested result.

Otherwise leave them untouched.

---

# SOURCE OF TRUTH

Find the canonical source first.

Prefer one:

- data record
- content source
- renderer/component
- canonical asset

Once found, stop searching unless there is evidence another active source must change.

Never duplicate content when an existing renderer already controls it.

---

# ADMIN INTAKE

Admin:

`admin/`

Drafts:

`admin-drafts/items/`

When instructed:

`Process admin drafts and publish.`

For each `ready` draft:

1. Read submitted source material.
2. Identify the existing supported template/item type.
3. Preserve submitted material as factual source of truth.
4. Promote only required production assets.
5. Add the item to the canonical content/data source.
6. Generate only necessary source-based title, summary, excerpt, metadata, caption, CTA, and presentation wording.
7. Quick-check the affected page.
8. Commit and push.
9. Verify staging.
10. Mark `published`.
11. Stop.

Do not redesign the library/content system for a routine item.

---

# CONTENT INTEGRITY

Submitted PDFs, images, videos, posters, documents, and structured data are source-of-truth material.

Preserve their substantive meaning.

You may shorten/restructure presentation copy for clarity.

Never invent:

- medical facts
- credentials
- statistics
- events
- authors
- affiliations
- accreditations
- registration details
- clinical claims

Do not replace submitted substantive material with invented substitutes.

---

# VISUAL SYSTEM

Maintain BA Medicale's established premium style:

- crimson / burgundy / oxblood / near-black red
- warm ivory
- smoked/translucent glass
- restrained glow
- layered depth
- cinematic medical imagery
- premium modern typography
- dense, organized editorial composition

Prefer meaningful oncology, tumor/cancer, anatomy, pathology, imaging, diagnostic, treatment, physician, and medical-education visuals.

Avoid generic SaaS/hospital templates, childish icons, emoji-like graphics, irrelevant imagery, excessive whitespace, oversized typography, repetitive cards, random animation, and decorative visuals without meaning.

Do not redesign a working component unless requested.

---

# MOCKUPS

When two images are supplied:

**IMAGE 1 = CURRENT / PROBLEM**
**IMAGE 2 = EXPECTED RESULT / SOURCE OF TRUTH**

For the requested scope, reproduce IMAGE 2 as closely as technically practical.

Match relevant:

- composition
- proportions
- artwork
- crop/position
- density
- spacing
- typography
- hierarchy
- media treatment
- edge blending
- depth
- responsive intent

Do not merely take inspiration.

Do not implement the mockup as a static screenshot.

Do not modify unrelated sections.

---

# IMAGE / MEDIA

Use supplied official assets whenever available.

For images:

- preserve focal subject
- use intentional crop
- use correct aspect ratio
- use appropriate `object-fit` / `object-position`
- maintain clarity
- optimize loading
- provide appropriate alt text

Never use repository imagery simply because it exists.

Every visual must support its component's meaning.

## Card Artwork

When the approved design expects integrated artwork:

- no obvious pasted rectangle
- no hard image boundary
- blend peripheral edges naturally into the card
- preserve sharp focal subject
- use restrained masks/gradients/overlays
- preserve crimson/black continuity
- avoid muddy blur/excessive transparency

Prefer CSS/media composition over replacing good artwork.

## Educational Media

Preserve educational imagery at original fidelity.

Do not unnecessarily fade, tint, distort, obscure, filter, or heavily crop meaningful content.

Use zoom/lightbox only when necessary for readable educational detail.

Do not add new interaction systems for simple asset changes.

---

# PHYSICIAN IDENTITY

Use supplied real physician photography without generating, reconstructing, beautifying, or materially altering appearance.

Full Dr. Bob identity:

`Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)`

Use exactly when full professional identity is required.

Do not invent or omit credentials.

Short presenter labels are acceptable only when intentionally required by the UI.

Use professional premium typography.

---

# RESPONSIVE + QA

Testing must match task size.

SMALL:
affected page/section only; check ~390px and/or ~1440px only when layout is affected.

MEDIUM:
390 / 768 / 1440.

LARGE:
390 / 430 / 768 / 1024 / 1440 / 1920.

Do not run six breakpoints for content, PDF, poster, icon, wording, or simple card updates.

Within affected scope prevent:

- overlap
- clipping
- overflow
- bad crop
- unreadable text
- bad stacking
- CTA collision

For visual changes, inspect the affected rendered result once.

If a mockup exists, compare once and correct material differences.

Do not repeatedly polish a correct result.

---

# CACHE

Do NOT change cache/version query strings by default.

Only cache-bust when:

1. deployment completed;
2. live staging is confirmed stale; and
3. normal refresh/deployment did not resolve it.

Never edit multiple HTML files preemptively for cache refresh.

---

# TOOL FAILURES

Do not tool-hop.

If a nonessential command fails:

1. correct once;
2. retry once;
3. if it still fails and is not required, skip it.

Never cycle through PowerShell → patch → Python → Node → temporary scripts → browser automation for a simple update.

Do not let optional validation block a correct requested change.

---

# THIRD-PARTY MEDIA

For external media:

- preserve canonical source
- preserve attribution
- preserve verified metadata
- do not rehost copyrighted video
- deduplicate by canonical URL/platform ID
- use existing embed/modal behavior

Do not redesign the media system for routine additions.

---

# GIT + DEPLOYMENT

Normal workflow:

1. inspect intended diff
2. stage intended files only
3. commit
4. `git push origin main`
5. verify affected staging route once
6. stop

Staging:

`https://anirbefanan.github.io/BAMedicale/`

Production:

`bamedicale.com`

Never deploy/connect production unless explicitly requested.

Preserve unrelated user work.

Never reset, clean, revert, reformat, or stage unrelated files.

## Authentication Failure

If push authentication fails:

1. retry once using existing configured authentication;
2. if it still fails, stop.

Do not start device-login loops, clear credentials, change Git configuration, switch repeatedly between SSH/HTTPS/CLI, or automate browser login.

Report:

`Changes are complete and committed locally. Push is blocked by the current GitHub credential/session.`

---

# COMPLETION

A task is finished when:

1. requested change works;
2. directly affected presentation is correct;
3. required content/assets load;
4. no regression caused by the change remains;
5. intended files are committed;
6. push succeeds when Git is available;
7. affected staging route is verified once.

Then STOP.

Do not continue auditing, testing, searching, cache-busting, refactoring, or improving after completion.

# FINAL OPERATING RULE

**USE THE EXISTING SYSTEM. CHANGE ONLY WHAT WAS REQUESTED.**

**FIND → EDIT → CHECK ONCE → COMMIT → PUSH → VERIFY ONCE → STOP.**

Never turn a routine update into an engineering investigation.