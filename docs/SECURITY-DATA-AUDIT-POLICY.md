# Política de segurança, dados e auditoria — GNR OS / HUB GNR

**Versão:** 0.1 — minuta para aprovação  
**Data:** 15/11/2026  
**Responsável pela aprovação:** Ricardo, Diretor Geral  
**Escopo:** GNR OS, HUB GNR, ambientes de desenvolvimento/QA/produção, dados operacionais, integrações e pessoas autorizadas.  
**Estado:** proposta documental. Não representa controles técnicos já implantados nem parecer jurídico.

## 1. Objetivo e princípios

Esta política estabelece requisitos mínimos para proteger informações, limitar acessos, manter rastreabilidade e responder a incidentes no GNR OS.

Princípios obrigatórios:

1. **Acesso mínimo necessário:** cada pessoa ou processo recebe somente o acesso necessário à função aprovada.
2. **Separação de ambientes:** desenvolvimento, QA e produção devem usar projetos, credenciais e dados distintos.
3. **Segurança no servidor:** ocultar telas ou botões no frontend não substitui autorização no backend e políticas RLS.
4. **Minimização:** coletar, armazenar, compartilhar e registrar somente os dados necessários à finalidade operacional.
5. **Rastreabilidade:** ações relevantes devem permitir identificar ator, ação, alvo, horário, ambiente e resultado.
6. **Fail-closed:** se identidade, permissão, configuração ou controle de orçamento não puder ser confirmado, bloquear a operação sensível.
7. **Aprovação humana:** decisões críticas, financeiras, externas e de acesso permanecem sob autoridade de Ricardo.
8. **Veracidade operacional:** distinguir controles planejados, documentados, implementados, testados, integrados e ativos em produção.

## 2. Classificação da informação

| Classe | Exemplos | Tratamento mínimo |
|---|---|---|
| Pública | Conteúdo institucional já aprovado para divulgação | Pode ser publicada após aprovação aplicável |
| Interna | Procedimentos, tarefas, planejamento, documentação não pública | Acesso somente à equipe autorizada |
| Confidencial | Dados de clientes, contatos, propostas, contratos, informações comerciais e financeiras | Acesso por necessidade; compartilhamento restrito; registro de acesso/alteração quando tecnicamente disponível |
| Restrita | Senhas, tokens, chaves secretas, credenciais administrativas, dados de autenticação, dados pessoais sensíveis e informações cuja exposição possa causar dano elevado | Acesso excepcional; armazenamento seguro; nunca incluir em frontend, repositório, relatórios ou logs |

A classificação deve considerar também o contexto: um dado isolado pode parecer comum e, combinado com outros, tornar-se confidencial ou restrito.

Não coletar dados pessoais sensíveis quando não forem indispensáveis ao serviço. Qualquer nova finalidade, categoria de dado ou compartilhamento externo relevante deve ser submetido à revisão de Ricardo antes da implantação.

## 3. Identidade, papéis e permissões

### 3.1 Regras

- Cada pessoa deve utilizar uma identidade individual; contas compartilhadas são proibidas para operação normal.
- A autenticação deve ser centralizada no provedor aprovado e associada a um perfil ativo.
- O backend e o banco devem validar permissões em toda operação protegida. A interface pode ocultar módulos como conveniência, nunca como controle único.
- A troca de sessão, ausência de perfil, perfil inativo, erro ao carregar permissões ou inconsistência de identidade deve bloquear o Dashboard e as operações protegidas.
- Permissões devem ser específicas por módulo e ação, com separação entre visualizar e administrar quando aplicável.
- Convites, elevação de privilégio, suspensão e remoção de acesso exigem autorização de Ricardo e trilha de auditoria.
- Revisar acessos periodicamente e imediatamente após mudança de função, desligamento ou suspeita de comprometimento.

### 3.2 Papéis previstos — não presumir implantação

