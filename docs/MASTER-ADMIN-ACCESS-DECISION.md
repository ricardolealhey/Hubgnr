# Decisão de acesso: Master x Admin — GNR OS / HUB GNR

**Data da evidência:** 17/11/2026  
**Repositório:** `ricardolealhey/Hubgnr`  
**Branch:** `docs/github-versioning-2026-11-12`  
**Ambiente inspecionado:** Supabase HUB GNR QA (`wbxxqhduiyryjnqcrscp`)  
**Estado:** memorando para decisão de Ricardo; nenhuma regra foi alterada.

## 1. Decisão que precisa ser tomada

Definir se o papel `admin` terá os mesmos poderes de `master), poderes delegados e limitados, ou se ficará sem uso no MVP.

A recomendação é reservar `master` exclusivamente a Ricardo e não atribuir `admin` a ninguém até que o escopo delegado esteja formalmente definido e tecnicamente testado. Se um papel Admin for necessário depois, ele deve receber capacidades explícitas e menores que as do Master.

## 2. Evidências atuais no Supabase QA

Consulta somente de leitura realizada em 17/11/2026:

- Projeto QA em estado `ACTIVE_HEALTHY`.
- Tabelas públicas `profiles`, `companies`, `clients` e `user_module_permissions`; RLS habilitado nas quatro.
- Todas as quatro tabelas com zero linhas no momento da consulta.
- Uma migration registrada no QA: `20261111051015 / hub_gnr_qa_bootstrap_20261111`.
- Nenhuma Edge Function listada no projeto QA.
- Supabase Security Advisor retornou zero alertas. Isso não substitui testes funcionais nem prova que a matriz de autorização esteja correta.

### 2.1 Função `private.is_hub_admin()`

A definição atual retorna verdadeiro quando existe um perfil autenticado, ativo, cujo papel seja `master` **ou** `admin`.

Essa função é usada por políticas que:
- permitem leitura de todos os perfis em `profiles` além da leitura do próprio perfil;
- permitem todas as operações em `user_module_permissions` para quem for reconhecido como administrador;
- permitem leitura de permissões próprias ou por administrador.

### 2.2 Função `private.has_module_access(module_key, p_manage)`

A definição atual retorna verdadeiro para qualquer perfil ativo com papel `master` **ou** `admin`, independentemente da permissão específica cadastrada em `user_module_permissions`.

Para os demais papéis, exige uma concessão para o módulo com `can_view=true); quando `p_manage=true`, exige também `can_manage=true`.

As políticas atuais de `companies` e `clients` usam essa função para SELECT, INSERT, UPDATE e DELETE. Portanto, no caminho de banco coberto por essa função, `admin` e `master` recebem o mesmo bypass das permissões por módulo. Não é apenas uma diferença visual no frontend.

### 2.3 Limite da evidência sobre convites

O histórico de auditoria do projeto principal registrou anteriormente que a Edge Function de convite exigia papel Master. Entretanto, o projeto QA consultado hoje não possui Edge Functions. Logo, essa diferença entre convite e RLS não foi revalidada por execução ponta a ponta no QA.

## 3. Alternativas

| Alternativa | Regra | Impacto |
|---|---|---|
| A — Admin equivalente a Master | Ambos mantêm bypass global e gestão integral de permissões | Simples, mas amplia muito o número de pessoas com poder administrativo total |
| B — Admin delegado | Master permanece global; Admin recebe somente módulos e ações explicitamente concedidos; não pode promover usuários nem conceder privilégios globais | Mais flexível, exige matriz de capacidades e mudanças/testes de RLS, funções e frontend |
| C — Sem Admin no MVP | Somente Ricardo recebe Master; nenhum perfil Admin é criado até a definição e implementação de B | Menor escopo imediato; adia a delegação administrativa |

## 4. Recomendação técnica

**Adotar C como regra provisória do MVP e desenhar B como modelo futuro.**

1. Reservar `master` a Ricardo.
2. Não criar nem convidar perfis `admin` enquanto a decisão estiver pendente.
3. Manter usuários operacionais com papéis específicos e concessões por módulo, como o perfil Performance previsto para Celso.
4. Antes de habilitar Admin, implementar e testar uma matriz que separe pelo menos: visualizar módulo, administrar dados do módulo, administrar usuários e conceder permissões.
5. Somente Master pode atribuir papéis privilegiados e conceder/revogar permissões globais, salvo decisão explícita diferente de Ricardo.

Essa recomendação não está implantada. As funções atuais ainda reconhecem `admin` como equivalente a `master` nos caminhos descritos.

## 5. Mudanças técnicas necessárias após decisão

Se Ricardo escolher B ou C com endurecimento técnico, preparar uma migration exclusiva para QA e alterações correspondentes no frontend/fluxo de convite, com:

- revisão de `private.is_hub_admin()` e `private.has_module_access()`;
- políticas RLS alinhadas à matriz aprovada;
- prevenção de autoelevação e de concessão de papéis privilegiados;
- alinhamento do comportamento do frontend com o backend;
- testes positivos e negativos para Master, Admin (se habilitado), Performance e usuário sem concessão;
- confirmação de que falhas e permissões ausentes resultam em negação de acesso.

Qualquer alteração em Auth, RLS, permissões, funções ou convites exige autorização explícita de Ricardo. Não executar em produção.

## 6. Decisão pendente

Ricardo deve escolher A, B ou C. Se escolher B, também deve aprovar quais módulos e operações um Admin poderá administrar e se poderá convidar usuários comuns. Até lá, preservar o estado atual, não criar perfis Admin e não declarar a matriz de acesso concluída.

## 7. Referências de evidência

- Projeto Asana GNR OS: tarefa “Concluir núcleo do HUB: login, perfis, clientes e permissões”.
- Projeto Asana GNR OS: tarefa “Validar acesso e arquitetura do Supabase”.
- Consulta `pg_policies` do Supabase QA em 17/11/2026.
- Definições consultadas de `private.is_hub_admin()` e `private.has_module_access(text, boolean)` em 17/11/2026.
- Estado do Supabase QA e tabelas consultados em 17/11/2026.

Nenhum usuário, dado, política, função, configuração Auth, deploy ou ambiente de produção foi alterado na preparação deste memorando.
