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
let members=[];
const select = () => JSON.stringify('[aria-labelledby="'+member+'"]');
const state = () => evaluate("(() => {const c=document.querySelector("+select()+");const s=c.closest('[data-team-scene]'),b=c.querySelector('[data-portrait-toggle]'),p=c.querySelector('[data-portrait-image]');return {active:c.classList.contains('is-portrait-active'),scroll:scrollY,scene:s.getBoundingClientRect().toJSON(),button:b.getBoundingClientRect().toJSON(),hidden:b.hidden,depth:getComputedStyle(c.querySelector('.living-portrait-depth')).transform,animation:getComputedStyle(c.querySelector('.living-portrait-arrival')).animationName,photo:getComputedStyle(c.querySelector('.living-portrait-photo')).opacity,loaded:p.complete&&p.naturalWidth>0,overflow:document.documentElement.scrollWidth>innerWidth,mask:getComputedStyle(p).maskImage};})()");
const open = async(w,h,mobile=false) => {
 await cdp('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});
 if(mobile) await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await cdp('Page.navigate',{url:origin+'/index.html'});
 await waitFor("document.readyState==='complete' && document.querySelectorAll('[data-living-portrait]').length===document.querySelectorAll('[data-team-card][data-portrait-src]').length");
 await evaluate('document.fonts.ready.then(()=>true)');
 members=await evaluate("Array.from(document.querySelectorAll('[data-team-card][data-portrait-src]'),c=>c.getAttribute('aria-labelledby'))");
};
const position = async() => {
 await evaluate("(() => {document.documentElement.style.scrollBehavior='auto';const c=document.querySelector("+select()+");scrollTo({top:scrollY+c.getBoundingClientRect().top-150,behavior:'instant'});})()");
 await waitFor("!document.querySelector("+select()+").querySelector('[data-portrait-toggle]').hidden");
 await pause(400);
};
const tap = async() => {
 const {button:b}=await state();
 await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
 await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await pause(1200);
};
try {
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
 for(const [w,h,mobile] of [[1366,900,false],[375,803,true],[320,568,true],[844,390,true]]) {
  await open(w,h,mobile);
  const depths=[];
  for(member of members) {
   await position();const before=await state();
   if(mobile) await tap();
   else {
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.scene.x+before.scene.width*.55,y:before.scene.y+90});
    await pause(1600);
   }
   const after=await state();
   assert.ok(after.active&&after.loaded,member+' activated');
   assert.equal(after.scroll,before.scroll,'no scroll');
   assert.equal(after.scene.height,before.scene.height,'stable height');
   assert.ok(!after.overflow,'no horizontal overflow');
   const expectedMask=await evaluate("document.querySelector("+select()+").dataset.portraitMask");
   if(expectedMask) assert.ok(after.mask.includes(expectedMask.replace(/^\.\//,'')),'configured portrait mask');
   assert.equal(after.animation,'portraitFloat');depths.push(after.depth);
   await screenshot(member+'-'+w);
   if(mobile) {assert.ok(after.button.height>=44);await tap();}
   else {await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:450});await pause(900);}
   assert.equal((await state()).active,false,'deactivate');
  }
  if(mobile) depths.forEach(depth=>assert.equal(depth,depths[0],'identical movement'));
 }
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(member of members) {
  await position();await tap();const s=await state();
  assert.equal(s.animation,'none');assert.equal(s.depth,'none');await tap();
 }
 await cdp('Emulation.setEmulatedMedia',{features:[]});
 await open(1366,900,true);
 for(member of members) {
  await position();
  await evaluate("document.querySelector("+select()+").querySelector('[data-portrait-toggle]').focus({preventScroll:true})");
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await pause(1000);assert.ok((await state()).active);
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.ok(!(await state()).active);
 }
 await cdp('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp('Network.setBlockedURLs',{urls:['*arshia-rezaei-3d-portrait-v3.webp*']});
 member='arshia-name';await open(375,803,true);
 await evaluate("document.querySelector("+select()+").scrollIntoView()");
 await pause(1500);assert.ok((await state()).hidden);assert.equal((await state()).photo,'1');
 await cdp('Network.setBlockedURLs',{urls:[]});
 await cdp('Emulation.setScriptExecutionDisabled',{value:true});
 await cdp('Page.navigate',{url:origin+'/index.html'});
 await waitFor("document.readyState==='complete'");
 assert.equal(await evaluate("document.querySelectorAll('[data-team-card] .team-card-visual > img').length"),6);
 assert.deepEqual(errors,[]);
 console.log('PASS: shared template, all configured portraits hover/touch/keyboard, stable layout, matching motion, reduced motion, failure and no-JS fallback.');
} finally {
 await Promise.race([cdp('Page.close').catch(()=>{}),pause(500)]);
 for(const request of pending.values()) clearTimeout(request.timeout);
 socket.close();stop();
}
