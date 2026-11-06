const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('중국어학습앱.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
function data(text){const js=text.match(/<script>\s*([\s\S]*?)<\/script>/)[1];return JSON.parse(vm.runInNewContext(js.slice(js.indexOf('const categories = ['),js.indexOf('let currentCategoryIndex'))+';JSON.stringify(categories)'));}
test('all source categories, lessons and styles are preserved',()=>{
 const original=data(source);assert.deepEqual(data(html),original);assert.equal(original.length,12);assert.equal(original.flatMap(c=>c.words).length,120);
 assert.equal(html.match(/<style>([\s\S]*?)<\/style>/)[1],source.match(/<style>([\s\S]*?)<\/style>/)[1]);assert.ok(!html.includes('<video'));
});
function app(){
 const elements=new Map();let stopped=0;
 function el(id){if(!elements.has(id))elements.set(id,{style:{},children:[],open:false,classList:{add(){},remove(){}},appendChild(child){this.children.push(child);},set innerHTML(x){this.children=[];},get innerHTML(){return '';},querySelector(){return el(id+' child');},click(){this.onclick?.();}});return elements.get(id);}
 class Recognition{start(){this.onstart();}stop(){stopped++;}}
 const context={document:{getElementById:el,createElement:()=>el('new-'+Math.random()),querySelectorAll:()=>el('categoriesContainer').children,addEventListener(){},body:{appendChild(){}}},window:{speechSynthesis:{cancel(){},speak(){}},SpeechRecognition:Recognition},SpeechSynthesisUtterance:function(text){this.text=text;},setTimeout(){},console};
 vm.runInNewContext(script,context);return {el,get stopped(){return stopped;}};
}
test('word navigation wraps and categories switch correctly',()=>{
 const a=app();assert.equal(a.el('cardChinese').textContent,'你好');a.el('nextBtn').click();assert.equal(a.el('cardChinese').textContent,'谢谢');a.el('prevBtn').click();a.el('prevBtn').click();assert.equal(a.el('currentIndex').textContent,10);
 a.el('categoriesContainer').children[1].onclick();assert.equal(a.el('headerName').textContent,'음식음료');assert.equal(a.el('currentIndex').textContent,1);
});
test('pressing follow-along again stops the active recognition',()=>{
 const a=app();a.el('listenBtn').click();a.el('listenBtn').click();assert.equal(a.stopped,1);
});
