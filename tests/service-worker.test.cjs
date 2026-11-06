const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('versioned installation scripts have an offline cache fallback',async()=>{
 const handlers={};let matched;
 const self={registration:{scope:'https://example.com/'},location:{origin:'https://example.com'},addEventListener:(name,fn)=>handlers[name]=fn};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,URL,fetch:async()=>{throw Error('offline');},caches:{match:async key=>{matched=key;return 'cached script';}}});
 let response;handlers.fetch({request:{method:'GET',url:'https://example.com/install.js?v=android-install-3',headers:{has:()=>false},mode:'cors'},respondWith(value){response=value;}});
 assert.equal(await response,'cached script');assert.equal(matched,'https://example.com/install.js');
});
