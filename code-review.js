// Local deterministic review: never represent this as a generative AI model.
export function reviewPython(code,runResult=null,customResults=[]){
 const lines=String(code||'').split(/\r?\n/),findings=[];
 const add=(severity,line,title,detail,fix)=>{
   if(findings.length>=12)return;
   findings.push({severity,line,title,detail,fix});
 };
 for(let i=0;i<lines.length;i++){
   const line=lines[i],str=line.trim(),n=i+1;
   if(!str||str.startsWith('#'))continue;
   if(/\bif\s+\w+\s*=\s*[^=]/.test(str))add('error',n,'Assignment used in condition','A Python condition must compare values with ==, not assign with =.','Use == inside the if condition.');
   if(/(?:\/\s*0(?:\b|$)|\/\/\s*0(?:\b|$))/.test(str))add('error',n,'Division by zero','This expression divides by the literal zero and will raise ZeroDivisionError.','Choose a nonzero divisor or guard it with an if statement.');
   if(/\bexcept\s*:/.test(str))add('warning',n,'Bare except','This catches almost everything, including interruption signals, and can conceal bugs.','Catch a specific exception, such as except ValueError:.');
   if(/\b(?:eval|exec)\s*\(\s*(?:input\s*\(|[A-Za-z_]\w*)/.test(str))add('warning',n,'Dynamic code evaluation','Executing user-controlled text can cause unexpected behavior.','Parse or validate input instead of evaluating it as Python code.');
   if(/range\s*\(\s*len\([^)]*\)\s*-\s*1\s*\)/.test(str))add('warning',n,'Possible off-by-one loop','The final element is excluded because range stops before its endpoint.','Check whether range(len(items)) is what you intended.');
   if(/\bwhile\s+True\s*:/.test(str)&&!lines.slice(i+1).some(x=>/^\s*(?:break|return)\b/.test(x)))add('warning',n,'Potential infinite loop','A while True loop has no obvious break or return statement.','Add a termination condition or ensure a reachable break statement.');
   if(/\bis\s+(?:[0-9]+|['"])/.test(str))add('warning',n,'Identity vs value comparison','is checks object identity, not equal values.','Use == when comparing literal values.');
   if(/\bprint\(.*\)/.test(str)&&/\bdef\s+/.test(code)&&!/(^|\n)\s*return\b/.test(code))add('info',n,'Printed result rather than returned value','Your function may only print. Automated tests that expect return values will see None.','Return a value if the specification expects one.');
 }
 if(runResult?.executionError){
   const raw=String(runResult.executionError),type=raw.match(/^([A-Za-z]+Error)/)?.[1]||'Python exception';
   const traceback=String(runResult.traceback||'');
   const matches=[...traceback.matchAll(/File "<editor>", line (\d+)/g)];
   const line=matches.length?Number(matches[matches.length-1][1]):null;
   const hints={
     SyntaxError:['Python cannot parse this statement.','Check syntax, missing colons, quotes and parentheses.'],
     IndentationError:['Indentation is inconsistent.','Use consistent four-space indentation.'],
     NameError:['A referenced name has not been defined.','Verify variable spelling and initialization.'],
     TypeError:['A value or argument has an incompatible type.','Inspect parameter types and conversions.'],
     ValueError:['An input value is not valid for the operation.','Validate or convert input before using it.'],
     IndexError:['A list index is outside its valid range.','Check list length and loop bounds.'],
     ZeroDivisionError:['The denominator evaluates to zero.','Check divisor before dividing.'],
     ModuleNotFoundError:['The requested module is missing from the browser runtime.','Try a supported module or a server Python environment.']
   };
   const [detail,fix]=hints[type]||['The interpreter raised an exception.','Inspect the traceback and inputs.'];
   add('error',line,type,`${detail} ${raw}`,fix);
 }
 for(const failure of customResults.filter(t=>!t.passed).slice(0,3)){
   add('error',null,`Test case ${failure.index} failed`,failure.error||`Expected ${JSON.stringify(failure.expected)}, got ${JSON.stringify(failure.actual)}.`,
     'Compare the exact output and review input parsing, calculations, and formatting.');
 }
 if(!findings.length)add('info',null,'No obvious issues found','The local reviewer did not detect a known pattern. This is not proof of correctness.','Add custom tests with edge cases and inspect actual outputs.');
 return findings;
}