| Papel | Diretriz de acesso |
|---|---|
| Master | Administração global; reservado a Ricardo até decisão formal diferente |
| Admin | Somente após definição explícita de escopo e limites; não herda automaticamente todos os poderes de Master |
| Staff | Acesso operacional por setor e módulos aprovados |
| Performance | Acesso estritamente limitado às atividades de Performance autorizadas |
| Client | Acesso apenas aos próprios dados e funcionalidades do portal, quando implantado |

A existência desses nomes no schema ou no frontend não comprova que o fluxo de autenticação, convite ou autorização esteja validado.

### 3.3 Divergência pendente

A auditoria registrou que funções RLS reconhecem os papéis master e admin como administradores, enquanto a função de convite consultada aceita somente master. Essa diferença exige decisão explícita de Ricardo. Não alterar RLS, Edge Functions ou regras de convite antes dessa decisão e de um plano de teste no QA.

## 4. Ambientes e dados de teste

- **Produção:** dados e usuários reais; qualquer escrita, migração, mudança de Auth/RLS ou deploy exige autorização explícita.
- **QA:** projeto Supabase e site Netlify separados; usar exclusivamente dados fictícios e contas de teste controladas.
- **Desenvolvimento local:** utilizar somente credenciais do Supabase QA.
- Nunca copiar usuários, tokens, e-mails de autenticação, dados pessoais ou registros comerciais de produção para QA.
- Cada preview deve apontar explicitamente para o Supabase QA. Variáveis compartilhadas entre contextos não devem ser consideradas seguras sem verificação.
- Antes de publicar conteúdo em QA, definir e validar o controle de acesso ao site.
- Arquivos .env.local, .env e equivalentes não devem ser versionados. Exemplos de ambiente devem permanecer sem valores reais.
- Variáveis VITE_* são incorporadas ao bundle do navegador. Somente valores projetados para exposição pública, como uma chave publishable protegida por RLS, podem ser usadas no frontend. Chaves service_role, tokens privados e segredos devem permanecer no backend.

**Achado atual:** a branch main ainda contém URL e chave publishable do Supabase principal em .env.example. A chave não é uma chave secreta, mas o exemplo cria risco de apontamento acidental para produção. A correção está preparada na branch isolada docs/github-versioning-2026-11-12, sem merge. Este documento não altera esse estado.

## 5. Credenciais, segredos e integrações

- Guardar segredos em mecanismos de variáveis/segredos do provedor, com escopo mínimo e acesso restrito.
- Nunca inserir segredos em código frontend, commits, issues, comentários do Asana, screenshots, logs ou relatórios.
- Não reutilizar credenciais entre QA e produção.
- Em suspeita de exposição, revogar/rotacionar a credencial afetada e investigar o uso, mediante autorização quando a operação puder afetar serviços.
- Integrações devem usar permissões mínimas, finalidade documentada e responsável identificado.
- Antes de ativar integração externa, registrar dados transmitidos, finalidade, permissões, retenção, custo e procedimento de revogação.

## 6. Uso de IA e proteção de orçamento

- Não enviar senhas, tokens, chaves, dados de autenticação ou dados pessoais sensíveis a modelos externos.
- Minimizar ou anonimizar dados de clientes antes de qualquer processamento externo.
- Não iniciar chamadas pagas de OpenAI API enquanto não houver medição confiável e bloqueio server-side do orçamento.
- O teto interno aprovado é **US$ 50 por mês**. O teto é limite, não meta de consumo.
- O controle deve reservar orçamento para chamadas concorrentes, falhar fechado quando o medidor estiver indisponível e preservar demandas não executadas.
- Alertas ou limites configurados no provedor são camadas adicionais; não presumir que sejam hard cap financeiro.
- Não habilitar recarga automática, aumento automático de limite ou compra de créditos.

## 7. Auditoria e registros

### 7.1 Eventos que devem ser auditáveis

- Login, logout, falhas de autenticação e alterações de credenciais.
- Criação, alteração, suspensão e remoção de usuários.
- Concessão, alteração e revogação de permissões.
- Leitura/exportação de dados confidenciais quando suportada pelo desenho e proporcional à finalidade.
- Criação, edição e exclusão de empresas, clientes e registros operacionais.
- Aprovações, rejeições, exceções de autonomia e ações administrativas.
- Deploys, migrações, mudanças de configuração e operações de integração.
- Bloqueios por orçamento, retomadas e autorizações excepcionais.

