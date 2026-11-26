export const SECTORS = Object.freeze([
  'commercial',
  'strategy',
  'digital_presence',
  'creation',
  'performance',
  'projects_execution',
  'quality',
  'administrative_finance',
]);

export const DISTRIBUTION_DECISIONS = Object.freeze({
  READY: 'READY',
  WAITING_INFORMATION: 'WAITING_INFORMATION',
  WAITING_RESPONSIBLE: 'WAITING_RESPONSIBLE',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  BLOCKED_DEPENDENCY: 'BLOCKED_DEPENDENCY',
  INVALID: 'INVALID',
});

export const TASK_STATES = Object.freeze({
  RECEIVED: 'received',
  TRIAGE: 'triage',
  WAITING_INFORMATION: 'waiting_information',
  WAITING_APPROVAL: 'waiting_approval',
  WAITING_RESPONSIBLE: 'waiting_responsible',
  READY: 'ready',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  REVIEW: 'review',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
});

const PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const APPROVAL_STATES = new Set(['approved', 'pending', 'not_required', 'rejected']);
const REQUIRED_FIELDS = [
  'title',
  'expectedOutcome',
  'deliverable',
  'acceptanceCriteria',
  'sector',
  'priority',
  'dueDate',
  'approvalStatus',
  'dependencies',
];

const TRANSITIONS = Object.freeze({
  [TASK_STATES.RECEIVED]: [TASK_STATES.TRIAGE],
  [TASK_STATES.TRIAGE]: [
    TASK_STATES.WAITING_INFORMATION,
    TASK_STATES.WAITING_APPROVAL,
    TASK_STATES.WAITING_RESPONSIBLE,
    TASK_STATES.READY,
    TASK_STATES.BLOCKED,
  ],
  [TASK_STATES.WAITING_INFORMATION]: [TASK_STATES.TRIAGE],
  [TASK_STATES.WAITING_APPROVAL]: [TASK_STATES.TRIAGE],
  [TASK_STATES.WAITING_RESPONSIBLE]: [TASK_STATES.TRIAGE],
  [TASK_STATES.READY]: [TASK_STATES.PLANNED],
  [TASK_STATES.PLANNED]: [TASK_STATES.IN_PROGRESS, TASK_STATES.BLOCKED],
  [TASK_STATES.IN_PROGRESS]: [TASK_STATES.BLOCKED, TASK_STATES.REVIEW],
  [TASK_STATES.BLOCKED]: [TASK_STATES.TRIAGE],
  [TASK_STATES.REVIEW]: [TASK_STATES.IN_PROGRESS, TASK_STATES.DELIVERED],
  [TASK_STATES.DELIVERED]: [TASK_STATES.CLOSED],
  [TASK_STATES.CLOSED]: [],
});

function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function result(decision, reasons, assignment = null) {
  return Object.freeze({ decision, reasons: Object.freeze(reasons), assignment });
}

/**
 * Evaluates a proposed assignment without writing to Asana, Supabase or any service.
 * An owner must be present in the supplied registry and active for the selected sector.
 * Every dependency must have an explicit completed/closed status in the context.
 */
