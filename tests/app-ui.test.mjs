import { test } from 'node:test';
import assert from 'node:assert/strict';

const listeners = {};
const screen = {innerHTML:''};
const terminalInput = {value:'',focus(){},addEventListener(){}};
const element = { addEventListener(){}, classList:{add(){},remove(){},toggle(){}}, textContent:''};

globalThis.document = {
 querySelector(selector){
  if(selector==='#app')return screen;
  if(selector==='#terminal-input')return screen.innerHTML.includes('id="terminal-input"')?terminalInput:null;
  return element;
 },
 querySelectorAll(){return []},
 addEventListener(type,callback){listeners[type]=callback}
};
globalThis.localStorage={getItem(){return null},setItem(){}};
globalThis.scrollTo=()=>{};
globalThis.confirm=()=>true;
globalThis.Worker=class {
  onmessage;
  constructor(){this.k=0}
  postMessage({id,request}){
   this.k++;
   const values=request.stdin.trim()?request.stdin.trim().split('\n'):[];
   const result=values.length<2?
    {stdout:values.length?`A: ${values[0]}\nB: `:'A: ',inputRequired:true,inputPrompt:values.length?'B: ':'A: ',executionError:null,tests:[]}:
    {stdout:`A: ${values[0]}\nB: ${values[1]}\nSum: ${Number(values[0])+Number(values[1])}\n`,inputRequired:false,inputPrompt:'',executionError:null,tests:[]};
   queueMicrotask(()=>this.onmessage({data:{id,result}}));
  }
  terminate(){}
};

await import('../app.js');
const click=(dataset)=>listeners.click({target:{closest(){return {dataset}}}});
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('app initially renders dashboard',()=>{
 assert.match(screen.innerHTML,/Python Debug Lab/);
});

test('compiler opens with an editor, stdin and interactive console',()=>{
 click({page:'debugger'});
 assert.match(screen.innerHTML,/Online Python Compiler/);
 assert.match(screen.innerHTML,/id="free-editor"/);
 assert.match(screen.innerHTML,/id="stdin-editor"/);
 assert.match(screen.innerHTML,/Interactive console/);
});

test('runner accepts interactive prompts and emits final output',async()=>{
 click({action:'free-run'});
 await tick();
 assert.match(screen.innerHTML,/id="terminal-input"/);
 terminalInput.value='10';
 click({action:'send-console-input'});
 await tick();
 assert.match(screen.innerHTML,/id="terminal-input"/);
 terminalInput.value='20';
 click({action:'send-console-input'});
 await tick();
 assert.match(screen.innerHTML,/Sum: 30/);
 assert.doesNotMatch(screen.innerHTML,/id="terminal-input"/);
});
