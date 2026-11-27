# GNR OS — Entrega, encerramento e histórico (MVP)

**Status:** protótipo lógico isolado. Não integrado ao HUB, Asana, Supabase, clientes ou serviços externos.

## Objetivo
Preparar um pacote de encerramento rastreável, sem gravar dados. O fechamento exige revisão aprovada, registro de entrega com evidências, aceite explícito, custos itemizados, resumo do resultado, feedback (recebido, recusado ou indisponível com justificativa) e lições aprendidas.

## Regras
- recordId obrigatório para idempotência; taskId identifica a tarefa.
- Revisão, entrega, aceite e encerramento devem possuir timestamps ISO com fuso e estar em ordem cronológica.
- Evidência de entrega: ao menos uma referência com tipo e identificador/URL.
- Custos: moeda ISO de 3 letras; valores não negativos com até duas casas decimais; total calculado por centavos; total declarado opcional e deve coincidir.
- Sem itens de custo, uma justificativa explícita de custo zero é obrigatória.
- Feedback ausente/recusado exige motivo. Feedback recebido exige resumo.
- Lições aprendidas deve ser preenchido, inclusive com declaração explícita de que não houve lição relevante.
- Histórico anterior aceita eventos válidos de outros tipos, exige IDs únicos e ordem cronológica. Os novos IDs são determinísticos a partir de recordId e não podem colidir com IDs existentes.
- Saída é closure_prepared, nunca closed no sistema externo. A persistência e alteração de status são etapas futuras.

## Eventos de auditoria preparados
review_accepted, delivery_recorded, acceptance_received, closure_prepared.
Cada evento traz ID, tipo, timestamp, ator, descrição e evidências (quando aplicável).

## Limites
- Não persiste histórico; não faz write-through.
- Não consulta nem altera Asana/Supabase.
- Não autentica clientes nem envia notificações.
- Não executa integração ou deploy.

## Testes
npm test deve executar os testes do Node. Testes cobrem pacote completo, revisão/entrega/aceite, ordem cronológica, evidências, custos, feedback, lições e histórico anterior.
