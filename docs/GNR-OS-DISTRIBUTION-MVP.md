# GNR OS — Distribuição, dependências e acompanhamento (MVP)

**Status:** protótipo lógico isolado; não integrado ao HUB, Asana, Supabase, e-mail ou agentes.
**Branch:** `feat/task-distribution-rules-2026-11-26`

## Escopo

O módulo puro `src/demandDistribution.js` avalia se uma demanda está apta a ser distribuída e valida transições do ciclo de execução. Não cria tarefas, não envia notificações e não atribui trabalho automaticamente.

## Destinos previstos

`commercial`, `strategy`, `digital_presence`, `creation`, `performance`, `projects_execution`, `quality`, `administrative_finance`. São categorias de roteamento, não prova de setor implantado ou de responsável ativo.

## Gates para distribuição

- Campos obrigatórios: título, resultado esperado, entregável, critérios de aceite, setor, prioridade, prazo (data ou `null` explícito), estado de aprovação e lista de dependências.
- Responsável: ID deve constar no cadastro fornecido ao módulo, estar ativo e pertencer ao setor escolhido.
- Dependências: cada ID deve ter status explicitamente verificado como `completed` ou `closed`.
- Aprovação: `pending` bloqueia; `rejected` invalida; `approved` ou `not_required` permite seguir, após os demais gates.
- O payload de atribuição só é produzido quando a avaliação retorna `READY`.

## Ciclo de status

`received → triage → waiting_information / waiting_approval / waiting_responsible / ready → planned → in_progress → blocked / review → delivered → closed`

As transições são validadas. `triage → ready` exige o objeto de resultado READY do avaliador; tarefas bloqueadas devem retornar à triagem antes de retomar. Entrar em revisão exige evidência; revisão para entregue exige revisão aprovada; entregue para encerrada exige aceite explícito. `closed` é terminal.

## Integração futura (não incluída)

1. Conectar a entrada estruturada ao registro de demanda e deduplicação.
2. Consultar setores/responsáveis ativos do cadastro de equipe, sem assumir implantação.
3. Consultar tarefas e dependências no Asana; revalidar status imediatamente antes da distribuição.
4. Criar ou atualizar tarefa somente após autorização e sem duplicar retries.
5. Registrar responsável, setor, prazo, status, dependências, bloqueios, evidências e histórico.
6. Não atribuir automaticamente a setores sem responsável confirmado; deixar em `waiting_responsible`.
7. Exigir aprovação humana para ações amarelas/vermelhas e decisões de negócio.

## Limites

- Nenhuma chamada de IA paga ou API externa.
- Nenhuma escrita em Asana/Supabase durante a execução do protótipo.
- Nenhuma alteração Auth/RLS/credenciais.
- Nenhum dado real de cliente.
- Nenhuma conexão ao frontend nem deploy.

## Testes

Executar `npm test`. Testes unitários cobrem campos ausentes, setor/prioridade/prazo inválidos, responsável inativo/fora do setor, dependências não verificadas ou incompletas, aprovação pendente/rejeitada, distribuição pronta e gates do ciclo de status.
