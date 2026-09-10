/* THE THREE VALUES A LAUNCH NEEDS. Nothing else has to change to go live.
 *
 *   endpoint    Where the lead goes. Contract: accepts POST JSON, returns 2xx
 *               JSON { success: true } ONLY once the lead is durably stored.
 *               Anything else is treated as a failure and the visitor keeps
 *               their typed details. Until this is an https URL the form is in
 *               preview mode: it validates, sends nothing, stores nothing, and
 *               says so. Also set the same URL as the <form action> in
 *               index.html so the form still works with JavaScript blocked.
 *   privacyUrl  Public privacy notice. Required by the ad platforms' lead
 *               policies, and by GDPR if the campaign runs in the EU or UK.
 *               Renders as a link under the form as soon as it is set, whether
 *               or not the endpoint is.
 *   conversion  Ad-platform conversion identifiers. Leave any of them empty and
 *               that platform is simply not notified. See fireConversion below.
 */
/* Which copy variant the visitor saw. Set before paint by the inline script
 * in index.html, so it is already on the root element by the time this runs. */
const VARIANT = document.documentElement.getAttribute('data-variant') || 'a';

const AUDIT_CONFIG = Object.freeze({
  endpoint: '',
  privacyUrl: '',
  campaign: 'free-cloud-audit-24h',
  conversion: Object.freeze({
    // Google Ads: 'AW-XXXXXXXXX/AbC-D_efG-h12_34-567'
    googleAdsSendTo: '',
    // GA4 event name. Mark it as a key event in GA4 to import it into Ads.
    ga4Event: 'generate_lead',
    // Meta: fires the standard 'Lead' event when the Pixel is present.
    metaEvent: 'Lead',
  }),
});

/* Tell the ad platforms a lead landed, once, keyed on the request id so a retry
 * cannot double-count. Every call is guarded: with no tag manager on the page
 * this is a no-op, which is what keeps preview mode silent. */
const reported = new Set();
function fireConversion(id) {
  if (!id || reported.has(id)) return;
  reported.add(id);
  const c = AUDIT_CONFIG.conversion;
  const detail = { campaign: AUDIT_CONFIG.campaign, request_id: id, form: 'free-cloud-audit', variant: VARIANT };
  // Tag Manager and anything else listening on the data layer.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'audit_request_submitted', ...detail });
  if (typeof window.gtag === 'function') {
    if (c.ga4Event) window.gtag('event', c.ga4Event, { ...detail, transaction_id: id });
    if (c.googleAdsSendTo) window.gtag('event', 'conversion', { send_to: c.googleAdsSendTo, transaction_id: id });
  }
  if (typeof window.fbq === 'function' && c.metaEvent) {
    window.fbq('track', c.metaEvent, { content_name: AUDIT_CONFIG.campaign }, { eventID: id });
  }
  // A distinct URL for the success state, so a destination-based conversion
  // goal works as a fallback and the step is visible in analytics. replaceState
  // keeps the back button on the page the visitor arrived from.
  try {
    const url = new URL(location.href);
    url.searchParams.set('submitted', '1');
    history.replaceState({ submitted: true }, '', url);
  } catch (error) { /* history is unavailable in some embedded webviews */ }
}

const EXAMPLES = {
  compute: {
    total: '$4,280',
    rows: [
      ['api-worker-prod-03', 'Oversized compute instance', '8% average CPU', 8, '$2,480'],
      ['staging-runner-02', 'Running outside working hours', '4% average CPU', 4, '$1,160'],
      ['batch-worker-07', 'Oversized compute instance', '12% average CPU', 12, '$640']
    ]
  },
  storage: {
    total: '$740',
    rows: [
      ['app-data-volume-04', 'Provisioned capacity exceeds use', '18% capacity used', 18, '$380'],
      ['analytics-volume-08', 'Provisioned IOPS exceed demand', '6% IOPS utilization', 6, '$220'],
      ['dev-data-volume-02', 'Provisioned capacity exceeds use', '22% capacity used', 22, '$140']
    ]
  }
};

const tabs = [...document.querySelectorAll('.report-tabs [role="tab"]')];

