# Zopdev cloud audit campaign

Status: offer accepted by the user on 2026-09-08; page design and copy are a reviewable draft. Not deployed. Lead delivery is not configured.

## Accepted offer

The campaign advertises a free cloud audit delivered within 24 hours after access is ready. The full report is optional. This decision supersedes the attached screenshot's "results in minutes" promise for the free scan. It does not accelerate the optional paid report to 24 hours.

## Page outline, before visuals and copy

1. Hero: make the free audit, tangible deliverable, 24-hour delivery condition, and primary request action immediately understandable. A quiet header repeats the same action and does not offer product navigation.
2. Deliverable: show a clearly labelled illustrative report. Explain the free audit's top 20 compute and block-storage savings, supporting usage evidence, related security/compliance flags, and aggregate idle/orphaned cost. Avoid fabricated customer proof.
3. Process and access: request the audit, arrange scoped read-only access, receive the free results within 24 hours once access is ready. Explain that the audit does not change production resources.
4. Conversion: resolve timing, access, free/paid scope, and savings uncertainty in FAQs; provide a short form. Keep the optional $5,000 full report subordinate to the free offer, with five-business-day delivery from the reference subject to confirmation before launch.

## Visual direction

Dia is a reference for simplicity and whitespace only. The offer screenshot is content context only. Use the supplied official Zopdev logo and signature #F58549 orange, #2A4494 blue, #7FB236 green, dark #0F0F12, neutral white and gray. Retain Space Grotesk headings and Inter body text. An editorial report preview is the main visual. Orange directs attention to conversion; blue describes evidence; green describes potential savings. Do not use stock cloud photography, decorative AI infrastructure imagery, customer logos without evidence, or invented outcome statistics.

## Copy boundaries and launch requirements

- One primary action: request the free audit. The 24-hour promise always means the free audit, after required read-only access is ready.
- The attachment supports top 20 compute/block-storage findings, related risk flags, up to 90 days of metrics, and one free scan per organization per 30 days. Confirm operational coverage before public launch; missing metric history must not be represented as collected evidence.
- Illustrative report values are examples, not customer results or guaranteed savings.
- The optional full report includes wider findings, remediation guidance and engineer review. Do not imply these are included in the free audit.
- No manufactured urgency, scarcity, ROI guarantee, testimonials, or compliance certification claims.
- The local form is explicitly a preview until a real lead destination and privacy notice are configured. Never display a successful audit request for an unsubmitted lead; do not log or persist personal information in preview mode. As of the 2026-09-08 polish revision the standing "Design preview" banner has been removed at the owner's request; preview disclosure now comes from the submit-time status message and the "Preview my audit request" button label, both of which `audit.js` still gates on an empty `endpoint`.
- Launch needs verified lead receipt, approved privacy notice, confirmed offer operations, final URL/share metadata, and public mobile/desktop verification.

## Implementation

Single authoritative static campaign: frontend/website/public/cloud-audit/index.html, styles.css, audit.js and assets/. The existing marketing site is unchanged. This folder can be previewed directly or served through the marketing site's public directory without adding framework dependencies.

Reference: https://platops.com/services/cloud/cloud-cost-audit/ supplies context for tangible deliverables and explaining the access process. Its savings statistics, customer claims, pricing and guarantees are not Zopdev evidence.

## Copy pass

Headline: "Find your cloud waste. In 24 hours."
Primary CTA: "Get my free audit."
Qualification beside the CTA: "Results within 24 hours after read-only access is ready."
Secondary link: "See what you get" scrolls to the illustrative report, without opening another conversion path.
The optional paid report appears in an FAQ rather than a competing pricing card. The form requests name, work email and cloud provider; no phone number, cloud credentials or mandatory sales call.

## Lead adapter handoff

`audit.js` keeps `endpoint` and `privacyUrl` empty in preview mode. Set both to approved HTTPS addresses to enable real submissions. The relay must accept JSON and return a 2xx response with `{ "success": true }` only after durable lead receipt. Deduplicate by `requestId`, enforce origin checks, validate input and rate-limit server-side. The browser preserves the request ID on retries and includes bounded ad attribution fields. No CRM credential belongs in client code.

Remove the draft `noindex` only when the landing destination, lead receipt, privacy notice, operational promises and final share metadata have been verified. Neither the page nor this task sends a live test lead.

## Verified candidate, 2026-09-08

- Browser outcome: passed. Desktop 1440px and mobile/tablet 320px, 390px and 768px; no page overflow or JavaScript errors. Report tabs and keyboard controls work. CTA anchors reach the form and mobile sticky CTA hides when the form is visible.
- Automated accessibility: no WCAG A/AA violations reported by axe-core on desktop or mobile. Reduced-motion preference is respected. This is automated coverage plus visual inspection, not an exhaustive accessibility certification.
- Form behavior: invalid/empty inputs rejected; preview sends nothing and stores no personal information. Simulated server failure and an unconfirmed HTTP 200 preserve details. Only confirmed durable receipt displays success. Retries reuse the same request ID and preserve ad attribution. No live lead was sent.
- Source fingerprint: `60b85a66a13f95f670947a6e57ef2323f54a0c91cc3470c37b8dd154e1334ade` (9 campaign files).
- Elsewhere job: `6bf2c23d2ad540dcb0bab2cf14284b13`, Fly Singapore, exit 0; observed execution interval 50 seconds; estimated run cost $0.05, not invoiced cost.
- Results: `output/playwright/cloud-audit/results.json`, desktop and mobile screenshots, and `accessibility.json`. Verified recovered bundle also remains at `/private/tmp/agent-capacity-501/job-results/6bf2c23d2ad540dcb0bab2cf14284b13`.
- Previous checks found a test selector problem, then one low-contrast label. Both were corrected. Prior machines and remote artifacts were removed after preserving results.
- Publication state: local source only. No deployment, no live CRM integration, and no production conversion-rate measurement. Existing untracked `docs/research/` and `docs/site-copy/` were preserved.
- Final cleanup: verified the successful job's machine, source upload and result upload are absent. All three task-owned remote runs are cleaned up; recovered local results are retained.