### 7.2 Campos mínimos recomendados

- Identificador do evento e horário UTC.
- Ator (ID interno; nunca senha ou token).
- Ação e recurso afetado.
- Ambiente (dev, QA ou produção).
- Resultado (sucesso, falha ou bloqueio).
- Identificador de correlação/request quando disponível.
- Justificativa e referência de aprovação para operações excepcionais.

### 7.3 Proteção dos logs

- Não registrar senhas, tokens, chaves, conteúdo integral de formulários ou payloads desnecessários.
- Restringir acesso aos logs e impedir que usuários comuns os alterem.
- Preferir registros append-only ou mecanismo equivalente de integridade.
- Sincronizar horários e padronizar UTC para facilitar investigação.
- Definir retenção por categoria e finalidade antes de ativar coleta ampla.
- A trilha de auditoria não deve ser usada para vigilância desproporcional de pessoas.

**Estado atual:** não há evidência suficiente de uma trilha de auditoria central do HUB implementada e validada. Os registros deste projeto no Asana e o histórico Git ajudam na rastreabilidade do desenvolvimento, mas não substituem auditoria de eventos do sistema em execução.

## 8. Retenção, correção e descarte

- Definir prazo por categoria de dado, finalidade, contrato e obrigação aplicável antes da entrada em produção.
- Não manter dados indefinidamente por conveniência.
- Não apagar dados de clientes, registros financeiros ou logs relevantes sem autorização, análise de obrigação de retenção e possibilidade de restauração.
- Solicitações de acesso, correção ou eliminação devem ser registradas, avaliadas e encaminhadas a Ricardo.
- Backups devem ter prazo de retenção e descarte próprios, compatíveis com a capacidade do plano contratado e com a finalidade.
- A exclusão de um registro no banco não significa que ele desapareceu imediatamente de backups; esse comportamento deve ser documentado.

Os prazos concretos de retenção ainda precisam de decisão e validação jurídica/contratual. Esta minuta não fixa prazos legais por conta própria.

## 9. Backup e recuperação

- GitHub não deve ser considerado a única cópia de segurança.
- Manter backup independente do código e documentação, com acesso restrito e proteção adequada.
- Planejar backup do banco separadamente do código; nunca colocar dumps com dados pessoais em repositórios públicos.
- Proteger backups com criptografia e controle de acesso.
- Definir RPO/RTO compatíveis com a operação antes de assumir compromissos de disponibilidade.
- Testar restauração em ambiente isolado e registrar data, escopo, resultado e responsável.
- Não declarar backup implantado até existir cópia verificável e teste de restauração bem-sucedido.

**Estado atual:** estratégia de backup independente está documentada como proposta; destino, rotina e restauração ainda não foram implantados ou comprovados.

## 10. Resposta a incidentes

Considerar incidente, entre outros casos: suspeita de acesso não autorizado, exposição de credencial, vazamento de dados, alteração indevida, indisponibilidade relevante, perda/corrupção de dados ou falha de isolamento entre ambientes.

### Procedimento mínimo

1. **Registrar:** horário, sistema, ambiente, sintoma, evidência e quem detectou.
2. **Conter:** interromper a operação afetada ou restringir acesso quando isso puder ser feito com segurança e autorização.
3. **Preservar:** guardar logs e evidências sem divulgar segredos ou ampliar a exposição.
4. **Avaliar:** identificar dados, usuários, integrações e período potencialmente afetados.
5. **Escalonar:** informar Ricardo imediatamente em incidentes relevantes; ele decide ações externas e compromissos.
6. **Recuperar:** restaurar serviço a partir de fonte confiável e validar controles antes de reabrir acesso.
7. **Aprender:** registrar causa, impacto, ações, responsáveis e medidas preventivas.

Comunicações a clientes, fornecedores, autoridades ou público, bem como notificações legais, somente podem ser feitas por pessoa autorizada por Ricardo, com orientação jurídica quando aplicável. Não prometer prazo ou ausência de impacto antes da investigação.

