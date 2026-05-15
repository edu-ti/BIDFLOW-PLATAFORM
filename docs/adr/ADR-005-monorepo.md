# ADR-005: Estrutura Monorepo

**Status:** Aceito
**Data:** 2026-05-15
**Autor:** Architecture Board
**Contexto:** Definir estrutura do repositório para múltiplos contextos.
**Decisão:** Turborepo com workspaces npm, apps/ (NestJS + Next.js + FastAPI) e packages/ (config + types + ui).
**Consequências:** Cache distribuído, paralelismo, dependências explícitas.
