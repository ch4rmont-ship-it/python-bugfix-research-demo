import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {bytesToBase64,base64ToBytes,normalizedProjectPath,shouldSkipProjectPath,importFolderFileList,projectPayload,selectEntryPoint} from '../project-files.js';

function sampleFile(path,content){
 const buf=new TextEncoder().encode(content);
 return {name:path.split('/').pop(),webkitRelativePath:path,size:buf.byteLength,async arrayBuffer(){return buf.buffer;}};
}
test('nested folder upload retains paths, entry point and binary contents',async()=>{
 const project=await importFolderFileList([
  sampleFile('demo_project/main.py','from src.helpers import add\nprint(add(10,20))'),
  sampleFile('demo_project/src/__init__.py',''),
  sampleFile('demo_project/src/helpers.py','def add(a,b):\n    return a+b'),
  sampleFile('demo_project/data/items.csv','qty,price\n2,40\n'),
  sampleFile('demo_project/.git/config','secret-like git metadata'),
  sampleFile('demo_project/.env','SENSITIVE=example')
 ]);
 assert.equal(project.name,'demo_project');
 assert.equal(project.entry,'main.py');
 assert.ok(project.files.some(f=>f.path==='src/helpers.py'));
 assert.ok(project.files.some(f=>f.path==='data/items.csv'));
 assert.ok(!project.files.some(f=>f.path.startsWith('.git')||f.path==='.env'));
 assert.equal(project.files.length,4);
 const payload=projectPayload(project);
 assert.equal(payload.entry,'main.py');
 assert.ok(payload.files.every(f=>typeof f.base64==='string'));
});
test('untrusted paths cannot escape project root',()=>{
 for(const path of ['../other.py','src/../outside.py','/root/main.py','C:/main.py','src//helper.py','src\\foo.py']){
  assert.throws(()=>normalizedProjectPath(path));
 }
 assert.equal(normalizedProjectPath('src/pkg/foo.py'),'src/pkg/foo.py');
 assert.equal(shouldSkipProjectPath('venv/lib/foo.py'),true);
});
test('binary files round-trip without text conversion',()=>{
 const bytes=Uint8Array.from([0,255,99,128,10]);
 assert.deepEqual(base64ToBytes(bytesToBase64(bytes)),bytes);
});
test('entry point selection chooses main.py ahead of utility modules',()=>{
 assert.equal(selectEntryPoint([{path:'src/other.py'},{path:'main.py'}]),'main.py');
 assert.equal(selectEntryPoint([{path:'utils.py'},{path:'src/main.py'}]),'src/main.py');
});
const worker=fs.readFileSync(new URL('../python-worker.js',import.meta.url),'utf8');
const match=worker.match(/engine\.runPythonAsync\(`([\s\S]*?)`\)/);
assert.ok(match);
const snippet=vm.runInNewContext('`'+match[1]+'`').trim().replace(/json\.dumps\(report, ensure_ascii=False\)\s*$/,'print(json.dumps(report, ensure_ascii=False))');
function runProject(project,stdin=''){
 const payload={mode:'project',code:'',project,stdin,tests:[]};
 const data=Buffer.from(JSON.stringify(payload)).toString('base64');
 const script=`import base64\n__pylab_payload=base64.b64decode('${data}').decode()\n${snippet}`;
 const result=spawnSync('python3',['-c',script],{encoding:'utf8',timeout:7000});
 assert.equal(result.status,0,result.stderr||'Python execution failed');
 return JSON.parse(result.stdout.trim());
}
test('worker runs a multi-module Python project with a packaged CSV resource',async()=>{
 const source=await importFolderFileList([
  sampleFile('example/main.py','from src.calc import multiply\nfrom pathlib import Path\nprint(multiply(6,7))\nprint(Path("data/value.txt").read_text().strip())'),
  sampleFile('example/src/__init__.py',''),
  sampleFile('example/src/calc.py','def multiply(a,b):\n    return a*b'),
  sampleFile('example/data/value.txt','files are mounted')
 ]);
 const result=runProject(projectPayload(source));
 assert.equal(result.executionError,null);
 assert.equal(result.stdout.trim(),'42\nfiles are mounted');
});
test('uploaded project prompts for interactive input and can replay with values',async()=>{
 const imported=await importFolderFileList([
  sampleFile('prompt/main.py','from helpers import message\na=input("Who? ")\nprint(message(a))'),
  sampleFile('prompt/helpers.py','def message(name):\n    return "Hi " + name')
 ]);
 const project=projectPayload(imported);
 const first=runProject(project);
 assert.equal(first.inputRequired,true);
 assert.equal(first.inputPrompt,'Who? ');
 const second=runProject(project,'Arza\n');
 assert.equal(second.inputRequired,false);
 assert.match(second.stdout,/Hi Arza/);
});
test('runner rejects path traversal even from crafted worker payload',()=>{
 const payload={entry:'../danger.py',files:[{path:'../danger.py',base64:bytesToBase64(new TextEncoder().encode('print(1)'))}]};
 const result=runProject(payload);
 assert.match(result.executionError,/Unsafe project path|ValueError/);
});

import {renderProjectWorkspace} from '../project-ui.js';

test('Project Workspace shows folder picker and stays empty until an upload',()=>{
 const result=renderProjectWorkspace({project:null,projectLoading:false,projectImporting:false,projectError:''},{
  title:(a,b,c,action)=>'<h1>Project Workspace</h1>'+action,pill:(text)=>text,safe:text=>String(text),renderDrawer:()=>''
 });
 assert.match(result,/webkitdirectory/);
 assert.match(result,/Choose Folder/);
 assert.match(result,/Open a Python project folder/);
});
test('Project Workspace renders nested file explorer and selectable entry script',()=>{
 const project={name:'demo',entry:'main.py',active:'src/calc.py',files:[
  {path:'main.py',isText:true,text:'import src.calc'},
  {path:'src/calc.py',isText:true,text:'print("42")'},
  {path:'src/data.bin',isText:false,base64:'AA=='},
 ]};
 const result=renderProjectWorkspace({project,projectLoading:false,projectImporting:false,projectError:'',busy:false,freeResult:null,freeSession:null,consoleOpen:false},{
  title:(a,b,c,action)=>'<h1>Project Workspace</h1>'+action,pill:t=>t,safe:t=>String(t),renderDrawer:()=>''
 });
 assert.match(result,/project-explorer/);
 assert.match(result,/src\/calc.py/);
 assert.match(result,/id="project-editor"/);
 assert.match(result,/id="project-entry-select"/);
 assert.match(result,/data-action="project-run"/);
});
