const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup({ua='Chrome/130',platform='Win32',standalone=false,capturedPrompt=null}={}) {
  const elements = new Map(); const events={};
  function element(id) { if (!elements.has(id)) elements.set(id,{ hidden:false, textContent:'', listeners:{}, addEventListener(name, fn){this.listeners[name]=fn;}, close(){this.open=false;},showModal(){this.open=true;},replaceChildren(...items){this.children=items;},querySelector(){return element('source');} }); return elements.get(id); }
  const location={href:'https://example.com/?private=value',origin:'https://example.com',assign(value){this.assigned=value;}};
  const window={addEventListener:(name,fn)=>events[name]=fn,isSecureContext:true,chinameetInstallPrompt:capturedPrompt};
  let registered;
  const context={document:{getElementById:element,createElement:()=>({})},navigator:{userAgent:ua,platform,serviceWorker:{register:async url=>{registered=url;}}},window,matchMedia:()=>({matches:standalone,addEventListener(){}}),location,URL,Blob};
  vm.runInNewContext(fs.readFileSync('install.js','utf8'),context);
  return {element,events,location,get registered(){return registered;}};
}
test('PC download remains available when already installed',async()=>{
  const app=setup({standalone:true}); assert.equal(app.element('pcShortcut').hidden,false);
  await app.element('installButton').listeners.click(); assert.equal(app.element('installDialog').open,true);
  const content=await (await fetch(app.element('pcShortcut').href)).text();
  assert.match(content,/URL=https:\/\/example.com\/\r\n/); assert.ok(!content.includes('private'));
});
test('Android install prompt is invoked on click and cancellation can recover',async()=>{
  const app=setup({ua:'Android Chrome/130',platform:'Linux armv8l'}); let calls=0;
  app.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{calls++;},userChoice:Promise.resolve({outcome:'dismissed'})});
  await app.element('installButton').listeners.click(); assert.equal(calls,1); assert.equal(app.element('installButton').disabled,false); assert.match(app.element('installStatus').textContent,/취소/);
  app.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{calls++;},userChoice:Promise.resolve({outcome:'accepted'})});
  await app.element('installButton').listeners.click(); assert.equal(calls,2);
});
test('iPhone gets Safari instructions without PC downloads',async()=>{
  const app=setup({ua:'iPhone Safari',platform:'iPhone'}); await app.element('installButton').listeners.click();
  assert.equal(app.element('pcShortcut').hidden,true); assert.match(app.element('installGuide').textContent,/Safari/);
});
test('Android without a browser prompt immediately shows actionable installation steps',async()=>{
  const app=setup({ua:'Android Chrome/130',platform:'Linux'}); await app.element('installButton').listeners.click();
  assert.equal(app.element('installDialog').open,true); assert.match(app.element('installSteps').children.map(x=>x.textContent).join(' '),/홈 화면에 추가/);assert.equal(app.element('installRetry').hidden,true);
});
test('Android embedded browser offers an explicit clean Chrome link',async()=>{
  const app=setup({ua:'Android KAKAOTALK Chrome/130',platform:'Linux'}); await app.element('installButton').listeners.click();
  assert.equal(app.element('installDialog').open,true);assert.equal(app.element('androidChrome').hidden,false);
  assert.match(app.element('androidChrome').href,/package=com.android.chrome/); assert.ok(!app.element('androidChrome').href.includes('private'));assert.equal(app.location.assigned,undefined);
});
test('Samsung Internet gets its own guide and can use its native install prompt',async()=>{
  const app=setup({ua:'Android SamsungBrowser/28 Chrome/130',platform:'Linux'});await app.element('installButton').listeners.click();assert.match(app.element('installSteps').children[0].textContent,/삼성 인터넷/);assert.equal(app.location.assigned,undefined);
  let calls=0;app.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{calls++;},userChoice:Promise.resolve({outcome:'accepted'})});await app.element('installRetry').listeners.click();assert.equal(calls,1);assert.equal(app.element('installDialog').open,false);
});
test('early captured and delayed browser prompts both remain usable',async()=>{
  let calls=0;const event={preventDefault(){},prompt:async()=>{calls++;},userChoice:Promise.resolve({outcome:'accepted'})};
  const early=setup({ua:'Android Chrome/130',capturedPrompt:event});await early.element('installButton').listeners.click();assert.equal(calls,1);
  const late=setup({ua:'Android Chrome/130'});await late.element('installButton').listeners.click();late.events.beforeinstallprompt(event);assert.equal(late.element('installRetry').hidden,false);await late.element('installRetry').listeners.click();assert.equal(calls,2);
});
test('a failed prompt restores controls and opens a useful fallback',async()=>{
  const app=setup({ua:'Android Chrome/130'});app.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{throw Error('blocked');}});await app.element('installButton').listeners.click();assert.equal(app.element('installButton').disabled,false);assert.equal(app.element('installDialog').open,true);
});
test('all manifest and shell files exist, and icon dimensions are valid',()=>{
  const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
  for(const icon of manifest.icons){ const data=fs.readFileSync(icon.src); const [w,h]=icon.sizes.split('x').map(Number); assert.equal(data.readUInt32BE(16),w); assert.equal(data.readUInt32BE(20),h); }
  const sw=fs.readFileSync('sw.js','utf8'); const shell=sw.match(/const SHELL = (\[[^;]+\]);/)[1];
  for(const entry of vm.runInNewContext(shell)) assert.ok(fs.existsSync(entry==='./'?'index.html':entry));
});
