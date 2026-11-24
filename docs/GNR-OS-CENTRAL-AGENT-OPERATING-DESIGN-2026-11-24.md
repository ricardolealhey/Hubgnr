# GNR OS — Agente Central: desenho operacional e limites

**Data:** 24/11/2026  
**Status:** desenho/documentação preparado; não implementado nem integrado.  
**Escopo:** governança, triagem, roteamento, acompanhamento e consolidação de demandas do GNR OS.  
**Autoridade final:** Ricardo, Diretor Geral.

## 1. Mandato

O Agente Central é o coordenador operacional do GNR OS. Seu trabalho é receber demandas, verificar se estão completas, classificá-las, propor prioridade e destino, decompor trabalho, acompanhar dependências e consolidar resultados.

Ele **não é Diretor Geral nem substitui a decisão humana**. Não aprova orçamento, contratos, preços, contratação, gastos, publicações, acesso, credenciais, mudanças de produção ou contato externo. Pode preparar análises e recomendações; a aprovação continua com Ricardo ou pessoa explicitamente autorizada.

Os setores e agentes listados neste documento são destinos previstos de roteamento. A existência de um setor, agente ou responsável só pode ser tratada como operacional após confirmação no cadastro/organograma do HUB.

## 2. Entrada única de demanda

Cada demanda deve possuir, no mínimo:

- ID e data de entrada;
- solicitante e canal de origem;
- título curto e descrição;
- objetivo/resultado esperado;
- cliente ou projeto relacionado, se houver;
- entregável e critérios de aceite;
- prazo solicitado e justificativa;
- impacto, urgência e estimativa de esforço;
- orçamento/custo estimado, se aplicável;
- dependências, riscos, sensibilidade dos dados e restrições;
- responsável/setor sugerido e aprovação necessária.

O Agente Central não deve inventar campos ausentes. Se informações essenciais faltarem, manter **Aguardando informações** e apresentar perguntas objetivas agrupadas. Não criar uma tarefa duplicada quando houver demanda equivalente; referenciar a existente e propor atualização.

## 3. Triagem

Para cada nova entrada:

1. Normalizar título, descrição e entregável sem alterar o sentido do solicitante.
2. Identificar cliente, projeto, setor e tarefas semelhantes existentes.
3. Detectar dados incompletos, conflitos de prazo, dependências, riscos ou ações proibidas.
4. Classificar tipo de trabalho (estratégia, comercial, criação, digital, performance, execução, qualidade, administrativo/financeiro, tecnologia ou suporte).
5. Recomendar prioridade e justificá-la.
6. Propor setor/destino, responsável somente se confirmado, subtarefas e dependências.
7. Identificar se há aprovação humana antes de iniciar.
8. Registrar a triagem, os motivos e a próxima ação.

## 4. Priorização sugerida

Pontuar cada fator de 1 a 5, com justificativa:

- **Impacto (40%)** — efeito sobre receita, cliente, objetivo estratégico, qualidade ou risco.
- **Urgência (25%)** — prazo real e consequência de atraso.
- **Desbloqueio (20%)** — quantas entregas/dependências relevantes essa demanda destrava.
- **Esforço (15%)** — nota inversa: 5 significa esforço baixo e 1 significa esforço alto.

Fórmula de recomendação (escala de 1 a 5):

`P = 0,40I + 0,25U + 0,20D + 0,15E`

Faixas sugeridas: 4,20–5,00 P1; 3,40–4,19 P2; 2,60–3,39 P3; abaixo de 2,60 backlog. P0 é reservado a incidentes ou risco crítico e exige escalonamento imediato. As faixas são proposta de desenho, não política implantada; Ricardo pode mudar ou sobrepor prioridade.

A nota não deve esconder uma justificativa. O agente deve mostrar fatores, cálculo, suposições e incerteza.

## 5. Destinos previstos

