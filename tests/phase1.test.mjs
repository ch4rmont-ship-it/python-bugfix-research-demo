import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {reviewPython} from '../code-review.js';
import {normalizeStdout,buildCaseResult,validateCases,defaultCases} from '../custom-tests.js';
import api from '../api/debug.js';

test('normalizes OS newline formats without masking content differences',()=>{
 assert.equal(normalizeStdout('a\r\nb\n'),'a\nb');
 assert.notEqual(normalizeStdout('x '),normalizeStdout('x'));
});
test('custom tests compare expected and actual stdout exactly (except trailing newline)',()=>{
 assert.equal(buildCaseResult(1,{expected:'30'}, {stdout:'30\n',executionError:null}).passed,true);
 assert.equal(buildCaseResult(1,{expected:'30'}, {stdout:'31\n'}).passed,false);
 assert.match(buildCaseResult(1,{expected:'30'}, {stdout:'',inputRequired:true}).error,/Not enough input/);
});
test('custom test input guard rejects empty and oversized collections',()=>{
 assert.ok(validateCases([]));
 assert.ok(validateCases(Array.from({length:11},()=>({stdin:'',expected:''}))));
 assert.equal(validateCases(defaultCases),null);
 assert.ok(validateCases([{stdin:'x'.repeat(4001),expected:'y'}]));
});
test('local analysis finds real patterns and uses runtime traceback',()=>{
 const notes=reviewPython('if x = 5:\n  print(x)\nresult = 10 / 0',{
  executionError:'SyntaxError: invalid syntax',traceback:'File "<editor>", line 1\n SyntaxError'
 });
 assert.ok(notes.some(x=>x.title==='Assignment used in condition'));
 assert.ok(notes.some(x=>x.title==='Division by zero'));
 assert.ok(notes.some(x=>x.title==='SyntaxError'&&x.line===1));
});
test('review is not misrepresented as AI and does not claim proof of correctness',()=>{
 const notes=reviewPython('print("Hi")');
 assert.match(notes[0].detail,/not proof of correctness/i);
});
test('code review includes failed custom test case diagnostics',()=>{
 const notes=reviewPython('print(3)',null,[{index:1,passed:false,actual:'3',expected:'4'}]);
 assert.ok(notes.some(x=>x.title==='Test case 1 failed'));
});
test('serverless AI endpoint reports disabled without key',async()=>{
 const old=process.env.OPENAI_API_KEY;
 delete process.env.OPENAI_API_KEY;
 const mkRes=()=>({statusCode:0,body:null,headers:{},status(n){this.statusCode=n;return this},setHeader(k,v){this.headers[k]=v;return this},json(data){this.body=data;return this}});
 try{
  let res=mkRes();await api({method:'GET'},res);
  assert.equal(res.statusCode,200);assert.equal(res.body.enabled,false);
  res=mkRes();await api({method:'POST',body:{code:'print(1)',context:'',language:'mn'}},res);
  assert.equal(res.statusCode,503);assert.equal(res.body.enabled,false);
 }finally{if(old!==undefined)process.env.OPENAI_API_KEY=old;}
});
const worker=fs.readFileSync(new URL('../python-worker.js',import.meta.url),'utf8');
const match=worker.match(/engine\.runPythonAsync\(`([\s\S]*?)`\)/);
assert.ok(match);
const snippet=vm.runInNewContext('`'+match[1]+'`').trim().replace(/json\.dumps\(report, ensure_ascii=False\)\s*$/,'print(json.dumps(report, ensure_ascii=False))');
function runWorker(code,stdin,mode){
 const payload={mode,code,stdin,tests:[]};
 const input=Buffer.from(JSON.stringify(payload)).toString('base64');
 const script=`import base64\n__pylab_payload=base64.b64decode('${input}').decode()\n${snippet}`;
 const r=spawnSync('python3',['-c',script],{encoding:'utf8',timeout:4000});
 assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout.trim());
}
test('custom-test mode hides input echo and correctly prints result',()=>{
 const code='a=int(input("A: "))\nb=int(input("B: "))\nprint(a+b)';
 const result=runWorker(code,'10\n20\n','custom_test');
 assert.equal(result.inputRequired,false);assert.equal(result.stdout,'30\n');
 assert.equal(buildCaseResult(1,{expected:'30'},result).passed,true);
});
test('custom-test mode identifies missing standard input',()=>{
 const result=runWorker('a=int(input())\nb=int(input())','10\n','custom_test');
 assert.equal(result.inputRequired,true);
});