function activateCategory(tab) {
  const example = EXAMPLES[tab.dataset.category];
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  document.getElementById('findings-panel').setAttribute('aria-labelledby', tab.id);
  document.getElementById('sample-total').innerHTML = `${example.total}<span>/mo</span>`;
  // All report values are fixed illustrative examples, never visitor input.
  document.getElementById('findings-body').innerHTML = example.rows.map(([name, finding, evidence, use, saving]) =>
    `<tr><td><span class="resource-name"><svg class="icon resource-icon" aria-hidden="true"><use href="#instance"/></svg> ${name}</span><span class="resource-detail">${finding}</span><span class="mobile-evidence">${evidence}</span></td><td><span class="evidence-meter"><i style="--usage:${use}%"></i></span><span class="evidence-value">${evidence}</span></td><td class="saving">${saving} <svg class="icon saving-trend" aria-hidden="true"><use href="#trend"/></svg></td></tr>`
  ).join('');
}

/* The three deliverable descriptions are the report's view switcher: each one
   shows a differently designed card for the facet it describes. */
const viewTabs = [...document.querySelectorAll('.dg-item')];
const split = document.querySelector('.deliverable-split');
const deck = document.querySelector('.report-deck');
const views = [...document.querySelectorAll('.report-view')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* The cards cross-slide. The outgoing one travels its own width to the left;
   the incoming one starts off-stage right and is held there until the outgoing
   card is nearly gone, so the two overlap only at the handover instead of
   swapping in place. Both are on stage together during the crossing, which is
   the point, and the report stage clips the travel.

   Web Animations API rather than a keyframe: a keyframe restarts from zero, so
   clicking quickly through the three pointers stuttered. These cancel and
   retarget, run off the main thread, and sequence on a promise instead of a
   timer guessing at a percentage of a keyframe. */
/* Both halves ease in and out rather than snapping away on a front-loaded
   ease-out, which spent 40% of the incoming card's travel in its first 35ms:
   the card appeared near its destination and crept the last stretch instead of
   reading as arriving from the right.

   The two curves are not the same, though, and that is deliberate. The
   outgoing card wants a hard ease-in-out: it lingers, accelerates away, and is
   gone. The incoming card cannot use the same curve, because a steep ease-in
   leaves it parked off-stage for its first 130ms and the stage sits empty in
   between. Its curve starts moving sooner and still decelerates into place. */
const EASE_LEAVE = 'cubic-bezier(.77,0,.175,1)';
const EASE_ARRIVE = 'cubic-bezier(.4,0,.2,1)';
const OUT_MS = 340;
const IN_MS = 400;
/* Overlapped rather than sequential, and the number comes from the geometry.
   The incoming card has to travel 5.6% of its distance before its edge clears
   the stage and it becomes visible at all, which on its curve takes 56ms. At
   120ms it therefore appears at ~180ms, while the outgoing card is still on
   stage until ~250ms. That shared stretch is what makes it read as one
   crossing instead of two moves with a pause between them. */
const HANDOVER_MS = 120;
let running = [];
let settleTimer;

/* Each card rests at its own slight tilt, like a separate sheet of paper. The
   travel has to carry that tilt, or the transform overrides it for the length
   of the animation and it snaps back the moment the fill is released. */
function tiltOf(card) {
  return getComputedStyle(card).getPropertyValue('--rot').trim() || '0deg';
}

function settle(outgoing) {
  clearTimeout(settleTimer);
  if (outgoing) outgoing.hidden = true;
  running.forEach(animation => animation.cancel());
  running = [];
}

/* Motion is decoration over a working switch, never a gate on it: every early
   return below still changes the view. */
function activateView(tab) {
  const panel = document.getElementById(tab.getAttribute('aria-controls'));
  const outgoing = views.find(view => !view.hidden);

  if (!panel || !deck || !deck.animate || outgoing === panel) { applyView(tab); return; }

  // Reduced motion keeps the opacity change, which is what tells you the view
  // switched, and drops the travel.
  if (reduceMotion.matches) {
    applyView(tab);
    panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'linear' });
    return;
  }

  settle();
  applyView(tab, outgoing);
  panel.hidden = false;

  const outTilt = tiltOf(outgoing);
  const inTilt = tiltOf(panel);

  // No fade on the way out. The card travels clear of the stage's padding box,
  // so it leaves the frame rather than dissolving in place.
  const outMove = outgoing.animate([
    { transform: `translateX(0) rotate(${outTilt})` },
    { transform: `translateX(-118%) rotate(${outTilt})` },
  ], { duration: OUT_MS, easing: EASE_LEAVE, fill: 'forwards' });

  // fill:backwards holds the incoming card off-stage right through the
  // handover delay, instead of flashing at its resting position first.
  const inMove = panel.animate([
    { transform: `translateX(118%) rotate(${inTilt})` },
    { transform: `translateX(0) rotate(${inTilt})` },
  ], { duration: IN_MS, delay: HANDOVER_MS, easing: EASE_ARRIVE, fill: 'backwards' });
  const inFade = panel.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 130, delay: HANDOVER_MS, easing: 'linear', fill: 'backwards' });

  running = [outMove, inMove, inFade];
  // cancel() rejects the pending promise, so an interrupted swap lands in the
  // rejection handler rather than throwing.
  inMove.finished.then(() => settle(outgoing), () => {});
  // If a frame is dropped or the promise never settles, nothing may be left
  // holding a forwards fill off-stage.
  settleTimer = setTimeout(() => settle(outgoing), HANDOVER_MS + IN_MS + 400);
}

