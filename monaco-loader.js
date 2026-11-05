// Monaco 0.52.2 is pinned to the last release before upstream deprecated AMD loader support.
// This standalone site has no bundler; if CDN/Web Workers are blocked, the existing textarea works.
const base='https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
let loadPromise=null;
let activeEditor=null;
let activeId=null;
function loadMonaco(){
  if(typeof window==='undefined'||typeof document==='undefined')return Promise.reject(new Error('Browser required'));
  if(loadPromise)return loadPromise;
  loadPromise=new Promise((resolve,reject)=>{
    if(window.monaco?.editor){resolve(window.monaco);return;}
    const script=document.createElement('script');
    script.src=`${base}/loader.js`;
    script.async=true;
    script.onerror=()=>reject(new Error('Monaco CDN unavailable'));
    script.onload=()=>{
      if(typeof window.require?.config!=='function'){reject(new Error('Monaco loader unavailable'));return;}
      window.MonacoEnvironment={getWorkerUrl(){return URL.createObjectURL(new Blob([
        `self.MonacoEnvironment={baseUrl:${JSON.stringify(base+'/')}};importScripts(${JSON.stringify(base+'/base/worker/workerMain.js')});`
      ],{type:'text/javascript'}));}};
      window.require.config({paths:{vs:base}});
      window.require(['vs/editor/editor.main'],()=>resolve(window.monaco),reject);
    };
    document.head.appendChild(script);
  }).catch(error=>{loadPromise=null;throw error;});
  return loadPromise;
}
export function disposeMonaco(){
  if(activeEditor){try{activeEditor.dispose();}catch{} activeEditor=null;activeId=null;}
}
export async function enhancePythonEditor(id,onChange,onRun){
  const textarea=document.getElementById(id);
  if(!textarea)return false;
  const mount=textarea.closest('.code-surface')?.querySelector('.monaco-mount');
  if(!mount)return false;
  try{
    const monaco=await loadMonaco();
    if(!document.contains(textarea)||!document.contains(mount))return false;
    disposeMonaco();
    monaco.editor.defineTheme('debug-lab-midnight',{
      base:'vs-dark',inherit:true,rules:[
        {token:'keyword',foreground:'c792ea'},{token:'string',foreground:'a7e7a2'},
        {token:'number',foreground:'f3c27d'},{token:'comment',foreground:'6c819c'},
        {token:'identifier',foreground:'d3e4f8'}],
      colors:{'editor.background':'#0d1624','editor.foreground':'#d3e4f8',
        'editorLineNumber.foreground':'#62758e','editorLineNumber.activeForeground':'#b5d8ff',
        'editor.selectionBackground':'#264d72','editor.lineHighlightBackground':'#17293d',
        'editorCursor.foreground':'#80c8ff'}
    });
    mount.hidden=false;mount.style.display='block';
    textarea.style.display='none';
    const gutter=textarea.closest('.code-surface')?.querySelector('.line-gutter');
    if(gutter)gutter.style.display='none';
    activeEditor=monaco.editor.create(mount,{
      value:textarea.value,language:'python',theme:'debug-lab-midnight',
      fontFamily:'JetBrains Mono, Consolas, monospace',fontSize:13,lineHeight:23,
      minimap:{enabled:false},automaticLayout:true,
      wordWrap:'on',scrollBeyondLastLine:false,tabSize:4,insertSpaces:true,
      formatOnPaste:false,roundedSelection:false,bracketPairColorization:{enabled:true},
      folding:true,readOnly:textarea.readOnly,renderWhitespace:'selection',
      fontLigatures:true,smoothScrolling:true,stickyScroll:{enabled:false},
      padding:{top:14,bottom:14}
    });
    activeId=id;
    activeEditor.onDidChangeModelContent(()=>{
      textarea.value=activeEditor.getValue();
      onChange(textarea.value);
    });
    activeEditor.onDidChangeCursorPosition(event=>{
      const status=document.querySelector('#cursor-status');
      if(status)status.textContent=`Ln ${event.position.lineNumber}, Col ${event.position.column}`;
    });
    activeEditor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>onRun());
    return true;
  }catch(error){
    mount.hidden=true;mount.style.display='none';
    textarea.style.display='block';
    const gutter=textarea.closest('.code-surface')?.querySelector('.line-gutter');
    if(gutter)gutter.style.display='block';
    // Do not block debugging if CDN is unavailable.
    return false;
  }
}