export function evaluateDistribution(demand, context = {}) {
  if (!demand || typeof demand !== 'object' || Array.isArray(demand)) {
    return result(DISTRIBUTION_DECISIONS.INVALID, ['Demanda inválida: esperado um objeto.']);
  }

  const missing = REQUIRED_FIELDS.filter((field) => !Object.hasOwn(demand, field));
  if (missing.length) {
    return result(
      DISTRIBUTION_DECISIONS.WAITING_INFORMATION,
      missing.map((field) => `Campo obrigatório ausente: ${field}.`),
    );
  }

  const invalid = [];
  if (!isNonEmptyText(demand.title)) invalid.push('Título não informado.');
  if (!isNonEmptyText(demand.expectedOutcome)) invalid.push('Resultado esperado não informado.');
  if (!isNonEmptyText(demand.deliverable)) invalid.push('Entregável não informado.');
  if (!Array.isArray(demand.acceptanceCriteria) || demand.acceptanceCriteria.length === 0 || demand.acceptanceCriteria.some((item) => !isNonEmptyText(item))) {
    invalid.push('Critérios de aceite inválidos ou ausentes.');
  }
  if (!SECTORS.includes(demand.sector)) invalid.push(`Setor inválido: ${String(demand.sector)}.`);
  if (!PRIORITIES.has(demand.priority)) invalid.push(`Prioridade inválida: ${String(demand.priority)}.`);
  if (demand.dueDate !== null && !isValidDate(demand.dueDate)) invalid.push('Prazo inválido; use YYYY-MM-DD ou null explícito.');
  if (!APPROVAL_STATES.has(demand.approvalStatus)) invalid.push(`Estado de aprovação inválido: ${String(demand.approvalStatus)}.`);
  if (!Array.isArray(demand.dependencies)) invalid.push('Dependências devem ser uma lista de IDs.');
  if (Array.isArray(demand.dependencies)) {
    if (demand.dependencies.some((id) => !isNonEmptyText(id))) invalid.push('Dependência contém ID inválido.');
    if (new Set(demand.dependencies).size !== demand.dependencies.length) invalid.push('Dependências duplicadas.');
    if (demand.id && demand.dependencies.includes(demand.id)) invalid.push('Uma tarefa não pode depender de si mesma.');
  }
  if (demand.approvalStatus === 'rejected') invalid.push('A demanda possui aprovação rejeitada.');
  if (invalid.length) return result(DISTRIBUTION_DECISIONS.INVALID, invalid);

  const owners = Array.isArray(context.owners) ? context.owners : [];
  const owner = owners.find((candidate) => candidate?.id === demand.ownerId);
  if (!owner || owner.active !== true) {
    return result(DISTRIBUTION_DECISIONS.WAITING_RESPONSIBLE, ['Responsável ativo não confirmado no cadastro.']);
  }
  if (owner.sector !== demand.sector) {
    return result(DISTRIBUTION_DECISIONS.INVALID, ['O setor do responsável não corresponde ao setor da demanda.']);
  }

  const dependencyStatuses = context.dependencyStatuses && typeof context.dependencyStatuses === 'object' && !Array.isArray(context.dependencyStatuses)
    ? context.dependencyStatuses
    : {};
  const unknownDependencies = demand.dependencies.filter((id) => !Object.hasOwn(dependencyStatuses, id));
  if (unknownDependencies.length) {
    return result(DISTRIBUTION_DECISIONS.BLOCKED_DEPENDENCY, unknownDependencies.map((id) => `Status da dependência ${id} não foi verificado.`));
  }
  const incompleteDependencies = demand.dependencies.filter((id) => !['completed', 'closed'].includes(dependencyStatuses[id]));
  if (incompleteDependencies.length) {
    return result(DISTRIBUTION_DECISIONS.BLOCKED_DEPENDENCY, incompleteDependencies.map((id) => `Dependência ${id} ainda não está concluída.`));
  }

  if (demand.approvalStatus === 'pending') {
    return result(DISTRIBUTION_DECISIONS.WAITING_APPROVAL, ['Aprovação humana necessária ainda está pendente.']);
  }

  return result(DISTRIBUTION_DECISIONS.READY, [], Object.freeze({
    taskId: demand.id ?? null,
    sector: demand.sector,
    ownerId: demand.ownerId,
    dueDate: demand.dueDate,
    priority: demand.priority,
    dependencies: Object.freeze([...demand.dependencies]),
    expectedOutcome: demand.expectedOutcome.trim(),
    deliverable: demand.deliverable.trim(),
    acceptanceCriteria: Object.freeze([...demand.acceptanceCriteria]),
  }));
}

/** Validates a task lifecycle transition and its required evidence/approval gates. */
export function transitionTask(currentState, nextState, context = {}) {
  if (!Object.values(TASK_STATES).includes(currentState) || !Object.values(TASK_STATES).includes(nextState)) {
    return Object.freeze({ ok: false, state: currentState, error: 'Estado de tarefa desconhecido.' });
  }
  if (!TRANSITIONS[currentState].includes(nextState)) {
    return Object.freeze({ ok: false, state: currentState, error: `Transição não permitida: ${currentState} → ${nextState}.` });
  }
  if (currentState === TASK_STATES.TRIAGE && nextState === TASK_STATES.READY && context.distributionReady !== true) {
    return Object.freeze({ ok: false, state: currentState, error: 'A distribuição exige validação READY da demanda.' });
  }
  if (currentState === TASK_STATES.IN_PROGRESS && nextState === TASK_STATES.REVIEW) {
    if (!Array.isArray(context.evidence) || context.evidence.length === 0) {
      return Object.freeze({ ok: false, state: currentState, error: 'A revisão exige ao menos uma evidência registrada.' });
    }
  }
  if (currentState === TASK_STATES.REVIEW && nextState === TASK_STATES.DELIVERED && context.reviewAccepted !== true) {
    return Object.freeze({ ok: false, state: currentState, error: 'A entrega exige revisão aprovada.' });
  }
  if (currentState === TASK_STATES.DELIVERED && nextState === TASK_STATES.CLOSED && context.accepted !== true) {
    return Object.freeze({ ok: false, state: currentState, error: 'O encerramento exige aceite registrado.' });
  }
  return Object.freeze({ ok: true, state: nextState, error: null });
}