function applyView(tab, keepVisible) {
  viewTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  if (split) split.dataset.view = tab.dataset.view;
  const panel = document.getElementById(tab.getAttribute('aria-controls'));
  views.forEach(view => { view.hidden = view !== panel && view !== keepVisible; });
}

/* Hold the deck at the tallest card so switching never shifts the page below
   it. Measured after layout because each card is a different height. This runs
   at every width: on mobile the pointers sit under the deck, so a resize moved
   the button the reader had just tapped.

   Each card is measured on its own rather than with all three unhidden. They
   share one grid cell, so measuring them together lets the row size to the
   flexible chart's minimum instead of the card's comfortable height, which
   under-measured the evidence card by 113px at 320px. */
function lockDeckHeight() {
  if (!deck || running.length) return;
  const shown = views.find(view => !view.hidden);
  deck.style.removeProperty('--deck-h');
  let tallest = 0;
  views.forEach(view => {
    views.forEach(other => { other.hidden = other !== view; });
    tallest = Math.max(tallest, view.offsetHeight);
  });
  views.forEach(view => { view.hidden = view !== shown; });
  if (tallest) deck.style.setProperty('--deck-h', `${Math.ceil(tallest)}px`);
}

/* Both tablists: click to select, arrow keys to move. The deliverable pointers
   are a vertical tablist, so Down and Up lead and Right and Left also work. */
viewTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateView(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % viewTabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + viewTabs.length) % viewTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = viewTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    activateView(viewTabs[next]);
    viewTabs[next].focus();
  });
});
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateCategory(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    activateCategory(tabs[next]);
    tabs[next].focus();
  });
});

activateCategory(tabs[0]);
lockDeckHeight();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockDeckHeight);
let measureTimer;
addEventListener('resize', () => {
  clearTimeout(measureTimer);
  measureTimer = setTimeout(lockDeckHeight, 150);
});

