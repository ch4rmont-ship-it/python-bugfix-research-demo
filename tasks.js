export const tasks = [
  {
    id:"sum", icon:"∑", title:"Sum Positive Values", zh:"正数求和", level:"Beginner", tag:"Conditions",
    description:"Return the sum of strictly positive values in a list. Ignore zero and negative numbers.",
    functionName:"sum_positive", signature:"sum_positive(nums)", sampleArgs:[[3,-2,1,4]],
    tests:[
      {args:[[3,-2,1,4]],expected:8},{args:[[-5,-2,0]],expected:0},
      {args:[[1,1,2]],expected:4},{args:[[0,5,2]],expected:7},{args:[[]],expected:0}
    ],
    variants:[
      {title:"Wrong comparison",bugLine:4,code:"def sum_positive(nums):\n    total = 0\n    for n in nums:\n        if n < 0:\n            total += n\n    return total",hintCase:"Input [3, -2, 1, 4] should produce 8.",hintConcept:"Only strictly positive values belong in the total.",hintFix:"Line 4 uses the opposite inequality. The condition should check n > 0."},
      {title:"Overwritten accumulator",bugLine:5,code:"def sum_positive(nums):\n    total = 0\n    for n in nums:\n        if n > 0:\n            total = n\n    return total",hintCase:"Input [3, -2, 1, 4] should produce 8.",hintConcept:"An accumulator must preserve its previous total.",hintFix:"Line 5 replaces the total instead of adding to it. Use +=."},
      {title:"Wrong initial value",bugLine:2,code:"def sum_positive(nums):\n    total = 1\n    for n in nums:\n        if n > 0:\n            total += n\n    return total",hintCase:"An empty list should produce 0.",hintConcept:"The identity element of addition is zero.",hintFix:"Line 2 must initialize total to 0."},
      {title:"Boundary off by one",bugLine:4,code:"def sum_positive(nums):\n    total = 0\n    for n in nums:\n        if n > 1:\n            total += n\n    return total",hintCase:"Input [1, 1, 2] should produce 4.",hintConcept:"One is positive too.",hintFix:"Line 4 must accept all n > 0, including 1."},
      {title:"Skipped first element",bugLine:3,code:"def sum_positive(nums):\n    total = 0\n    for n in nums[1:]:\n        if n > 0:\n            total += n\n    return total",hintCase:"Input [3, -2, 1, 4] should produce 8.",hintConcept:"Slicing from index 1 excludes the first element.",hintFix:"Line 3 should iterate across nums, not nums[1:]."}
    ]
  },
  {
    id:"signs",icon:"±",title:"Count Nonnegative and Negative",zh:"正负数统计",level:"Beginner",tag:"Classification",
    description:"Return a dictionary with 'non_negative' (including zeros) and 'negative' counts.",
    functionName:"count_signs",signature:"count_signs(nums)",sampleArgs:[[0,-4,3,-1]],
    tests:[
      {args:[[0,-4,3,-1]],expected:{non_negative:2,negative:2}},
      {args:[[0,0]],expected:{non_negative:2,negative:0}},
      {args:[[-1,-2]],expected:{non_negative:0,negative:2}},
      {args:[[2,5]],expected:{non_negative:2,negative:0}},
      {args:[[]],expected:{non_negative:0,negative:0}}
    ],
    variants:[
      {title:"Zero excluded",bugLine:5,code:"def count_signs(nums):\n    positive = 0\n    negative = 0\n    for n in nums:\n        if n > 0:\n            positive += 1\n        elif n < 0:\n            negative += 1\n    return {'non_negative': positive, 'negative': negative}",hintCase:"Zero must count as nonnegative.",hintConcept:"Nonnegative means greater than or equal to 0.",hintFix:"Line 5 should use >= rather than >."},
      {title:"Counters swapped",bugLine:6,code:"def count_signs(nums):\n    positive = 0\n    negative = 0\n    for n in nums:\n        if n >= 0:\n            negative += 1\n        else:\n            positive += 1\n    return {'non_negative': positive, 'negative': negative}",hintCase:"Input [0,0] should count 2 nonnegative.",hintConcept:"The two branches update different counters.",hintFix:"Line 6 increments the wrong counter; swap the branch updates."},
      {title:"Extra negative count",bugLine:8,code:"def count_signs(nums):\n    positive = 0\n    negative = 0\n    for n in nums:\n        if n >= 0:\n            positive += 1\n        else:\n            negative += 2\n    return {'non_negative': positive, 'negative': negative}",hintCase:"Input [-1,-2] should count exactly 2 negatives.",hintConcept:"Each element contributes one count, not two.",hintFix:"Line 8 should increase negative by 1."},
      {title:"Counter starts at one",bugLine:3,code:"def count_signs(nums):\n    positive = 0\n    negative = 1\n    for n in nums:\n        if n >= 0:\n            positive += 1\n        else:\n            negative += 1\n    return {'non_negative': positive, 'negative': negative}",hintCase:"An empty list has no negative values.",hintConcept:"Counting starts from zero.",hintFix:"Line 3 must initialize negative to 0."},
      {title:"Zero classified negative",bugLine:5,code:"def count_signs(nums):\n    positive = 0\n    negative = 0\n    for n in nums:\n        if n <= 0:\n            negative += 1\n        else:\n            positive += 1\n    return {'non_negative': positive, 'negative': negative}",hintCase:"Input [0,0] should count 2 nonnegative.",hintConcept:"Zero belongs in the nonnegative group.",hintFix:"Line 5 tests the wrong partition. Use n < 0 for the negative branch."}
    ]
  },
  {
    id:"rain",icon:"☂",title:"Average Rainfall",zh:"平均降雨量",level:"Intermediate",tag:"Arithmetic",
    description:"Return the average rainfall rounded to 2 decimals. Return 0 for an empty list.",
    functionName:"average_rainfall",signature:"average_rainfall(values)",sampleArgs:[[1,2,2]],
    tests:[
      {args:[[1,2,2]],expected:1.67},{args:[[12,0,6]],expected:6},
      {args:[[5]],expected:5},{args:[[0,0]],expected:0},{args:[[]],expected:0}
    ],
    variants:[
      {title:"Wrong divisor",bugLine:4,code:"def average_rainfall(values):\n    if not values:\n        return 0\n    return round(sum(values) / (len(values) - 1), 2)",hintCase:"[1, 2, 2] averages to 1.67.",hintConcept:"Mean divides the sum by the number of items.",hintFix:"Line 4 should divide by len(values), not len(values)-1."},
      {title:"First reading skipped",bugLine:4,code:"def average_rainfall(values):\n    if not values:\n        return 0\n    return round(sum(values[1:]) / len(values), 2)",hintCase:"A single-element list must average to that value.",hintConcept:"Every measurement contributes to the total.",hintFix:"Line 4 incorrectly slices away the first reading. Sum values."},
      {title:"Extra item in denominator",bugLine:4,code:"def average_rainfall(values):\n    if not values:\n        return 0\n    return round(sum(values) / (len(values) + 1), 2)",hintCase:"[12,0,6] averages to 6.",hintConcept:"Denominator is the actual count of readings.",hintFix:"Line 4 should not add one to len(values)."},
      {title:"Floor instead of true division",bugLine:4,code:"def average_rainfall(values):\n    if not values:\n        return 0\n    return round(sum(values) // len(values), 2)",hintCase:"[1,2,2] should produce 1.67.",hintConcept:"Floor division loses the fractional part.",hintFix:"Use / instead of // on line 4."},
      {title:"Rounding omitted",bugLine:4,code:"def average_rainfall(values):\n    if not values:\n        return 0\n    return sum(values) / len(values)",hintCase:"[1,2,2] must return exactly 1.67.",hintConcept:"The task specifies a two-decimal result.",hintFix:"Wrap the division in round(expression, 2) on line 4."}
    ]
  },
  {
    id:"pal",icon:"↔",title:"Palindrome String",zh:"回文判断",level:"Intermediate",tag:"Strings",
    description:"Return True when the string reads identically forward and backward. Case and spaces matter.",
    functionName:"is_palindrome",signature:"is_palindrome(s)",sampleArgs:["racecar"],
    tests:[
      {args:["racecar"],expected:true},{args:["abba"],expected:true},
      {args:["abca"],expected:false},{args:["python"],expected:false},
      {args:["Aa"],expected:false},{args:[""],expected:true}
    ],
    variants:[
      {title:"Even length requirement",bugLine:2,code:"def is_palindrome(s):\n    return s == s[::-1] and len(s) % 2 == 0",hintCase:"'racecar' is a palindrome even with 7 letters.",hintConcept:"Palindromes can have odd or even length.",hintFix:"Line 2 must not require an even length."},
      {title:"Only first and last compared",bugLine:2,code:"def is_palindrome(s):\n    return len(s) < 2 or s[0] == s[-1]",sampleArgs:["abca"],hintCase:"'abca' has matching ends but is not a palindrome.",hintConcept:"Every mirrored character pair must match.",hintFix:"Line 2 should compare the entire string to its reverse."},
      {title:"Reverse omitted",bugLine:2,code:"def is_palindrome(s):\n    return s == s[::1]",sampleArgs:["python"],hintCase:"'python' is not a palindrome.",hintConcept:"A slice step of 1 preserves the order.",hintFix:"Line 2 needs a negative slice step: [::-1]."},
      {title:"Every other character",bugLine:2,code:"def is_palindrome(s):\n    return s == s[::-2]",hintCase:"'racecar' is a palindrome.",hintConcept:"A reverse slice should not skip characters.",hintFix:"Line 2 must reverse with step -1 rather than -2."},
      {title:"Incorrect case normalization",bugLine:2,code:"def is_palindrome(s):\n    return s.lower() == s[::-1].lower()",sampleArgs:["Aa"],hintCase:"'Aa' is not a palindrome under case-sensitive matching.",hintConcept:"Case normalization changes the problem definition.",hintFix:"Line 2 must compare s and s[::-1] without .lower()."}
    ]
  },
  {
    id:"fib",icon:"⌁",title:"Fibonacci to N",zh:"斐波那契数列",level:"Advanced",tag:"Sequences",
    description:"Return the first n Fibonacci numbers starting with 0, 1. n=0 returns [].",
    functionName:"fibonacci",signature:"fibonacci(n)",sampleArgs:[6],
    tests:[
      {args:[6],expected:[0,1,1,2,3,5]},
      {args:[0],expected:[]},{args:[1],expected:[0]},
      {args:[2],expected:[0,1]},{args:[7],expected:[0,1,1,2,3,5,8]}
    ],
    variants:[
      {title:"One iteration missing",bugLine:4,code:"def fibonacci(n):\n    a, b = 0, 1\n    out = []\n    for _ in range(n - 1):\n        out.append(a)\n        a, b = b, a + b\n    return out",hintCase:"n=1 should return [0].",hintConcept:"Python range excludes its endpoint.",hintFix:"Line 4 should iterate range(n), not range(n-1)."},
      {title:"Sequence starts at one",bugLine:2,code:"def fibonacci(n):\n    a, b = 1, 1\n    out = []\n    for _ in range(n):\n        out.append(a)\n        a, b = b, a + b\n    return out",hintCase:"The first number must be zero.",hintConcept:"Fibonacci here starts 0, 1.",hintFix:"Line 2 should initialize a, b = 0, 1."},
      {title:"Wrong value appended",bugLine:5,code:"def fibonacci(n):\n    a, b = 0, 1\n    out = []\n    for _ in range(n):\n        out.append(b)\n        a, b = b, a + b\n    return out",hintCase:"n=1 should return [0].",hintConcept:"Append the current number before moving to the next one.",hintFix:"Line 5 should append a rather than b."},
      {title:"One extra iteration",bugLine:4,code:"def fibonacci(n):\n    a, b = 0, 1\n    out = []\n    for _ in range(n + 1):\n        out.append(a)\n        a, b = b, a + b\n    return out",hintCase:"n=0 should produce an empty list.",hintConcept:"The number of iterations should equal n.",hintFix:"Line 4 should use range(n), without +1."},
      {title:"Output reversed",bugLine:7,code:"def fibonacci(n):\n    a, b = 0, 1\n    out = []\n    for _ in range(n):\n        out.append(a)\n        a, b = b, a + b\n    return out[::-1]",hintCase:"n=6 should start with 0.",hintConcept:"The sequence must preserve generation order.",hintFix:"Line 7 should return out directly, without reversing."}
    ]
  }
];
export const totalVariants = tasks.reduce((n,t)=>n+t.variants.length,0);
export function getSample(task,variant){return variant.sampleArgs||task.sampleArgs;}
export function describeArgs(task,args){return `${task.functionName}(${args.map(x=>JSON.stringify(x)).join(", ")})`;}
export function encodeCode(code){return code.split("\n").map((line,i)=>({line:i+1,text:line}));}
export function pseudoFromCode(code){
 return code.split("\n").map((line,index)=>{
  const s=line.trim();
  if(s.startsWith("def "))return `Define the function ${s.slice(4).replace(":","")}.`;
  if(s.startsWith("for "))return `Repeat for ${s.slice(4).replace(":","")}.`;
  if(s.startsWith("if "))return `If ${s.slice(3).replace(":","")} is true, continue with the nested step.`;
  if(s.startsWith("elif "))return `Otherwise if ${s.slice(5).replace(":","")} is true, continue.`;
  if(s==="else:")return "Otherwise, follow the next step.";
  if(s.startsWith("return "))return `Return ${s.slice(7)}.`;
  if(s.includes("+="))return `Increase ${s.replace("+="," by ")}.`;
  if(s.includes("="))return `Set ${s.replace("="," to ")}.`;
  return `Step ${index+1}: ${s}.`;
 });
}