## 11. Matriz de autonomia aplicada à segurança

| Nível | Exemplos | Regra |
|---|---|---|
| Verde | Leitura, auditoria, documentação, análise, testes locais sem dados reais | Pode executar dentro das permissões |
| Amarelo | Preparar alteração de configuração, acesso, integração, comunicação ou deploy de QA | Preparar e documentar; não ativar/publicar sem autorização aplicável |
| Vermelho | Produção, dados reais, Auth, RLS, permissões, credenciais, migrações destrutivas, exclusões, domínios, faturamento, compras e comunicação externa | Exige autorização explícita de Ricardo antes da ação |

A autorização para uma etapa não se estende automaticamente a outras. Exemplo: autorização para preparar QA não autoriza criar usuários, enviar convites, alterar RLS ou publicar em produção.

## 12. Terceiros e fornecedores

Antes de conceder acesso ou transmitir dados a um fornecedor, registrar:

- Finalidade e necessidade.
- Dados e permissões envolvidos.
- Responsável interno.
- Região/armazenamento quando conhecido.
- Retenção, exclusão e possibilidade de exportação.
- Custos, limites e procedimento de encerramento.
- Condições contratuais e avaliação de privacidade aplicável.

A contratação ou ativação paga exige aprovação financeira de Ricardo.

## 13. Critérios para aprovar esta política

Ricardo deve revisar e decidir:

1. Se a classificação e os papéis propostos são adequados.
2. Se Master ficará reservado a Ricardo e qual será o escopo futuro de Admin.
3. Como resolver a divergência Master/Admin identificada em RLS e convites.
4. Quais prazos de retenção serão definidos por categoria.
5. Quem pode receber alertas e conduzir a resposta inicial a incidentes.
6. Quais metas RPO/RTO e rotina de backup são proporcionais à operação.
7. Quais controles serão priorizados no MVP do HUB.

## 14. Plano de implantação — ainda não executado

| Etapa | Entrega | Evidência de aceite |
|---|---|---|
| 1 | Aprovar esta política e decisões pendentes | Aprovação registrada por Ricardo |
| 2 | Corrigir fluxo fail-closed de sessão/perfil em branch isolada | Testes de troca de usuário, erro de perfil e logout |
| 3 | Confirmar matriz de papéis e permissões | Matriz aprovada + testes negativos de acesso |
| 4 | Separar variáveis e proteger QA | Inspeção do site e do bundle sem expor valores |
| 5 | Implantar auditoria de eventos | Eventos de teste consultáveis e sem segredos |
| 6 | Definir retenção e backups | Configuração documentada + restauração testada |
| 7 | Preparar resposta a incidentes | Responsáveis, canal e simulado documentados |

Nenhuma etapa desta tabela deve ser marcada como implantada apenas por estar descrita aqui.

## 15. Referência de estado em 15/11/2026

- Supabase QA wbxxqhduiyryjnqcrscp: estado ACTIVE_HEALTHY; quatro tabelas públicas com RLS habilitado e zero linhas; nenhuma Edge Function listada na consulta desta sessão.
- Netlify QA hubgnr-qa: sem deploy publicado; último deploy listado SKIPPED por limite de créditos. O estado consultado não exige senha nem SSO; não publicar até haver decisão de proteção e caminho de deploy sem gasto.
- GitHub: repositório oficial ricardolealhey/Hubgnr, branch padrão main. A branch docs/github-versioning-2026-11-12 permanece isolada e ainda não foi mesclada em main; contém esta minuta e outras documentações propostas.
- Não foram criados usuários, alterados dados, Auth, RLS, permissões, variáveis ou deploys nesta sessão.
- Os testes anteriores de banco (16/16 RLS/triggers e 6/6 operações CRUD Master) usaram claims sintéticos e ROLLBACK. Não equivalem a autenticação real ou testes E2E.

**Conclusão:** esta minuta fornece uma base para decisão e implementação. A política só deve ser considerada aprovada após revisão explícita de Ricardo; os controles técnicos permanecem pendentes até serem implantados e testados.