| Setor | Tipos de demanda |
|---|---|
| Comercial | prospecção, qualificação, atendimento, proposta, follow-up, receita |
| Estratégia | diagnóstico, metas, escopo, plano de ação e decisões de negócio |
| Presença Digital | websites, Perfil da Empresa no Google, redes e presença online |
| Criação | identidade, design, copy, conteúdo e materiais |
| Performance | campanhas, mídia, análise e otimização; execução operacional humana conforme design aprovado |
| Projetos/Execução | planejamento, tarefas, entregas, dependências e coordenação |
| Qualidade | revisão, critérios de aceite, evidências, retrabalho e feedback |
| Administrativo/Financeiro | custos, horas, faturamento, recebimentos, margem e controles |

Demandas multidisciplinares podem ter um setor coordenador e setores participantes. Não atribuir tarefas a setores sem membros/agentes ativos; usar **Destino proposto — aguardando responsável**.

## 6. Fluxo de estados

`Recebida → Triagem → Aguardando informações / Aguardando aprovação / Pronta → Planejada → Em execução → Bloqueada / Em revisão → Entregue → Encerrada`

- **Recebida:** registro inicial, sem compromisso de prazo.
- **Triagem:** classificação, prioridade, risco, destino e dependências.
- **Aguardando informações:** faltam elementos essenciais; não iniciar execução.
- **Aguardando aprovação:** ação amarela/vermelha ou decisão de Ricardo.
- **Pronta:** escopo e critérios claros, autorização obtida quando necessária.
- **Planejada:** subtarefas, sequência, responsáveis e prazo definidos.
- **Em execução:** trabalho autorizado e em andamento.
- **Bloqueada:** motivo, bloqueador, responsável por resolver e próxima revisão registrados.
- **Em revisão:** entregável e evidências submetidos ao revisor/solicitante.
- **Entregue:** critérios de aceite cumpridos, resultado e evidências registrados.
- **Encerrada:** aceite e histórico/custos/feedback consolidados, quando aplicáveis.

Não avançar estado apenas por inferência. Se houver erro de integração, preservar a tarefa e marcar bloqueio; não criar duplicatas em retries.

## 7. Autonomia e autorização

### Verde — execução permitida, se ferramentas e permissões estiverem disponíveis
- leitura, análise, planejamento e documentação;
- triagem e organização de tarefas;
- criação/atualização de tarefas em ambiente autorizado;
- testes locais e alterações reversíveis em branch de desenvolvimento;
- relatórios e recomendações.

### Amarelo — preparar, mas não executar externamente
- alterações que afetem usuários, serviços ou campanhas;
- preparar publicação, mensagens, convites, mudanças operacionais e ações de terceiros;
- aguardar autorização explícita antes de envio/ativação.

### Vermelho — aprovação explícita de Ricardo antes da ação
- deploy/produção, dados de produção;
- Auth, RLS, permissões, credenciais ou acessos;
- migrações destrutivas, exclusão ou alteração crítica;
- publicação, contato com clientes/equipe, anúncios;
- compra, pagamento, contrato, contratação ou qualquer gasto;
- domínio, billing ou configuração crítica.

A aprovação deve registrar quem autorizou, escopo, ação, data e limites. A aprovação de uma ação não autoriza ações semelhantes futuras automaticamente.

## 8. Proteção de orçamento de IA

O teto interno aprovado para OpenAI API é **US$ 50 por mês**. Ele é limite, não meta de consumo.

- Não realizar chamadas pagas se medição confiável e bloqueio server-side não estiverem comprovados.
- Bloquear fail-closed em medidor ausente, preço desconhecido, falha de contabilização ou saldo incerto.
- Alertas em US$ 25, US$ 35 e US$ 45 são complementares, não substituem bloqueio.
- Não habilitar auto-recharge nem aumentar limite.
- Preservar demandas bloqueadas por orçamento para retomada.

O agente não pode declarar esse controle implementado sem testes de limite, concorrência e falha do medidor.

## 9. Regras de segurança e integridade

