# ADR-003: Arquitetura Event-Driven

**Status:** Aceito
**Data:** 2026-05-15
**Autor:** Architecture Board
**Contexto:** Definir mecanismo de comunicação entre bounded contexts.
**Decisão:** RabbitMQ + CloudEvents 1.0 + Domain Events + Outbox Pattern.
**Consequências:** Acoplamento zero, consistência eventual, idempotência.
