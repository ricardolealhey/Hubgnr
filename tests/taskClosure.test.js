import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareTaskClosure } from '../src/taskClosure.js';

const validInput = () => ({
  recordId: 'closure-2026-11-27-001',
  taskId: 'task-123',
  closedBy: 'master-ricardo',
  closedAt: '2026-11-27T13:00:00Z',
  review: { accepted: true, reviewerId: 'reviewer-1', reviewedAt: '2026-11-27T11:00:00Z', summary: 'Revisão aprovada sem ressalvas.' },
  delivery: { deliveredAt: '2026-11-27T12:00:00Z', deliveredBy: 'executor-1', evidence: [{ type: 'url', reference: 'https://example.test/deliverable', description: 'Artefato final' }] },
  acceptance: { accepted: true, acceptedBy: 'client-1', acceptedAt: '2026-11-27T12:30:00Z' },
  costs: { currency: 'BRL', items: [{ category: 'hours', description: 'Execução', amount: 125.50 }, { category: 'tools', description: 'Ferramentas', amount: 24.50 } ], total: 150.00 },
  outcome: { summary: 'Entrega concluída e aceita.', metrics: [{ label: 'Revisões', value: 1, unit: 'un' }] },
  feedback: { status: 'received', summary: 'Cliente confirmou que atende ao escopo.' },
  lessonsLearned: 'Briefing detalhado reduziu retrabalho.',
  previousHistory: [],
});

test('prepares complete closure package and four immutable history events', () => {
  const result = prepareTaskClosure(validInput());
  assert.equal(result.ok, true);
  assert.equal(result.record.status, 'closure_prepared');
  assert.equal(result.record.costs.total, 150);
  assert.equal(result.history.length, 4);
  assert.equal(result.history.at(-1).type, 'closure_prepared');
});

test('missing record id is rejected for idempotency', () => {
  const input = validInput(); input.recordId = '';
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('missing review fails closed', () => {
  const input = validInput(); input.review.accepted = false;
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('delivery requires at least one evidence reference', () => {
  const input = validInput(); input.delivery.evidence = [];
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('evidence item must contain type and reference', () => {
  const input = validInput(); input.delivery.evidence = [{ type: 'link', reference: '' }];
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('acceptance must be explicit and attributed', () => {
  const input = validInput(); input.acceptance.accepted = false;
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('timeline must be review then delivery then acceptance then closure', () => {
  const input = validInput(); input.delivery.deliveredAt = '2026-11-27T10:30:00Z';
  assert.ok(prepareTaskClosure(input).errors.some((e) => e.includes('Entrega não pode anteceder')));
});

test('costs require currency and item list', () => {
  const input = validInput(); input.costs.currency = 'BR';
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('negative or fractional-cent cost rejected', () => {
  const input = validInput(); input.costs.items[0].amount = -1;
  assert.equal(prepareTaskClosure(input).ok, false);
  const input2 = validInput(); input2.costs.items[0].amount = 0.001;
  assert.equal(prepareTaskClosure(input2).ok, false);
});

test('declared total must match itemized costs', () => {
  const input = validInput(); input.costs.total = 149.99;
  assert.ok(prepareTaskClosure(input).errors.some((e) => e.includes('Total informado diverge')));
});

test('feedback received requires a summary', () => {
  const input = validInput(); input.feedback.summary = ' ';
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('feedback unavailable or declined requires a reason', () => {
  const input = validInput(); input.feedback = { status: 'unavailable', reason: '' };
  assert.equal(prepareTaskClosure(input).ok, false);
  input.feedback.reason = 'Cliente ainda não respondeu.';
  assert.equal(prepareTaskClosure(input).ok, true);
});

test('lessons learned must be explicitly recorded', () => {
  const input = validInput(); input.lessonsLearned = '';
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('prior history accepts unrelated valid event types', () => {
  const input = validInput(); input.previousHistory = [{ id: 'prior', type: 'task_started', timestamp: '2026-11-27T10:00:00Z', actorId: 'a', description: 'Task started' }];
  assert.equal(prepareTaskClosure(input).ok, true);
});

test('empty cost list requires an explicit no-cost reason', () => {
  const input = validInput(); input.costs.items = []; input.costs.total = 0;
  assert.equal(prepareTaskClosure(input).ok, false);
  input.costs.noCostsReason = 'Nenhum custo externo ou ferramenta foi consumido.';
  assert.equal(prepareTaskClosure(input).ok, true);
});

test('malformed prior history blocks closure preparation', () => {
  const input = validInput(); input.previousHistory = [{ id: 'x', type: '', timestamp: '2026-11-27T10:00:00Z', actorId: 'a', description: 'Event' }];
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('duplicate history ids block closure preparation', () => {
  const input = validInput(); input.previousHistory = [{ id: 'closure-2026-11-27-001:review', type: 'review_accepted', timestamp: '2026-11-27T10:00:00Z', actorId: 'reviewer', description: 'Review' }];
  assert.ok(prepareTaskClosure(input).errors.some((e) => e.includes('ID de evento duplicado')));
});

test('prior history timestamp after review prevents append', () => {
  const input = validInput(); input.previousHistory = [{ id: 'prior', type: 'review_accepted', timestamp: '2026-11-27T11:30:00Z', actorId: 'a', description: 'Earlier closure review' }];
  assert.ok(prepareTaskClosure(input).errors.some((e) => e.includes('não pode anteceder o último evento')));
});

test('calendar-invalid timestamp is rejected', () => {
  const input = validInput(); input.closedAt = '2026-11-27T25:00:00Z';
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('previous history chronology must be monotonic', () => {
  const input = validInput(); input.previousHistory = [
    { id: '1', type: 'review_accepted', timestamp: '2026-11-27T10:10:00Z', actorId: 'a', description: 'Review' },
    { id: '2', type: 'delivery_recorded', timestamp: '2026-11-27T10:09:00Z', actorId: 'a', description: 'Delivery' },
  ];
  assert.equal(prepareTaskClosure(input).ok, false);
});

test('bad closing timestamp rejected', () => {
  const input = validInput(); input.closedAt = 'yesterday';
  assert.equal(prepareTaskClosure(input).ok, false);
});
