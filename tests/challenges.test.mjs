import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tasks, totalVariants } from '../tasks.js';
import { SOLUTIONS } from '../solutions.js';

function runPython(code, task) {
  const bridge = `import json,sys
p=json.loads(sys.stdin.read())
n={}
try:
  exec(p['code'], n)
  fn=n[p['name']]
  values=[]
  for test in p['tests']:
    try:
      values.append(fn(*test['args'])==test['expected'])
    except Exception:
      values.append(False)
  print(json.dumps(values))
except Exception:
  print(json.dumps([False]*len(p['tests'])))`;
  const child = spawnSync('python3', ['-c', bridge], {
    input: JSON.stringify({ code, name: task.functionName, tests: task.tests }),
    encoding: 'utf8', timeout: 4500
  });
  assert.equal(child.status, 0, child.stderr || 'Python failed');
  return JSON.parse(child.stdout.trim());
}

test('catalog contains five algorithm topics and twenty-five unique buggy variants', () => {
  assert.equal(tasks.length, 5);
  assert.equal(totalVariants, 25);
  assert.equal(new Set(tasks.map(t => t.id)).size, 5);
  for (const task of tasks) {
    assert.equal(task.variants.length, 5, `${task.id} should have 5 variants`);
    assert.ok(task.tests.length >= 4);
  }
});

for (const task of tasks) {
  test(`reference solution for ${task.id} passes every test`, () => {
    const results = runPython(SOLUTIONS[task.id], task);
    assert.deepEqual(results, Array(task.tests.length).fill(true));
  });
  for (const [index, variant] of task.variants.entries()) {
    test(`intentional bug ${task.id} #${index + 1} is detected`, () => {
      const results = runPython(variant.code, task);
      assert.ok(results.some(passed => !passed), `undetected variant: ${task.id} #${index + 1}`);
    });
  }
}
