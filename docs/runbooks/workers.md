# Runbook: Workers — BidFlow Platform

> **Propósito:** Gerenciamento de workers assíncronos, filas e event consumers.
> **Responsável:** DevOps / Backend
> **Stack:** RabbitMQ + NestJS Microservices

---

## 1. Workers Atuais

| Worker | Queue | Função | Consumidores | Prioridade |
|--------|-------|--------|-------------|------------|
| **AutoTransitionConsumer** | `bidflow.workflow.auto-transition` | Executa transições automáticas por evento externo | 2 | Alta |
| **EntityWorkflowConsumer** | `bidflow.workflow.entity-created` | Cria instância de workflow ao criar entidade | 1 | Alta |
| **NotificationWorker** | `bidflow.notifications.send` | Envia notificações (email, push, SMS) | 3 | Média |
| **DeadlineScheduler** | (scheduler cron) | Verifica deadlines vencidos a cada 5 min | 1 | Alta |
| **ApprovalReminderScheduler** | (scheduler cron) | Envia lembretes de aprovação a cada 1h | 1 | Média |

## 2. Filas RabbitMQ

```bash
# Listar todas as filas
rabbitmqadmin list queues name messages consumers state

# Verificar mensagens não processadas
rabbitmqadmin list queues name messages_ready messages_unacknowledged

# Purge de fila (emergência)
rabbitmqadmin purge queue name=bidflow.notifications.send

# Mover da DLQ para fila original (replay)
rabbitmqadmin get queue=dlq.workflow.all requeue=true count=10
```

## 3. Health dos Workers

```bash
# Verificar consumers ativos
rabbitmqadmin list consumers queue channel_details.node

# Verificar taxa de processamento
rabbitmqadmin list queues name message_stats.ack_details.rate

# Verificar workers na aplicação
curl http://localhost:3001/health | jq '.rabbitmq'
```

## 4. Escalonamento de Workers

```yaml
# Configuração de workers no docker-compose
workers:
  image: bidflow-api
  command: "node dist/workers/auto-transition.js"
  deploy:
    replicas: 2
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
```

## 5. Troubleshooting de Workers

| Problema | Causa | Solução |
|----------|-------|---------|
| Mensagens acumulando | Worker lento ou crashado | Aumentar replicas |
| Mensagens em DLQ | Erro no processamento | Verificar logs, reprocessar |
| Worker não consome | Conexão perdida | Restart do worker |
| Duplicação de mensagens | Falta de idempotência | Verificar IdempotencyService |

## 6. Schedulers (Agendados)

| Scheduler | Cron | Função |
|-----------|------|--------|
| DeadlineChecker | `*/5 * * * *` | Instâncias com deadline vencido |
| ApprovalReminder | `0 * * * *` | Lembretes de aprovação pendente |
| Backup | `0 0 * * *` | Backup full do banco |
| TenantCleanup | `0 3 * * 0` | Limpeza de tenants cancelados |

## 7. Workers Futuros

| Worker | Queue | Previsão |
|--------|-------|----------|
| **TenderAutoCapture** | `bidflow.tender.capture` | Captura automática de editais |
| **FraudAnalyzer** | `bidflow.tender.fraud-analysis` | Análise de fraude em lances |
| **ReportGenerator** | `bidflow.reports.generate` | Geração de relatórios periódicos |
| **DocumentOcr** | `bidflow.document.ocr` | OCR de documentos digitalizados |
