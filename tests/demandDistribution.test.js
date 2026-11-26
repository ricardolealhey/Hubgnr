import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISTRIBUTION_DECISIONS,
  TASK_STATES,
  evaluateDistribution,
  transitionTask,
}  from '../src/demandDistribution.js';

const validDemand = () => ({
  id: 'task-101',
  title: 'Preparar diagnóstico inicial',
  expectedOutcome: 'Mapear o cenário e recomendar prioridades.',
  deliverable: 'Documento de diagnóstico.',
  acceptanceCriteria: ['Documento entregue', 'Riscos e próximos passos registrados'],
  sector: 'strategy',
  priority: 'P1',
  dueDate: '2026-11-30',
  approvalStatus: 'not_required',
  dependencies: [],
  ownerId: 'owner-1',
});
const context = () => ({
  owners: [{ id: 'owner-1', sector: 'strategy', active: true }],
  dependencyStatuses: {},
});

test('missing mandatory fields are held for information', () => {
  const result = evaluateDistribution({ title: 'Task' });
  assert.equal(result.decision, DISTRIBUTION_DECISIONS.WAITING_INFORMATION);
  assert.ok(result.reasons.length > 0);
  assert.equal(result.assignment, null);
});

test('unknown sector is rejected', () => {
  const demand = validDemand(); demand.sector = 'unregistered-sector';
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.INVALID);
});

test('invalid priority is rejected', () => {
  const demand = validDemand(); demand.priority = 'P5';
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.INVALID);
});

test('invalid date is rejected', () => {
  const demand = validDemand(); demand.dueDate = '2026-02-30';
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.INVALID);
});

test('explicit no-deadline is valid', () => {
  const demand = validDemand(); demand.dueDate = null;
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.READY);
});

test('unknown or inactive owner waits for a confirmed responsible person', () => {
  const demand = validDemand();
  const ctx = context(); ctx.owners[0].active = false;
  assert.equal(evaluateDistribution(demand, ctx).decision, DISTRIBUTION_DECISIONS.WAITING_RESPONSIBLE);
});

test('owner sector mismatch is rejected', () => {
  const demand = validDemand();
  const ctx = context(); ctx.owners[0].sector = 'creation';
  assert.equal(evaluateDistribution(demand, ctx).decision, DISTRIBUTION_DECISIONS.INVALID);
});

test('unverified dependency status blocks distribution', () => {
  const demand = validDemand(); demand.dependencies = ['task-42'];
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.BLOCKED_DEPENDENCY);
});

test('unfinished dependency blocks distribution', () => {
  const demand = validDemand(); demand.dependencies = ['task-42'];
  const ctx = context(); ctx.dependencyStatuses['task-42'] = 'in_progress';
  assert.equal(evaluateDistribution(demand, ctx).decision, DISTRIBUTION_DECISIONS.BLOCKED_DEPENDENCY);
});

test('pending human approval blocks distribution', () => {
  const demand = validDemand(); demand.approvalStatus = 'pending';
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.WAITING_APPROVAL);
});

test('rejected approval is invalid', () => {
  const demand = validDemand(); demand.approvalStatus = 'rejected';
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.INVALID);
});

test('valid demand produces assignment payload only after all gates pass', () => {
  const demand = validDemand(); demand.dependencies = ['task-42'];
  const ctx = context(); ctx.dependencyStatuses['task-42'] = 'completed';
  const result = evaluateDistribution(demand, ctx);
  assert.equal(result.decision, DISTRIBUTION_DECISIONS.READY);
  assert.deepEqual(result.assignment.dependencies, ['task-42']);
  assert.equal(result.assignment.ownerId, 'owner-1');
  assert.equal(result.assignment.sector, 'strategy');
});

test('self-dependency and duplicate dependencies are invalid', () => {
  const demand = validDemand(); demand.dependencies = ['task-101', 'task-42', 'task-42'];
  assert.equal(evaluateDistribution(demand, context()).decision, DISTRIBUTION_DECISIONS.INVALID);
});

test('triage cannot move to ready without a validated distribution', () => {
  const result = transitionTask(TASK_STATES.TRIAGE, TASK_STATES.READY);
  assert.equal(result.ok, false);
});

test('blocked tasks must return to triage before resuming', () => {
  const result = transitionTask(TASK_STATES.BLOCKED, TASK_STATES.IN_PROGRESS);
  assert.equal(result.ok, false);
});

test('unknown lifecycle transition is rejected', () => {
  const result = transitionTask('bogus', TASK_STATES.TRIAGE);
  assert.equal(result.ok, false);
});

test('in progress cannot move to review without evidence', () => {
  const result = transitionTask(TASK_STATES.IN_PROGRESS, TASK_STATES.REVIEW);
  assert.equal(result.ok, false);
});

test('triage moves to ready only with evaluator result', () => {
  const demand = validDemand();
  const evaluation = evaluateDistribution(demand, context());
  const result = transitionTask(TASK_STATES.TRIAGE, TASK_STATES.READY, { distributionResult: evaluation });
  assert.equal(result.ok, true);
});

test('malformed evaluation context is handled without throwing', () => {
  const result = evaluateDistribution(validDemand(), null);
  assert.equal(result.decision, DISTRIBUTION_DECISIONS.WAITING_RESPONSIBLE);
});

test('in progress moves to review with evidence', () => {
  const result = transitionTask(TASK_STATES.IN_PROGRESS, TASK_STATES.REVIEW, { evidence: ['commit:abc'] });
  assert.equal(result.ok, true);
  assert.equal(result.state, TASK_STATES.REVIEW);
});

test('review cannot deliver without accepted review', () => {
  const result = transitionTask(TASK_STATES.REVIEW, TASK_STATES.DELIVERED, { reviewAccepted: false });
  assert.equal(result.ok, false);
});

test('delivered cannot close without acceptance', () => {
  const result = transitionTask(TASK_STATES.DELIVERED, TASK_STATES.CLOSED, { accepted: false });
  assert.equal(result.ok, false);
});

test('closed task is terminal', () => {
  const result = transitionTask(TASK_STATES.CLOSED, TASK_STATES.TRIAGE);
  assert.equal(result.ok, false);
});
