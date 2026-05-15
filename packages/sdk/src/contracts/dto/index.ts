// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Domain DTOs
// ═══════════════════════════════════════════════════════════════════════════

import {
  TenderStatus, TenderModality, WorkflowInstanceStatus, ApprovalStatus, LeadStatus,
} from '../types';

// ── Auth DTOs ──
export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// ── Tender DTOs ──
export interface TenderResponse {
  id: string;
  number: string;
  organization: string;
  modality: TenderModality;
  status: TenderStatus;
  title: string;
  estimatedValue: number | null;
  openingDate: string;
  closingDate: string;
  assignedTo: string | null;
  createdAt: string;
}

export interface TenderDetailResponse extends TenderResponse {
  description: string | null;
  uf: string | null;
  city: string | null;
  disputeDate: string | null;
  workflowInstanceId: string | null;
  items: TenderItemResponse[];
  documents: TenderDocumentResponse[];
  checklist: TenderChecklistResponse[];
  timeline: TimelineEntryResponse[];
}

export interface TenderItemResponse {
  id: string;
  number: number;
  description: string;
  quantity: number;
  unit: string;
  estimatedValue: number | null;
}

export interface TenderDocumentResponse {
  id: string;
  category: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  status: string;
}

export interface TenderChecklistResponse {
  id: string;
  category: string;
  title: string;
  status: string;
  isMandatory: boolean;
  assignedTo: string | null;
}

export interface TimelineEntryResponse {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
  createdBy: string | null;
}

// ── Workflow DTOs ──
export interface WorkflowDefinitionResponse {
  id: string;
  name: string;
  slug: string;
  entityType: string;
  version: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface WorkflowInstanceResponse {
  id: string;
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  title: string;
  status: WorkflowInstanceStatus;
  currentStage: string;
  enteredStageAt: string;
  deadlineAt: string | null;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
}

export interface ApprovalResponse {
  id: string;
  status: ApprovalStatus;
  approvalMode: string;
  assignedTo: string;
  decision: string | null;
  comment: string | null;
  createdAt: string;
}

// ── CRM DTOs ──
export interface LeadResponse {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: LeadStatus;
  score: number;
  source: string;
  assignedTo: string | null;
  createdAt: string;
}

export interface CustomerResponse {
  id: string;
  legalName: string;
  taxId: string;
  email: string;
  segment: string;
  tier: string;
  status: string;
  totalRevenue: number;
}

export interface OpportunityResponse {
  id: string;
  title: string;
  status: string;
  stage: string;
  estimatedValue: number;
  probability: number;
  expectedCloseDate: string | null;
  assignedTo: string | null;
}

export interface DashboardSummary {
  totalActive: number;
  totalCompleted: number;
  totalOverdue: number;
  pendingApprovals: number;
  pendingTasks: number;
}
