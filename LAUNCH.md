# Launch checklist

The page is **not live-ready** until the three items in "Blocked on values" are
filled in. Everything else on this list is already done in the code.

Current live revision is **#16**, which does **not** include the work in this
file's commit. Nothing here has been deployed.

## Blocked on values (someone has to decide these)

| # | What | Where | Why it blocks |
|---|---|---|---|
| 1 | Lead endpoint URL | `AUDIT_CONFIG.endpoint` in `audit.js`, **and** the `action` attribute on `<form id="audit-form">` in `index.html` | Until this is an `https://` URL the form validates and sends nothing. Ads would buy clicks and return zero leads. Set both places: `audit.js` covers the normal path, the HTML attribute covers JavaScript being blocked. |
| 2 | Privacy notice URL | `AUDIT_CONFIG.privacyUrl` | Required by the ad platforms' lead policies, and by GDPR if the campaign runs in the EU or UK. Renders as a link under the form the moment it is set. |
| 3 | Google Ads conversion label | `AUDIT_CONFIG.conversion.googleAdsSendTo`, format `AW-XXXXXXXXX/AbC-D_efG-h12` | Without it smart bidding has no signal and the campaign optimises on clicks. The GA4 event name and the Meta event are already set and need no ID. |

The endpoint contract: accept `POST` JSON, return `2xx` with JSON
`{ "success": true }` **only once the lead is durably stored**. Anything else is
treated as a failure, the visitor keeps what they typed, and no conversion
fires. Retries reuse the same `requestId`, so dedupe on that field.

The payload also carries `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term`, `gclid` and `msclkid` when present, so the CRM can
attribute the lead to the ad that produced it.

## Also add before spend

- **A tag manager or gtag snippet.** The page pushes to `window.dataLayer` and
  calls `gtag`/`fbq` if they exist, and no-ops if they do not. Nothing else has
  to change.
- **Mark the GA4 `generate_lead` event as a key event** so it can be imported
  into Google Ads.
- **A decision on the portrait.** A stand-in with a visible "Placeholder image"
  badge currently sits beside the McAfee quote. It is honest, but it tells paid
  visitors the page is unfinished, and it sits on the page's only social proof.
  Either supply a cleared photograph of the person quoted, or remove the
  portrait and go back to the `MT` monogram. See `PRODUCT.md`.
- **Settle the platform coverage question.** The `PLATFORMS AUDITED` row shows
  Databricks, Snowflake, Kubernetes and OpenShift. `PRODUCT.md` records this as
  owner-asserted, not confirmed. It is the claim on the page most likely to
  attract a policy complaint or an awkward customer conversation.

## The A/B test

Three copy variants, reachable two ways so the ad platforms can use whichever
they prefer:

| Variant | URL | Angle | Headline |
|---|---|---|---|
| A (control) | `/` or `/?v=a` or `/a` | Speed | Find your cloud waste. **In 24 hours.** |
| B | `/?v=b` or `/b` | Specificity | Your 20 biggest savings. **Named**, with the evidence. |
| C | `/?v=c` or `/c` | Risk reversal | Find your cloud waste. **Without touching it.** |

The tidy aliases need no server route: `server.cjs` already falls through
unknown paths to `index.html`, and the selector reads `location.pathname`.

**Only the headline and the lead vary.** The call to action is identical in all
three, deliberately: changing two things at once makes a winner impossible to
attribute. If you want to test the CTA, run that as a second round against
whichever headline wins.

The variant is chosen before first paint by a short inline script in the head,
so there is no flash of the control. Variant A is the default in the CSS
cascade, so the page still reads correctly with JavaScript blocked and an
unrecognised value like `?v=z` falls back to A.

Every lead carries `variant` in its payload, and the same value goes into the
`dataLayer` event, so the CRM and analytics both know which copy converted.

## Verifying a change

```bash
node verify-cloud-audit.cjs
```

Ten checks, including a mocked relay that proves a conversion fires **once**, on
confirmed receipt only, never on a failure or an unconfirmed `200`, deduplicated
by request ID, with the trackable `?submitted=1` success URL and the privacy
link present. It patches `AUDIT_CONFIG` by string replacement, so if you reshape
that object the harness will tell you rather than hanging.

## Notes for whoever touches the fonts

`assets/*.woff2` are subset to the 117 codepoints this page renders, which is
why they are 39KB instead of 71KB. The full faces are kept in
`docs/fonts/*.full.woff2` and the exact unicode list in
`docs/fonts/subset-unicodes.txt`.

Inter keeps its `wght 100-900` variable axis because the stylesheet declares
`font-weight: 100 900`. Space Grotesk is instanced to the single weight 700 it
is declared at. Both keep all layout features, because the report uses
`font-variant-numeric: tabular-nums`.

**Neither face contains an arrow glyph** (`→`, U+2192) — that was true of the
source files, not a result of subsetting. If arrows return to the copy, they
will fall back to a system font. Re-subset from `docs/fonts` after any copy
change that introduces characters outside the list.
