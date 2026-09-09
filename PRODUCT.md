# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences are all in scope for this campaign, confirmed by the owner. They differ in what they can grant and what convinces them, and copy has to serve all four without narrowing to one:

- **Platform / DevOps lead.** Owns the cloud accounts and can grant read-only access without escalating. Judges the usage evidence directly and acts on the shortlist.
- **Engineering manager / Head of Engineering.** Owns the bill as a line item but delegates access setup. Cares about how much is recoverable against how little team time it costs.
- **Finance / FinOps.** Owns cost accountability without owning the infrastructure. Needs the savings figure and a defensible basis, then hands remediation to engineering.
- **Founder / CTO at a startup.** No dedicated FinOps function, feels the bill personally, little time to investigate.

The practical consequence: the person who wants the number is often not the person who can grant access. The access step must read as low-risk and delegable, and the savings figure must be defensible to someone who will not inspect the resources themselves.

## Product Purpose

A free cloud cost audit, offered as a lead-generation campaign. The visitor requests the audit, arranges scoped read-only access, and receives their 20 largest compute and block-storage savings within 24 hours of that access being ready. Each finding names the actual resource, shows the usage evidence behind it, and carries any related security or compliance flags. The free audit also reports aggregate counts and estimated cost for idle and orphaned resources.

Success is a qualified request with real read-only access granted, not a form fill. The audit's own value has to survive the visitor never buying anything.

## Positioning

Named resources with the usage evidence attached, delivered free within 24 hours of read-only access being ready. The differentiator is the specificity and the deliverable being real work rather than a calculator or an estimate: a shortlist a team can act on, produced from their own metrics, at no cost and with no change to their infrastructure.

The audit is strictly read-only. It inspects configuration and usage and never deploys, resizes, stops or deletes a resource. The customer controls the access grant and can revoke it. This is a positioning claim as much as a technical one, because it is what makes the ask small enough to say yes to.

## Operating Context

- The visitor requests the audit, receives access setup instructions by email, and their team reviews and grants scoped read-only permissions. The 24-hour clock starts when the required access is ready, not at form submission.
- Supported clouds as presented: AWS, Microsoft Azure, Google Cloud. Databricks and Snowflake were added to the platform row at the owner's request; see the open question in Capabilities and Constraints.
- Analysis draws on up to 90 days of usage metrics.
- Missing access or missing metric history is flagged to the customer before analysis, and gaps must never be presented as collected evidence.
- The form collects name, work email and cloud provider only. No phone number, no cloud credentials, no mandatory sales call.

## Capabilities and Constraints

**Confirmed by the owner:**

- Free audit delivered within 24 hours once read-only access is ready.
- Up to 90 days of usage metric history genuinely available across supported providers.
- Optional full report at $5,000 one-time, delivered in five business days. It names the additional findings including idle and orphaned resources, extends recommendations to databases, networking, functions, storage and caches, and includes remediation steps, engineer review and one re-run at six months. No subscription, no automatic upgrade.

**Open, and must not be stated as fact until settled:**

- **One free audit per organization every 30 days.** Still not confirmed, and **removed from the page on 2026-09-09**. The first FAQ had asserted the limit as fact; the sentence is gone rather than softened, because an unenforceable limit stated as fact is the worst of the three options. It goes back verbatim the moment the limit is confirmed and enforceable.
- **Platform coverage breadth (partly resolved, 2026-09-09).** The row is now labelled **"PLATFORMS AUDITED"**, taken from the sibling ZopNight audit page, which uses `aria-label="Platforms audited"` for the same idea. That replaces "FOR YOUR CLOUD", which asserted five and now seven marks were all clouds. The label is honest about what it claims. What remains open is the underlying fact: the confirmed audit scope is compute and block storage reached through cloud read-only access, which does not by itself establish that Databricks, Snowflake, Kubernetes or OpenShift spend is audited. All four are in the row at the owner's explicit instruction, and the sibling page groups the same seven platforms under the same label, so this is **owner-asserted coverage, not published evidence**. Confirm the operational reality before public launch.
- Savings are always estimates derived from configuration, usage and pricing. They are never guaranteed, and the customer validates workload needs before acting.

**Constraints:** static single-page campaign with no framework dependencies. Lead delivery is not configured; the form is in preview mode with `endpoint` and `privacyUrl` empty, and the page carries `noindex, nofollow`.

## Brand Commitments

