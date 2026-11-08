# HUB GNR

Central de gestão do Grupo Nova Rota.

## Stack
- React + Vite
- Supabase Auth + Postgres
- Netlify

## Desenvolvimento
1. Copie .env.example para .env.local.
2. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
3. Execute npm install.
4. Execute npm run dev.

## Segurança
- O frontend usa somente a chave publishable/anon.
- Nunca configure a chave service_role no navegador.
- O painel administrativo aceita perfis ativos com role master ou admin.
- A autorização real dos dados deve permanecer nas políticas RLS do Supabase.

## Estado da versão 0.2.0
- Login com e-mail e senha.
- Recuperação de senha por e-mail.
- Atualização de senha após retorno do link.
- Carregamento e validação do perfil.
- Painel Master inicial com módulos planejados.
- Integrações CRM e Visitor Intelligence ainda não conectadas.

A configuração de URLs de redirecionamento e SMTP deve ser revisada no Supabase antes do teste de recuperação de senha em produção.