# Plano de testes ponta a ponta — núcleo do HUB GNR

**Data de preparação:** 12/11/2026  
**Repositório:** `ricardolealhey/Hubgnr`  
**Branch:** `docs/github-versioning-2026-11-12`  
**Escopo:** login, sessão, perfis, empresas, clientes e permissões  
**Status:** plano preparado; testes de navegador ainda não executados.

## 1. Objetivo e limites

Comprovar que o núcleo do HUB funciona por meio da interface real e de sessões autenticadas distintas, respeitando o acesso mínimo necessário. Os testes devem ocorrer exclusivamente no Supabase QA e em um frontend QA isolado.

Este documento não autoriza deploy, alteração de autenticação/RLS/permissões, criação de usuários, envio de convites, e-mails ou uso de dados de produção.

## 2. Estado conhecido do ambiente

- Supabase QA: projeto `HUB GNR QA`, ref `wbxxqhduiyryjnqcrscp`, estado `ACTIVE_HEALTHY`.
- Tabelas públicas: `profiles`, `companies`, `clients` e `user_module_permissions`; RLS habilitado nas quatro; contagem atual consultada: zero linhas em cada uma.
- Advisor de segurança consultado em 12/11: nenhum alerta.
- Edge Functions no projeto QA: nenhuma listada. A função `hub-invite-member` ainda não foi implantada no QA.
- Netlify QA: site `hubgnr-qa`, ID `4b57f132-e7fd-472f-8e5a-c0ad1f38de00`, sem deploy publicado. O último deploy foi `SKIPPED` por `account credit usage exceeded`.
- O site QA está atualmente sem senha e sem exigência de SSO. Antes de publicar qualquer conteúdo, Ricardo deve escolher e autorizar a proteção adequada.
- O Deploy Preview do site principal não deve ser usado para autenticação ou escrita: seus contextos de variáveis foram registrados como capazes de apontar para o Supabase principal.
- Testes já executados no banco QA: 16/16 verificações transacionais de triggers/RLS aprovadas e 6/6 operações CRUD Master afetaram exatamente uma linha cada. Os testes usaram claims JWT sintéticos e `ROLLBACK`; não comprovam login real, recuperação de senha, convites ou sessão no navegador.

## 3. Pré-requisitos obrigatórios

