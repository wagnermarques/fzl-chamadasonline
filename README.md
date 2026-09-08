# Chamada Online

PWA para registro de presença em eventos escolares (~2000 alunos), com defesas em camada contra um aluno marcar presença por outro:

1. **Geofence** — check-in precisa vir de coordenadas GPS dentro da área do evento: um raio configurável, ou um polígono desenhado (lista de coordenadas) para acompanhar o contorno real do terreno da escola.
2. **Código rotativo** — a equipe projeta um código de 5 caracteres que muda a cada 45s; o aluno precisa digitá-lo para confirmar presença. Principal defesa contra alguém marcar presença remotamente por um colega ausente.
3. **Vínculo de dispositivo (automático)** — o app gera um ID persistente no navegador no primeiro login. Se um dispositivo já vinculado a um aluno tentar marcar presença como outro aluno, o check-in é sinalizado (não bloqueado) para revisão da equipe.
4. **Vínculo verificado (secretaria)** — a equipe chama o aluno, confirma a matrícula (RM) pessoalmente e gera um código de vínculo (`/admin/enroll`) que o aluno digita no próprio celular (`/vincular`) para fixá-lo à conta. A partir daí, **só aquele celular pode marcar presença daquele aluno** — check-in de qualquer outro dispositivo é recusado na hora, não apenas sinalizado.

Ver `apps/api/prisma/schema.prisma` para o modelo de dados e `apps/api/src/routes/checkins.ts` para a lógica central.

## Estrutura

- `apps/web` — PWA (React + Vite + Tailwind)
- `apps/api` — API (Fastify + Prisma + PostgreSQL)
- `packages/shared` — schemas Zod compartilhados

## Rodando localmente

```bash
docker compose up -d db

npm install

cp apps/api/.env.example apps/api/.env
npm run prisma:migrate --workspace apps/api
npm run seed --workspace apps/api

npm run dev:api   # http://localhost:3333
npm run dev:web   # http://localhost:5173 (proxy /api -> :3333)
```

Usuário staff seed: `staff@escola.test` / PIN `staff123`
Aluno seed: matrícula `20260001` / PIN `1234`

O evento seed usa coordenadas de exemplo (Praça da Sé, SP) — ajuste `geofenceLat`/`geofenceLng` no `prisma/seed.ts` ou crie um evento pelo painel staff (`/admin/events`) com as coordenadas reais do evento.

## Importar alunos em massa

```bash
npm run import:students --workspace apps/api -- caminho/para/alunos.csv
```

CSV com cabeçalho `registrationNumber,name`. O PIN padrão de cada aluno é os últimos 4 dígitos da matrícula.

## Testes

```bash
npm run test --workspace apps/api
```

## Deploy (GitHub Pages + Render + Supabase)

O frontend (`apps/web`) é publicado como site estático no GitHub Pages; a API (`apps/api`) roda no Render; o Postgres é o do Supabase. Ver a explicação completa do mecanismo, em português, em [`docs/arquitetura-github-pages-supabase.org`](docs/arquitetura-github-pages-supabase.org) — inclui o checklist de setup.

Resumo rápido:

```bash
# 1. DATABASE_URL (Supabase, connection pooling, porta 6543) no .env local e no painel do Render
# 2. Criar o serviço no Render a partir de render.yaml (New -> Blueprint)
# 3. Configurar a variável de repositório API_URL (GitHub Actions) com a URL pública do serviço no Render
# 4. Settings -> Pages -> Source: GitHub Actions
# 5. git push origin main
```

## Fora do escopo desta primeira versão

Leitura de código via QR (o código é digitado, mais simples e robusto), selfie/auditoria fotográfica, login via SMS/OTP ou SSO, notificações push.
