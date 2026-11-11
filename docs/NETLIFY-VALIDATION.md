# Validação do Netlify — 11/11/2026

## Escopo

Registro técnico do processo de build do HUB GNR. As alterações deste PR são exclusivamente documentais e permanecem isoladas em branch de QA; não alteram a branch `main`, a configuração do site ou os dados do Supabase.

## Identificadores verificados

- Site Netlify: `hubgnr-e9ah`
- Repositório: `ricardoleahhey/Hubgnr`
- Branch principal: `main`
- HEAD de `main` na auditoria: `e88801342f1447b129a2df5101835e09bb0d75b4`
- Último deploy de produção publicado: `6af10ebb611de67ee99e6c5b`, commit `a67f2e790ea8040a39f48afd0ee25a76e31d99da`

## Configuração de build

- Comando: `npm run build`
- Script: `vite build`
- Diretório publicado: `dist`
- Node: `20`
- Stack declarada: React 19, Vite 7 e Supabase JS 2

## Histórico e resultado

- Em 09/11/2026, três deploys de produção falharam durante a etapa de build com código de saída 2; dois deploys seguintes foram cancelados.
- Os commits `91a1a811`, `eda553f1` e `e8880134` contêm correções posteriores relacionadas ao fluxo de permissões.
- Em 11/11/2026, foi aberto o PR documental #1 a partir da branch `qa/netlify-build-validation-2026-11-11`, baseada no HEAD `e88801342f1447b129a2df5101835e09bb0d75b4`.
- O Deploy Preview `6af3efd6a8137c75c33347ea` concluiu com estado **READY**, em aproximadamente 10 segundos, para o commit documental `0e5778bf86113d1d130ee1ce32980550819e1878`. Esse commit tem como base a versão atual de `main` e altera somente este documento; portanto, o build Netlify compilou o código de aplicação presente no HEAD `e8880134`.
- O resumo do deploy informa que `index.html`, um asset e uma regra de redirect foram processados sem erro. Nenhuma função ou Edge Function foi publicada, o que é compatível com a estrutura frontend atual.
- Preview: https://deploy-preview-1--hubgnr-e9ah.netlify.app
- O deploy de produção continua apontando para o commit antigo `a67f2e7`; nenhuma publicação de produção ocorreu nesta sessão.
- O conector Netlify disponível informa estado e resumo, mas não fornece o log detalhado da compilação.
- A tentativa de build local foi bloqueada porque o ambiente não conseguiu resolver `github.com`; portanto, nenhum resultado local de `npm run build` está disponível.
- O repositório não possui `package-lock.json` no HEAD auditado; a instalação não está fixada por lockfile.

## Variáveis de ambiente

O site possui as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Os valores não devem ser copiados para logs, documentação ou relatórios. A chave publishable é destinada ao cliente; chaves `service_role` e outros segredos nunca podem ser usados em variáveis `VITE_*`.

**Atenção:** as variáveis estão no contexto `all`, então o Deploy Preview pode apontar para o Supabase principal. Até existir um projeto Supabase isolado para QA e configuração própria de redirect/CORS, limitar o preview a inspeção visual sem autenticação, convites ou operações de escrita.

## Critérios de aceite e estado

1. **Build Netlify em preview:** CONCLUÍDO para o código de aplicação do HEAD `e8880134`, com Deploy Preview READY.
2. **Bundle com variáveis esperadas:** ainda não inspecionado diretamente; os nomes das variáveis estão cadastrados no site.
3. **Interface abre e funciona visualmente:** ainda não validado por inspeção manual nesta sessão.
4. **Autenticação, recuperação, convites, CRUD e RLS:** não testados; não executar no preview enquanto ele usar o Supabase principal.
5. **Testes ponta a ponta:** aguardam ambiente isolado, usuários e dados de QA.
6. **Produção:** sem alteração; qualquer merge ou deploy exige autorização explícita.

## Próximos passos

1. Fazer inspeção visual do preview sem autenticar nem gravar dados.
2. Criar ou identificar um ambiente Supabase de QA e configurar variáveis específicas de Deploy Preview, redirects e CORS antes de testes autenticados.
3. Obter acesso ao log detalhado do Netlify se houver nova falha.
4. Definir lockfile e estratégia de build reproduzível em tarefa própria.
5. Não fazer merge deste PR sem revisão e autorização de Ricardo.

**Status:** build de preview validado; inspeção visual e integração funcional continuam pendentes.
