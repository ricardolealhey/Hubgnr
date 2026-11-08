# Deploy do HUB GNR

O projeto é publicado no Netlify a partir da branch `main` do repositório `ricardolealhey/Hubgnr`.

## Build

- Comando: `npm run build`
- Diretório publicado: `dist`
- Framework: Vite

## Variáveis de ambiente

Configure no painel do Netlify, em todas as contextos de deploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Essas variáveis são lidas durante a compilação do Vite. Depois de criá-las ou alterá-las, é necessário executar um novo deploy para incorporá-las ao bundle publicado.

A chave `VITE_SUPABASE_PUBLISHABLE_KEY` é uma chave pública destinada ao cliente. Nunca adicionar chaves `service_role` ou secrets do Supabase ao frontend ou ao repositório.
