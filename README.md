# HUB GNR

Central de gestão do Grupo Nova Rota.

## Stack
- React + Vite
- Supabase Auth + Postgres
- Netlify

## Desenvolvimento local
1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` exclusivamente com os dados do projeto Supabase isolado de QA.
3. Execute `npm install`.
4. Execute `npm run dev`.

O arquivo `.env.example` permanece sem credenciais para evitar que uma instalação local seja conectada acidentalmente ao banco de produção. Sem as duas variáveis, o HUB apresenta a tela “Configuração necessária”.

## Build
- Comando: `npm run build`
- Saída: `dist`
- Node configurado no Netlify: `20`

## Segurança
- `VITE_*` é incorporado ao bundle do navegador e não pode conter segredos.
- A chave publishable/anon é destinada ao cliente; nunca configure `service_role` no frontend.
- O arquivo `.env.local` é ignorado pelo Git.
- Use o Supabase QA em desenvolvimento e testes. Não use contas ou dados reais de produção em previews.
- O painel administrativo reconhece perfis ativos com role `master` ou `admin`.
- A autorização dos dados deve permanecer nas políticas RLS do Supabase.

## Estado da versão 0.2.0
- Login com e-mail e senha.
- Recuperação de senha por e-mail.
- Atualização de senha após retorno do link.
- Carregamento e validação do perfil.
- Painel Master inicial com módulos planejados.
- Integrações CRM e Visitor Intelligence ainda não conectadas.

A configuração de URLs de redirecionamento e SMTP deve ser revisada no Supabase QA antes dos testes de recuperação de senha. A integração de produção só deve ser alterada mediante autorização explícita.
