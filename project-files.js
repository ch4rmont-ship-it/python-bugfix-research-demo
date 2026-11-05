// Files remain in IndexedDB on this device; project source is never uploaded to a server.
export const MAX_PROJECT_FILES = 250;
export const MAX_PROJECT_BYTES = 20 * 1024 * 1024;
export const MAX_SINGLE_FILE_BYTES = 8 * 1024 * 1024;
const ignoredParts = new Set(['.git','.svn','.hg','node_modules','.venv','venv','env','__pycache__','.idea','.vscode','.next','dist','build','.DS_Store']);
const textExts = new Set(['py','pyi','txt','md','json','jsonl','csv','tsv','yaml','yml','toml','ini','cfg','xml','html','css','js','sql','sh','bat','gitignore','properties','log','rst']);
export function normalizedProjectPath(path){
  if(typeof path!=='string'||!path||path.length>500||path.startsWith('/')||path.includes('\\')||path.includes('\0'))throw new Error('Invalid project file path.');
  const parts=path.split('/');
  if(parts.some(part=>!part||part==='.'||part==='..'||part.includes(':')||/[\x00-\x1f]/.test(part)))throw new Error('Unsafe project file path.');
  return parts.join('/');
}
export function shouldSkipProjectPath(path){return path.split('/').some(x=>ignoredParts.has(x)||x==='.env'||x.startsWith('.env.'));}
export function isTextFile(path){const base=path.split('/').pop()||'';return textExts.has(base.toLowerCase().split('.').pop())||['Dockerfile','Makefile','requirements.txt','pyproject.toml','README','LICENSE'].includes(base);}
export function bytesToBase64(bytes){
  let parts=[];
  for(let i=0;i<bytes.length;i+=16384){parts.push(String.fromCharCode(...bytes.subarray(i,i+16384)));}
  return btoa(parts.join(''));
}
export function base64ToBytes(base64){
  const raw=atob(base64),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  return bytes;
}
const encoder=new TextEncoder();
export function encodeProjectFile(file){return file.isText?bytesToBase64(encoder.encode(file.text)):file.base64;}
export function selectEntryPoint(files){
  const python=files.map(f=>f.path).filter(p=>p.toLowerCase().endsWith('.py'));
  return python.find(p=>p==='main.py')||python.find(p=>p==='app.py')||python.find(p=>p==='run.py')||python.find(p=>p.endsWith('/main.py'))||python.find(p=>p.endsWith('/app.py'))||python[0]||null;
}
export async function importFolderFileList(fileList){
  const original=Array.from(fileList||[]);
  if(!original.length)throw new Error('Choose a folder that contains files.');
  const root=(original[0].webkitRelativePath||'').split('/')[0];
  const name=root||'My Python Project';
  const accepted=[];let total=0;
  for(const raw of original){
    const relative=raw.webkitRelativePath||raw.name;
    let path=relative;
    if(root&&path.startsWith(root+'/'))path=path.slice(root.length+1);
    path=normalizedProjectPath(path);
    if(shouldSkipProjectPath(path))continue;
    if(raw.size>MAX_SINGLE_FILE_BYTES)throw new Error(`File too large: ${path} (max 8 MB each).`);
    total+=raw.size;
    if(total>MAX_PROJECT_BYTES)throw new Error('Project exceeds the 20 MB limit.');
    accepted.push({path,raw});
    if(accepted.length>MAX_PROJECT_FILES)throw new Error('Project exceeds the 250-file limit.');
  }
  if(!accepted.length)throw new Error('Folder has no supported files after excluding caches and secrets.');
  const unique=new Set();
  const files=[];
  for(const {path,raw} of accepted){
    if(unique.has(path))throw new Error(`Duplicate path: ${path}`);unique.add(path);
    const bytes=new Uint8Array(await raw.arrayBuffer());
    const isText=isTextFile(path)&&!bytes.includes(0);
    files.push({path,isText,text:isText?new TextDecoder().decode(bytes):'',base64:isText?'':bytesToBase64(bytes),size:bytes.length});
  }
  files.sort((a,b)=>a.path.localeCompare(b.path));
  return {name,files,entry:selectEntryPoint(files),active:selectEntryPoint(files)||files.find(x=>x.isText)?.path||files[0].path};
}
export function projectPayload(project){
  if(!project?.files?.length||!project.entry)throw new Error('Select a Python entry file before running.');
  if(!project.files.some(f=>f.path===project.entry&&f.path.endsWith('.py')))throw new Error('Entry point must be a .py file in this project.');
  if(project.files.length>MAX_PROJECT_FILES)throw new Error('Too many files.');
  let bytes=0;
  const files=project.files.map(file=>{
    const path=normalizedProjectPath(file.path);
    const base64=encodeProjectFile(file);
    bytes+=Math.floor(base64.length*3/4);
    if(base64.length>Math.ceil(MAX_SINGLE_FILE_BYTES*4/3)+4)throw new Error(`File too large: ${path}`);
    return {path,base64};
  });
  if(bytes>MAX_PROJECT_BYTES)throw new Error('Project size exceeds 20 MB.');
  return {entry:project.entry,files};
}
const DB_NAME='python-debug-lab-project-v1';
const STORE='workspaces';
async function database(){
  if(typeof indexedDB==='undefined')throw new Error('IndexedDB is unavailable in this browser.');
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Cannot open IndexedDB'));
  });
}
async function transaction(action,project){
  const db=await database();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,action==='load'?'readonly':'readwrite');
    const store=tx.objectStore(STORE);
    const req=action==='load'?store.get('current'):action==='clear'?store.delete('current'):store.put(project,'current');
    let value=null;
    req.onsuccess=()=>{value=req.result};
    req.onerror=()=>reject(req.error||new Error('Project storage failed'));
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(tx.error||new Error('Project storage failed'));
    tx.onabort=()=>reject(tx.error||new Error('Project storage aborted'));
  });}finally{db.close();}
}
export const loadProject=()=>transaction('load');
export const saveProject=project=>transaction('save',project);
export const clearProject=()=>transaction('clear');
