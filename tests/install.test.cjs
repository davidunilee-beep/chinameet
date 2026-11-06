const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup({ua='Chrome/130',platform='Win32',standalone=false}={}) {
  const elements = new Map(); const events={};
  function element(id) { if (!elements.has(id)) elements.set(id,{ hidden:false, textContent:'', listeners:{}, addEventListener(name, fn){this.listeners[name]=fn;}, close(){this.open=false;},showModal(){this.open=true;},replaceChildren(...items){this.children=items;},querySelector(){return element('source');} }); return elements.get(id); }
  const location={href:'https://example.com/?private=value',origin:'https://example.com',assign(value){this.assigned=value;}};
  const window={addEventListener:(name,fn)=>events[name]=fn,isSecureContext:true};
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
test('Android embedded browser opens clean Chrome intent',async()=>{
  const app=setup({ua:'Android KAKAOTALK Chrome/130',platform:'Linux'}); await app.element('installButton').listeners.click();
  assert.match(app.location.assigned,/package=com.android.chrome/); assert.ok(!app.location.assigned.includes('private'));
});
test('video failure provides a useful message',()=>{
  const app=setup(); app.element('source').listeners.error(); assert.equal(app.element('videoStatus').hidden,false); assert.match(app.element('videoStatus').textContent,/불러오지 못/);
});
test('all manifest and shell files exist, and icon dimensions are valid',()=>{
  const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
  for(const icon of manifest.icons){ const data=fs.readFileSync(icon.src); const [w,h]=icon.sizes.split('x').map(Number); assert.equal(data.readUInt32BE(16),w); assert.equal(data.readUInt32BE(20),h); }
  const sw=fs.readFileSync('sw.js','utf8'); const shell=sw.match(/const SHELL = (\[[^;]+\]);/)[1];
  for(const entry of vm.runInNewContext(shell)) assert.ok(fs.existsSync(entry==='./'?'index.html':entry));
});
