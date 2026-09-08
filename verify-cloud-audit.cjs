/* Run from the campaign directory with playwright and axe-core available.
 * Browser verification of the actual visitor journey; no live leads are sent.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
const root = process.cwd();
const out = path.join(root, 'qa-results');
fs.mkdirSync(out, {recursive: true});
const checks = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + '/') || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
  res.end(fs.readFileSync(file));
});
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({headless:true, args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [], posts = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {if(request.method()==='POST') posts.push(request.url());});
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert.match(await page.locator('h1').innerText(),/24 hours/);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, nofollow');
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await page.screenshot({path:path.join(out,'desktop-hero.png')});
  await page.locator('.report-stage').screenshot({path:path.join(out,'report-detail.png')});
  checks.push('Desktop page renders with local fonts and the accepted 24-hour offer');
  await page.getByRole('tab',{name:'Block storage'}).click();
  assert.match(await page.locator('#sample-total').innerText(),/740/);
  assert.equal(await page.locator('#findings-body tr').count(),3);
  assert.match(await page.locator('#findings-body').innerText(),/analytics-volume-08/);
  await page.getByRole('tab',{name:'Block storage'}).press('ArrowLeft');
  assert.equal(await page.getByRole('tab',{name:'Compute'}).getAttribute('aria-selected'),'true');
  assert.match(await page.locator('#sample-total').innerText(),/4,280/);
  checks.push('Report category tabs update rows, total and accessible selection; arrow-key navigation works');
  await page.locator('summary').filter({hasText:'What does the optional full report add?'}).click();
  assert.match(await page.locator('details[open]').last().innerText(),/five business days/);
  await page.locator('summary').filter({hasText:'What does the optional full report add?'}).click();
  await page.locator('.hero-actions a[href="#request"]').click();
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(()=>location.hash),'#request');
  await page.locator('#audit-form button[type=submit]').click();
  assert.equal(await page.locator('#full-name').evaluate(el=>el.validity.valueMissing),true);
  assert.equal(await page.locator('#form-status').isVisible(),false);
  await page.locator('#full-name').fill('Preview Visitor');
  await page.locator('#work-email').fill('invalid-email');
  await page.locator('#cloud-provider').selectOption('AWS');
  await page.locator('#audit-form button[type=submit]').click();
  assert.equal(await page.locator('#work-email').evaluate(el=>el.validity.typeMismatch),true);
  await page.locator('#work-email').fill('preview@example.com');
  await page.locator('#audit-form button[type=submit]').click();
  assert.match(await page.locator('#form-status').innerText(),/no request was sent/);
  assert.equal(posts.length,0);
  assert.equal(await page.evaluate(()=>localStorage.length + sessionStorage.length),0);
  checks.push('All request actions reach the form; empty and invalid fields are rejected; preview submits no lead and stores no personal details');
  for (const width of [390,320,768]) {
    await page.setViewportSize({width,height:844});
    await page.goto(base);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,`Overflow at ${width}px`);
    await page.screenshot({path:path.join(out,`mobile-${width}.png`),fullPage:true});
    if(width===390) {
      await page.screenshot({path:path.join(out,'mobile-hero.png')});
      await page.locator('.report-stage').screenshot({path:path.join(out,'mobile-report.png')});
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.locator('.mobile-cta a').click();
      await page.waitForTimeout(700);
      assert.equal(await page.locator('.mobile-cta').isVisible(),false);
      await page.screenshot({path:path.join(out,'mobile-form.png')});
    }
  }
  checks.push('320px, 390px and 768px layouts fit without horizontal page overflow; mobile CTA hides when the request form is visible');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const axe = await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(axe.violations,null,2));
  assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,help:v.help,nodes:v.nodes.map(n=>n.target)}))));
  checks.push('Desktop automated WCAG A/AA checks pass');
  await page.setViewportSize({width:390,height:844});
  const mobileAxe=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  assert.equal(mobileAxe.violations.length,0,JSON.stringify(mobileAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
  checks.push('Mobile automated WCAG A/AA checks pass');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  checks.push('Reduced-motion preference disables smooth scrolling');

  // Mock the future relay to verify network failure and durable-receipt behavior.
  const livePage = await browser.newPage();
  livePage.on('pageerror', error=>errors.push(error.message));
  const script = fs.readFileSync(path.join(root,'audit.js'),'utf8').replace("endpoint: '', privacyUrl: ''", "endpoint: 'https://audit-relay.example/lead', privacyUrl: 'https://audit-relay.example/privacy'");
  await livePage.route('**/audit.js',route=>route.fulfill({contentType:'text/javascript',body:script}));
  let payloads=[], mode='error';
  await livePage.route('https://audit-relay.example/lead',async route=>{
    const request=route.request();
    if(request.method()==='OPTIONS') {await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type'}});return;}
    payloads.push(request.postDataJSON());
    await route.fulfill({status:mode==='error'?500:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:mode==='success'})});
  });
  await livePage.goto(base+'/?utm_source=qa&utm_campaign=cloud-audit');
  await livePage.locator('#full-name').fill('Preview Visitor');
  await livePage.locator('#work-email').fill('preview@example.com');
  await livePage.locator('#cloud-provider').selectOption('AWS');
  await livePage.locator('#audit-form button[type=submit]').click();
  await livePage.waitForFunction(()=>document.getElementById('form-status').dataset.state==='error');
  assert.equal(await livePage.locator('#work-email').inputValue(),'preview@example.com');
  mode='unconfirmed';
  await livePage.locator('#audit-form button[type=submit]').click();
  await livePage.waitForFunction(()=>document.getElementById('audit-form').getAttribute('aria-busy')===null);
  assert.equal(await livePage.locator('#form-status').getAttribute('data-state'),'error');
  mode='success';
  await livePage.locator('#audit-form button[type=submit]').click();
  await livePage.waitForFunction(()=>document.getElementById('form-status').dataset.state==='success');
  assert.equal(await livePage.locator('#work-email').inputValue(),'');
  assert.equal(payloads.length,3);
  assert.equal(payloads[0].requestId,payloads[2].requestId);
  assert.equal(payloads[2].utm_source,'qa');
  assert.equal(payloads[2].campaign,'free-cloud-audit-24h');
  checks.push('Mock relay: server errors and unconfirmed 200 responses preserve details; only confirmed success clears the form; retries reuse request ID and ad attribution survives');
  assert.deepEqual(errors,[]);
  checks.push('No browser JavaScript errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,checks},null,2));
  console.log(JSON.stringify({passed:true,checks}));
})().catch(error=>{
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:false,checks,error:error.stack},null,2));
  console.error(error);process.exitCode=1;
}).finally(async()=>{if(browser)await browser.close();server.close();});
