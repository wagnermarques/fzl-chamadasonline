# Memória de Funcionalidades (Features Memory): Chamada Online

> **Data de atualização**: 12/10/2026  
> **Diretório**: `gemini-cli/`  
> **Finalidade**: Catálogo persistente do estado de cada feature, regras de negócio e procedimentos operacionais.

---

## 1. Catálogo de Funcionalidades

### 1.1. Autenticação e Gestão de Identidade
- **Status**: Concluído e Testado.
- **Modos de Operação**:
  - **Local / Fallback**: Login com Matrícula (Aluno) ou Email (Staff) + PIN armazenado com hash `bcrypt`.
  - **Keycloak SSO / OIDC**: Suporte a fluxo com PKCE, validação criptográfica do token contra o endpoint JWKS do Realm, e auto-provisionamento de conta no primeiro acesso (com proteção contra concorrência e `P2002` do Prisma).
- **Mapeamento de Permissões**:
  - `STUDENT`: Registro de presença (`/`), vinculação do próprio aparelho (`/vincular`).
  - `STAFF`: Painel de eventos (`/admin/events`), projeção de código (`/admin/events/:id/periods/:id/display`), auditoria de presenças (`/admin/events/:id/periods/:id/checkins`), moderação de presenças suspeitas (`/admin/events/:id/flagged`), e balcão de vinculação presencial (`/admin/enroll`). Também pode acessar a visão do aluno.

### 1.2. Mecanismo de Presença (Check-in)
- **Status**: Concluído e Funcional.
- **Fluxo do Aluno**:
  1. Acessa a rota raiz `/`.
  2. A aplicação detecta automaticamente o período e evento ativo via `/events/active`.
  3. O aluno informa o código de 5 caracteres projetado na tela.
  4. O navegador solicita permissão de geolocalização e extrai latitude/longitude.
  5. Envia requisição para `POST /checkins` contendo: `eventPeriodId`, `code`, `lat`, `lng`, `clientToken` e `fingerprintHash`.
- **Idempotência**: Check-in duplo no mesmo período retorna `status: ok` imediatamente sem duplicar registros no banco (`@@unique([studentId, eventPeriodId])`).

### 1.3. Defesa Antifraude: Código Dinâmico Rotativo
- **Status**: Concluído.
- **Ciclo de Vida**: 45 segundos por código.
- **Exibição**: Tela de projetor em `/admin/events/:eventId/periods/:periodId/display` com cronômetro regressivo e atualização automática.
- **Validação**: O backend aceita o código atual ou o código imediatamente anterior durante uma janela curta de tolerância para compensar latência de rede.

### 1.4. Defesa Antifraude: Geofencing (Circular e Polígono)
- **Status**: Concluído.
- **Modo Circular**: Centro em latitude/longitude e raio em metros (padrão 150m) via fórmula de Haversine.
- **Modo Poligonal**: Lista ordenada de coordenadas `[{lat, lng}, ...]` delimitando o terreno da escola, validado com o algoritmo Ray-Casting.
- **Comportamento Silencioso**: Check-ins fora da área retornam `status: ok` ao aluno para não alertar fraudadores, mas gravam a flag `outside_geofence`.

### 1.5. Defesa Antifraude: Vínculo de Dispositivo (Soft Binding)
- **Status**: Concluído.
- **Identificação**: Cada navegador gera um UUID persistente (`clientToken`).
- **Detecção de Reúso**: Se o mesmo aparelho tentar marcar presença para um segundo aluno, a presença do segundo é aceita, mas sinalizada com `device_bound_to_other_student`.

### 1.6. Defesa Antifraude: Vínculo Verificado em Secretaria (Hard Binding)
- **Status**: Concluído.
- **Fluxo de Atendimento**:
  1. No painel `/admin/enroll`, o staff pesquisa o aluno por RM via `GET /students/lookup`.
  2. O staff clica em "Gerar Código", invocando `POST /students/:id/enrollment-code` (código de 6 dígitos com TTL de 120s).
  3. O aluno digita o código em seu próprio celular em `/vincular`.
  4. O aparelho é gravado com `verified: true`.
  5. Uma vez verificado, tentativas de check-in vindas de qualquer outro dispositivo são bloqueadas com erro **HTTP 403 (`device_not_enrolled`)**.

### 1.7. Painel de Auditoria e Moderação (Staff)
- **Status**: Concluído.
- **Revisão de Suspeitos**: `/admin/events/:eventId/flagged` exibe presenças com bandeiras vermelhas e razões (`outside_geofence`, `device_bound_to_other_student`, etc.).
- **Decisão**: Staff pode aprovar ou rejeitar (`PATCH /checkins/:id/review`).

---

## 2. Dados de Teste e Credenciais Seed

Definidos em `apps/api/prisma/seed.ts`:

* **Usuário Staff**: `staff@escola.test` | PIN: `staff123`
* **Usuário Aluno**: Matrícula `20260001` | PIN: `1234`
* **Evento Inicial**: Praça da Sé, SP (utilizado para testes locais com coordenadas simuladas).

---

## 3. Importação em Massa de Alunos

Comando de importação via CSV:
```bash
npm run import:students --workspace apps/api -- caminho/para/alunos.csv
```
Formato esperado:
```csv
registrationNumber,name
20260002,Maria Silva
20260003,João Souza
```
*Regra de PIN padrão*: Últimos 4 dígitos da matrícula.

---

## 4. Comandos de Operação e Testes

* **Iniciar Banco de Dados Local**: `docker compose up -d db`
* **Instalar Dependências**: `npm install`
* **Executar Migrações**: `npm run prisma:migrate --workspace apps/api`
* **Popular Dados Iniciais**: `npm run seed --workspace apps/api`
* **Rodar API**: `npm run dev:api` (Porta 3333)
* **Rodar Web PWA**: `npm run dev:web` (Porta 5173 com proxy `/api` para a porta 3333)
* **Executar Suíte de Testes**: `npm run test --workspace apps/api`

---

## 5. Itens Fora de Escopo / Backlog Futuro

Conforme documentado no projeto, os seguintes itens não fazem parte da versão atual:
- Leitura de código via câmera/QR Code (o código é digitado para maior simplicidade e menor atrito).
- Auditoria fotográfica / selfie no check-in.
- Login via SMS / OTP.
- Notificações push via Web Push API.
