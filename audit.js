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

const tabs = [...document.querySelectorAll('[role="tab"]')];
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
  document.getElementById('findings-body').innerHTML = example.rows.map(([name, finding, evidence, use, saving]) => `<tr><td><span class="resource-name"><svg class="icon resource-icon" aria-hidden="true"><use href="#instance"/></svg> ${name}</span><span class="resource-detail">${finding}</span><span class="mobile-evidence">${evidence}</span></td><td><span class="evidence-meter"><i style="--usage:${use}%"></i></span><span class="evidence-value">${evidence}</span></td><td class="saving">${saving} <svg class="icon saving-trend" aria-hidden="true"><use href="#trend"/></svg></td></tr>`).join('');
}
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

// Stop the mobile CTA obscuring the form while it is visible.
if ('IntersectionObserver' in window) {
  const mobileCTA = document.querySelector('.mobile-cta');
  new IntersectionObserver(entries => {
    mobileCTA.classList.toggle('is-hidden', entries[0].isIntersecting);
  }, { threshold: 0 }).observe(document.getElementById('request'));
}