const form = document.getElementById('audit-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('button[type="submit"]');
const submitLabel = document.getElementById('submit-label');
submit.disabled = false;
/* Sending and the privacy notice are separate concerns. The old check required
 * both before either happened, which meant a configured privacy notice stayed
 * invisible while the endpoint was still being approved. */
const live = /^https:\/\//.test(AUDIT_CONFIG.endpoint);
const hasPrivacy = /^https:\/\//.test(AUDIT_CONFIG.privacyUrl);
let requestId;
let inFlight = false;

if (live) submitLabel.textContent = 'Get my free audit';
if (hasPrivacy) {
  const privacyLink = document.createElement('a');
  privacyLink.href = AUDIT_CONFIG.privacyUrl;
  privacyLink.textContent = 'Privacy notice';
  privacyLink.style.textDecoration = 'underline';
  document.getElementById('form-terms').append(' ', privacyLink, '.');
}
/* With JavaScript blocked the button never enables and the form posts natively
 * to its action, so the noscript block in index.html has to match reality. */
if (live) form.setAttribute('action', AUDIT_CONFIG.endpoint);

function showStatus(message, state) {
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = false;
  status.focus({ preventScroll: true });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (inFlight || !form.reportValidity()) return;
  const data = new FormData(form);
  if (String(data.get('company_url') || '').trim()) return;
  const name = String(data.get('name') || '').trim();
  if (!name) {
    showStatus('Please enter your name.', 'error');
    document.getElementById('full-name').focus();
    return;
  }
  if (!live) {
    showStatus('Preview complete. Your form is valid, but no request was sent and no details were stored. The live page will send the access setup instructions after your request is received.', 'preview');
    return;
  }
  status.hidden = true;
  inFlight = true;
  submit.disabled = true;
  submitLabel.textContent = 'Sending your request…';
  form.setAttribute('aria-busy', 'true');
  requestId ||= crypto.randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const params = new URLSearchParams(location.search);
  const attribution = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'msclkid']) {
    if (params.has(key)) attribution[key] = params.get(key).slice(0, 300);
  }
  try {
    const response = await fetch(AUDIT_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        name, email: String(data.get('email')).trim(), provider: data.get('provider'),
        campaign: AUDIT_CONFIG.campaign, source: 'Landing Page', variant: VARIANT,
        page: location.origin + location.pathname, requestId, ...attribution
      })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) throw new Error('Lead receipt was not confirmed');
    showStatus('Request received. We’ll email your read-only access setup instructions. Your free results will arrive within 24 hours after access is ready.', 'success');
    // Only here, after the endpoint has confirmed the lead is stored. Never on
    // a click, never on a validation pass, never on an unconfirmed 200.
    fireConversion(requestId);
    form.reset();
    requestId = undefined;
  } catch (error) {
    showStatus(error.name === 'AbortError'
      ? 'We couldn’t confirm receipt in time. Your details are still here. Please retry; we’ll use the same request reference to avoid a duplicate.'
      : 'We couldn’t confirm your request. Your details are still here. Please try again.', 'error');
  } finally {
    clearTimeout(timeout);
    inFlight = false;
    submit.disabled = false;
    submitLabel.textContent = 'Get my free audit';
    form.removeAttribute('aria-busy');
  }
});

/* Reveal each process step as it enters the viewport. Guarded twice: the CSS
 * that hides them is inside prefers-reduced-motion:no-preference, and without
 * IntersectionObserver every step is marked in immediately, so no step can be
 * left invisible by a failure here. */
const stepFlow = document.querySelector('.process-flow');
const steps = [...document.querySelectorAll('.process-step')];
if (stepFlow && steps.length && 'IntersectionObserver' in window
    && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Opt into hiding only now that the observer is certain to run.
  stepFlow.classList.add('js-reveal');
  const stepObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  steps.forEach(step => stepObserver.observe(step));
  // Anything already on screen at load reveals immediately, and a late
  // safety net guarantees nothing is still hidden if the observer misfires.
  setTimeout(() => steps.forEach(step => step.classList.add('is-in')), 2500);
}

/* Every call to action is an anchor to the form, which scrolled the reader
   there and then left them to find the first field. On a pointer device the
   cursor is already elsewhere, so the field takes focus for them. Not on
   touch: raising the keyboard over the form the reader just arrived at hides
   the thing they came to look at. */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('a[href="#request"]').forEach(link => {
    link.addEventListener('click', () => {
      const firstField = document.getElementById('full-name');
      if (!firstField) return;
      // After the smooth scroll settles, and without fighting it.
      setTimeout(() => firstField.focus({ preventScroll: true }), 620);
    });
  });
}

/* The sticky bar is the phone's persistent call to action, so it stays out of
   the way whenever a real one is already on screen: the hero's button at the
   top of the page, and the form itself at the bottom. Without this it sat
   under the hero button on first paint, showing the same label twice. */
if ('IntersectionObserver' in window) {
  const mobileCTA = document.querySelector('.mobile-cta');
  const rivals = [document.getElementById('request'), document.querySelector('.hero-actions')].filter(Boolean);
  const onScreen = new Set();
  const ctaObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) onScreen.add(entry.target);
      else onScreen.delete(entry.target);
    });
    mobileCTA.classList.toggle('is-hidden', onScreen.size > 0);
  }, { threshold: 0 });
  rivals.forEach(el => ctaObserver.observe(el));
}
