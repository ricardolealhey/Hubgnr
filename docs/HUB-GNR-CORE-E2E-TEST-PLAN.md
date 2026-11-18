# Plano de testes ponta a ponta — núcleo do HUB GNR

**Revisão:** 18/11/2026  
**Repositório:** `ricardolealhey/Hubgnr`  
**Branch:** `docs/github-versioning-2026-11-12`  
**Escopo:** login, sessão, perfis, empresas, clientes e permissões  
**Status:** plano atualizado com bloqueio ambiental; testes de navegador ainda não executados.

## 1. Objetivo e limites

Comprovar que o núcleo do HUB funciona por meio da interface real e de sessões autenticadas distintas, respeitando o acesso mínimo necessário. Os testes devem ocorrer exclusivamente no Supabase QA e em um frontend QA isolado.

Este documento não autoriza deploy, alteração de autenticação/RLS/permissões, criação de usuários, envio de convites, e-mails ou uso de dados de produção.

## 2. Estado atual dos ambientes — revalidado em 18/11/2026

### Supabase QA

- Projeto: `HUB GNR QA`, ref `wbxxqhduiyryjnqcrscp`, região `us-east-2`.
- A consulta atual de projeto retornou status **INACTIVE**.
- A tentativa de listar tabelas falhou com `Database is possibly not accessible at the moment`. Portanto, nesta sessão não foi possível confirmar a disponibilidade do banco, schema, políticas ou contagens atuais.
- A consulta de Edge Functions retornou lista vazia.
- O Security Advisor retornou lista vazia, mas, com o projeto INACTIVE e o banco inacessível, esse retorno não deve ser tratado como nova validação de segurança.
- Último snapshot de banco previamente registrado em 17/11: quatro tabelas (`profiles`, `companies`, `clients`, `user_module_permissions)), RLS habilitado nas quatro e zero linhas. Esse é um registro histórico, não uma leitura confirmada de hoje.
- Testes históricos no QA: 16/16 verificações transacionais de triggers/RLS e 6/6 operações CRUD Master aprovadas. Usaram claims JWT sintéticos e `ROLLBACK`; não comprovam login real, recuperação de senha, convites ou sessão no navegador.

### Netlify QA

- Site: `hubgnr-qa`, ID `4b57f132-e7fd-472f-8e5a-c0ad1f38de00`.
- Não há deploy publicado atual (`currentDeploy` vazio).
- Controles atuais: sem exigência de senha e sem exigência de SSO (`requirePassword=false`, `requireSSOTeamLogin=false`).
- O único deploy listado permanece `SKIPPED`, branch `main`, contexto `production`, ID `6af4016cd0015adcc68e6036`. O histórico anterior registrou `account credit usage exceeded`.
- Não existe aplicação QA publicada para teste neste site. Não tentar contornar o bloqueio de créditos.

### Regras derivadas do estado atual

1. Não executar testes de login, CRUD ou convites enquanto o Supabase QA estiver INACTIVE.
2. Não restaurar/reativar o projeto automaticamente. A retomada do serviço precisa ser tratada como ação externa separada, sem upgrade, compra ou gasto.
3. Não publicar conteúdo no Netlify QA enquanto o site estiver sem proteção aprovada e o bloqueio operacional persistir.
4. Não usar o Deploy Preview do site principal para autenticação ou escrita: seus contextos de variáveis foram registrados como capazes de apontar para o Supabase principal.

## 3. Pré-requisitos obrigatórios

1. Reativar o Supabase QA e confirmar que o banco aceita consultas; depois revalidar tabelas, RLS, funções, triggers e Advisor. Não assumir que o snapshot de 17/11 permanece atual.
2. Disponibilizar frontend de QA isolado, com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` apontando exclusivamente para o projeto QA. Nunca registrar valores de chaves neste documento ou nos logs.
3. Definir proteção do site QA (senha ou SSO) antes de publicar. Não publicar enquanto o site permanecer sem proteção aprovada.
4. Resolver o bloqueio de deploy sem contratar plano, comprar créditos ou habilitar recarga automática. Não iniciar deploy de produção.
5. Gerar e validar `package-lock.json` em ambiente Node 20; executar `npm ci` e `npm run build`. O repositório principal consultado não contém lockfile e não há evidência de build local reproduzível.
6. Obter autorização explícita antes de criar contas de teste no Supabase Auth. Usar apenas identidades de teste controladas por Ricardo, sem copiar usuários ou dados de produção.
7. Definir como testar recuperação de senha com uma caixa de e-mail controlada e sem enviar mensagens a clientes ou membros reais.
8. Adaptar a função de convite para o domínio QA e um mecanismo de e-mail de teste/sandbox antes de qualquer implantação. A função do projeto principal tem CORS/redirect associados ao domínio de produção e envia e-mails; não copiá-la sem revisão.
9. Resolver a decisão de governança pendente: as funções RLS previamente inspecionadas reconheciam `master` e `admin` como administradores, enquanto a função de convite aceitava somente `master`. A regra atual precisa ser revalidada após a retomada do QA; não alterá-la sem decisão de Ricardo.

## 4. Matriz de testes

| ID | Cenário | Resultado esperado | Estado |
|---|---|---|---|
| ENV-01 | Abrir sem variáveis Supabase | Tela de configuração; nenhuma consulta ou sessão | Pendente |
| AUTH-01 | Login Master com credenciais QA válidas | Sessão criada e perfil ativo carregado | Bloqueado: Supabase QA INACTIVE |
| AUTH-02 | Login com senha incorreta | Acesso negado; mensagem sem expor detalhes sensíveis | Bloqueado: Supabase QA INACTIVE |
| AUTH-03 | Recarregar a página com sessão válida | Sessão restaurada e perfil correspondente | Bloqueado: Supabase QA INACTIVE |
| AUTH-04 | Encerrar sessão | Sessão removida, perfil/permissões limpos e retorno ao login | Bloqueado: Supabase QA INACTIVE |
| AUTH-05 | Recuperar e atualizar senha | Link QA válido; senha alterada; login com nova senha | Bloqueado: QA/e-mail |
| AUTH-06 | Perfil inexistente, inativo ou consulta do perfil com erro | Dashboard não exibido; perfil/permissões limpos; acesso negado de forma fechada | Pendente de correção e teste |
| AUTH-07 | Trocar de usuário na mesma aba após sessão anterior | Nenhum nome, papel ou permissão do usuário anterior permanece visível durante ou após a validação | Pendente de correção e teste |
| AUTH-08 | Consulta de permissões falha após leitura do perfil | Não renderizar Dashboard parcialmente autorizado; exibir estado de erro seguro e não reutilizar permissões anteriores | Pendente de definição/correção e teste |
| AUTH-09 | Resposta assíncrona de perfil/permissões chega após nova troca de sessão | Resposta da sessão antiga descartada; somente dados vinculados ao usuário da sessão atual podem ser aplicados | Pendente de teste |
| RBAC-01 | Master abre Visão Geral, Empresas, Clientes e Equipe | Áreas administrativas disponíveis conforme matriz aprovada | Bloqueado: QA INACTIVE e decisão Master/Admin |
| CRUD-01 | Master cria, edita e exclui empresa de teste | Uma linha afetada por operação; lista atualiza após recarga | Teste de banco histórico; UI pendente |
| CRUD-02 | Master cria, edita e exclui cliente de teste | Uma linha afetada por operação; vínculo com empresa funciona | Teste de banco histórico; UI pendente |
| RBAC-02 | Usuário Performance acessa somente o módulo concedido | Navegação e dados limitados ao escopo autorizado | Bloqueado: QA INACTIVE |
| RBAC-03 | Performance tenta abrir Empresas, Equipe e operações administrativas | Acesso negado também no backend/RLS; ocultar menu não basta | Teste de banco histórico parcial; UI pendente |
| INV-01 | Convite de membro em ambiente QA | Só executar após função QA, e-mail sandbox e autorização explícita | Bloqueado |
| UI-01 | Testar em viewport móvel de 360 px | Formulários, navegação, tabelas e modais utilizáveis sem overflow crítico | Pendente |
| UI-02 | Testar em desktop de 1440 px | Layout e ações principais utilizáveis | Pendente |
| CLEAN-01 | Limpar os dados sintéticos ao final | Nenhum usuário ou registro de teste permanece | Pendente |

## 5. Risco de sessão identificado na leitura do frontend

Leitura de `src/main.jsx` na branch `main`, em 18/11/2026:

- No início de `loadProfile()`, o código define `loading=true`, mas não limpa `profile` e `permissions` antes de consultar o novo usuário.
- Se a consulta do novo perfil retornar erro, o caminho atual define `error`, mas não limpa o perfil anterior.
- A condição de renderização do Dashboard verifica `session && profile && !recoveryMode`; não exige ausência de erro nem confirmação de que o perfil pertence à sessão atual.
- Há também um caminho de erro na consulta de `user_module_permissions` que mantém o perfil recém-lido, define permissões vazias e registra erro, mas a condição de renderização ainda permite montar o Dashboard.

Isso demonstra risco de estado inconsistente na interface. Não comprova bypass de RLS nem acesso aos dados protegidos. A correção exige mudança no fluxo de autenticação/autorização e deve aguardar autorização explícita de Ricardo.

Critério esperado: invalidar imediatamente o estado anterior na troca de sessão; vincular perfil e permissões ao ID da sessão atual; impedir a renderização do Dashboard até que perfil e permissões necessários estejam validados; descartar respostas assíncronas de sessões antigas; falhar de forma fechada em erro de perfil ou de permissões.

## 6. Critérios de aceite do núcleo

- Build reproduzível com lockfile, `npm ci` e `npm run build` aprovados.
- Frontend QA comprovadamente conectado apenas ao Supabase QA.
- Supabase QA ativo e revalidado após a retomada.
- Login, persistência de sessão, logout e recuperação testados com usuários QA reais.
- Master e usuário de acesso limitado testados em sessões separadas, após decisão formal sobre Master/Admin.
- CRUD de empresas/clientes validado pela interface, incluindo confirmação de linhas afetadas e persistência após recarga.
- Tentativas não autorizadas bloqueadas no backend, não apenas escondidas na interface.
- Troca de sessão, falha de consulta de perfil e falha de consulta de permissões falham de forma fechada.
- Respostas assíncronas antigas não alteram o estado da sessão atual.
- Testes responsivos aprovados em móvel e desktop.
- Convites só aceitos após função QA isolada, e-mail sandbox e teste sem destinatários reais.
- Dados sintéticos removidos e limpeza confirmada.
- Evidências, commits e resultados registrados no Asana.

## 7. Regras de parada

- Não executar autenticação, CRUD ou convites no Supabase principal.
- Não executar testes funcionais enquanto o Supabase QA estiver INACTIVE.
- Não usar o Deploy Preview do site principal para testar dados ou autenticação.
- Não publicar no Netlify QA enquanto não houver proteção aprovada e o bloqueio operacional persistir.
- Não restaurar/reativar o Supabase, criar usuários, alterar Auth/RLS/permissões ou implantar Edge Functions sem autorização específica.
- Não realizar merge, deploy de produção, envio de e-mail ou gasto.
- Se uma pré-condição falhar, parar o teste correspondente, registrar o bloqueio e preservar os dados.

**Conclusão:** este plano organiza a validação do núcleo, mas não declara o HUB validado. Em 18/11/2026, a execução está bloqueada pelo Supabase QA INACTIVE e pela ausência de frontend QA publicado/protegido. O aceite depende da retomada segura do ambiente e da execução dos cenários aplicáveis em QA isolado.
