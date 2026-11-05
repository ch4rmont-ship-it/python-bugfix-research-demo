import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tasks} from '../tasks.js';
import {supportedLanguages,LANGUAGE_KEY,translations,translateText} from '../i18n.js';

test('three languages exist with a stable storage key',()=>{
 assert.deepEqual(supportedLanguages,['en','zh','mn']);
 assert.equal(LANGUAGE_KEY,'pylab-language-v1');
});
test('main navigation is fully localized',()=>{
 const labels=['Overview','Debug playground','Python Compiler','Analytics','Getting started'];
 for(const label of labels)for(const lang of ['zh','mn']){
  assert.notEqual(translateText(label,lang),label,`${label} should be localized to ${lang}`);
 }
});
test('every challenge name and description can be translated',()=>{
 for(const challenge of tasks){
  for(const raw of [challenge.title,challenge.description]){
   assert.ok(translations[raw]?.zh,`missing Chinese for ${raw}`);
   assert.ok(translations[raw]?.mn,`missing Mongolian for ${raw}`);
  }
  for(const variant of challenge.variants){
   for(const raw of [variant.title,variant.hintCase,variant.hintConcept,variant.hintFix]){
    assert.ok(translations[raw]?.zh,`missing Chinese for ${raw}`);
    assert.ok(translations[raw]?.mn,`missing Mongolian for ${raw}`);
   }
  }
 }
});
test('dynamic test status labels are translated',()=>{
 assert.equal(translateText('3/5 tests passed','zh'),'3/5 项测试通过');
 assert.equal(translateText('3/5 tests passed','mn'),'3/5 тест тэнцсэн');
 assert.equal(translateText('Test 2','zh'),'测试 2');
 assert.equal(translateText('Topic 3/5','mn'),'Сэдэв 3/5');
});
test('raw Python and unknown strings are not modified',()=>{
 for(const text of ['print("Hello")','NameError: x is not defined','[1, 2, 3]','data = input()']){
  assert.equal(translateText(text,'mn'),text);
  assert.equal(translateText(text,'zh'),text);
  assert.equal(translateText(text,'en'),text);
 }
});