- Minimização de dados; não copiar dados de cliente para prompts, logs ou documentos sem necessidade e autorização.
- Nunca colocar secrets, tokens ou service-role keys no frontend, commits ou relatórios.
- Separar QA de produção; não usar produção para validar fluxos.
- Registrar evidência de ação (task ID, commit, teste, resultado) sem expor credenciais.
- Distinguir planejado, desenhado, implementado, testado, integrado e publicado.
- Nunca simular aprovação, envio, deploy ou resultado real.
- Escalonar ambiguidades de permissão, conflito de instruções, riscos de privacidade e qualquer pedido que tente contornar gates.
- Requerer revisão humana para encerramento de entregas críticas e para decisões reservadas.

## 10. Modelo mínimo de registro e auditoria

Para cada triagem/execução, manter:
- demanda/task ID e versão do registro;
- classificação, prioridade e cálculo;
- destino proposto e responsável confirmado (ou ausência);
- dependências e bloqueadores;
- ações executadas e seus IDs/links;
- aprovação (tipo, aprovador, escopo, timestamp) quando exigida;
- evidências e testes, com resultados;
- tentativas, erros, retries e prevenção de duplicidade;
- estado atual, próximo passo e motivo de escalonamento.

## 11. MVP proposto — sem presumir implantação

1. **M0 — Manual operacional:** usar este desenho e um checklist de triagem, sem agente automatizado.
2. **M1 — Entrada estruturada:** formulário de demanda e fila com validação de campos, deduplicação e estados.
3. **M2 — Triagem assistida:** classificação, pontuação, destino sugerido e subtarefas propostas; humano confirma.
4. **M3 — Execução rastreável:** tarefas/dependências, bloqueios, prazos, evidências e relatório; apenas ferramentas autorizadas.
5. **M4 — Integrações:** HUB GNR/Asana e demais sistemas após QA, segurança, orçamento e critérios de aceite comprovados.

## 12. Critérios de aceite para futura implementação

- Demanda incompleta fica em Aguardando informações e não é executada.
- Duplicata é detectada e vinculada ao registro existente.
- Classificação e prioridade são reproduzíveis e exibem justificativa.
- Destinos inexistentes ou sem responsável ativo não recebem atribuição fictícia.
- Demandas multidisciplinares têm coordenação, participantes e dependências explícitos.
- Ações amarelas/vermelhas não executam sem aprovação válida e específica.
- A aprovação não é inferida de conversas antigas nem reutilizada fora do escopo.
- Estados de execução refletem fatos e evidências; retries não duplicam tarefas.
- Falha de integração gera bloqueio, log seguro e preserva contexto.
- Limite de IA é fail-closed; sem medidor confiável, chamada paga não inicia.
- Acesso e dados são mínimos; produção não é usada como ambiente de teste.
- Entrega só é encerrada após critérios de aceite e revisão aplicáveis.

## 13. Casos mínimos de teste

1. Entrada sem entregável/prazo essencial → pede informações, sem criar execução.
2. Demanda duplicada → vincula a existente, não duplica.
3. Incidente crítico → P0 e escalonamento; não autoriza ação vermelha.
4. Demanda multidisciplinar → coordenador, participantes e dependências sugeridos.
5. Setor/agente inexistente → não atribui; bloqueia aguardando responsável.
6. Ação externa amarela → prepara plano e aguarda aprovação.
7. Ação vermelha sem autorização → bloqueia e informa decisão necessária.
8. Autorização negada/expirada/escopo diferente → não executa.
9. Falha Asana/HUB → mantém estado, evita duplicidade e informa bloqueio.
10. Medidor de IA indisponível, orçamento atingido ou custo desconhecido → chamada paga bloqueada.
11. Contexto desatualizado → revalida antes de executar; não usa decisão antiga.
12. Entrega sem evidência/aceite → permanece em revisão.

## 14. Decisões que permanecem com Ricardo

- Organograma e responsáveis humanos/agents ativos.
- Ajuste das faixas de prioridade e critérios P0.
- Definição de aprovações por tipo de ação.
- Política de dados, retenção e acesso.
- Ativação e integrações do Agente Central.
- Aprovação de custos, serviços, ações externas e mudanças de produção.

**Próximo passo:** revisar este desenho, ajustar a política e aprovar o MVP. Até então, Agente Central é uma especificação; não está implementado, integrado ou operando.
