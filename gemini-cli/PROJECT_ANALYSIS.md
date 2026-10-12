# Análise Técnica do Projeto: Chamada Online (`fzl-chamadasonline`)

> **Data de geração**: 12/10/2026  
> **Escopo**: Análise arquitetural, modelo de dados, proteções antifraude, fluxos de autenticação e topologia de deploy.

---

## 1. Visão Geral e Propósito

O **Chamada Online** é uma aplicação PWA (*Progressive Web App*) de alta densidade projetada para registro e controle de presença em tempo real para eventos acadêmicos, assembleias e instituições de ensino com grande volume de participantes (escala planejada: ~2.000 alunos simultâneos).

O principal desafio resolvido pela arquitetura é o **combate à fraude em presença digital**, eliminando filas físicas e assinaturas manuais sem permitir que alunos presentes registrem presença para colegas ausentes ou que alunos ausentes enviem presenças forjadas remotamente.

---

## 2. Pilha Tecnológica (Tech Stack)

A aplicação é organizada como um monorepo com suporte a workspaces (`apps/*`, `packages/*`):

| Camada | Tecnologia | Descrição & Justificativa |
| :--- | :--- | :--- |
| **Monorepo** | NPM Workspaces | Compartilhamento tipado entre frontend, backend e schemas. |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS | PWA ultraleve distribuído via CDN estática (GitHub Pages). |
| **Backend API** | Fastify, TypeScript, `@fastify/jwt`, `@fastify/cors`, `@fastify/rate-limit` | Servidor HTTP assíncrono de altíssimo throughput e baixo footprint. |
| **ORM / Banco** | Prisma ORM, PostgreSQL (Supabase) | Schema fortemente tipado com índices para consultas de concorrência. |
| **Validação** | Zod (compartilhado em `packages/shared`) | Contrato único de validação e inferência de tipos TS ponta-a-ponta. |
| **Autenticação** | JWT nativo + Keycloak OAuth2 / OIDC com PKCE | Dual auth: login escolar nativo (RM + PIN) ou SSO corporativo (Keycloak). |
| **Hospedagem** | GitHub Pages + Render + Supabase | Custo zero/baixo, infraestrutura desacoplada e escalável. |

---

## 3. Arquitetura de Defesa em Camadas (Anti-Fraude)

O sistema implementa **4 camadas defensivas sucessivas**:

```
[ Camada 1: Janela Temporal & Código Dinâmico ]
          └─> Código TOTP de 5 caracteres que rotaciona a cada 45 segundos no telão/projetor.
[ Camada 2: Geofencing Geográfico (GPS) ]
          └─> Validação de coordenadas (Círculo Haversine ou Polígono Ray-Casting dos limites da escola).
[ Camada 3: Vínculo Suave de Dispositivo (Detecção Heurística) ]
          └─> Token persistente no navegador + hash de fingerprint para identificar multi-login no mesmo aparelho.
[ Camada 4: Vínculo Verificado (Hard Check pela Secretaria) ]
          └─> Pareamento presencial na secretaria via código efêmero de 6 dígitos (TTL 120s); bloqueia check-in de qualquer outro aparelho.
```

### 3.1. Detalhamento dos Mecanismos

#### A. Código Rotativo de 45s (Anti-Presença Remota)
* **Localização**: `apps/api/src/lib/checkinCode.ts` e `apps/web/src/pages/admin/CodeDisplay.tsx`
* **Funcionamento**: A equipe do evento exibe em telão/projetor um código alfanumérico gerado pelo backend que expira a cada 45 segundos.
* **Prevenção**: Impede que alunos fora do local de aula recebam o código a tempo por mensageiros (WhatsApp/Telegram), já que o tempo de repasse e digitação expira rapidamente.

#### B. Geofencing Circular e Poligonal (Anti-GPS Spoofing / Proximidade)
* **Localização**: `apps/api/src/lib/geofence.ts`
* **Algoritmos Implementados**:
  1. **Haversine Distance**: Cálculo de distância geodésica em metros para áreas circulares (`radiusMeters`, padrão 150m).
  2. **Ray-Casting Point-in-Polygon**: Teste vetorial de intersecção de raios para verificar se a coordenada está dentro de um polígono irregular formado pelas divisas físicas do campus escolar.
* **Comportamento**: Se o aluno estiver fora da área, o check-in é aceito silenciosamente para o aluno, porém marcado com a flag `outside_geofence` para auditoria do staff.

