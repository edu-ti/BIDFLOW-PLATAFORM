# Integrações — BidFlow Platform

> **Propósito:** Mapear todas as integrações entre módulos internos e com sistemas externos.

---

## Matriz de Integração entre Bounded Contexts

```
                     ┌──────────────────────────────────────────────────────────┐
                     │                      CONSOMMER                          │
┌───────────────────├──────────┬──────────┬──────────┬──────────┬──────────────┤
│    PRODUTOR       │   Auth   │  Tenant  │   CRM    │ Workflow │ Tender (Lic) │
├───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤
│ Auth              │    —     │ Session  │   —      │    —     │     —        │
│ Tenant            │    —     │    —     │   —      │    —     │     —        │
│ CRM               │    —     │    —     │    —     │    —     │ Lead → Tender│
│ Workflow Engine   │    —     │    —     │    —     │    —     │ Stage → Status│
│ Tender (Licitações)│   —     │    —     │ Win/Loss │ Start WF │     —        │
└───────────────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
```

## Integrações por Evento

| Evento | Publisher | Consumer(s) | Tipo |
|--------|-----------|-------------|------|
| `TenantRegistered` | Tenant | Provisioning, Billing | Assíncrono |
| `LeadCaptured` | CRM | IA (scoring) | Assíncrono |
| `LeadConverted` | CRM | ERP, IA | Assíncrono |
| `OpportunityWon` | CRM | Bidding (criar RFP) | Assíncrono |
| `TenderCaptured` | Tender | Workflow Engine (start), CRM (opportunity) | Assíncrono |
| `TenderProposalSubmitted` | Tender | Workflow Engine (advance) | Assíncrono |
| `WorkflowStageChanged` | Workflow Engine | Tender (update status) | Assíncrono |
| `WorkflowCompleted` | Workflow Engine | Tender (finalize) | Assíncrono |
| `BidPlaced` | Bidding | IA (fraud detection) | Assíncrono + Stream |
| `FraudAlertRaised` | IA | Bidding (suspend) | Assíncrono |

## Integrações com Sistemas Externos

| Sistema | Tipo | Protocolo | Dados trafegados | Frequência |
|---------|------|-----------|-----------------|------------|
| **ComprasNet** | Captura | HTTP/Scraping | Editais, avisos | Diária |
| **DOU** | Captura | RSS/XML | Publicações | Diária |
| **Azure AD** | SSO | OIDC | Autenticação | Sob demanda |
| **Google SSO** | SSO | OIDC | Autenticação | Sob demanda |
| **Stripe** | Pagamento (futuro) | REST API | Assinaturas, faturas | Mensal |
| **MinIO/S3** | Storage | S3 API | Documentos | Sob demanda |

## Filas RabbitMQ

| Exchange | Tipo | Routing Key Pattern | Propósito |
|----------|------|---------------------|-----------|
| `bidflow.domain` | topic | `{tenantId}.{context}.{eventType}` | Eventos de domínio |
| `bidflow.dlx` | direct | `{tenantId}.{context}.{eventType}.retry` | Retry queue |
| `bidflow.dlq` | fanout | — | Dead letter queue |

## WebSocket

| Canal | Evento | Descrição |
|-------|--------|-----------|
| `dispute:{tenderId}` | `BidPlaced` | Lance na disputa eletrônica |
| `notification:{userId}` | `NotificationCreated` | Notificação push |
| `workflow:{instanceId}` | `StageChanged` | Transição de workflow |
