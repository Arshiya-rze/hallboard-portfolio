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
 await cdp('Page.enable'); await cdp('Runtime.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:origin+'/index.html'});await waitFor("document.readyState==='complete'");
 await evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('#how-we-work').scrollIntoView()");
 await pause(750);
 assert.equal(await evaluate("document.querySelectorAll('.how-orb[aria-hidden=true] > span').length"),2);
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.how-orb')).transformStyle"),'preserve-3d');
 assert.ok(await evaluate("(()=>{const w=document.createTreeWalker(document.querySelector('.how-header h2'),NodeFilter.SHOW_TEXT),rects=[];while(w.nextNode()){const r=document.createRange();r.selectNodeContents(w.currentNode);rects.push(...r.getClientRects())}return Array.from(document.querySelectorAll('.how-orb')).every(e=>{const a=e.getBoundingClientRect();return rects.every(b=>a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom)})})()"),'no title text overlap');
 await screenshot('how-tiles-desktop');
 assert.ok(await evaluate("(()=>{const a=document.querySelector('.how-orb').getAnimations()[0];a.pause();a.currentTime=0;const y=document.querySelector('.how-orb').getBoundingClientRect().top;a.currentTime=3000;return Math.abs(document.querySelector('.how-orb').getBoundingClientRect().top-y)>14})()"),'visible vertical float');
 for(const [selector,token,count] of [['.principle-card','--principle-accent',5],['.how-step','--step-accent',6]]) {
  assert.equal(await evaluate("new Set(Array.from(document.querySelectorAll('"+selector+"'),e=>getComputedStyle(e).getPropertyValue('"+token+"'))).size"),count,'distinct card colors');
  assert.ok(await evaluate("Array.from(document.querySelectorAll('"+selector+"')).every(e=>getComputedStyle(e).boxShadow.includes('inset')&&getComputedStyle(e).clipPath==='none')"),'visible relief');
 }
 await evaluate("document.querySelector('.principles-title').scrollIntoView()");await pause(400);
 await screenshot('how-cards-desktop');
 await evaluate("document.querySelector('.tech-stack').scrollIntoView()");await pause(700);
 assert.equal(await evaluate("document.querySelectorAll('.tech-orb[aria-hidden=true] > span').length"),2);
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.tech-orb')).transformStyle"),'preserve-3d');
 assert.ok(await evaluate("(()=>{const e=document.querySelector('.tech-orb'),a=e.getAnimations()[0];a.pause();a.currentTime=0;const y=e.getBoundingClientRect().top;a.currentTime=3000;return Math.abs(e.getBoundingClientRect().top-y)>14})()"),'tech float remains visible');
 await screenshot('tech-tiles-desktop');
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.how-orb')).animationName"),'none');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.tech-orb')).animationName"),'none');
 await cdp('Emulation.setDeviceMetricsOverride',{width:375,height:803,deviceScaleFactor:1,mobile:false});
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.how-orb')).display"),'none');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.tech-orb')).display"),'none');
 assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
 await evaluate("document.querySelector('.principles-title').scrollIntoView()");await pause(300);
 await screenshot('how-cards-mobile');
 assert.deepEqual(errors,[]); console.log('PASS: raised decorative tiles, no heading overlap, reduced motion, mobile visibility and bounds.');
} finally {
 await Promise.race([cdp('Page.close').catch(()=>{}),pause(500)]);
 for(const request of pending.values()) clearTimeout(request.timeout);
 socket.close();stop();
}
