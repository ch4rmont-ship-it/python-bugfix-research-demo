import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const src=fs.readFileSync(new URL('../python-worker.js',import.meta.url),'utf8');
const match=src.match(/engine\.runPythonAsync\(`([\s\S]*?)`\)/);
assert.ok(match,'Python worker wrapper must be present');
const wrapper=vm.runInNewContext('`'+match[1]+'`').trim().replace(/json\.dumps\(report, ensure_ascii=False\)\s*$/, 'print(json.dumps(report, ensure_ascii=False))');

function execute(code, stdin='', mode='execute', cases=[]){
 const payload={mode,code,stdin,tests:cases, functionName:'sum_positive'};
 const encoded=Buffer.from(JSON.stringify(payload)).toString('base64');
 const script=`import base64\n__pylab_payload=base64.b64decode('${encoded}').decode('utf8')\n${wrapper}`;
 const out=spawnSync('python3',['-c',script],{encoding:'utf8',timeout:6000});
 assert.equal(out.status,0,out.stderr);
 return JSON.parse(out.stdout.trim());
}

test('three inputs can be preloaded and echoed in terminal',()=>{
 const result=execute('a=int(input("A: "))\nb=int(input("B: "))\nc=int(input("C: "))\nprint("Total:",a+b+c)','15\n30\n45\n');
 assert.equal(result.inputRequired,false);
 assert.equal(result.executionError,null);
 assert.match(result.stdout,/Total: 90/);
});

test('an absent value asks the console for input',()=>{
 const result=execute('a=int(input("A: "))\nb=int(input("B: "))\nprint(a+b)','10\n');
 assert.equal(result.executionError,null);
 assert.equal(result.inputRequired,true);
 assert.equal(result.inputPrompt,'B: ');
 assert.match(result.stdout,/A: 10/);
});

test('replaying input after user submits a line completes program',()=>{
 const code='a=int(input("A: "))\nb=int(input("B: "))\nprint("Sum:",a+b)';
 const wait=execute(code,'10\n');
 assert.equal(wait.inputRequired,true);
 const done=execute(code,'10\n20\n');
 assert.equal(done.inputRequired,false);
 assert.match(done.stdout,/Sum: 30/);
});

test('interactive loop supports a variable number of inputs',()=>{
 const code='n=int(input("Count: "))\ntotal=0\nfor i in range(n):\n    total+=int(input(f"Value {i+1}: "))\nprint("Total:", total)';
 assert.equal(execute(code,'3\n1\n2\n').inputPrompt,'Value 3: ');
 const done=execute(code,'3\n1\n2\n4\n');
 assert.equal(done.inputRequired,false);
 assert.match(done.stdout,/Total: 7/);
});

test('bad input gives a readable ValueError',()=>{
 const result=execute('a=int(input("Value: "))\nprint(a)','abc\n');
 assert.match(result.executionError,/^ValueError:/);
 assert.equal(result.inputRequired,false);
});

test('a user except Exception cannot swallow the input request',()=>{
 const code='try:\n    a=input("Ready: ")\nexcept Exception:\n    print("Caught")';
 const result=execute(code,'');
 assert.equal(result.inputRequired,true);
});

test('test-mode coding challenges are unchanged',()=>{
 const code='def sum_positive(nums):\n    return sum(x for x in nums if x>0)';
 const result=execute(code,'','test',[{args:[[1,-2,3]],expected:4}]);
 assert.equal(result.tests.length,1);
 assert.equal(result.tests[0].passed,true);
 assert.equal(result.inputRequired,false);
});
