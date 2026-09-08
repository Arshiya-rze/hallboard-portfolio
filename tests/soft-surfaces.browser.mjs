import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const project = new URL('../', import.meta.url).pathname;
const origin = 'http://127.0.0.1:5517';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn('python3', ['-m', 'http.server', '5517', '--bind', '127.0.0.1'], { cwd: project, stdio: 'ignore' });
const browser = spawn('/usr/bin/google-chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking',
  '--blink-settings=primaryHoverType=2,primaryPointerType=4,availableHoverTypes=2,availablePointerTypes=4',
  '--remote-debugging-port=9227', '--user-data-dir=' + fs.mkdtempSync('/tmp/hallboard-team-check.'),
], { stdio: 'ignore' });
const stop = () => { server.kill(); browser.kill(); };
process.on('exit', stop);
process.on('SIGTERM', () => { stop(); process.exit(143); });
process.on('SIGINT', () => { stop(); process.exit(130); });
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    await fetch('http://127.0.0.1:9227/json/version');
    await fetch(origin);
    break;
  } catch {
    if (attempt === 49) throw new Error('Owned browser/server failed to start');
    await pause(200);
  }
}

const tab = await (await fetch('http://127.0.0.1:9227/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timeout);
    message.error ? request.reject(message.error) : request.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
});
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 12000);
  pending.set(id, { resolve, reject, timeout });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const waitFor = async expression => {
  for (let i = 0; i < 70; i++) {
    if (await evaluate(expression)) return;
    await pause(100);
  }
  throw new Error('Timed out: ' + expression);
};
const screenshot = async name => {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/tmp/hallboard-team-' + name + '.png', Buffer.from(data, 'base64'));
};

let member='taba-name';

try {
 await cdp('Page.enable');await cdp('Runtime.enable');
 for(const [width,height] of [[1366,900],[375,803]]) {
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:origin+'/index.html'});await waitFor("document.readyState==='complete'");
  await evaluate("document.documentElement.style.scrollBehavior='auto'");
  for(const selector of ['.stats-grid','.service-card','.project-card','.tech-tabs','.what-we-do-cta']) {
   await evaluate("document.querySelector("+JSON.stringify(selector)+").scrollIntoView({block:'center'})"); await pause(700);
   assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"),'no horizontal overflow');
   assert.notEqual(await evaluate("getComputedStyle(document.querySelector("+JSON.stringify(selector==='.stats-grid'?'.stat-card':selector)+")).boxShadow"),'none');
   await screenshot('soft-'+selector.slice(1)+'-'+width);
  }
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.tech-tab')).every(e=>e.getBoundingClientRect().height>=44)"));
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.what-we-do-cta .cta-actions .btn')).every(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.height>=52&&s.boxShadow.includes('inset')&&s.transform!=='none'&&e.getAttribute('aria-haspopup')==='dialog'})"),'raised CTA buttons remain dialog controls');
  await evaluate("document.querySelectorAll('.tech-tab')[1].click()");
  assert.ok(await evaluate("document.querySelectorAll('.tech-tab')[1].classList.contains('is-active')"));
  await evaluate("document.querySelector('[data-services-slider]').dispatchEvent(new Event('pointerenter'));document.querySelector('.services-viewport').scrollIntoView({block:'center'});document.querySelector('.services-dot').click()");await pause(650);
  assert.equal(await evaluate("document.querySelectorAll('.stat-card').length"),4);
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.stat-card,.service-card')).every(e=>getComputedStyle(e).boxShadow.includes('inset'))"));
  const start=await evaluate("document.querySelector('.services-viewport').scrollLeft");
  await evaluate("document.querySelector('[data-slider-next]').click()");await pause(650);
  assert.ok(await evaluate("document.querySelector('.services-viewport').scrollLeft")>start+20,'next slide moves');
  await evaluate("document.querySelector('[data-slider-prev]').click()");await pause(650);
  const returned=await evaluate("document.querySelector('.services-viewport').scrollLeft");
  assert.ok(Math.abs(returned-start)<2,'previous slide returns: '+start+' -> '+returned);
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'}]});
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.tech-tab')).boxShadow"),'none');
  await cdp('Emulation.setEmulatedMedia',{features:[]});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: soft card surfaces, desktop/mobile bounds, tab selection, touch targets and forced-colors fallback.');
} finally {
 await Promise.race([cdp('Page.close').catch(()=>{}),pause(500)]);
 for(const request of pending.values()) clearTimeout(request.timeout);
 socket.close();stop();
}
