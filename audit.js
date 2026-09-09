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

/* Security and compliance flags shown in the evidence view. Illustrative, like
 * every other figure in this report, and labelled as such on the page. */
const FLAGS = {
  'api-worker-prod-03': 'Security group open to 0.0.0.0/0',
  'staging-runner-02': 'Root volume not encrypted',
  'batch-worker-07': 'Instance metadata v1 still allowed',
  'app-data-volume-04': 'No snapshot in 90 days',
  'analytics-volume-08': 'Not encrypted at rest',
  'dev-data-volume-02': 'No lifecycle policy'
};

const tabs = [...document.querySelectorAll('.report-tabs [role="tab"]')];
let currentView = 'savings';

function activateCategory(tab) {
  const example = EXAMPLES[tab.dataset.category];
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  document.getElementById('findings-panel').setAttribute('aria-labelledby', tab.id);
  document.getElementById('sample-total').innerHTML = `${example.total}<span>/mo</span>`;
  document.querySelector('.estimate-label').textContent = 'Across the 3 examples below';
  const evidenceView = currentView === 'evidence';
  document.querySelector('.report-head-evidence').textContent = evidenceView ? 'Security / compliance flag' : 'Usage evidence';
  // All report values are fixed illustrative examples, never visitor input.
  document.getElementById('findings-body').innerHTML = example.rows.map(([name, finding, evidence, use, saving]) => {
    const middle = evidenceView
      ? `<span class="flag"><svg class="icon flag-icon" aria-hidden="true"><use href="#lock"/></svg>${FLAGS[name] || 'No flags raised'}</span>`
      : `<span class="evidence-meter"><i style="--usage:${use}%"></i></span><span class="evidence-value">${evidence}</span>`;
    return `<tr><td><span class="resource-name"><svg class="icon resource-icon" aria-hidden="true"><use href="#instance"/></svg> ${name}</span><span class="resource-detail">${finding}</span><span class="mobile-evidence">${evidenceView ? (FLAGS[name] || 'No flags raised') : evidence}</span></td><td>${middle}</td><td class="saving">${saving} <svg class="icon saving-trend" aria-hidden="true"><use href="#trend"/></svg></td></tr>`;
  }).join('');
}

/* The three deliverable descriptions are the report's view switcher: each one
 * shows the facet of the free audit it describes. */
const viewTabs = [...document.querySelectorAll('.dg-item')];
function activateView(tab) {
  currentView = tab.dataset.view;
  viewTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  document.getElementById('report-body').setAttribute('aria-labelledby', tab.id);

  const waste = currentView === 'waste';
  document.getElementById('waste-panel').hidden = !waste;
  document.getElementById('findings-panel').hidden = waste;
  document.querySelector('.report-tabs').hidden = waste;

  if (waste) {
    document.getElementById('sample-total').innerHTML = '$2,940<span>/mo</span>';
    document.querySelector('.estimate-label').textContent = 'Idle and orphaned, 46 resources';
  } else {
    activateCategory(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]);
  }
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