- **Brand owner: the zop.dev umbrella**, confirmed. Umbrella logo lockup, orange accent, ink band with cream text. No endorsement lockup exists for the umbrella. This campaign is deliberately not filed under ZopNight despite ZopNight being the designated cost and infrastructure brand.
- Locked palette: `#F58549` orange, `#2A4494` blue, `#7FB236` green, `#0F0F12` ink, neutral white and gray. Orange directs attention to conversion, blue describes evidence, green describes potential savings.
- Locked type: Space Grotesk headings, Inter body.
- Always use the official supplied logo files. Never set "zop.dev" as text.
- Square corners throughout. Button hover signature is a 4px lift with a hard offset block.
- Voice: direct and confident, short sentences, specific numbers, periods rather than em dashes. No em dashes anywhere.
- Prohibited: manufactured urgency or scarcity, ROI guarantees, testimonials, compliance certification claims, stock cloud photography, decorative infrastructure imagery, customer logos without permission, and invented outcome statistics.

## Evidence on Hand

**Correction, 2026-09-09.** An earlier version of this record said no proof existed. That was wrong: it was written from the campaign brief alone, without checking the production site. **zop.dev publishes real, attributable proof**, and it is reusable here because the company has already put it in public.

Published on the zop.dev homepage:

- **Named and attributable.** Mahesh Tyagarajan, VP Platform Engineering, McAfee: "Zop has been instrumental in simplifying our multi-cloud operations, a must-have for any organization managing complex cloud environments." Now quoted in the campaign's process band. This is the only named-company proof available and the safest, since it carries no numeric claim.
- **Anonymized under NDA, and directly about cost auditing.** Director, Cloud Platform, Fortune 1000 software company: "Azure Advisor measured 14% of the opportunity. The other 86% was accumulating silently every month, until zopnight surfaced it in four weeks." Topically the strongest asset, but unused so far for two reasons: the four-week timeline reads against this page's 24-hour promise, and an 86% figure on a lead-generation page risks being read as a guarantee, which the brief prohibits.
- **Anonymized under NDA.** Cloud platform lead, Fortune Global 2000 FMCG, India: "Manual cost governance turned into a continuously enforced operating model. SAP HANA, in-house apps, third-party systems. We got fast value without re-engineering how anything is built."

`zop.dev/customers` additionally names Flexflow, Linarc and Zopping.

**Now on the campaign page, 2026-09-09.** Sourced from the sibling ZopNight audit variant at `~/Zopnight Landing Page Audit /variant-apple.html` and each figure verified against live zop.dev before use:

- McAfee estate scale under the quote: *12 AWS accounts, 48 Kubernetes clusters, 1,000+ req/sec in production.*
- **The evidence band, restructured 2026-09-09.** Four platform-scale figures verified against the live zop.dev homepage on the day: *$30M+ annualised cloud spend under management, 550K+ resources tracked since launch, 220M+ data points processed monthly, 353 resource types covered across 6 platforms.* The sibling draft's `$12M+` and `275,000+` are **stale** and were not used. Beside them, the team-pedigree block.
- **The real-engagement figures are no longer on the page.** *2,140 resources read across 3 subscriptions, 15 to 287 findings, $14,820 recovered monthly,* shared under NDA by a Fortune 1000 software company on Azure over a four-week window. They ran briefly as a compressed line beneath the four platform figures and were **removed at the owner's instruction on 2026-09-09**. The figures are real and still available; they are simply unused. If they are ever restored, the caveat that this was a full ZopNight engagement and **not** the free 24-hour audit is load-bearing and must come back with them, or the numbers read as a 24-hour outcome. Do not treat their absence from the page as evidence that no customer proof exists.

**Available but deliberately not used.** All published, all barred by this campaign's own brief:

- **ISO 27001:2022, SOC 2 Type II** — the brief prohibits compliance certification claims.
- **Year-1 ROI 2.8x, payback under 5 months** — the brief prohibits ROI guarantees.

**Present in that variant but published nowhere, so treated as unverified draft copy and not imported:** `$15M+ cloud spend under management`, `154 teams`, `MeitY-empaneled`, `IRDAI`. The variant's marquee strings these together with the genuine certifications, so that line cannot be reused wholesale.

**Team-pedigree marks, resolved 2026-09-09 and now on the campaign page.** An earlier version of this record said Y Combinator did not appear on live zop.dev. That was wrong. The live homepage hero publishes **"Built by people from HashiCorp · AWS · Accenture · OYO · YC · MIT · IIT Bombay"**, and those seven are reproduced in the evidence band. This is a claim about where the team came from, not a customer endorsement, which is why it is usable where a customer logo strip still is not. All seven render in one flat ink (`#5c6478`) so no third-party brand colour is reproduced. **Meesho appears in the sibling draft but not on live zop.dev, so it is left out.**

