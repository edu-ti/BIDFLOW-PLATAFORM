// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Payload type definitions
// ═══════════════════════════════════════════════════════════════════════════

// ── Tenant ──
export interface TenantRegisteredPayload {
  tenantId: string;
  legalName: string;
  slug: string;
  planSlug: string;
  adminEmail: string;
  registeredAt: string;
}

// ── CRM ──
export interface LeadCapturedPayload {
  leadId: string;
  name: string;
  email: string;
  company?: string;
  source: 'WEBSITE' | 'LANDING_PAGE' | 'REFERRAL' | 'IMPORT' | 'API' | 'MANUAL';
  score: number;
  capturedAt: string;
}

export interface LeadConvertedPayload {
  leadId: string;
  customerId: string;
  customerName: string;
  taxId: string;
  tier: string;
  convertedAt: string;
}

export interface OpportunityWonPayload {
  opportunityId: string;
  customerId: string;
  customerName: string;
  wonValue: number;
  products?: Array<{ name: string; quantity: number }>;
  closeDate: string;
}

// ── Workflow ──
export interface WorkflowStartedPayload {
  instanceId: string;
  workflowDefinitionId: string;
  workflowSlug: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  title: string;
  initialStage: string;
  assignedTo: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startedBy: string;
}

export interface StageChangedPayload {
  instanceId: string;
  fromStage: string;
  fromStageName: string;
  toStage: string;
  toStageName: string;
  transitionSlug: string;
  executedBy: string;
  isAutomatic: boolean;
  comment: string | null;
}

export interface ApprovalGrantedPayload {
  approvalId: string;
  workflowInstanceId: string;
  decidedBy: string;
  comment: string | null;
  remainingApprovals: number;
}

export interface ApprovalRejectedPayload {
  approvalId: string;
  workflowInstanceId: string;
  decidedBy: string;
  comment: string;
}

export interface TaskAssignedPayload {
  taskId: string;
  workflowInstanceId: string;
  title: string;
  taskType: string;
  assignedTo: string;
  assignedBy: string;
  isMandatory: boolean;
  dueDate: string | null;
}

export interface WorkflowCompletedPayload {
  instanceId: string;
  workflowSlug: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  title: string;
  finalStage: string;
  totalTransitions: number;
  totalElapsedMs: number;
  completedBy: string;
  result: 'COMPLETED' | 'REJECTED' | 'CANCELLED';
}

// ── Tender ──
export interface TenderCapturedPayload {
  tenderId: string;
  number: string;
  organization: string;
  modality: string;
  estimatedValue: number | null;
  openingDate: string;
  closingDate: string;
}

export interface TenderProposalSubmittedPayload {
  tenderId: string;
  proposalId: string;
  totalValue: number;
  version: number;
}

export interface TenderDisputeBidPayload {
  disputeId: string;
  supplierId: string;
  amount: number;
  round: number;
  isAutomatic: boolean;
}

export interface TenderWonPayload {
  tenderId: string;
  winnerValue: number;
  classification: number;
  contractValue?: number;
}

export interface TenderLostPayload {
  tenderId: string;
  classification: number;
  winnerName: string;
  winnerValue: number;
  observations?: string;
}