## Revision, 2026-09-08 (design polish)

The 2026-09-08 verified candidate above remains an accurate record of that build. This section records what changed after it. The offer, timing promise, pricing, free/paid scope, FAQ answers and every report figure are unchanged; no claim was edited.

### Font packaging

`inter-400.woff2` and `inter-600.woff2` were byte-identical copies of one variable font. Both are replaced by a single `inter-variable.woff2` declared once at `font-weight:100 900`. Rendering is unchanged, confirmed by identical glyph advances at 400/600/700 before and after; the saving is 48 KB and one request. The earlier assumption that bold text was being faux-bolded was wrong: a variable face declared `600 700` was already instantiating true weights.

### Provider marks

The hero previously faked provider identity with a CSS-drawn AWS wordmark, the `◩` glyph for Azure and a bare letter `G` for Google Cloud. These are replaced by the official marks from the ZopDev Brand Kit (`logo-aws.svg`, `logo-azure.svg`, `logo-gcp.svg`), each `viewBox` retargeted to its measured content bounds so all three share one optical baseline. A stray off-canvas `<rect>` shipped inside the Azure file was removed. The marks are unboxed at the owner's request. Databricks and Snowflake marks were added afterwards at the owner's request, bringing the row to five: Databricks from the Brand Kit's `azure-databricks.svg`, Snowflake from the CC0 Simple Icons package with the #29B5E8 hex that package documents. Note that neither is an IaaS cloud and the row is still labelled "FOR YOUR CLOUD"; the coverage question that raises is recorded as open in PRODUCT.md and must be settled before launch.

### Design-system alignment

Buttons now match the locked `.btn-accent` spec: weight 700, `-0.02em` tracking, `translateY(-4px)` lift with a `0 8px 0 -4px` ink offset, and a 3px arrow nudge on hover. The focus ring is the specified 2px accent at 2px offset, with the field border going ink on focus. All five controls share one `#arrow` symbol; the secondary link rotates it 45 degrees rather than substituting a font glyph.

### Craft pass

- Unicode glyphs standing in for icons (`▤`, `↗`, `+`) are replaced by drawn `#instance`, `#trend` and `#plus` symbols at the page's existing 1.65 stroke, in both the static markup and the `audit.js` row template.
- Browser-owned surfaces are themed: `::selection`, caret colour in form fields, `tabular-nums` on report figures, and the mobile table scrollbar.
- The hero eyebrow was removed so the headline leads, per both the ZopDev system and the craft floor. "FREE CLOUD COST AUDIT" no longer appears; the free offer is still carried by the CTA, the reassurance row and the `$0 / FREE AUDIT` tag. The redundant "YOUR FIRST STEP" label above that tag was also removed.
- The decorative `01/02/03` on the deliverables was removed; the process steps keep theirs, where order carries meaning.
- The illustrative report's "READ-ONLY BY DESIGN" stamp was rebuilt as a hairline annotation because it read as a dark primary button.
- The "FROM BILLING NOISE TO A SHORTLIST." stage note was removed and its padding reclaimed.
- Motion: a staggered hero load reveal, an ease-in-out FAQ pointer, and a hover treatment on "24 hours." that reuses the button lift. The hero reveal animates transform only, never opacity, because a mid-fade element measures as low-contrast and fails the axe colour-contrast gate.

### Campaign file inventory

Eleven files: `index.html`, `styles.css`, `audit.js`, and in `assets/` — `inter-variable.woff2`, `space-grotesk-700.woff2`, `logo-aws.svg`, `logo-azure.svg`, `logo-gcp.svg`, `zopdev-logo-dark.svg`, `zopdev-logo-white.svg`, `zopdev-mark.svg`. The previous count was nine; `inter-600.woff2` was removed and three provider marks were added.

### Verification

- Project harness (`verify-cloud-audit.cjs`): all nine checks pass, including both desktop and mobile automated WCAG A/AA runs. Run against the installed Google Chrome via `channel:'chrome'`, because the pinned Playwright expects a `chromium_headless_shell` build that is not in the local cache. Run `npx playwright install chromium` before relying on the suite in CI.
- No horizontal overflow at 390, 768 or 1440, measured as `scrollWidth - innerWidth == 0` at true device metrics.
- Impeccable design detector: seven findings. Two were real and fixed (2px `border-left` callout rules reduced to 1px). Five were rejected as conflicts with the locked brand: Space Grotesk and Inter flagged as overused fonts, the tri-colour `.process` top rule read as a side tab, the square request card's 3px top border read as an accent on a rounded element, and the report stage's grid background. The detector ran degraded, without its HTML and CSS parser modules, so its output is an undercount.
- Headless screenshots taken with `chrome --headless --window-size=390,...` are unreliable: Chrome enforces a minimum window width, lays out wider than requested and crops the capture, which looks like horizontal overflow. Capture mobile through Playwright device metrics instead.

### Source fingerprint

Not restated. The `60b85a66...` fingerprint above covers the nine-file build and no longer matches; the recipe that produced it is not recorded anywhere in this document, so it cannot be regenerated faithfully. Recompute it with the original method and record it here:

    Source fingerprint (11 campaign files): ____________________

### Publication state

Unchanged. Local source only. `robots` remains `noindex, nofollow`, `endpoint` and `privacyUrl` remain empty, and no lead destination or privacy notice is configured. No deployment, no live CRM integration, no live test lead. The launch requirements listed above still all apply.