1. Disponibilizar frontend de QA isolado, com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` apontando exclusivamente para o projeto QA. Nunca registrar os valores das chaves neste documento ou nos logs.
2. Definir proteção do site QA (senha ou SSO) antes de publicar. Não publicar enquanto o site permanecer sem proteção aprovada.
3. Gerar e validar `package-lock.json` em ambiente Node 20; executar `npm ci` e `npm run build`. O repositório consultado não contém lockfile e o clone local desta sessão falhou por DNS; portanto, ainda não há build local reproduzível.
4. Obter autorização explícita antes de criar contas de teste no Supabase Auth, pois isso altera recursos de autenticação. Usar apenas identidades de teste controladas por Ricardo, sem copiar usuários ou dados de produção.
5. Definir como testar recuperação de senha com uma caixa de e-mail controlada e sem enviar mensagens a clientes ou membros reais.
6. Adaptar a função de convite para o domínio QA e um mecanismo de e-mail de teste/sandbox antes de qualquer implantação. A função de produção tem CORS/redirect associados ao domínio de produção e envia e-mails; não copiá-la sem revisão.
7. Resolver a decisão de governança pendente: as funções RLS reconhecem `master` e `admin` como administradores, enquanto a função de convite aceita somente `master`. Não alterar essa regra sem decisão de Ricardo.

## 4. Matriz de testes

| ID | Cenário | Resultado esperado | Estado |
|---|---|---|---|
| ENV-01 | Abrir sem variáveis Supabase | Tela de configuração; nenhuma consulta ou sessão | Pendente |
| AUTH-01 | Login Master com credenciais QA válidas | Sessão criada e perfil ativo carregado | Bloqueado por conta QA |
| AUTH-02 | Login com senha incorreta | Acesso negado; mensagem sem expor detalhes sensíveis | Bloqueado por conta QA |
| AUTH-03 | Recarregar a página com sessão válida | Sessão restaurada e perfil correspondente | Bloqueado por conta QA |
| AUTH-04 | Encerrar sessão | Sessão removida e retorno ao login | Bloqueado por conta QA |
| AUTH-05 | Recuperar e atualizar senha | Link de QA válido; senha alterada; login com nova senha | Bloqueado por conta QA/e-mail |
| AUTH-06 | Perfil inexistente, inativo ou consulta de perfil com erro | Dashboard não pode ser exibido; acesso deve falhar de forma fechada | Pendente de correção e teste |
| AUTH-07 | Trocar de usuário na mesma aba após sessão anterior | Nenhum nome, papel ou permissão do usuário anterior pode permanecer visível | Pendente de correção e teste |
| RBAC-01 | Master abre Visão Geral, Empresas, Clientes e Equipe | Áreas administrativas disponíveis conforme papel aprovado | Bloqueado por conta QA |
| CRUD-01 | Master cria, edita e exclui empresa de teste | Uma linha afetada por operação; lista atualiza após recarga | Banco validado; UI pendente |
| CRUD-02 | Master cria, edita e exclui cliente de teste | Uma linha afetada por operação; vínculo com empresa funciona | Banco validado; UI pendente |
| RBAC-02 | Usuário Performance acessa somente o módulo concedido | Navegação e dados limitados ao escopo autorizado | Bloqueado por conta QA |
| RBAC-03 | Performance tenta abrir Empresas, Equipe e operações administrativas | Acesso negado também no backend/RLS; ocultar menu não basta | Banco parcialmente validado; UI pendente |
| INV-01 | Convite de membro em ambiente QA | Só executar após função QA, e-mail sandbox e autorização explícita | Bloqueado |
| UI-01 | Testar em viewport móvel de 360 px | Formulários, navegação, tabelas e modais utilizáveis sem overflow crítico | Pendente |
| UI-02 | Testar em desktop de 1440 px | Layout e ações principais utilizáveis | Pendente |
| CLEAN-01 | Limpar os dados sintéticos ao final | Nenhum usuário ou registro de teste permanece | Pendente |

## 5. Risco de sessão identificado na leitura do frontend

Na versão atual de `main`, o efeito que carrega o perfil define `loading=true`, mas não limpa imediatamente `profile` e `permissions` antes de consultar o novo usuário. Se a sessão mudar e a consulta do novo perfil falhar, o estado anterior pode permanecer em memória; como a renderização do Dashboard verifica apenas a existência de `session` e `profile`, a interface pode exibir o papel/permissões anteriores com a sessão nova.

Isso não comprova bypass de RLS nem acesso aos dados protegidos, mas é um risco de estado/autorização na interface. A correção exige mudança no fluxo de autenticação e deve aguardar autorização explícita de Ricardo. Critério esperado: limpar perfil/permissões na troca de sessão e manter a interface bloqueada enquanto o perfil atual não for validado.

## 6. Critérios de aceite do núcleo

- Build reproduzível com lockfile, `npm ci` e `npm run build` aprovados.
- Frontend QA comprovadamente conectado apenas ao Supabase QA.
- Login, persistência de sessão, logout e recuperação testados com usuários QA reais.
- Master e usuário de acesso limitado testados em sessões separadas.
- CRUD de empresas/clientes validado pela interface, incluindo confirmação de linhas afetadas e persistência após recarga.
- Tentativas não autorizadas bloqueadas no backend, não apenas escondidas na interface.
- Troca de sessão e falha de consulta de perfil falham de forma fechada.
- Testes responsivos aprovados em móvel e desktop.
- Convites só aceitos após função QA isolada, e-mail sandbox e teste sem destinatários reais.
- Dados sintéticos removidos e limpeza confirmada.
- Evidências, commits e resultados registrados no Asana.

## 7. Regras de parada

- Não executar autenticação, CRUD ou convites no Supabase principal.
- Não usar o Deploy Preview do site principal para testar dados ou autenticação.
- Não publicar no Netlify QA enquanto não houver proteção aprovada e o bloqueio de créditos persistir.
- Não criar usuários, alterar Auth/RLS/permissões ou implantar Edge Functions sem autorização explícita.
- Não realizar merge, deploy de produção, envio de e-mail ou gasto.
- Se uma pré-condição falhar, parar o teste correspondente, registrar o bloqueio e preservar os dados.

**Conclusão:** este plano organiza a validação do núcleo, mas não declara o HUB validado. O aceite depende da execução de todos os cenários aplicáveis em ambiente QA isolado.
