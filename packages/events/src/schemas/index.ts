import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// Event Schema Versions
// Cada schema é versionado. Breaking changes = nova versão.
// ═══════════════════════════════════════════════════════════════════════════

export const CloudEventSchema = z.object({
  specversion: z.literal('1.0'),
  id: z.string().uuid(),
  source: z.string(),
  type: z.string(),
  subject: z.string().optional(),
  time: z.string().datetime(),
  datacontenttype: z.literal('application/json'),
  dataschema: z.string().optional(),
  data: z.record(z.unknown()),
  tenantid: z.string().uuid(),
  userid: z.string().uuid().optional(),
  correlationid: z.string().uuid().optional(),
  causationid: z.string().uuid().optional(),
});

// ── Tenant ──
export const TenantRegisteredPayloadV1 = z.object({
  tenantId: z.string().uuid(),
  legalName: z.string().min(1).max(255),
  slug: z.string().min(3).max(63),
  planSlug: z.string(),
  adminEmail: z.string().email(),
  registeredAt: z.string().datetime(),
});

// ── CRM ──
export const LeadCapturedPayloadV1 = z.object({
  leadId: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  company: z.string().optional(),
  source: z.enum(['WEBSITE', 'LANDING_PAGE', 'REFERRAL', 'IMPORT', 'API', 'MANUAL']),
  score: z.number().int().min(0).max(100).default(0),
  capturedAt: z.string().datetime(),
});

export const OpportunityWonPayloadV1 = z.object({
  opportunityId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string(),
  wonValue: z.number().positive(),
  products: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
  })).optional(),
  closeDate: z.string().datetime(),
});

// ── Workflow ──
export const WorkflowStartedPayloadV1 = z.object({
  instanceId: z.string().uuid(),
  workflowDefinitionId: z.string().uuid(),
  workflowSlug: z.string(),
  workflowVersion: z.number().int().positive(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  title: z.string().min(1).max(300),
  initialStage: z.string(),
  assignedTo: z.string().uuid().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  startedBy: z.string().uuid(),
});

export const StageChangedPayloadV1 = z.object({
  instanceId: z.string().uuid(),
  fromStage: z.string(),
  fromStageName: z.string(),
  toStage: z.string(),
  toStageName: z.string(),
  transitionSlug: z.string(),
  executedBy: z.string().uuid(),
  isAutomatic: z.boolean(),
  comment: z.string().nullable(),
});

export const ApprovalGrantedPayloadV1 = z.object({
  approvalId: z.string().uuid(),
  workflowInstanceId: z.string().uuid(),
  decidedBy: z.string().uuid(),
  comment: z.string().nullable(),
  remainingApprovals: z.number().int().min(0),
});

export const WorkflowCompletedPayloadV1 = z.object({
  instanceId: z.string().uuid(),
  workflowSlug: z.string(),
  workflowVersion: z.number().int().positive(),
  entityType: z.string(),
  entityId: z.string(),
  title: z.string(),
  finalStage: z.string(),
  totalTransitions: z.number().int().min(0),
  totalElapsedMs: z.number().int().min(0),
  completedBy: z.string().uuid(),
  result: z.enum(['COMPLETED', 'REJECTED', 'CANCELLED']),
});

// ── Tender ──
export const TenderCapturedPayloadV1 = z.object({
  tenderId: z.string().uuid(),
  number: z.string(),
  organization: z.string(),
  modality: z.string(),
  estimatedValue: z.number().nullable(),
  openingDate: z.string().datetime(),
  closingDate: z.string().datetime(),
});

export const TenderWonPayloadV1 = z.object({
  tenderId: z.string().uuid(),
  winnerValue: z.number().positive(),
  classification: z.number().int().positive(),
  contractValue: z.number().optional(),
});
