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
import json, io, contextlib, sys, builtins, traceback
payload = json.loads(__pylab_payload)
previous_stdin = sys.stdin
previous_input = builtins.input
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
    if payload.get("mode") in ("execute", "custom_test"):
        builtins.input = compiler_input
    try:
        with contextlib.redirect_stdout(capture), contextlib.redirect_stderr(err_capture):
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

