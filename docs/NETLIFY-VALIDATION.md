# Validação do Netlify — 11/11/2026

## Escopo

Registro técnico do processo de build do HUB GNR. Esta alteração é documental e fica isolada em branch de QA; não altera a branch `main`, a configuração do site ou os dados do Supabase.

## Identificadores verificados

- Site Netlify: `hubgnr-e9ah`
- Repositório: `ricardolealhey/Hubgnr`
- Branch principal: `main`
- HEAD de `main` na auditoria: `e88801342f1447b129a2df5101835e09bb0d75b4`
- Último deploy publicado: `6af10ebb611de67ee99e6c5b`, commit `a67f2e790ea8040a39f48afd0ee25a76e31d99da`

## Configuração de build

- Comando: `npm run build`
- Script: `vite build`
- Diretório publicado: `dist`
- Node: `20`
- Stack declarada: React 19, Vite 7 e Supabase JS 2

## Estado observado

- Três deploys recentes falharam durante a etapa de build com código de saída 2.
- Dois deploys posteriores foram cancelados.
- Os commits `91a1a811`, `eda553f1` e `e8880134` contêm correções posteriores relacionadas ao fluxo de permissões.
- Não foi encontrado deploy READY posterior a essas correções.
- A conexão Netlify disponível retorna estado e mensagem geral, mas não disponibiliza o log detalhado da compilação.
- A tentativa de build local foi bloqueada porque o ambiente não conseguiu resolver `github.com`; portanto, nenhum resultado local de `npm run build` está disponível.
- O repositório não possui `package-lock.json` no HEAD auditado; a instalação não está fixada por lockfile.

## Variáveis de ambiente

O site possui as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Os valores não devem ser copiados para logs, documentação ou frontend além do uso previsto pelo Vite. A chave publishable é destinada ao cliente; chaves `service_role` e outros segredos nunca podem ser usados em variáveis `VITE_*`.

**Atenção:** as variáveis estão no contexto `all`, então um Deploy Preview pode apontar para o Supabase principal. Até existir um projeto Supabase isolado para QA e configuração própria de redirect/CORS, limitar o preview a inspeção visual sem autenticação, convites ou operações de escrita.

## Critérios de aceite

1. Um Deploy Preview para o HEAD atual conclui com estado READY e commit identificado.
2. O bundle é gerado com as duas variáveis esperadas, sem exposição de valores sensíveis.
3. A interface abre no preview sem erro visual ou de carregamento.
4. Não executar login, recuperação, convites, CRUD ou testes RLS no preview enquanto ele usar o Supabase principal.
5. Testes ponta a ponta só serão aceitos em ambiente isolado, com usuários e dados de QA.
6. Nenhuma alteração ou publicação de produção será feita sem autorização explícita.

## Próximos passos

1. Usar este PR documental para verificar se o pipeline de Deploy Preview inicia e conclui.
2. Se falhar, obter o log detalhado diretamente no painel Netlify, pois o conector atual não expõe essa informação.
3. Criar ambiente Supabase de QA e variáveis específicas de Deploy Preview antes de testes autenticados.
4. Não fazer merge deste PR sem revisão e autorização de Ricardo.

**Status:** validação em andamento; build do HEAD atual ainda não comprovado.
