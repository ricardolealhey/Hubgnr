# Versionamento, revisão e backup — HUB GNR

**Auditoria:** 12/11/2026  
**Repositório:** `ricardolealhey/Hubgnr`  
**Branch desta proposta:** `docs/github-versioning-2026-11-12`  
**Base:** `main` em `e88801342f1447b129a2df5101835e09bb0d75b4`  
**Status:** proposta documental em branch isolada; ainda não aprovada nem aplicada à configuração do GitHub.

## 1. Estado verificado

- Repositório oficial identificado e acessível; visibilidade pública.
- Branch padrão: `main`.
- HEAD consultado em 12/11/2026: `e88801342f1447b129a2df5101835e09bb0d75b4`.
- Versão declarada em `package.json`: `0.2.0`.
- Stack declarada: React 19, Vite 7 e Supabase JS 2.
- Build Netlify declarado em `netlify.toml`: `npm run build`, publicação `dist`, Node 20.
- `package-lock.json` não foi localizado na branch `main`. O uso de intervalos semânticos em `package.json` sem lockfile reduz a reprodutibilidade das instalações.
- A busca de código não localizou workflow de CI. Portanto, CI automatizada não está comprovada nesta auditoria.
- A consulta de proteção de `main` e de rulesets retornou 404 pela conexão disponível. Isso não permite concluir se há ou não proteção configurada; o estado permanece **não confirmado**.
- PR #1 permanece aberto em draft, sem merge, com base `main` e branch `qa/netlify-build-validation-2026-11-11`. Seu objetivo é validar o build em preview.
- Branches de trabalho identificadas: `audit/accurate-validation-status-2026-11-10`, `qa/netlify-build-validation-2026-11-11` e `qa/supabase-bootstrap-2026-11-11`, além de `main`.

## 2. Risco identificado no ambiente local

Na auditoria, `.env.example` continha a URL e uma chave publishable do projeto Supabase principal. A chave publishable não é uma chave secreta, mas deixar o exemplo apontando para produção cria risco operacional: alguém pode copiar o arquivo e executar testes locais contra dados reais.

Nesta branch, `.env.example` foi alterado para deixar os dois valores vazios. O código atual de `src/supabase.js` só instancia o cliente quando ambas as variáveis estão preenchidas; `src/main.jsx` apresenta “Configuração necessária” quando não estão. O README foi ajustado para exigir o projeto QA no desenvolvimento local.

**Importante:** a alteração está somente nesta branch. Não foi mesclada em `main` e não alterou as variáveis do Netlify nem qualquer projeto Supabase.

## 3. Fluxo de branches recomendado

1. Manter `main` como referência estável e única fonte de publicação de produção.
2. Criar uma branch por assunto:
   - `feat/<assunto>-AAAA-MM-DD`
   - `fix/<assunto>-AAAA-MM-DD`
   - `docs/<assunto>-AAAA-MM-DD`
   - `qa/<assunto>-AAAA-MM-DD`
3. Não desenvolver diretamente em `main`.
4. Abrir PR com escopo, arquivos alterados, evidências, testes, riscos e plano de reversão.
5. Usar Deploy Preview apenas com variáveis de QA. Não autenticar nem gravar no Supabase principal por meio de previews.
6. Manter PR em draft enquanto houver pendências; solicitar revisão antes de merge.
7. Mesclar somente após critérios de aceite e autorização aplicável. Deploy de produção continua sujeito à aprovação explícita de Ricardo.
8. Criar tag de versão para cada release aprovado e registrar o commit publicado no Asana.

## 4. Proteção recomendada para main

Proposta para decisão — nenhuma regra foi alterada nesta sessão:

- Exigir PR para integrar mudanças.
- Bloquear force-push e exclusão da branch `main`.
- Exigir build automatizado bem-sucedido quando a CI estiver implantada.
- Definir aprovação independente somente após confirmar um segundo revisor humano. Não ativar uma regra de aprovação que possa bloquear o fluxo sem haver revisor disponível.
- Manter Ricardo como autoridade final para merge sensível e publicação de produção.

A existência e o estado atual dessas regras ainda precisam ser confirmados diretamente nas configurações do repositório.

## 5. CI e build reproduzível

Antes de exigir um status check:

1. Gerar `package-lock.json` em ambiente Node 20/npm compatível.
2. Revisar e versionar o lockfile em branch própria.
3. Validar instalação limpa com `npm ci`.
4. Validar `npm run build`.
5. Só então adicionar workflow de CI para pull requests e tornar o check obrigatório.

Não foi executado build local nesta auditoria. O preview Netlify READY registrado anteriormente comprova o build naquele contexto, mas não substitui instalação reproduzível com lockfile nem CI.

## 6. Estratégia de backup recomendada

GitHub é o repositório remoto principal, mas histórico Git não é backup independente contra perda de acesso, exclusão da conta ou comprometimento do serviço.

Proposta, ainda não implantada:

- Manter uma cópia independente do repositório em armazenamento controlado por Ricardo, com acesso restrito e criptografia.
- Fazer backup semanal do repositório e criar tag antes de cada release de produção.
- Manter retenção mínima proposta de 30 dias e testar restauração trimestralmente.
- Tratar backup do Supabase separadamente: exportar schema e dados conforme os recursos disponíveis no plano, proteger arquivos com criptografia e testar restauração em projeto isolado.
- Nunca incluir chaves, tokens, arquivos `.env`, service role ou credenciais nos backups versionados/publicamente acessíveis.
- Não copiar dados reais de produção para QA.

Nenhum backup independente foi criado ou validado nesta sessão; destino, retenção e responsabilidade ainda precisam ser aprovados.

## 7. Pendências para aceite da tarefa no Asana

- Confirmar diretamente se `main` possui branch protection ou rulesets.
- Decidir se haverá segundo revisor humano e quem será.
- Aprovar ou ajustar a política de PR e proteção de `main`.
- Definir destino e retenção do backup independente.
- Gerar lockfile, executar `npm ci` e `npm run build` em ambiente com dependências disponíveis.
- Implantar CI e comprovar o resultado em um PR.
- Revisar esta branch e decidir se as alterações podem ser mescladas.

**Conclusão:** o repositório e a branch principal estão identificados; há fluxo de branches e um PR de QA em uso. A política de revisão, a proteção efetiva de `main`, CI e backup independente ainda não estão comprovados. Esta documentação organiza a proposta, mas não declara esses controles como implantados.
