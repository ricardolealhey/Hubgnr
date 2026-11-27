function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validIsoDateTime(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, offsetHour = '00', offsetMinute = '00'] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toISOString().slice(0, 10) === year + "-" + month + "-" + day
    && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59
    && Number(offsetHour) <= 14 && Number(offsetMinute) <= 59
    && (Number(offsetHour) < 14 || Number(offsetMinute) === 0)
    && Number.isFinite(Date.parse(value));
}

function toCents(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) return null;
  const cents = amount * 100;
  const rounded = Math.round(cents);
  if (!Number.isSafeInteger(rounded) || Math.abs(cents - rounded) > 1e-7) return null;
  return rounded;
}
function validateHistory(history) {
  if (!Array.isArray(history)) return ['Histórico anterior deve ser uma lista.'];
  const errors = [];
  const seen = new Set();
  let lastTime = -Infinity;
  for (const [index, entry] of history.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push("Evento " + (index + 1) + " do histórico é inválido.");
      continue;
    }
    if (!nonEmpty(entry.id)) errors.push("Evento " + (index + 1) + " sem ID.");
    if (seen.has(entry.id)) errors.push("ID de evento duplicado: " + entry.id + ".");
    seen.add(entry.id);
    if (!nonEmpty(entry.type)) errors.push("Evento " + (entry.id || index + 1) + " sem tipo.");
    if (!validIsoDateTime(entry.timestamp)) errors.push("Timestamp inválido no evento " + (entry.id || index + 1) + ".");
    else {
      const time = Date.parse(entry.timestamp);
      if (time < lastTime) errors.push('Histórico fora de ordem cronológica.');
      lastTime = time;
    }
    if (!nonEmpty(entry.actorId)) errors.push("Evento " + (entry.id || index + 1) + " sem ator.");
    if (!nonEmpty(entry.description)) errors.push("Evento " + (entry.id || index + 1) + " sem descrição.");
    if (entry.evidence !== undefined && (!Array.isArray(entry.evidence) || entry.evidence.some((item) => !nonEmpty(item))) {
      errors.push("Evidências inválidas no evento " + (entry.id || index + 1) + ".");
    }
  }
  return errors;
}

/**
 * Builds a closure package and appended audit history in memory only.
 * Does not write to the HUB, Asana, database or any external service.
 */
