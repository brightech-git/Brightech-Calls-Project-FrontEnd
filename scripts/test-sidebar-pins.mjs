import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const values = new Map();
let userId = '1';
let blocked = false;
let events = 0;
const moduleObject = { exports: {} };
const source = fs.readFileSync(
  new URL('../src/components/use-sidebar-pins.ts', import.meta.url),
  'utf8',
);
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
vm.runInNewContext(code, {
  module: moduleObject,
  exports: moduleObject.exports,
  require: (name) =>
    name === 'react'
      ? {
          useCallback: (fn) => fn,
          useMemo: (fn) => fn(),
          useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
        }
      : { useSession: () => ({ userId }) },
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (blocked) throw new Error('Storage blocked');
      values.set(key, value);
    },
  },
  window: { dispatchEvent: () => events++ },
  Event: class {
    constructor(type) {
      this.type = type;
    }
  },
});
const pins = moduleObject.exports.useSidebarPins;
const ids = () => Array.from(pins().pinnedIds);
assert.deepEqual(ids(), []);
pins().togglePin('user-master');
pins().togglePin('client-master');
assert.deepEqual(
  ids(),
  ['user-master', 'client-master'],
  'Pins persist in selection order across hook instances',
);
pins().togglePin('user-master');
assert.deepEqual(ids(), ['client-master'], 'Unpin removes only the chosen page');
userId = '2';
assert.deepEqual(ids(), [], 'Different accounts have separate pins');
values.set('calls-sidebar-pins:2', '{bad json');
assert.deepEqual(ids(), [], 'Corrupt storage is safe');
values.set('calls-sidebar-pins:2', '["client-master",null,3,"client-master"]');
assert.deepEqual(ids(), ['client-master'], 'Invalid and duplicate ids are excluded');
blocked = true;
pins().togglePin('project-master');
assert.deepEqual(
  ids(),
  ['client-master', 'project-master'],
  'Pins still work when storage writes are blocked',
);
assert.equal(events, 4, 'Changes notify other sidebar instances');
console.log('Sidebar pin persistence checks passed.');