**A portrait for the McAfee quote, 2026-09-09.** The page carries a stand-in portrait cropped from `~/Downloads/linkedin-sales-solutions-pAtA8xe_iVM-unsplash.jpg`, whose macOS `kMDItemWhereFroms` records it as `https://images.unsplash.com/photo-1560250097-0b93528c311a` — an Unsplash photo published by LinkedIn Sales Solutions, **not a photograph of the person quoted**. It is Unsplash-licensed and free for commercial use, so the licence is not the constraint. The constraint is the caption: a face under "Mahesh Tyagarajan, VP Platform Engineering, McAfee" tells every visitor that the face is his. **It therefore ships with a visible "Placeholder image" badge, and the badge is load-bearing, not decoration.** Removing the badge while the stand-in is in place turns the page into a false statement about a named person at a named company. Replace the image with a cleared photograph of him and the badge goes with it. Check `kMDItemWhereFroms` on any candidate portrait first.

**Still genuinely absent: customer logo files.** The marketing site's `public/` holds only AWS, Azure, GCP, AWS Marketplace and ZopDev's own marks. A customer logo strip cannot be built without sourcing third-party trademarks and confirming permission, so requests for one stay blocked on that, not on design.

No benchmark figures or measured outcome statistics beyond the quotes above exist. Nothing may be fabricated to fill a proof slot; an absent proof section is still better than an invented one.

What else exists:

- An illustrative example report on the campaign page. Its figures are format demonstrations, explicitly not customer results and not guaranteed savings, and are labelled as such on the page.
- Official ZopDev logo files, and official AWS, Azure, Google Cloud and Databricks marks from the ZopDev Brand Kit. The Snowflake mark was downloaded from the CC0-licensed Simple Icons package, which cites snowflake.com/brand-guidelines as its source; its brand hex #29B5E8 came from that package's data rather than from memory. Simple Icons independently lists Databricks as #FF3621, matching the Brand Kit asset already in use.
- The reference at `platops.com/services/cloud/cloud-cost-audit/` supplied context for explaining deliverables and the access process only. Its savings statistics, customer claims, pricing and guarantees are not ZopDev evidence and must never be reused as such.

## Product Principles

1. **The 24-hour promise always means the free audit, always after read-only access is ready.** It never attaches to the paid report and never starts at form submission.
2. **Specificity is the product.** A named resource with its usage evidence beats any aggregate claim. Where evidence is missing, say so rather than smoothing over it.
3. **Never represent unconfirmed operational coverage as fact.** Metric gaps, unsupported platforms and unsettled limits get stated plainly or omitted.
4. **The free offer stays primary.** The optional paid report remains subordinate and never becomes a competing conversion path.
5. **One primary action per page: request the free audit.** No secondary conversion path competes with it.
6. **Never show success for an unsubmitted lead,** and never persist personal information while in preview mode.

## Accessibility & Inclusion

WCAG 2.1 A/AA is the working standard, enforced on this campaign by an automated axe-core gate over both desktop and mobile in `verify-cloud-audit.cjs`. Reduced-motion preferences are respected. Automated coverage plus visual inspection is not an accessibility certification and should not be described as one.

Three conventions this project has already had to learn:

1. Ink text on the orange accent is the accessible pairing at 7.1:1, while light text on orange fails at 2.4:1.
2. **Entrance motion animates transform only, never opacity.** An element measured mid-fade reads as a low-contrast foreground and fails the contrast gate. This first bit the hero; on 2026-09-09 it bit the process-step reveal the same way, at 768 and 390 only, where clicking a report view scrolls the steps into the viewport just as axe samples them. Both now translate without fading. Do not add a fade back to either.
3. **Motion.** Press feedback exists on every pressable element; hover effects are gated behind `@media (hover: hover) and (pointer: fine)` because a tap on a touch device otherwise leaves a hover tag stuck open. The report card swap runs on the Web Animations API rather than a CSS keyframe: a keyframe restarts from zero, so clicking quickly through the three pointers stuttered. Reduced motion keeps opacity and colour and drops movement; a blanket `transition: none` kill removes the feedback that tells you the state changed.
4. **The phone breakpoint is 440px, not 390px.** 390 catches an iPhone 12/13/14 and nothing since: a 393px iPhone 15/16, a 402 Pro and a 430 Pro Max all fell through to the tablet rules, which is why the hero kept its desktop line break and its 51px type on a real phone. Anything phone-specific belongs in the 440px block.
5. **The report deck's height is locked to its tallest card at every width.** On mobile the pointers sit under the deck, so letting it resize per view moved the button that had just been tapped by up to 127px. Each card is measured on its own, not with all three unhidden, because they share one grid cell and measuring them together sizes the row to the flexible chart's minimum.
6. **11px is the floor for functional text, 12px for values and short prose.** The small end of the scale had drifted down to 5.7px on the report masthead, with roughly sixty declarations between 8px and 10px. Weight, tracking and colour carry the label-versus-value distinction that size alone used to carry.

A note on the contrast gate itself: axe-core cannot resolve a foreground over a dashed-border region or a `mix-blend-mode` layer, and reports neither a pass nor a violation there. The bundled Impeccable detector computes those pairs statically and caught two real failures axe had cleared. Run both.
