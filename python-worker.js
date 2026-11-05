let pyodidePromise;
let workQueue = Promise.resolve();
async function getInterpreter() {
 if(!pyodidePromise){
  pyodidePromise=(async()=>{
   importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");
   return loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.27.7/full/"});
  })();
 }
 return pyodidePromise;
}
async function execute(request){
 const engine=await getInterpreter();
 engine.globals.set("__pylab_payload",JSON.stringify(request));
 try{
  const output=await engine.runPythonAsync(`
import json, io, contextlib, sys, builtins, traceback, base64, pathlib, os, runpy, tempfile, shutil, importlib
payload = json.loads(__pylab_payload)
previous_stdin = sys.stdin
previous_input = builtins.input
previous_cwd = os.getcwd()
previous_syspath = list(sys.path)
previous_argv = list(sys.argv)
project_dir = None
sys.stdin = io.StringIO(payload.get("stdin", ""))
namespace = {"__name__": "__main__"}
capture = io.StringIO()
err_capture = io.StringIO()
report = {"tests": [], "stdout": "", "stderr": "", "traceback": "", "executionError": None, "inputRequired": False, "inputPrompt": ""}
class InputRequired(BaseException):
    def __init__(self, prompt):
        self.prompt = prompt

def compiler_input(prompt=""):
    prompt = str(prompt)
    if payload.get("mode") != "custom_test":
        print(prompt, end="", flush=True)
    line = sys.stdin.readline()
    if line == "":
        raise InputRequired(prompt)
    answer = line.removesuffix(chr(10)).removesuffix(chr(13))
    if payload.get("mode") != "custom_test":
        print(answer)
    return answer

def encode(value):
    try:
        return json.loads(json.dumps(value, ensure_ascii=False))
    except (TypeError, ValueError):
        return repr(value)
try:
    if payload.get("mode") in ("execute", "custom_test", "project"):
        builtins.input = compiler_input
    try:
        with contextlib.redirect_stdout(capture), contextlib.redirect_stderr(err_capture):
            if payload.get("mode") == "project":
                project = payload.get("project") or {}
                project_files = project.get("files") or []
                if not project_files or len(project_files) > 250:
                    raise ValueError("Project must contain between 1 and 250 files")
                project_dir = pathlib.Path(tempfile.mkdtemp(prefix="debuglab_project_"))
                total_size = 0
                for item in project_files:
                    relative = item["path"]
                    parts = relative.split("/")
                    if (not isinstance(relative, str) or not relative or len(relative) > 500
                        or relative.startswith("/") or chr(92) in relative
                        or any(p in ("", ".", "..") or ":" in p for p in parts)):
                        raise ValueError("Unsafe project path")
                    data = base64.b64decode(item["base64"], validate=True)
                    total_size += len(data)
                    if len(data) > 8 * 1024 * 1024 or total_size > 20 * 1024 * 1024:
                        raise ValueError("Project size exceeds limits")
                    target = project_dir.joinpath(*parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
                entry_path = project["entry"]
                if entry_path not in [f["path"] for f in project_files] or not entry_path.endswith(".py"):
                    raise ValueError("Choose a valid Python entry file")
                entry_file = project_dir / entry_path
                os.chdir(project_dir)
                sys.path.insert(0, str(project_dir))
                sys.path.insert(0, str(entry_file.parent))
                sys.argv = [str(entry_file)]
                importlib.invalidate_caches()
                runpy.run_path(str(entry_file), run_name="__main__")
            else:
                exec(compile(payload["code"], "<editor>", "exec"), namespace)
        if payload.get("mode") == "test":
            name = payload["functionName"]
            callback = namespace.get(name)
            if not callable(callback):
                raise NameError("Required function " + name + " is missing or not callable")
            for case in payload["tests"]:
                try:
                    with contextlib.redirect_stdout(capture), contextlib.redirect_stderr(err_capture):
                        actual = callback(*case["args"])
                    report["tests"].append({
                        "passed": actual == case["expected"],
                        "actual": encode(actual),
                        "expected": case["expected"],
                        "error": None
                    })
                except Exception as exc:
                    report["tests"].append({
                        "passed": False,
                        "actual": None,
                        "expected": case["expected"],
                        "error": type(exc).__name__ + ": " + str(exc)
                    })
    except InputRequired as exc:
        report["inputRequired"] = True
        report["inputPrompt"] = exc.prompt
    except Exception as exc:
        report["executionError"] = type(exc).__name__ + ": " + str(exc)
        report["traceback"] = traceback.format_exc(limit=8)[:4000]
finally:
    sys.stdin = previous_stdin
    builtins.input = previous_input
    os.chdir(previous_cwd)
    sys.path[:] = previous_syspath
    sys.argv = previous_argv
    if project_dir is not None:
        project_prefix = str(project_dir) + os.sep
        for key, mod in list(sys.modules.items()):
            path = str(getattr(mod, "__file__", "") or "")
            if path.startswith(project_prefix):
                sys.modules.pop(key, None)
        shutil.rmtree(project_dir, ignore_errors=True)
report["stdout"] = capture.getvalue()[:12000]
report["stderr"] = err_capture.getvalue()[:4000]
json.dumps(report, ensure_ascii=False)
`);
  return JSON.parse(output);
 }finally{
  engine.globals.delete("__pylab_payload");
 }
}
self.onmessage=event=>{
 const {id,request}=event.data;
 workQueue=workQueue.then(async()=>{
  try{self.postMessage({id,result:await execute(request)});}
  catch(error){self.postMessage({id,error:String(error?.message||error)});}
 });
};

