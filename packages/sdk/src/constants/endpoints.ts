// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/sdk — API Endpoint Constants
// ═══════════════════════════════════════════════════════════════════════════

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const Endpoints = {
  // ── Auth ──
  LOGIN:              `${API_PREFIX}/auth/login` as const,
  REFRESH_TOKEN:      `${API_PREFIX}/auth/refresh` as const,
  LOGOUT:             `${API_PREFIX}/auth/logout` as const,
  ME:                 `${API_PREFIX}/auth/me` as const,

  // ── CRM ──
  LEADS:              `${API_PREFIX}/crm/leads` as const,
  LEAD_BY_ID:         (id: string) => `${API_PREFIX}/crm/leads/${id}` as const,
  CUSTOMERS:          `${API_PREFIX}/crm/customers` as const,
  OPPORTUNITIES:      `${API_PREFIX}/crm/opportunities` as const,
  PIPELINES:          `${API_PREFIX}/crm/pipelines` as const,

  // ── Workflow ──
  WORKFLOW_DEFINITIONS:     `${API_PREFIX}/workflow/definitions` as const,
  WORKFLOW_DEFINITION_BY_ID: (id: string) => `${API_PREFIX}/workflow/definitions/${id}` as const,
  WORKFLOW_INSTANCES:       `${API_PREFIX}/workflow/instances` as const,
  WORKFLOW_INSTANCE_BY_ID:  (id: string) => `${API_PREFIX}/workflow/instances/${id}` as const,
  WORKFLOW_TIMELINE:        (id: string) => `${API_PREFIX}/workflow/instances/${id}/timeline` as const,
  WORKFLOW_APPROVALS:       (id: string) => `${API_PREFIX}/workflow/instances/${id}/approvals` as const,
  WORKFLOW_DASHBOARD_SUMMARY: `${API_PREFIX}/workflow/dashboard/summary` as const,

  // ── Tender ──
  TENDERS:            `${API_PREFIX}/tenders` as const,
  TENDER_BY_ID:       (id: string) => `${API_PREFIX}/tenders/${id}` as const,
  TENDER_DOCUMENTS:   (id: string) => `${API_PREFIX}/tenders/${id}/documents` as const,
  TENDER_PROPOSALS:   (id: string) => `${API_PREFIX}/tenders/${id}/proposals` as const,
  TENDER_DISPUTE:     (id: string) => `${API_PREFIX}/tenders/${id}/dispute` as const,
  TENDER_TIMELINE:    (id: string) => `${API_PREFIX}/tenders/${id}/timeline` as const,

  // ── Tenant ──
  TENANTS:            `${API_PREFIX}/tenants` as const,
  PLANS:              `${API_PREFIX}/plans` as const,
} as const;

export type EndpointKey = keyof typeof Endpoints;