export function prepareTaskClosure(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Object.freeze({ ok: false, errors: Object.freeze(['Entrada inválida.']), record: null, history: null });
  }
  const errors = [];
  if (!nonEmpty(input.recordId)) errors.push('recordId obrigatório para idempotência.');
  if (!nonEmpty(input.taskId)) errors.push('taskId obrigatório.');
  if (!nonEmpty(input.closedBy)) errors.push('closedBy obrigatório.');
  if (!validIsoDateTime(input.closedAt)) errors.push('closedAt inválido.');
  if (!input.review || typeof input.review !== 'object' || input.review.accepted !== true || !nonEmpty(input.review.reviewerId) || !nonEmpty(input.review.summary) || !validIsoDateTime(input.review.reviewedAt)) {
    errors.push('Revisão aprovada, responsável e data válidos são obrigatórios.');
  }
  if (!input.delivery || typeof input.delivery !== 'object' || !validIsoDateTime(input.delivery.deliveredAt) || !nonEmpty(input.delivery.deliveredBy) || !Array.isArray(input.delivery.evidence) || input.delivery.evidence.length === 0 || input.delivery.evidence.some((e) => !e || !nonEmpty(e.type) || !nonEmpty(e.reference))) {
    errors.push('Entrega exige data, responsável e pelo menos uma evidência com tipo e referência.');
  }
  if (!input.acceptance || typeof input.acceptance !== 'object' || input.acceptance.accepted !== true || !nonEmpty(input.acceptance.acceptedBy) || !validIsoDateTime(input.acceptance.acceptedAt)) {
    errors.push('Aceite explícito, responsável e data válidos são obrigatórios.');
  }
  if (!input.costs || typeof input.costs !== 'object' || !/^[A-Z]{3}$/.test(input.costs.currency || '') || !Array.isArray(input.costs.items)) {
    errors.push('Custos exigem moeda ISO de 3 letras e lista de itens.');
  }
  let costTotalCents = 0;
  const normalizedCosts = [];
  if (input.costs && Array.isArray(input.costs.items)) {
    if (input.costs.items.length === 0 && !nonEmpty(input.costs.noCostsReason)) errors.push('Sem custos: registre uma justificativa explícita.');
    input.costs.items.forEach((item, index) => {
      if (!item || !nonEmpty(item.category) || !nonEmpty(item.description)) {
        errors.push("Item de custo " + (index + 1) + " exige categoria e descrição.");
        return;
      }
      const cents = toCents(item.amount);
      if (cents === null) {
        errors.push("Valor inválido no item de custo " + (index + 1) + "; use valor não negativo com até 2 casas decimais.");
        return;
      }
      costTotalCents += cents;
      normalizedCosts.push(Object.freeze({ category: item.category.trim(), description: item.description.trim(), amount: cents / 100 }));
    });
    if (!Number.isSafeInteger(costTotalCents)) errors.push('Total de custos excede limite seguro.');
    if (input.costs.total !== undefined) {
      const suppliedTotal = toCents(input.costs.total);
      if (suppliedTotal === null || suppliedTotal !== costTotalCents) errors.push('Total informado diverge da soma dos itens de custo.');
    }
  }
  if (!input.outcome || typeof input.outcome !== 'object' || !nonEmpty(input.outcome.summary)) {
    errors.push('Resultado final exige resumo.');
  }
  if (input.outcome?.metrics !== undefined && (!Array.isArray(input.outcome.metrics) || input.outcome.metrics.some((m) => !m || !nonEmpty(m.label) || !(typeof m.value === 'number' ? Number.isFinite(m.value) : nonEmpty(m.value))))) {
    errors.push('Métricas de resultado inválidas.');
  }
  const feedbackStatuses = ['received', 'declined', 'unavailable'];
  if (!input.feedback || typeof input.feedback !== 'object' || !feedbackStatuses.includes(input.feedback.status)) {
    errors.push('Feedback deve estar marcado como recebido, recusado ou indisponível.');
  } else if (input.feedback.status === 'received' && !nonEmpty(input.feedback.summary)) {
    errors.push('Feedback recebido exige resumo.');
  } else if (input.feedback.status !== 'received' && !nonEmpty(input.feedback.reason)) {
    errors.push('Feedback indisponível/recusado exige justificativa.');
  }
  if (!nonEmpty(input.lessonsLearned)) errors.push('Lições aprendidas devem ser registradas (ou declarar que não houve).');
  if (input.review?.reviewedAt && input.delivery?.deliveredAt && validIsoDateTime(input.review.reviewedAt) && validIsoDateTime(input.delivery.deliveredAt) && Date.parse(input.delivery.deliveredAt) < Date.parse(input.review.reviewedAt)) errors.push('Entrega não pode anteceder a revisão.');
  if (input.delivery?.deliveredAt && input.acceptance?.acceptedAt && validIsoDateTime(input.delivery.deliveredAt) && validIsoDateTime(input.acceptance.acceptedAt) && Date.parse(input.acceptance.acceptedAt) < Date.parse(input.delivery.deliveredAt)) errors.push('Aceite não pode anteceder a entrega.');
  if (input.acceptance?.acceptedAt && input.closedAt && validIsoDateTime(input.acceptance.acceptedAt) && validIsoDateTime(input.closedAt) && Date.parse(input.closedAt) < Date.parse(input.acceptance.acceptedAt)) errors.push('Encerramento não pode anteceder o aceite.');
  const priorHistory = input.previousHistory ?? [];
  errors.push(...validateHistory(priorHistory));
  if (Array.isArray(priorHistory) && priorHistory.length && input.review?.reviewedAt && validIsoDateTime(input.review.reviewedAt)) {
    const lastPrior = priorHistory.at(-1);
    if (lastPrior && validIsoDateTime(lastPrior.timestamp) && Date.parse(lastPrior.timestamp) > Date.parse(input.review.reviewedAt)) errors.push('Novo encerramento não pode anteceder o último evento do histórico.');
  }
  const generatedIds = [input.recordId + ":review", input.recordId + ":delivery", input.recordId + ":acceptance", input.recordId + ":closure"];
  if (Array.isArray(priorHistory) && generatedIds.some((id) => priorHistory.some((entry) => entry?.id === id)) errors.push('ID de evento duplicado entre histórico anterior e encerramento preparado.');
  if (errors.length) return Object.freeze({ ok: false, errors: Object.freeze(errors), record: null, history: null });

  const record = Object.freeze({
    recordId: input.recordId.trim(),
    taskId: input.taskId.trim(),
    preparedAt: input.closedAt,
    preparedBy: input.closedBy.trim(),
    status: 'closure_prepared',
    review: Object.freeze({ reviewerId: input.review.reviewerId.trim(), reviewedAt: input.review.reviewedAt, summary: input.review.summary.trim() }),
    delivery: Object.freeze({ deliveredAt: input.delivery.deliveredAt, deliveredBy: input.delivery.deliveredBy.trim(), evidence: Object.freeze(input.delivery.evidence.map((e) => Object.freeze({ type: e.type.trim(), reference: e.reference.trim(), description: e.description?.trim() || '' }))) }),
    acceptance: Object.freeze({ acceptedBy: input.acceptance.acceptedBy.trim(), acceptedAt: input.acceptance.acceptedAt }),
    costs: Object.freeze({ currency: input.costs.currency, total: costTotalCents / 100, items: Object.freeze(normalizedCosts), noCostsReason: input.costs.noCostsReason?.trim() || '' }),
    outcome: Object.freeze({ summary: input.outcome.summary.trim(), metrics: Object.freeze((input.outcome.metrics || []).map((m) => Object.freeze({ label: m.label.trim(), value: m.value, unit: m.unit?.trim() || '' }))) }),
    feedback: Object.freeze(input.feedback.status === 'received' ? { status: 'received', summary: input.feedback.summary.trim() } : { status: input.feedback.status, reason: input.feedback.reason.trim() }),
    lessonsLearned: input.lessonsLearned.trim(),
  });
  const events = [
    { id: record.recordId + ":review", type: 'review_accepted', timestamp: input.review.reviewedAt, actorId: input.review.reviewerId, description: input.review.summary.trim(), evidence: [] },
    { id: record.recordId + ":delivery", type: 'delivery_recorded', timestamp: input.delivery.deliveredAt, actorId: input.delivery.deliveredBy.trim(), description: 'Entrega registrada.', evidence: Object.freeze(input.delivery.evidence.map((e) => e.reference.trim())) },
    { id: record.recordId + ":acceptance", type: 'acceptance_received', timestamp: input.acceptance.acceptedAt, actorId: input.acceptance.acceptedBy, description: 'Aceite explícito registrado.', evidence: [] },
    { id: record.recordId + ":closure", type: 'closure_prepared', timestamp: input.closedAt, actorId: input.closedBy, description: 'Pacote de encerramento preparado; persistência externa pendente.', evidence: [] },
  ];
  const history = [...priorHistory, ...events].map((event) => Object.freeze(event));
  return Object.freeze({ ok: true, errors: Object.freeze([]), record, history: Object.freeze(history) });
}
