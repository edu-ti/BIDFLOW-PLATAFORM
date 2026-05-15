# ADR-004: Motor de Workflows (Workflow Engine)

**Status:** Aceito
**Data:** 2026-05-15
**Autor:** Architecture Board
**Contexto:** Necessidade de workflows configuráveis por tenant.
**Decisão:** Workflow Engine genérico como bounded context separado, com definições versionadas e integrado via eventos.
**Consequências:** Customização sem código, DAG validation, approval ANY/ALL/SEQUENTIAL.
