// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Event Type Constants
// ═══════════════════════════════════════════════════════════════════════════

export const EVENT_PREFIX = 'com.bidflow' as const;

export const EventTypes = {
  // ── Auth Events ──
  USER_LOGGED_IN:            `${EVENT_PREFIX}.saas.user.logged_in.v1`,
  USER_LOGGED_OUT:           `${EVENT_PREFIX}.saas.user.logged_out.v1`,
  PASSWORD_CHANGED:          `${EVENT_PREFIX}.saas.password.changed.v1`,

  // ── Tenant Events ──
  TENANT_REGISTERED:         `${EVENT_PREFIX}.saas.tenant.registered.v1`,
  TENANT_ACTIVATED:          `${EVENT_PREFIX}.saas.tenant.activated.v1`,
  TENANT_SUSPENDED:          `${EVENT_PREFIX}.saas.tenant.suspended.v1`,
  SUBSCRIPTION_CHANGED:      `${EVENT_PREFIX}.saas.subscription.changed.v1`,
  QUOTA_EXCEEDED:            `${EVENT_PREFIX}.saas.quota.exceeded.v1`,

  // ── CRM Events ──
  LEAD_CAPTURED:             `${EVENT_PREFIX}.crm.lead.captured.v1`,
  LEAD_QUALIFIED:            `${EVENT_PREFIX}.crm.lead.qualified.v1`,
  LEAD_CONVERTED:            `${EVENT_PREFIX}.crm.lead.converted.v1`,
  OPPORTUNITY_CREATED:       `${EVENT_PREFIX}.crm.opportunity.created.v1`,
  OPPORTUNITY_WON:           `${EVENT_PREFIX}.crm.opportunity.won.v1`,
  OPPORTUNITY_LOST:          `${EVENT_PREFIX}.crm.opportunity.lost.v1`,

  // ── Workflow Events ──
  WORKFLOW_STARTED:          `${EVENT_PREFIX}.workflow.instance.started.v1`,
  WORKFLOW_STAGE_CHANGED:    `${EVENT_PREFIX}.workflow.stage.changed.v1`,
  WORKFLOW_APPROVAL_REQUESTED: `${EVENT_PREFIX}.workflow.approval.requested.v1`,
  WORKFLOW_APPROVAL_GRANTED: `${EVENT_PREFIX}.workflow.approval.granted.v1`,
  WORKFLOW_APPROVAL_REJECTED: `${EVENT_PREFIX}.workflow.approval.rejected.v1`,
  WORKFLOW_TASK_ASSIGNED:    `${EVENT_PREFIX}.workflow.task.assigned.v1`,
  WORKFLOW_TASK_COMPLETED:   `${EVENT_PREFIX}.workflow.task.completed.v1`,
  WORKFLOW_COMPLETED:        `${EVENT_PREFIX}.workflow.instance.completed.v1`,
  WORKFLOW_CANCELLED:        `${EVENT_PREFIX}.workflow.instance.cancelled.v1`,

  // ── Tender (Licitações) Events ──
  TENDER_CAPTURED:           `${EVENT_PREFIX}.tender.captured.v1`,
  TENDER_ANALYSIS_COMPLETED: `${EVENT_PREFIX}.tender.analysis.completed.v1`,
  TENDER_PROPOSAL_SUBMITTED: `${EVENT_PREFIX}.tender.proposal.submitted.v1`,
  TENDER_DISPUTE_BID:        `${EVENT_PREFIX}.tender.dispute.bid.v1`,
  TENDER_DISPUTE_FINISHED:   `${EVENT_PREFIX}.tender.dispute.finished.v1`,
  TENDER_WON:                `${EVENT_PREFIX}.tender.won.v1`,
  TENDER_LOST:               `${EVENT_PREFIX}.tender.lost.v1`,

  // ── Bidding Events ──
  BID_PLACED:                `${EVENT_PREFIX}.bidding.bid.placed.v1`,
  AUCTION_STARTED:           `${EVENT_PREFIX}.bidding.auction.started.v1`,
  AUCTION_COMPLETED:         `${EVENT_PREFIX}.bidding.auction.completed.v1`,
  CONTRACT_AWARDED:          `${EVENT_PREFIX}.bidding.contract.awarded.v1`,

  // ── ERP Events ──
  SUPPLIER_QUALIFIED:        `${EVENT_PREFIX}.erp.supplier.qualified.v1`,
  INVOICE_APPROVED:          `${EVENT_PREFIX}.erp.invoice.approved.v1`,
  PAYMENT_PROCESSED:         `${EVENT_PREFIX}.erp.payment.processed.v1`,
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
