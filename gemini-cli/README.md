# Gemini CLI Memory & Analysis - Chamada Online

Este diretório contém a documentação e memória analítica gerada para persistência de contexto em sessões do assistente Gemini CLI no projeto **Chamada Online** (`fzl-chamadasonline`).

## Arquivos Disponíveis

1. [**`PROJECT_ANALYSIS.md`**](file:///home/wgn/fzl-chamadasonline/gemini-cli/PROJECT_ANALYSIS.md)
   - Visão geral da arquitetura de software e monorepo (`apps/api`, `apps/web`, `packages/shared`).
   - Pilha tecnológica (React, Fastify, Prisma, Supabase, Keycloak, Tailwind).
   - Detalhamento das 4 camadas de segurança antifraude (Haversine & Ray-Casting Polygon Geofencing, TOTP 45s rotating codes, soft device binding, staff verified hard binding).
   - Mapeamento de endpoints da API e modelo relacional Prisma.
   - Topologia de deploy em produção (GitHub Pages, Render, Supabase).

2. [**`FEATURES_MEMORY.md`**](file:///home/wgn/fzl-chamadasonline/gemini-cli/FEATURES_MEMORY.md)
   - Catálogo de status e regras de negócio para cada funcionalidade.
   - Procedimentos de teste, seed data e credenciais padrão de desenvolvimento.
   - Instruções de importação em massa de estudantes.
   - Limites do escopo e roadmap futuro.

## Outras Referências no Repositório

- [README.md principal](file:///home/wgn/fzl-chamadasonline/README.md)
- [Documentação funcional completa (`docs/sistema-chamada-online.org`)](file:///home/wgn/fzl-chamadasonline/docs/sistema-chamada-online.org)
- [Guia de arquitetura de deploy (`docs/arquitetura-github-pages-supabase.org`)](file:///home/wgn/fzl-chamadasonline/docs/arquitetura-github-pages-supabase.org)
- [Plano de aula & segurança (`LOGIN_AND_PRESENCE_CHECKING_SECURELLY.org`)](file:///home/wgn/fzl-chamadasonline/LOGIN_AND_PRESENCE_CHECKING_SECURELLY.org)
