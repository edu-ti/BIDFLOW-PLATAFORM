// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Shared Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

// ── General API Types ──
export type ApiVersion = 'v1';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type SortDirection = 'asc' | 'desc';

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
  errors?: Array<{ field: string; constraints: Record<string, string> }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

export interface BatchOperationResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ index: number; error: string; item?: unknown }>;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export interface SortParams {
  sort?: string;
  order?: SortDirection;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams extends PaginationParams, SortParams {
  search?: string;
}

// ── Multi-tenant Types ──
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

// ── Auth Types ──
export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  jti: string;
  iat: number;
  exp: number;
  sessionId: string;
  mfaVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

// ── Identifiers ──
export type TenderId = string;
export type LeadId = string;
export type CustomerId = string;
export type OpportunityId = string;
export type WorkflowId = string;
export type WorkflowInstanceId = string;
export type UserId = string;
export type TenantId = string;
export type StageId = string;

// ── Enums (shared) ──
export type TenderStatus =
  | 'CAPTURED' | 'ANALYZING' | 'VIABILITY_ANALYSIS' | 'DOCUMENTATION'
  | 'APPROVAL' | 'PROPOSAL' | 'SUBMITTED' | 'DISPUTE'
  | 'RESULT_AWAITED' | 'WON' | 'LOST' | 'APPEAL'
  | 'CONTRACTED' | 'CANCELLED' | 'ARCHIVED';

export type TenderModality =
  | 'PREGAO_ELETRONICO' | 'PREGAO_PRESENCIAL' | 'CONCORRENCIA'
  | 'TOMADA_PRECOS' | 'CONVITE' | 'CONCURSO' | 'LEILAO' | 'RDC';

export type WorkflowInstanceStatus =
  | 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'ARCHIVED';

export type ApprovalStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'EXPIRED';

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'DISQUALIFIED' | 'ARCHIVED';
