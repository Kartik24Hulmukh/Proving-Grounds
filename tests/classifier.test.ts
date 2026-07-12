import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../src/classifier.js';

const rows = [
  ['intended_delta', 'fail', 'pass', 'demonstrated'],
  ['intended_delta', 'pass', 'pass', 'vacuous'],
  ['intended_delta', 'pass', 'fail', 'regression'],
  ['intended_delta', 'fail', 'fail', 'inconclusive'],
  ['invariant', 'pass', 'pass', 'demonstrated'],
  ['invariant', 'pass', 'fail', 'regression'],
  ['invariant', 'fail', 'pass', 'inconclusive'],
  ['invariant', 'fail', 'fail', 'inconclusive'],
] as const;

for (const [type, base, head, verdict] of rows) {
  test(`${type} ${base}/${head}`, () => {
    assert.equal(classify(type, base, head), verdict);
  });
}

test('unknown is inconclusive', () => {
  assert.equal(classify('invariant', 'unknown', 'pass'), 'inconclusive');
});
