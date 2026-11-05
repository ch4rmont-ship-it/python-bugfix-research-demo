import {tasks,totalVariants} from "./tasks.js";
import {SOLUTIONS} from "./solutions.js";

const KEY = "pylab-full-demo-v2";
const DEFAULT_CODE = `def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(factorial(5))`;

const safe = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const el = query=>document.querySelector(query);
function storageRead() {try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
function storageWrite(){try{localStorage.setItem(KEY,JSON.stringify({taskId:state.taskId,variant:state.variant,code:state.code,freeCode:state.freeCode,freeInput:state.freeInput,history:state.history}));}catch{notify("Storage unavailable: export your records to keep them.",true);}}
const saved = storageRead();
const state = {
 page:"dashboard",
 taskId:tasks.some(t=>t.id===saved.taskId)?saved.taskId:"sum",
 variant:Number.isInteger(saved.variant)&&saved.variant>=0&&saved.variant<5?saved.variant:0,
 code:saved.code||tasks[0].variants[0].code,
 freeCode:saved.freeCode||DEFAULT_CODE,
 freeInput:typeof saved.freeInput==="string"?saved.freeInput:"",
 history:Array.isArray(saved.history)?saved.history:[],
 hints:0, result:null, freeResult:null, freeSession:null, busy:false, working:"", revealed:false,
 tool:"explanation"
};
if(!saved.taskId)state.code=tasks[0].variants[0].code;
const task = ()=>tasks.find(t=>t.id===state.taskId)||tasks[0];
const variant=()=>task().variants[state.variant];
const solution=()=>SOLUTIONS[state.taskId];
const percent=(n,d)=>d?Math.round(100*n/d):0;
const solved=()=>state.history.filter(h=>h.passed);
const solvedVariants=()=>new Set(solved().map(h=>h.key));
const completedTopics=()=>tasks.filter(t=>state.history.some(h=>h.passed&&h.taskId===t.id)).length;
const number= n => Number(n).toLocaleString("en-US");
const dateLabel = iso => new Date(iso).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const format = v=>typeof v==="string"?JSON.stringify(v):JSON.stringify(v)??"None";
let toastTimeout;
function notify(message,error=false){const e=el("#toast");e.textContent=message;e.className=`toast show${error?" error":""}`;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>e.classList.remove("show"),4300);}
function title(kicker,heading,sub,action=""){return `<div class="page-head"><div><div class="eyebrow">${safe(kicker)}</div><h1 class="page-title">${safe(heading)}</h1><p class="page-subtitle">${safe(sub)}</p></div>${action}</div>`;}
function button(text,action,style="btn-primary",extra=""){return `<button class="btn ${style}" data-action="${action}" ${extra}>${text}</button>`;}
function section(heading,action=""){return `<div class="section-bar"><h2 class="section-title">${heading}</h2>${action}</div>`;}
function stat(label,value,note,icon,kind){return `<div class="card stat-card"><div class="stat-top"><span>${safe(label)}</span><span class="stat-ico ${kind}">${icon}</span></div><div class="stat-number">${safe(value)}</div><div class="stat-note">${safe(note)}</div></div>`;}
function pill(text,klass=""){return `<span class="tiny-pill ${klass}">${safe(text)}</span>`;}
function track(percentValue){return `<div class="progress-track"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,percentValue))}%"></div></div>`;}
function selectTask(id,index=0) {
 const t=tasks.find(x=>x.id===id);if(!t)return;
 state.taskId=t.id;state.variant=Math.max(0,Math.min(t.variants.length-1,index));
 state.code=t.variants[state.variant].code;state.hints=0;state.result=null;
 state.revealed=false;storageWrite();state.page="practice";render();
}
function resultsMarkup(result){
 if(!result)return `<div class="empty"><div class="empty-icon">⌁</div><h3>Ready to debug</h3><p>Edit the starter code, then run the test suite. Your outputs will appear here.</p></div>`;
 const cases=result.tests||[],passed=cases.filter(x=>x.passed).length;
 const complete=cases.length>0&&passed===cases.length;
 return `<div class="flex-between"><strong>${passed}/${cases.length} tests passed</strong>${pill(complete?"ALL PASSED":"NEEDS DEBUGGING",complete?"success":"warn")}</div>
 ${result.executionError?`<div class="callout mt-12" style="border-color:#ffdddd;background:#fff8f8"><strong>Runtime error</strong><div class="mono small">${safe(result.executionError)}</div></div>`:""}
 <div class="mt-12">${cases.map((t,i)=>`<div class="test-row"><span class="test-symbol ${t.passed?"test-pass":"test-fail"}">${t.passed?"✓":"✕"}</span><div class="test-body"><strong>Test ${i+1}</strong><div class="muted mt-12">Expected: <span class="mono">${safe(format(t.expected))}</span></div><div class="muted">Received: <span class="mono">${safe(t.error||format(t.actual))}</span></div></div></div>`).join("")}</div>
 ${result.stdout?`<div class="card-caption mt-12">Printed output</div><pre class="code-output">${safe(result.stdout)}</pre>`:""}`;
}
function renderDashboard(){
 const attempts=state.history.length,totalSolved=solvedVariants().size,rate=percent(solved().length,attempts);
 return title("Your coding workspace","Python Debug Lab","A complete practice environment to find logic errors, execute Python code, and improve debugging skills.",
 `<button class="btn btn-outline" data-action="export-csv">↓ Export progress</button>`)
 +`<section class="hero"><div><div class="hero-tag">✦ LEARN PYTHON THROUGH DEBUGGING</div><h2>Find the bug.<br>Understand the fix.</h2><p>25 broken examples, real code execution, gradual hints, live test feedback — all inside your browser.</p><button class="btn btn-white" data-page="practice">Start debugging →</button></div><div class="hero-code"><div class="comment"># fix the condition ↓</div><div><span class="func">def</span> sum_positive(nums):</div><div>&nbsp;&nbsp;total = 0</div><div>&nbsp;&nbsp;for n in nums:</div><div class="error">&nbsp;&nbsp;&nbsp;&nbsp;if n &lt; 0: ✕</div><div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;total += n</div><div>&nbsp;&nbsp;return total</div></div></section>
 <div class="grid grid-4 stats">
 ${stat("Practice variations",totalVariants,"5 Python topics","⌘","purple")}
 ${stat("Variants solved",`${totalSolved}/${totalVariants}`,"Unique passed variants","✓","teal")}
 ${stat("Code executions",attempts,"Recorded test runs","▷","blue")}
 ${stat("Run pass rate",attempts?`${rate}%`:"—","Successful test runs","↗","orange")}
 </div>
 <div class="grid split-7-5">
 <div class="card">${section("Challenge library",`<button class="text-link" data-page="practice">See all 25 variations →</button>`)}
 <div class="grid grid-2">${tasks.map(t=>`<button class="challenge-card" data-action="open-task" data-task="${t.id}"><div class="challenge-icon">${t.icon}</div><div><div class="challenge-title">${safe(t.title)}</div><div class="challenge-desc">${safe(t.zh)} · ${safe(t.level)}</div></div><span class="challenge-arrow">${state.history.some(h=>h.passed&&h.taskId===t.id)?"✓":"→"}</span></button>`).join("")}</div></div>
 <div class="card"><div class="flex-between"><h3 class="card-title">Your learning journey</h3>${pill(`${completedTopics()}/5 complete`)}</div>
 <p class="card-caption">Solve at least one version of each algorithm to complete its topic.</p>
 <div class="mt-18">${tasks.map(t=>`<div style="margin-bottom:18px"><div class="flex-between small" style="margin-bottom:7px"><strong>${safe(t.title)}</strong><span class="muted">${t.variants.filter((_,i)=>solvedVariants().has(`${t.id}:${i}`)).length}/5</span></div>${track(20*t.variants.filter((_,i)=>solvedVariants().has(`${t.id}:${i}`)).length)}</div>`).join("")}</div>
 ${button("Open your code playground →","goto-practice")}
 </div></div>
 <div class="grid grid-3 mt-18">
 ${miniFeature("⌘","25 hands-on bugs","Find off-by-one, conditional, arithmetic, and sequence errors.")}
 ${miniFeature("✦","Three levels of hints","Reveal sample clues, underlying concepts, then explicit fixes.")}
 ${miniFeature("▥","Run history","Track accuracy and export progress as CSV for your records.")}
 </div>`;
}
function miniFeature(icon,label,body){return `<div class="card"><div class="panel-head"><span class="stat-ico purple">${icon}</span><h3 class="card-title">${safe(label)}</h3></div><p class="card-caption">${safe(body)}</p></div>`;}
function renderPractice(){
 const t=task(),v=variant(),finished=state.result&&(state.result.tests||[]).length>0&&state.result.tests.every(x=>x.passed);
 return title("Interactive playground","Debug challenges","Fix the Python function and run real tests to verify your changes.",button("↺ Reset code","reset-code","btn-outline"))
 +`<div class="challenge-picker">${tasks.map(a=>`<button data-action="open-task" data-task="${a.id}" class="pick-btn ${a.id===t.id?"active":""}">${a.icon} &nbsp;${safe(a.title)}</button>`).join("")}</div>
 <div class="grid split-7-5 mb-16">
  <div class="card"><div class="flex-between"><div>${pill(t.tag)} ${pill(t.level,"ink")}</div><span class="small muted">Topic ${tasks.indexOf(t)+1}/5</span></div><h2 class="section-title mt-18">${safe(t.title)} <span class="muted xs">/ ${safe(t.zh)}</span></h2><p class="small muted">${safe(t.description)}</p><div class="mt-18 small"><strong>Required:</strong> <span class="mono">${safe(t.signature)}</span></div></div>
  <div class="card"><label class="label" for="variant-picker">CHOOSE BUG VARIATION</label><select id="variant-picker" class="select">${t.variants.map((x,i)=>`<option value="${i}" ${i===state.variant?"selected":""}>${i+1}. ${safe(x.title)}</option>`).join("")}</select><p class="card-caption">Each variation contains an intentional logic error. All test cases must pass.</p></div>
 </div>
 <div class="editor-layout">
 <div class="grid" style="align-items:start">
   <div class="card editor-card"><div class="editor-bar"><span class="editor-file"><span class="editor-dot"></span>${safe(t.id)}_bug_${state.variant+1}.py</span>${pill("Python 3")}</div>
   <textarea id="practice-editor" class="editor-textarea" spellcheck="false" aria-label="Python editor">${safe(state.code)}</textarea>
   <div class="editor-footer"><button class="btn btn-primary" data-action="practice-run" ${state.busy?"disabled":""}>${state.busy?"Running…":"▷ Run tests"}</button><button class="btn btn-outline" data-action="apply-reference" ${!state.result?"disabled title='Run the tests first'":""}>✧ Apply reference fix</button><span class="muted xs">${t.tests.length} test cases · code auto-saved</span></div></div>
   ${state.result?`<div class="card"><h3 class="card-title">What's happening?</h3><div class="callout mt-12">${safe(explainResult(state.result,t))}</div>${finished?`<p class="small" style="color:#10997b"><strong>✓ Good work!</strong> All ${t.tests.length} cases pass. Try another variation to build fluency.</p>`:`<p class="card-caption">The debugger uses test results and Python exceptions. It does not claim to be a generative AI service.</p>`}</div>`:""}
 </div>
 <div class="grid" style="align-items:start">
  <div class="card"><div class="panel-head"><span class="stat-ico teal">✓</span><div><h3>Test console</h3><p>Live results from browser Python</p></div></div>${resultsMarkup(state.result)}</div>
  <div class="card"><div class="flex-between"><h3 class="card-title">Guided hints</h3><div class="hint-count">${[1,2,3].map(i=>`<i class="${i<=state.hints?"on":""}"></i>`).join("")}</div></div>
  <p class="card-caption">Unlock clues progressively. You decide how much help to use.</p>
  ${state.hints>=1?hintBox("01 · EXAMPLE",v.hintCase):""}
  ${state.hints>=2?hintBox("02 · CONCEPT",v.hintConcept):""}
  ${state.hints>=3?hintBox("03 · REPAIR",v.hintFix):""}
  <button class="btn btn-soft mt-18" data-action="unlock-hint" ${state.hints>=3?"disabled":""}>${state.hints>=3?"All clues shown":"✦ Reveal next hint"}</button>
  </div>
  <div class="card"><div class="flex-between"><h3 class="card-title">Reference solution</h3>${pill(state.result?"Unlocked":"Locked",state.result?"success":"ink")}</div><p class="card-caption">Want to compare your approach against a known-correct example?</p><button class="btn btn-outline mt-12" data-action="toggle-solution" ${!state.result?"disabled":""}>${state.revealed?"Hide solution":"View solution"}</button>${state.revealed?`<pre class="code-output mt-12">${safe(solution())}</pre>`:""}</div>
 </div></div>`;
}
function hintBox(title,content){return `<div class="hint-card"><strong>${safe(title)}</strong><p>${safe(content)}</p></div>`;}
function explainResult(r,t){
 if(r.executionError)return diagnose(r.executionError);
 const f=(r.tests||[]).filter(x=>!x.passed);
 if(!f.length)return "Your function passed every supplied test. Great! Note that a passing test suite increases confidence, but does not formally prove correctness for every possible input.";
 if(f.some(x=>x.error))return diagnose(f.find(x=>x.error).error);
 const one=f[0];return `The function returned ${format(one.actual)} while the expected result is ${format(one.expected)}. The program runs, so this looks like a logic error. Check loop boundaries, branching conditions, accumulators, or return values.`;
}
const DIAG={
 SyntaxError:"Python could not parse the code. Check colons after def/if/for statements, brackets, quotations, and invalid operators.",
 IndentationError:"Indentation is inconsistent. All statements in the same Python block must align; use four spaces per level.",
 NameError:"A variable or function name was used before it was defined. Verify spelling, capitalization and execution order.",
 EOFError:"The script needs more input. Enter one value on each line in the Standard Input (stdin) box, matching every input() call.",
 TypeError:"An operation received an incompatible type or number of arguments. Inspect the involved values and function signature.",
 IndexError:"The code accessed a list index that does not exist. Check the list length and off-by-one loop conditions.",
 ZeroDivisionError:"A division uses zero as the divisor. Handle the empty list or zero denominator before dividing.",
 KeyError:"A dictionary key is missing. Verify the key name, or use a safe lookup when appropriate.",
 AttributeError:"An object does not provide the requested method or property. Confirm its type.",
 ValueError:"A value is not valid for the requested operation. Inspect input data and conversion rules.",
 RecursionError:"The function is recursing too deeply. Verify that its base case stops recursive calls.",
 TabError:"Tabs and spaces were mixed in indentation. Use a consistent indentation style (four spaces).",
 ModuleNotFoundError:"The requested module is unavailable in this browser Python environment."
};
function diagnose(error){const value=String(error||"Unknown error");const name=value.match(/(?:^|\b)([A-Za-z]+Error)\b/)?.[1]||"Runtime error";return `${name}: ${DIAG[name]||"Read the exception, inspect the referenced operation and try a smaller test case."} — ${value.slice(0,260)}`;}

function renderDebugger(){
 const r=state.freeResult;
 return title("Python tools","Online Python Compiler","Write Python, run your code, and enter input() values interactively in the console — or paste a batch of stdin lines.",
 button("↺ Reset example","reset-free","btn-outline"))
 +`<div class="editor-layout">
 <div class="grid" style="align-items:start">
  <div class="card editor-card"><div class="editor-bar"><span class="editor-file"><span class="editor-dot"></span>my_python_script.py</span>${pill("Interactive Python")}</div>
  <textarea id="free-editor" class="editor-textarea" style="min-height:360px" spellcheck="false" aria-label="Custom Python code" ${state.freeSession?"readonly":""}>${safe(state.freeCode)}</textarea>
  <div class="stdin-panel"><div class="flex-between"><label class="label" for="stdin-editor">OPTIONAL INPUT DATA (stdin)</label>${pill("Interactive input()","success")}</div><textarea id="stdin-editor" class="input stdin-textarea mono" rows="3" placeholder="10&#10;20" spellcheck="false" aria-label="Optional input values, one per line" ${state.freeSession?"readonly":""}>${safe(state.freeInput)}</textarea><p class="card-caption">Leave blank to enter each <span class="mono">input()</span> interactively in the console. Or paste as many lines as needed here before running.</p><button class="btn btn-soft btn-sm mt-12" data-action="sample-add">+ Load A + B input example</button> <button class="btn btn-outline btn-sm mt-12" data-action="sample-three">+ Load 3-number example</button> <button class="btn btn-outline btn-sm mt-12" data-action="sample-loop">+ Interactive loop demo</button></div>
  <div class="editor-footer"><button class="btn btn-primary" data-action="free-run" ${state.busy?"disabled":""}>${state.busy?"Executing…":state.freeSession?"↻ Restart program":"▷ Run Code"}</button>${state.freeSession?`<button class="btn btn-danger" data-action="stop-free">■ Stop</button>`:""}<button class="btn btn-outline" data-action="copy-free">Copy</button><button class="btn btn-outline" data-action="download-free">↓ .py</button><span class="xs muted">Python 3 · Browser runtime</span></div></div>
  <div class="callout"><strong>How this works:</strong> Uses Python via WebAssembly. When the console asks for input, type a value and press Enter; the current script is replayed with all collected inputs. No API key needed. Not all CPython packages or OS features are available.</div>
 </div>
 <div class="grid" style="align-items:start">
  <div class="card"><div class="flex-between"><div class="panel-head" style="margin:0"><span class="stat-ico purple">⌘</span><div><h3>Interactive console</h3><p>Output and input — like an online compiler</p></div></div><button class="btn btn-outline btn-sm" data-action="clear-console">Clear</button></div>
  <div class="compiler-terminal" role="region" aria-label="Python console output"><div class="terminal-topline"><span class="terminal-light"></span> <span>output / Python 3</span> ${pill(state.busy?"RUNNING":r?.inputRequired?"AWAITING INPUT":r?.executionError?"ERROR":r?"FINISHED":"READY",r?.inputRequired?"warn":r&&!r.executionError?"success":"ink")}</div>
  <pre class="terminal-output" id="terminal-output">${r?safe(r.stdout||"(No output printed)"):"Press Run Code to execute Python.\nIf input() requests data, type below."}</pre>
  ${r?.inputRequired?`<div class="terminal-input-wrap"><div class="terminal-hint">${safe(r.inputPrompt||"Python input() is waiting for a value")} · type below and press Enter</div><div class="terminal-input-line"><span class="terminal-chevron">›</span><input id="terminal-input" type="text" autocomplete="off" spellcheck="false" placeholder="Enter value and press Enter" aria-label="Value for Python input()"><button class="btn btn-primary btn-sm" data-action="send-console-input">Enter ↵</button></div></div>`:""}
  ${r?.stderr?`<div class="terminal-error"><strong>stderr:</strong><pre class="code-output">${safe(r.stderr)}</pre></div>`:""}
  ${r?.executionError?`<div class="terminal-error"><strong>Exception:</strong> ${safe(r.executionError)}${r.traceback?`<details class="mt-12"><summary>Show Python traceback</summary><pre class="code-output">${safe(r.traceback)}</pre></details>`:""}</div>`:""}
  </div><p class="card-caption mt-12">The console accepts any number of <span class="mono">input()</span> requests. For <span class="mono">sys.stdin.read()</span>, supply all data in Optional Input Data before running.</p></div>
  <div class="card"><div class="panel-head"><span class="stat-ico teal">✦</span><div><h3>Debugger explanation</h3><p>Rule-based guidance · no API key</p></div></div>
  ${r?`<div class="callout"><strong>${r.inputRequired?"Waiting for keyboard input":r.executionError?"Suggested next step":"No runtime exception detected"}</strong><p>${safe(r.inputRequired?"Type a value in the Interactive Console and press Enter to continue. Each input is replayed to produce the next prompt or final result.":r.executionError?diagnose(r.executionError):"The script executed without a reported exception. If the output is incorrect, compare it with a known expected result or switch to Practice for unit-tested exercises.")}</p></div>`:
 `<p class="card-caption">When you run your code, Python will report errors such as NameError, TypeError, SyntaxError, IndentationError and more. We'll describe their likely causes here.</p>`}
  </div>
  <div class="card"><h3 class="card-title">Try an error example</h3><div class="grid mt-12">
  ${[["NameError","print(missing_value)"],["ZeroDivisionError","items = []\nprint(10 / len(items))"],["IndexError","data = [1, 2]\nprint(data[5])"],["SyntaxError","for n in range(4)\n    print(n)"]].map(([name,code],i)=>`<button class="challenge-card" data-action="sample-error" data-sample="${i}"><span class="stat-ico orange">⌁</span><span class="small"><strong>${name}</strong></span><span class="challenge-arrow">→</span></button>`).join("")}
  </div></div>
 </div></div>`;
}
const SAMPLES=["print(missing_value)","items = []\nprint(10 / len(items))","data = [1, 2]\nprint(data[5])","for n in range(4)\n    print(n)"];
function renderAnalytics(){
 const history=state.history;
 const correct=history.filter(x=>x.passed);
 const byTopic=tasks.map(t=>({task:t,completed:t.variants.filter((_,i)=>solvedVariants().has(`${t.id}:${i}`)).length,runs:history.filter(h=>h.taskId===t.id).length}));
 return title("Your progress","Learning analytics","Your personal debugging activity. Data is stored on this device, not on a server.",
 `<button class="btn btn-outline" data-action="export-csv">↓ Export CSV</button>`)
 +`<div class="grid grid-4 stats">
 ${stat("Recorded runs",history.length,"Practice test submissions","▷","purple")}
 ${stat("Unique variants solved",solvedVariants().size,"Out of 25 available", "✓","teal")}
 ${stat("Accuracy",history.length?`${percent(correct.length,history.length)}%`:"—","All-test pass rate per run","◫","blue")}
 ${stat("Topics completed",`${completedTopics()}/5`,"At least one solved variation","◴","orange")}
 </div>
 <div class="grid split-7-5">
  <div class="card">${section("Solved variants by topic")}${byTopic.map(x=>`<div class="chart-row"><span class="chart-label">${safe(x.task.title)}</span><div class="chart-bar-wrap"><div class="chart-bar" style="width:${20*x.completed}%"></div></div><span class="chart-val">${x.completed}/5</span></div>`).join("")}<div class="chart-note mt-12">Counted once per variant, not once per successful run.</div></div>
  <div class="card"><h3 class="card-title">Practice insights</h3><p class="card-caption">Track completed tasks and identify areas where you need more practice.</p>
  <div class="method-row"><div class="method-number">01</div><div><h4>Practice consistently</h4><p>Run a few different code samples, not just the same solution repeatedly.</p></div></div>
  <div class="method-row"><div class="method-number">02</div><div><h4>Check failing cases</h4><p>Compare expected vs actual values to locate logic mistakes.</p></div></div>
  <div class="method-row"><div class="method-number">03</div><div><h4>Use hints selectively</h4><p>Try a test case clue before revealing the complete fix.</p></div></div>
  </div>
 </div>
 <div class="card mt-18">${section("Recent test runs",`<button class="btn btn-danger btn-sm" data-action="clear-history" ${!history.length?"disabled":""}>Clear history</button>`)}
 ${history.length?`<div class="table-wrap"><table class="record-table"><thead><tr><th>Date</th><th>Algorithm</th><th>Variation</th><th>Result</th><th>Tests</th><th>Hints</th></tr></thead><tbody>
 ${history.slice(0,40).map(h=>`<tr><td>${safe(dateLabel(h.date))}</td><td>${safe(tasks.find(t=>t.id===h.taskId)?.title||h.taskId)}</td><td>#${Number(h.variant)+1}</td><td>${pill(h.passed?"Passed":"Failed",h.passed?"success":"warn")}</td><td>${h.testPassed}/${h.testTotal}</td><td>${h.hints}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><div class="empty-icon">▥</div><h3>No run history yet</h3><p>Complete a challenge and the results will appear here.</p><button class="btn btn-primary" data-page="practice">Start practicing</button></div>`}
 </div>`;
}
function renderGuide(){
 return title("About the platform","How Debug Lab works","A working Python debugging demo built to show coding, error detection, guided practice, and progress tracking.")
 +`<div class="grid split-7-5">
 <div class="card"><h3 class="card-title">Start in three steps</h3>
 <div class="method-row"><div class="method-number">01</div><div><h4>Choose a buggy program</h4><p>Select one of five Python topics and one of its five intentional mistakes.</p></div></div>
 <div class="method-row"><div class="method-number">02</div><div><h4>Edit, execute, and inspect</h4><p>Correct the source in the editor and check outputs against multiple predefined cases.</p></div></div>
 <div class="method-row"><div class="method-number">03</div><div><h4>Unlock hints when needed</h4><p>Use a concrete test example, a conceptual hint, and finally a detailed correction.</p></div></div>
 <div class="method-row"><div class="method-number">04</div><div><h4>Review progress</h4><p>Analyze learning history or export your results as a CSV file.</p></div></div>
 <button class="btn btn-primary" data-page="practice">Try a challenge →</button>
 </div>
 <div class="grid">
 <div class="card"><h3 class="card-title">Demo features</h3><ul class="bullet-list"><li>25 buggy code variants in five topics</li><li>Real Python 3 runtime via Pyodide</li><li>4–6 test cases per exercise</li><li>Step-by-step hints and canonical fixes</li><li>Online Python compiler: console input() prompts and batch stdin</li><li>Free-form code execution with exception guidance</li><li>Local progress dashboard, analytics, CSV export</li><li>Responsive mobile and desktop layout</li></ul></div>
 <div class="callout"><strong>Important limitations.</strong> The platform is a functioning rule-based demo, not a live generative AI chatbot. The first run requires internet access to download the Python WebAssembly runtime. Code execution occurs inside a browser Worker with a time limit; it is not a hardened server-side security sandbox. Progress is kept only in this browser.</div>
 </div></div>
 <div class="grid grid-3 mt-18">
 ${miniFeature("↔","Test-driven debugging","Practice requires matching expected results across multiple input cases.")}
 ${miniFeature("⚙","Open source","Static HTML, CSS and JavaScript; no server or database needed.")}
 ${miniFeature("✦","Learning first","Hints become more specific only when you request them.")}
 </div>`;
}
function render(){
 const body={dashboard:renderDashboard,practice:renderPractice,debugger:renderDebugger,analytics:renderAnalytics,guide:renderGuide};
 el("#app").innerHTML=(body[state.page]||renderDashboard)();
 document.querySelectorAll("#nav [data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
 const titles={dashboard:"Overview",practice:"Debug playground",debugger:"Python Compiler",analytics:"Analytics",guide:"Guide"};
 el("#page-crumb").textContent=titles[state.page]||"Overview";
 if(state.page==="practice"){
  const editor=el("#practice-editor");
  if(editor)editor.addEventListener("input",event=>{state.code=event.target.value;state.result=null;state.revealed=false;storageWrite();});
  el("#variant-picker")?.addEventListener("change",event=>selectTask(state.taskId,Number(event.target.value)));
 }else if(state.page==="debugger"){
  el("#free-editor")?.addEventListener("input",event=>{state.freeCode=event.target.value;state.freeResult=null;storageWrite();});
  el("#free-editor")?.addEventListener("keydown",event=>{
   if(event.key==="Tab"){
    event.preventDefault();const t=event.target,start=t.selectionStart,end=t.selectionEnd;
    t.setRangeText("    ",start,end,"end");state.freeCode=t.value;storageWrite();
   }
   if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){
    event.preventDefault();void performFreeRun();
   }
  });
  el("#stdin-editor")?.addEventListener("input",event=>{state.freeInput=event.target.value;state.freeResult=null;storageWrite();});
  el("#terminal-input")?.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();void supplyConsoleInput();}});
  if(state.freeResult?.inputRequired){el("#terminal-input")?.focus();}
 }
}
let worker=null,sequence=0,workerReady=false;
const pending=new Map();
function discardWorker(){
 if(worker){worker.terminate();worker=null;}
 for(const [id,p] of pending){clearTimeout(p.timeout);p.reject(new Error("Python session restarted."));pending.delete(id);}
 workerReady=false;
}
function makeWorker(){
 if(worker)return worker;
 worker=new Worker("./python-worker.js");
 worker.onerror=err=>{const msg=err.message||"Python worker failed to load";for(const [id,p] of pending){clearTimeout(p.timeout);p.reject(new Error(msg));pending.delete(id);}discardWorker();};
 worker.onmessage=event=>{
  const {id,result,error}=event.data;
  const p=pending.get(id);if(!p)return;
  clearTimeout(p.timeout);pending.delete(id);workerReady=true;
  if(error)p.reject(new Error(error));else p.resolve(result);
 };
 return worker;
}
function runPython(request){
 const current=makeWorker(),id=++sequence;
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{
   pending.delete(id);discardWorker();reject(new Error("Python timed out. Check for infinite loops or try again."));
  },workerReady?10000:55000);
  pending.set(id,{resolve,reject,timeout});
  current.postMessage({id,request});
 });
}
async function performPracticeRun(){
 if(state.busy)return;
 const t=task(),index=state.variant,key=`${t.id}:${index}`,source=state.code;
 state.busy=true;render();notify("Starting browser Python; the first run may download the runtime.");
 try{
  const result=await runPython({mode:"test",code:source,functionName:t.functionName,tests:t.tests});
  const passed=result.tests?.length===t.tests.length &&result.tests.every(x=>x.passed);
  state.result=result;
  state.history.unshift({date:new Date().toISOString(),taskId:t.id,variant:index,key,passed:Boolean(passed),testPassed:result.tests?.filter(x=>x.passed).length||0,testTotal:t.tests.length,hints:state.hints});
  if(state.history.length>500)state.history.length=500;
  storageWrite();
  notify(passed?"Fantastic — all tests passed!":"Tests finished. Inspect the results to find the issue.",!passed);
 }catch(error){
  state.result={tests:[],executionError:error.message};
  notify(error.message,true);
 }finally{state.busy=false;render();}
}
let freeRunToken=0;
function initialStdin(value){
 const normalized=String(value||"").replace(/\r\n?/g,"\n");
 return normalized && !normalized.endsWith("\n")?normalized+"\n":normalized;
}
function cancelFreeRun(){
 freeRunToken++;
 if(state.busy)discardWorker();
 state.busy=false;state.freeSession=null;
}
async function executeFreeSession(token){
 const session=state.freeSession;
 if(!session)return;
 state.busy=true;render();
 try{
  const result=await runPython({mode:"execute",code:session.code,stdin:session.stdin,tests:[]});
  if(token!==freeRunToken)return;
  state.freeResult=result;
  state.busy=false;
  if(result.inputRequired){
   session.requests++;
   if(session.requests>100){
    state.freeSession=null;
    state.freeResult={...result,inputRequired:false,executionError:"Input limit reached (100 prompts). Reduce the number of prompts or use Optional Input Data."};
    notify("Too many interactive input prompts.",true);
   }
  }else{
   state.freeSession=null;
   notify(result.executionError?`Python error: ${result.executionError}`:"Execution complete.",Boolean(result.executionError));
  }
 }catch(error){
  if(token!==freeRunToken)return;
  state.freeResult={tests:[],stdout:"",executionError:error.message};
  state.freeSession=null;state.busy=false;
  notify(error.message,true);
 }
 if(token===freeRunToken)render();
}
async function performFreeRun(){
 if(state.busy)return;
 cancelFreeRun();
 const token=freeRunToken;
 state.freeSession={code:state.freeCode,stdin:initialStdin(state.freeInput),requests:0};
 state.freeResult=null;
 notify("Starting Python... If more input is needed, the console will ask you.");
 await executeFreeSession(token);
}
async function supplyConsoleInput(){
 const session=state.freeSession;
 if(!session||!state.freeResult?.inputRequired||state.busy)return;
 const input=el("#terminal-input");if(!input)return;
 const value=input.value;
 if(value.length>3000){notify("Single input line cannot exceed 3000 characters.",true);return;}
 session.stdin+=value+"\n";
 await executeFreeSession(freeRunToken);
}
function exportCsv(){
 if(!state.history.length){notify("No test records to export yet.",true);return;}
 const fields=["date","taskId","variant","passed","testPassed","testTotal","hints"];
 const rows=[fields.join(","),...state.history.map(r=>fields.map(k=>{const s=String(r[k]??"").replace(/"/g,'""');return `"${s}"`;}).join(","))];
 downloadText(rows.join("\r\n"),"python-debug-lab-progress.csv","text/csv;charset=utf-8");
 notify("CSV exported.");
}
function downloadText(content,name,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const anchor=document.createElement("a");anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener("click",event=>{
 const clickable=event.target.closest("button[data-page],button[data-action]");
 if(!clickable)return;
 const page=clickable.dataset.page,action=clickable.dataset.action;
 if(page){
  if(!["dashboard","practice","debugger","analytics","guide"].includes(page))return;
  state.page=page;el("#sidebar").classList.remove("open");render();scrollTo({top:0,behavior:"instant"});return;
 }
 switch(action){
  case "menu":el("#sidebar").classList.toggle("open");return;
  case "goto-practice":state.page="practice";render();return;
  case "open-task":selectTask(clickable.dataset.task);return;
  case "reset-code":if(confirm("Restore the original buggy code for this variation?")){selectTask(state.taskId,state.variant);notify("Starter code restored.");}return;
  case "unlock-hint":state.hints=Math.min(3,state.hints+1);render();return;
  case "toggle-solution":if(!state.result)return;state.revealed=!state.revealed;render();return;
  case "apply-reference":if(!state.result)return;state.code=solution();state.revealed=true;state.result=null;storageWrite();render();notify("Reference solution inserted. Run the tests to verify.");return;
  case "practice-run":void performPracticeRun();return;
  case "free-run":void performFreeRun();return;
  case "send-console-input":void supplyConsoleInput();return;
  case "stop-free":cancelFreeRun();state.freeResult={tests:[],stdout:state.freeResult?.stdout||"",executionError:"Execution stopped by user."};render();notify("Python execution stopped.");return;
  case "clear-console":cancelFreeRun();state.freeResult=null;render();return;
  case "reset-free":if(confirm("Restore the demo script?")){cancelFreeRun();state.freeCode=DEFAULT_CODE;state.freeResult=null;storageWrite();render();}return;
  case "download-free":downloadText(state.freeCode,"main.py","text/x-python;charset=utf-8");notify("Python file downloaded.");return;
  case "copy-free":{const code=state.freeCode;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(code).then(()=>notify("Code copied."),()=>notify("Clipboard unavailable.",true));}else{notify("Clipboard requires HTTPS.",true);}return;}
  case "sample-error":state.freeCode=SAMPLES[Number(clickable.dataset.sample)]||DEFAULT_CODE;state.freeResult=null;storageWrite();render();return;
  case "sample-add":cancelFreeRun();state.freeCode='A = int(input("Enter A: "))\nB = int(input("Enter B: "))\nprint("A + B =", A + B)';state.freeInput="10\n20";state.freeResult=null;storageWrite();render();notify("A + B example loaded with two input values.");return;
  case "sample-loop":cancelFreeRun();state.freeCode='n = int(input("How many numbers? "))\ntotal = 0\nfor i in range(n):\n    value = int(input(f"Number {i+1}: "))\n    total += value\nprint("Sum:", total)';state.freeInput="";state.freeResult=null;storageWrite();render();notify("Interactive loop sample loaded. Press Run Code to enter inputs.");return;
  case "sample-three":cancelFreeRun();state.freeCode='A = int(input("Enter A: "))\nB = int(input("Enter B: "))\nC = int(input("Enter C: "))\nprint("Maximum:", max(A, B, C))\nprint("Minimum:", min(A, B, C))\nprint("Average:", (A + B + C) / 3)';state.freeInput="15\n30\n45";state.freeResult=null;storageWrite();render();notify("Three-number example and its three inputs loaded.");return;
  case "export-csv":exportCsv();return;
  case "clear-history":if(confirm("Delete all recorded practice history from this browser? This cannot be undone.")){state.history=[];storageWrite();render();notify("Progress records cleared.");}return;
 }
});
render();

