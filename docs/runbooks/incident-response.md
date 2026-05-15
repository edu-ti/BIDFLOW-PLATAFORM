# Runbook: Incident Response — BidFlow Platform

> **Propósito:** Procedimentos para resposta a incidentes de segurança, performance e disponibilidade.
> **Responsável:** Time de plantão (on-call)
> **SLA:** P1 < 15 min resposta | P2 < 1h | P3 < 24h

---

## 1. Severidades

| Severidade | Definição | Exemplos | Resposta | SLA |
|-----------|-----------|----------|----------|-----|
| **P1 — Crítico** | Sistema fora do ar ou dados em risco | Downtime total, vazamento de dados, perda de dados | Imediata | 15 min |
| **P2 — Alto** | Funcionalidade crítica afetada | Login quebrado, proposta não submete | Urgente | 1h |
| **P3 — Médio** | Funcionalidade não-crítica afetada | Dashboard lento, relatório falha | Normal | 24h |
| **P4 — Baixo** | Bug cosmético ou melhoria | CSS quebrado, texto errado | Planejado | Próximo sprint |

## 2. Classificação de Incidentes

| Tipo | Exemplo | Ação inicial |
|------|---------|-------------|
| **Disponibilidade** | API retornando 500 | Health check + logs |
| **Performance** | p95 > 3s | Métricas + tracing |
| **Segurança** | Tentativa de acesso não autorizado | Isolar + auditoria |
| **Dados** | Corrupção ou perda | Backup recovery |
| **Integração** | RabbitMQ/REDIS fora | Verificar conectividade |

## 3. Fluxo de Resposta

```
1. DETECTAR
   ├── Alerta PagerDuty / Slack
   ├── Usuário reporta
   └── Monitoramento (Grafana)

2. TRIAGEM (5 min)
   ├── Verificar severidade
   ├── Identificar componente afetado
   └── Comunicar no canal #incidentes

3. MITIGAÇÃO (15 min)
   ├── Rollback se deploy recente
   ├── Feature flag se disponível
   └── Isolar tráfego se necessário

4. RESOLUÇÃO
   ├── Aplicar fix
   ├── Verificar health check
   └── Confirmar com usuário

5. PÓS-INCIDENTE
   ├── Post-mortem em 24h
   ├── ADR se mudança arquitetural
   └── Atualizar runbook
```

## 4. Comandos de Diagnóstico Rápido

```bash
# Health check
curl -f http://localhost:3001/health
curl -f http://localhost:3002/health

# Logs recentes
docker compose logs api --tail=100 --since=5m
docker compose logs web --tail=100 --since=5m

# Conexões ativas no banco
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# Filas RabbitMQ
rabbitmqadmin list queues name messages message_stats.ack_details.rate

# Cache Redis
redis-cli info | grep used_memory_human
redis-cli info | grep connected_clients

# Métricas de erro
curl http://localhost:3001/metrics | grep error_total
```

## 5. Canais de Comunicação

| Canal | Uso |
|-------|-----|
| `#incidentes` (Slack) | Coordenação do incidente |
| `#alerts` (Slack) | Alertas automáticos |
| PagerDuty | On-call rotation |
| Email | Comunicação com usuários |
| Status page | Status público do sistema |

## 6. Template de Post-mortem

```markdown
# Post-mortem: [TÍTULO]

**Data:** YYYY-MM-DD
**Severidade:** P1/P2/P3
**Duração:** XX min
**Impacto:** [usuários afetados, funcionalidades]

## Sumário
[Descrição do incidente em 2-3 frases]

## Timeline
- HH:MM — Alerta disparado
- HH:MM — Triagem iniciada
- HH:MM — Causa identificada
- HH:MM — Mitigação aplicada
- HH:MM — Sistema恢复正常

## Causa Raiz
[Causa técnica detalhada]

## Ações Corretivas
- [ ] Ação 1 (responsável, prazo)
- [ ] Ação 2 (responsável, prazo)

## Lições Aprendidas
[O que pode ser melhorado]
```
