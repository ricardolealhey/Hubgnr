import test from 'node:test';
import assert from 'node:assert/strict';
import { hasExactlyOneAffectedRow } from '../src/affectedRows.js';

test('accepts exactly one affected row with a non-null id', () => {
  assert.equal(hasExactlyOneAffectedRow([{ id: 'row-1' }]), true);
});

test('rejects zero affected rows', () => {
  assert.equal(hasExactlyOneAffectedRow([]), false);
});

test('rejects multiple affected rows', () => {
  assert.equal(hasExactlyOneAffectedRow([{ id: 'row-1' }, { id: 'row-2' }]), false);
});

test('rejects a single malformed row', () => {
  for (const value of [[null], [{}], [{ id: null }]]) {
    assert.equal(hasExactlyOneAffectedRow(value), false);
  }
});

test('rejects missing or non-array results', () => {
  for (const value of [undefined, null, {}, { id: 'row-1' }]) {
    assert.equal(hasExactlyOneAffectedRow(value), false);
  }
});

test('rejects blank and non-string IDs', () => {
  for (const value of [[{ id: '' }], [{ id: '   ' }], [{ id: 0 }], [{ id: false }]]) {
    assert.equal(hasExactlyOneAffectedRow(value), false);
  }
});
