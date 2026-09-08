# Cloud audit landing page

The ZopDev free cloud cost audit campaign. A single self-contained static page: no framework, no build step, no runtime dependencies.

> ## Not cleared for deployment
>
> This is a reviewable pre-launch draft. It carries `<meta name="robots" content="noindex, nofollow">` and its form is in **preview mode** — `endpoint` and `privacyUrl` in `audit.js` are deliberately empty, so submitting sends nothing and stores nothing.
>
> Do not deploy, and do not remove the `noindex`, until every item under [Launch blockers](#launch-blockers) is closed.

## Layout

The page sits at the repository root so any repo-to-URL host serves it with no
publish-directory setting and no build step.

```
index.html              the campaign
styles.css
audit.js                lead adapter, preview mode by default
assets/                 self-hosted fonts, ZopDev logos, provider marks
OUTLINE-AND-HANDOFF.md  the living record: brief, decisions, revisions
PRODUCT.md              durable product truth. Read before changing copy.
verify-cloud-audit.cjs  browser QA harness (Playwright + axe-core)
docs/
  original-brief-2026-09-08.md  the untouched original brief
  hover-variants.html           13 hover treatments for the hero headline
```

## Hosting

The ZopCloud service runs this as a container listening on **port 8000**, so the
repo serves itself rather than relying on static-file hosting:

- `Dockerfile` + `nginx.conf` — nginx serving the page on 8000. Only
  `index.html`, `styles.css`, `audit.js` and `assets/` are copied into the
  image, so the internal records never ship.
- `server.cjs` + `npm start` — a zero-dependency Node fallback on
  `$PORT` (default 8000), used only if the build runs a Node buildpack
  instead of the Dockerfile.

Both serve the identical four things. Nothing else is required: there is no
build step and no runtime dependency.

## Preview

```bash
npm run preview
```

Then open `http://127.0.0.1:8792`. Any static file server works; there is nothing to build.

## Verify

```bash
npm install && npx playwright install chromium && npm run verify
```

Nine checks: rendering and the 24-hour offer, report tabs with keyboard navigation, form validation and preview-mode safety, layout at 320/390/768 without horizontal overflow, automated WCAG A/AA on desktop and mobile, reduced-motion, a mocked lead relay covering failure and unconfirmed-receipt paths, and a console-error check. It sends no live lead.

If `npx playwright install` is not an option, the harness can drive an installed Google Chrome by changing its launch call to `chromium.launch({ headless: true, channel: 'chrome' })`.

## Launch blockers

Carried over from the brief, plus two claim issues found during review. All are recorded in `PRODUCT.md`.

| # | Blocker |
|---|---|
| 1 | **Lead destination.** Set `endpoint` and `privacyUrl` in `audit.js` to approved HTTPS addresses. The relay must return `{"success": true}` only after durable receipt, deduplicate by `requestId`, check origin, validate input and rate-limit server-side. No CRM credential belongs in client code. |
| 2 | **Privacy notice.** Approved and live at the `privacyUrl` address. |
| 3 | **Verified lead receipt.** One real end-to-end test lead confirmed in the CRM. No live lead has ever been sent from this page. |
| 4 | **"One free audit per organization every 30 days."** Asserted as fact in the first FAQ but never confirmed. Confirm the limit is enforceable, or cut the sentence. |
| 5 | **Databricks and Snowflake coverage.** Both marks sit in a row labelled "FOR YOUR CLOUD". Neither is an IaaS cloud, and the confirmed audit scope is compute and block storage via cloud read-only access. Confirm the coverage, relabel the row, or remove the two marks. |
| 6 | **Final URL and share metadata.** `og:url` and a canonical URL are unset; confirm `og:` fields against the final destination. |
| 7 | **Remove `noindex, nofollow`** — last, and only once 1 to 6 are closed. |

## Ground rules for changes

`PRODUCT.md` is the authority on what may be claimed. The short version:

- The 24-hour promise always means the **free** audit, and always starts when read-only access is ready — never at form submission.
- There is **no proof on hand**: no customers, testimonials, case studies or measured outcomes. Never fabricate any to fill a section.
- Report figures on the page are format demonstrations, not customer results.
- The optional $5,000 report stays subordinate to the free offer and never becomes a competing conversion path.
- Never show success for a lead that was not durably received.
- Brand is locked: the zop.dev umbrella lockup, `#F58549` / `#2A4494` / `#7FB236` / `#0F0F12`, Space Grotesk headings, Inter body, square corners.

Two accessibility conventions worth keeping: ink on the orange accent is the readable pairing at 7.1:1 while light text on orange fails at 2.4:1; and hero entrance motion animates transform only, never opacity, because an element measured mid-fade reads as low-contrast and fails the contrast gate.