#### C. Vínculo de Dispositivo e Fingerprint Heurístico
* **Localização**: `apps/api/src/lib/device.ts`
* **Mapeamento**: O PWA armazena um UUID persistente em `localStorage` (`clientToken`).
* **Sinalizações (Flags)**:
  * `device_bound_to_other_student`: Dispositivo já vinculado a um aluno tentando realizar check-in com a conta de outro aluno.
  * `similar_fingerprint_multiple_students`: Hash de características de hardware/navegador idêntico detectado em múltiplos alunos.

#### D. Vínculo Verificado por Staff (Secretaria Enrollment)
* **Localização**: `apps/api/src/routes/devices.ts` e `apps/web/src/pages/admin/Enroll.tsx`
* **Fluxo**:
  1. O aluno comparece pessoalmente à secretaria e apresenta seu documento/RM.
  2. O staff gera um código de 6 dígitos com validade de 2 minutos (`DeviceEnrollmentCode`).
  3. O aluno digita o código no seu aparelho em `/vincular`.
  4. O registro `Device` recebe `verified: true` exclusivo para aquele estudante.
  5. A partir desse momento, **qualquer tentativa de check-in por outro dispositivo é rejeitada imediatamente com HTTP 403 (`device_not_enrolled`)**.

---

## 4. Modelo de Dados (Prisma Schema)

* **`User`**: Usuários do sistema (`Role`: `STUDENT` ou `STAFF`). Suporta autenticação direta por `pinHash` ou auto-provisionamento delegado via Keycloak.
* **`Event`**: Evento acadêmico com definição de data, coordenadas de geofence (`geofenceLat`, `geofenceLng`, `geofenceRadiusMeters`) e polígono opcional em JSON (`geofencePolygon`).
* **`EventPeriod`**: Períodos/aulas dentro do evento (ex.: Manhã, Tarde, Período 1).
* **`CheckinCode`**: Códigos efêmeros emitidos para cada período com timestamp de expiração.
* **`Device`**: Registro de aparelho identificado por `clientToken`, com `fingerprintHash`, status de verificação (`verified`) e staff responsável (`verifiedByStaffId`).
* **`DeviceEnrollmentCode`**: Códigos temporários de autorização gerados pelo staff para vinculação de aparelho.
* **`Checkin`**: Registro individual de presença, com auditoria de coordenadas (`lat`, `lng`, `distanceMeters`), flags antifraude (`flagged`, `flagReasons`) e parecer de revisão do staff (`reviewed`, `reviewDecision`).

---

## 5. Endpoints da API

### Autenticação & Dispositivos
* `POST /auth/login` — Autenticação por RM/email + PIN e registro do `clientToken`.
* `POST /auth/keycloak` — Troca de token JWT Keycloak OIDC (validação de JWKS, papéis `chamadas-student` / `chamadas-staff`).
* `GET /auth/me` — Recupera os dados do usuário autenticado.
* `GET /students/lookup` *(Staff)* — Consulta status de aluno e histórico de vínculo de aparelho.
* `POST /students/:id/enrollment-code` *(Staff)* — Emite código temporário para vinculação.
* `POST /devices/enroll` *(Student)* — Consome código da secretaria e vincula o aparelho atual.

### Eventos & Presença
* `POST /events` *(Staff)* — Criação de evento com raio ou polígono geográfico.
* `POST /events/:id/periods` *(Staff)* — Criação de períodos horários.
* `GET /events/active` *(Student/Staff)* — Retorna o evento e período ativo no momento.
* `GET /events/:eventId/periods/:periodId/code` *(Staff)* — Consulta/rotaciona o código do telão.
* `GET /events/:eventId/periods/:periodId/checkins` *(Staff)* — Listagem em tempo real das presenças do período.
* `GET /events/:eventId/flagged` *(Staff)* — Fila de presenças suspeitas pendentes de auditoria.
* `PATCH /checkins/:id/review` *(Staff)* — Aprovação ou rejeição de presença sinalizada.
* `POST /checkins` *(Student)* — Envio de presença com código rotativo, GPS e identificador de dispositivo.

---

## 6. Topologia de Infraestrutura e CI/CD

```
  [ Aluno / Staff ]
         │
         ▼ (HTTPS)
 [ GitHub Pages CDN ] ──(PWA / Static Assets: React + Vite)
         │
         │ (API REST Calls)
         ▼
 [ Render Web Service ] ──(Fastify API / Node.js)
         │
         ├──▶ [ Keycloak IdP ] ──(Validação de JWT via JWKS)
         │
         └──▶ [ Supabase ] ─────(PostgreSQL com Connection Pooling na porta 6543)
```

* **Deploy Frontend**: GitHub Actions via `.github/workflows/deploy-pages.yml` compila `apps/web` e publica em `github-pages`.
* **Deploy Backend**: Render Blueprint via `render.yaml` executa migrações do Prisma e inicializa o servidor Fastify na porta configurada.
