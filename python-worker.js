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
import json, io, contextlib, sys
payload = json.loads(__pylab_payload)
previous_stdin = sys.stdin
sys.stdin = io.StringIO(payload.get("stdin", ""))
namespace = {"__name__": "__main__"}
capture = io.StringIO()
report = {"tests": [], "stdout": "", "executionError": None}
def encode(value):
    try:
        return json.loads(json.dumps(value, ensure_ascii=False))
    except (TypeError, ValueError):
        return repr(value)
try:
    with contextlib.redirect_stdout(capture):
        exec(compile(payload["code"], "<editor>", "exec"), namespace)
    if payload.get("mode") == "test":
        name = payload["functionName"]
        callback = namespace.get(name)
        if not callable(callback):
            raise NameError("Required function " + name + " is missing or not callable")
        for case in payload["tests"]:
            try:
                with contextlib.redirect_stdout(capture):
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
except Exception as exc:
    report["executionError"] = type(exc).__name__ + ": " + str(exc)
sys.stdin = previous_stdin
report["stdout"] = capture.getvalue()[:6000]
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

