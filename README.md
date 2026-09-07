# Chamada Online

PWA para registro de presença em eventos escolares (~2000 alunos), com defesas em camada contra um aluno marcar presença por outro:

1. **Geofence** — check-in precisa vir de coordenadas GPS dentro de um raio configurável do evento.
2. **Código rotativo** — a equipe projeta um código de 5 caracteres que muda a cada 45s; o aluno precisa digitá-lo para confirmar presença. É a principal defesa contra alguém marcar presença remotamente por um colega ausente.
3. **Vínculo de dispositivo** — o app gera um ID persistente no navegador no primeiro login. Se um dispositivo já vinculado a um aluno tentar marcar presença como outro aluno, o check-in é sinalizado (não bloqueado) para revisão da equipe.

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

## Fora do escopo desta primeira versão

Leitura de código via QR (o código é digitado, mais simples e robusto), selfie/auditoria fotográfica, login via SMS/OTP ou SSO, configuração de deploy em produção, notificações push.
