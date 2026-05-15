# ADR-001: Estratégia Multi-tenant

**Status:** Aceito
**Data:** 2026-05-15
**Autor:** Architecture Board
**Contexto:** Definir estratégia de isolamento entre inquilinos.
**Decisão:** Schema-per-tenant com tabelas de controle globais no schema `public`.
**Consequências:** Isolamento total + migrações por schema + pool de conexões.
