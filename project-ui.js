export function renderProjectWorkspace(state,{title,pill,safe,renderDrawer}){
 const project=state.project;
 const current=project?.files?.find(f=>f.path===project.active);
 const python=project?.files?.filter(f=>f.path.endsWith('.py'))||[];
 const folders=new Set(),rows=[];
 if(project)for(const file of project.files){
  const pieces=file.path.split('/');let ancestor='';
  for(const part of pieces.slice(0,-1)){
   ancestor=ancestor?ancestor+'/'+part:part;
   if(!folders.has(ancestor)){folders.add(ancestor);rows.push('<div class="project-folder" style="padding-left:'+((ancestor.split('/').length-1)*13+10)+'px">▾ 📁 '+safe(part)+'</div>');}
  }
  const level=pieces.length-1;
  const icon=file.path.endsWith('.py')?'🐍':file.isText?'▤':'▧';
  rows.push('<button class="project-file '+(project.active===file.path?'active':'')+'" data-action="project-open-file" data-path="'+safe(file.path)+'" title="'+safe(file.path)+'" style="padding-left:'+(level*13+21)+'px"><span>'+icon+'</span><span class="project-file-name">'+safe(pieces.at(-1))+'</span>'+(project.entry===file.path?'<span class="project-entry-dot">▶</span>':'')+'</button>');
 }
 const header=title('Project Workspace','Full Python Project','Import a folder, edit nested files, and run the selected Python entry point.',
 '<label class="btn btn-primary project-upload-label" for="project-folder-input">📁 Open Folder</label><input class="hidden" id="project-folder-input" type="file" webkitdirectory directory multiple aria-label="Upload Python project folder"/>');
 if(!project)return header+(state.projectImporting?'<div class="callout">Importing files…</div>':'')+(state.projectError?'<div class="callout">'+safe(state.projectError)+'</div>':'')+
 '<div class="project-welcome"><div class="project-welcome-icon">📂</div><h2>'+(state.projectLoading?'Loading saved project…':'Open a Python project folder')+'</h2><p>Choose a folder from your computer. Keep its nested files together, browse them in Explorer, and run a Python entry point.</p><label class="btn btn-primary" for="project-folder-input">Choose Folder →</label><p class="card-caption">250 files maximum · 20 MB total · 8 MB per file. Cache folders and secret .env files are excluded.</p></div>';
 const entrySelect=python.map(file=>'<option value="'+safe(file.path)+'" '+(file.path===project.entry?'selected':'')+'>'+safe(file.path)+'</option>').join('')||'<option>No Python files</option>';
 const content=current?.isText?'<div class="code-surface project-code-surface"><div class="monaco-mount" hidden></div><div class="line-gutter" id="project-gutter" aria-hidden="true"></div><textarea class="editor-textarea" id="project-editor" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" aria-label="Project source editor" '+(state.busy?'readonly':'')+'>'+safe(current.text)+'</textarea></div>':
 '<div class="project-asset-message">'+(current?'Binary file: kept for execution but not editable here.':'Select a file in the Explorer.')+'</div>';
 return header+(state.projectError?'<div class="callout project-error">'+safe(state.projectError)+'</div>':'')+
 '<div class="project-toolbar"><div><strong>📁 '+safe(project.name)+'</strong><span class="project-summary">'+project.files.length+' files · saved locally</span></div><div class="project-toolbar-actions"><button class="btn btn-outline btn-sm" data-action="project-add-file">+ New File</button><button class="btn btn-danger btn-sm" data-action="project-close">Close Project</button></div></div>'+
 '<div class="project-layout"><aside class="project-explorer"><div class="project-explorer-top">EXPLORER <span>'+project.files.length+'</span></div><div class="project-tree">'+rows.join('')+'</div><div class="project-explorer-foot">Local IndexedDB storage</div></aside>'+
 '<section class="project-editor-pane"><div class="project-open-tab">▤ <span>'+safe(current?.path||'No file selected')+'</span>'+pill(current?.isText?'Editable':current?'Binary':'No file','ink')+'</div>'+content+
 '<div class="project-runbar"><label for="project-entry-select">▶ Entry file</label><select class="select" id="project-entry-select" '+(state.busy?'disabled':'')+'>'+entrySelect+'</select><button class="btn btn-primary" data-action="project-run" '+(state.busy||!project.entry?'disabled':'')+'>'+(state.busy?'Running…':'▷ Run Project')+'</button>'+
 ((state.freeResult||state.freeSession)&&!state.consoleOpen?'<button class="btn btn-soft" data-action="show-console">▣ Open Terminal</button>':'')+'</div>'+
 '<details class="project-advanced"><summary>Advanced: preloaded stdin</summary><div class="project-advanced-content"><label class="stdin-preload-toggle"><input id="project-use-preload" type="checkbox" '+(project.useBatch?'checked':'')+'> Use preloaded stdin</label><textarea id="project-stdin" class="input mono" rows="3" placeholder="One input per line">'+safe(project.stdin||'')+'</textarea></div></details></section></div>'+
 '<p class="project-footnote">Multi-file Python imports and bundled data files work in the browser. Temporary files created by running code are not saved. Packages missing from Pyodide, native apps, and external services may not run.</p>'+renderDrawer();
}

