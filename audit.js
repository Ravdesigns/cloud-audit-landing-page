/* Set both values only after the lead destination and privacy notice are approved.
 * Endpoint contract: POST JSON, then return 2xx JSON { success: true } only when
 * the lead is durably accepted. Preview mode never sends or stores personal data.
 */
const AUDIT_CONFIG = Object.freeze({ endpoint: '', privacyUrl: '', campaign: 'free-cloud-audit-24h' });

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
const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
const OUT_MS = 220;
const IN_MS = 280;
/* The curve is strongly front-loaded: it covers 95% of the travel in the first
   44% of the duration. So the outgoing card is down to its last 5% on stage at
   ~95ms, which is where the incoming card starts. Measured, not guessed. */
const HANDOVER_MS = 95;
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

  // No fade on the way out. The stage clips the card at its own edge, which is
  // what makes it read as leaving a frame rather than dissolving in place.
  const outMove = outgoing.animate([
    { transform: `translateX(0) rotate(${outTilt})` },
    { transform: `translateX(-104%) rotate(${outTilt})` },
  ], { duration: OUT_MS, easing: EASE_OUT, fill: 'forwards' });

  // fill:backwards holds the incoming card off-stage right through the
  // handover delay, instead of flashing at its resting position first.
  const inMove = panel.animate([
    { transform: `translateX(104%) rotate(${inTilt})` },
    { transform: `translateX(0) rotate(${inTilt})` },
  ], { duration: IN_MS, delay: HANDOVER_MS, easing: EASE_OUT, fill: 'backwards' });
  const inFade = panel.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 90, delay: HANDOVER_MS, easing: 'linear', fill: 'backwards' });

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
   it. Measured after layout because each card is a different height. */
function lockDeckHeight() {
  if (!deck || running.length || matchMedia('(max-width:1000px)').matches) return;
  const shown = views.find(view => !view.hidden);
  deck.style.removeProperty('--deck-h');
  const tallest = views.reduce((max, view) => {
    view.hidden = false;
    const height = view.offsetHeight;
    view.hidden = view !== shown;
    return Math.max(max, height);
  }, 0);
  if (tallest) deck.style.setProperty('--deck-h', `${Math.ceil(tallest)}px`);
}

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
addEventListener('resize', lockDeckHeight);

const form = document.getElementById('audit-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('button[type="submit"]');
const submitLabel = document.getElementById('submit-label');
submit.disabled = false;
const live = /^https:\/\//.test(AUDIT_CONFIG.endpoint) && /^https:\/\//.test(AUDIT_CONFIG.privacyUrl);
let requestId;
let inFlight = false;

if (live) {
  submitLabel.textContent = 'Get my free audit';
  const privacyLink = document.createElement('a');
  privacyLink.href = AUDIT_CONFIG.privacyUrl;
  privacyLink.textContent = 'Privacy notice';
  privacyLink.style.textDecoration = 'underline';
  document.getElementById('form-terms').append(' ', privacyLink, '.');
}

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
        campaign: AUDIT_CONFIG.campaign, source: 'Landing Page',
        page: location.origin + location.pathname, requestId, ...attribution
      })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) throw new Error('Lead receipt was not confirmed');
    showStatus('Request received. We’ll email your read-only access setup instructions. Your free results will arrive within 24 hours after access is ready.', 'success');
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

// Stop the mobile CTA obscuring the form while it is visible.
if ('IntersectionObserver' in window) {
  const mobileCTA = document.querySelector('.mobile-cta');
  new IntersectionObserver(entries => {
    mobileCTA.classList.toggle('is-hidden', entries[0].isIntersecting);
  }, { threshold: 0 }).observe(document.getElementById('request'));
}
