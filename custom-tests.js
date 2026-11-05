export function normalizeStdout(text){return String(text??'').replace(/\r\n?/g,'\n').replace(/\n+$/,'');}
export function buildCaseResult(index,caseData,result){
 const expected=normalizeStdout(caseData.expected);
 const actual=normalizeStdout(result?.stdout||'');
 const error=result?.executionError|| (result?.inputRequired?'Not enough input values for the Python script.':null);
 return {index,expected,actual,error,passed:!error&&actual===expected};
}
export function validateCases(cases){
 if(!Array.isArray(cases)||cases.length<1||cases.length>10)return 'Add between 1 and 10 test cases.';
 for(const c of cases){
  if(typeof c.stdin!=='string'||typeof c.expected!=='string')return 'Each case requires input and expected output text.';
  if(c.stdin.length>4000||c.expected.length>4000)return 'One test case exceeds the 4,000 character limit.';
 }
 return null;
}
export const defaultCases=[{id:1,stdin:'',expected:'120'}];
