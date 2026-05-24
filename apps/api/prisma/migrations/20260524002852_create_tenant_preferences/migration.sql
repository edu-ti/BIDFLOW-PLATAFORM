-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'MANAGER');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISQUALIFIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'LANDING_PAGE', 'REFERRAL', 'IMPORT', 'API', 'SOCIAL_MEDIA', 'EVENT', 'INDICATION', 'MANUAL');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('PUBLIC', 'PRIVATE', 'GOVERNMENT', 'NGO', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "CustomerTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK_COMPLETED', 'SYSTEM', 'WHATSAPP', 'VIDEO_CALL', 'SITE_VISIT', 'PROPOSAL_SENT', 'CONTRACT_SIGNED');

-- CreateEnum
CREATE TYPE "TimelineEntryType" AS ENUM ('ACTIVITY', 'TASK_COMPLETED', 'STAGE_CHANGED', 'STATUS_CHANGED', 'OWNER_CHANGED', 'TIER_CHANGED', 'NOTE_ADDED', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'CALL_LOGGED', 'MEETING_LOGGED', 'PROPOSAL_SENT', 'CONTRACT_SIGNED', 'SYSTEM_EVENT', 'SCORE_CHANGED', 'LEAD_CONVERTED', 'OPPORTUNITY_WON', 'OPPORTUNITY_LOST');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('INITIAL', 'STANDARD', 'APPROVAL', 'REVIEW', 'FINISH', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InstancePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('ANY', 'ALL', 'SEQUENTIAL');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'DELEGATED', 'COMPLETED', 'REVOKED');

-- CreateEnum
CREATE TYPE "WorkflowTaskType" AS ENUM ('ACTION', 'UPLOAD', 'FORM', 'VALIDATION', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "WorkflowTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowTimelineEventType" AS ENUM ('INSTANCE_CREATED', 'STAGE_ENTERED', 'STAGE_EXITED', 'TRANSITION_EXECUTED', 'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED', 'TASK_CREATED', 'TASK_COMPLETED', 'ASSIGNED', 'REASSIGNED', 'DELEGATED', 'COMMENT_ADDED', 'DEADLINE_UPDATED', 'PRIORITY_CHANGED', 'AUTO_TRANSITIONED', 'INSTANCE_COMPLETED', 'INSTANCE_CANCELLED', 'SYSTEM_EVENT');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('CAPTURED', 'ANALYZING', 'VIABILITY_ANALYSIS', 'DOCUMENTATION', 'APPROVAL', 'PROPOSAL', 'SUBMITTED', 'DISPUTE', 'RESULT_AWAITED', 'WON', 'LOST', 'APPEAL', 'CONTRACTED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TenderModality" AS ENUM ('PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_PRECOS', 'CONVITE', 'CONCURSO', 'LEILAO', 'RDC');

-- CreateEnum
CREATE TYPE "TenderDocumentCategory" AS ENUM ('HABILITACAO', 'TECNICA', 'COMERCIAL', 'ADMINISTRATIVO', 'OUTROS');

-- CreateEnum
CREATE TYPE "TenderDocumentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TenderAnalysisType" AS ENUM ('TECHNICAL', 'FINANCIAL', 'LEGAL', 'VIABILITY');

-- CreateEnum
CREATE TYPE "TenderAnalysisStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderCompetitionLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TenderRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TenderAnalysisRecommendation" AS ENUM ('GO', 'NO_GO', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "TenderChecklistCategory" AS ENUM ('DOCUMENTATION', 'TECHNICAL', 'FINANCIAL', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TenderChecklistStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TenderDisputeStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CLOSED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderResultStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'DISQUALIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderParticipationStatus" AS ENUM ('REGISTERED', 'INTERESTED', 'SUBMITTED', 'DISQUALIFIED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TenderDeadlineType" AS ENUM ('CLARIFICATION', 'IMPUGNATION', 'PROPOSAL_SUBMISSION', 'DISPUTE', 'APPEAL', 'CONTRACT_SIGNING', 'OTHER');

-- CreateEnum
CREATE TYPE "TenderDeadlineStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderTimelineEntryType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'DOCUMENT_ADDED', 'DOCUMENT_VALIDATED', 'DOCUMENT_REJECTED', 'ANALYSIS_COMPLETED', 'PROPOSAL_SUBMITTED', 'DISPUTE_STARTED', 'DISPUTE_CLOSED', 'BID_PLACED', 'RESULT_ANNOUNCED', 'CONTRACT_SIGNED', 'SYSTEM', 'NOTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "start_price" DECIMAL(10,2) NOT NULL,
    "current_price" DECIMAL(10,2) NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "mobile" VARCHAR(30),
    "company" VARCHAR(255),
    "position" VARCHAR(100),
    "department" VARCHAR(100),
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
    "score" INTEGER NOT NULL DEFAULT 0,
    "score_criteria" JSONB,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "last_contacted_at" TIMESTAMP(3),
    "last_contacted_by" TEXT,
    "converted_to_customer_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "converted_by" TEXT,
    "disqualification_reason" VARCHAR(500),
    "tags" JSONB DEFAULT '[]',
    "custom_fields" JSONB DEFAULT '{}',
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "legal_name" VARCHAR(255) NOT NULL,
    "fantasy_name" VARCHAR(255),
    "tax_id" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "website" VARCHAR(500),
    "address" JSONB,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "segment" "CustomerSegment" NOT NULL DEFAULT 'PRIVATE',
    "tier" "CustomerTier" NOT NULL DEFAULT 'BRONZE',
    "tier_changed_at" TIMESTAMP(3),
    "lead_id" TEXT,
    "assigned_to" TEXT,
    "contacts" JSONB DEFAULT '[]',
    "tags" JSONB DEFAULT '[]',
    "custom_fields" JSONB DEFAULT '{}',
    "notes" TEXT,
    "last_activity_at" TIMESTAMP(3),
    "last_activity_type" VARCHAR(50),
    "total_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "won_opportunities" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stages" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "customer_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "stage" VARCHAR(50) NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "previous_stage" VARCHAR(50),
    "estimated_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "probability" INTEGER NOT NULL DEFAULT 10,
    "expected_close_date" TIMESTAMP(3),
    "actual_close_date" TIMESTAMP(3),
    "won_value" DECIMAL(14,2),
    "lost_reason" VARCHAR(500),
    "lost_details" TEXT,
    "lost_to" VARCHAR(255),
    "assigned_to" TEXT,
    "products" JSONB DEFAULT '[]',
    "tags" JSONB DEFAULT '[]',
    "custom_fields" JSONB DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_reason" VARCHAR(500),
    "lead_id" TEXT,
    "customer_id" TEXT,
    "opportunity_id" TEXT,
    "assigned_to" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" VARCHAR(500),
    "reminder_at" TIMESTAMP(3),
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "lead_id" TEXT,
    "customer_id" TEXT,
    "opportunity_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "duration" INTEGER,
    "outcome" VARCHAR(500),
    "metadata" JSONB DEFAULT '{}',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TimelineEntryType" NOT NULL,
    "lead_id" TEXT,
    "customer_id" TEXT,
    "opportunity_id" TEXT,
    "activity_id" TEXT,
    "task_id" TEXT,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "entity_type" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "color" VARCHAR(7),
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "max_concurrent_instances" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "workflow_definition_id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "order" INTEGER NOT NULL,
    "color" VARCHAR(7),
    "type" "StageType" NOT NULL DEFAULT 'STANDARD',
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "approval_config" JSONB,
    "assignment_config" JSONB,
    "deadline_hours" INTEGER,
    "notify_on_enter" BOOLEAN NOT NULL DEFAULT false,
    "notify_on_exit" BOOLEAN NOT NULL DEFAULT false,
    "allow_rejection" BOOLEAN NOT NULL DEFAULT true,
    "rejection_target_stage_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" TEXT NOT NULL,
    "workflow_definition_id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "from_stage_id" TEXT NOT NULL,
    "to_stage_id" TEXT NOT NULL,
    "conditions" JSONB DEFAULT '{}',
    "permissions" JSONB DEFAULT '{}',
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "auto_trigger_event" VARCHAR(255),
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_definition_id" TEXT NOT NULL,
    "workflow_version" INTEGER NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_stage_id" TEXT NOT NULL,
    "entered_stage_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMP(3),
    "priority" "InstancePriority" NOT NULL DEFAULT 'NORMAL',
    "assigned_to" TEXT,
    "assigned_role" VARCHAR(80),
    "data" JSONB DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "total_transitions" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instance_stages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "stage_slug" VARCHAR(80) NOT NULL,
    "stage_name" VARCHAR(100) NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "stage_type" "StageType" NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exited_at" TIMESTAMP(3),
    "transition_log_id" TEXT,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_instance_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transition_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "transition_slug" VARCHAR(80) NOT NULL,
    "transition_name" VARCHAR(100),
    "from_stage_id" TEXT NOT NULL,
    "from_stage_name" VARCHAR(100) NOT NULL,
    "to_stage_id" TEXT NOT NULL,
    "to_stage_name" VARCHAR(100) NOT NULL,
    "executed_by" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approval_mode" "ApprovalMode" NOT NULL DEFAULT 'ANY',
    "assigned_to" TEXT NOT NULL,
    "assigned_role" VARCHAR(80),
    "order" INTEGER NOT NULL DEFAULT 1,
    "decided_at" TIMESTAMP(3),
    "decision" VARCHAR(20),
    "comment" TEXT,
    "delegated_from" TEXT,
    "delegated_to" TEXT,
    "deadline_at" TIMESTAMP(3),
    "reminded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_slug" VARCHAR(80),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "delegated_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "type" "WorkflowTaskType" NOT NULL DEFAULT 'ACTION',
    "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_to" TEXT,
    "assigned_by" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "completed_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_timeline_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "type" "WorkflowTimelineEventType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "transition_log_id" TEXT,
    "approval_id" TEXT,
    "task_id" TEXT,
    "instance_stage_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "external_id" VARCHAR(100) NOT NULL,
    "organization" VARCHAR(255) NOT NULL,
    "modality" "TenderModality" NOT NULL,
    "status" "TenderStatus" NOT NULL DEFAULT 'CAPTURED',
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "estimated_value" DECIMAL(14,2),
    "opening_date" TIMESTAMP(3) NOT NULL,
    "closing_date" TIMESTAMP(3) NOT NULL,
    "dispute_date" TIMESTAMP(3),
    "uf" VARCHAR(2),
    "city" VARCHAR(100),
    "assigned_to" TEXT,
    "workflow_instance_id" TEXT,
    "assigned_team" JSONB,
    "score" INTEGER,
    "score_criteria" JSONB,
    "tags" JSONB DEFAULT '[]',
    "metadata" JSONB DEFAULT '{}',
    "custom_fields" JSONB DEFAULT '{}',
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_items" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "estimated_value" DECIMAL(14,2),
    "proposal_value" DECIMAL(14,2),
    "bid_value" DECIMAL(14,2),
    "category" VARCHAR(100),
    "specifications" JSONB,
    "has_dispute" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    CONSTRAINT "tender_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_documents" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "checklist_item_id" TEXT,
    "category" "TenderDocumentCategory" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "file_name" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_url" VARCHAR(2000) NOT NULL,
    "file_hash" VARCHAR(64),
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "status" "TenderDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "rejection_reason" VARCHAR(500),
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_analyses" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "type" "TenderAnalysisType" NOT NULL,
    "status" "TenderAnalysisStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "analyst_id" TEXT NOT NULL,
    "analyst_name" VARCHAR(255),
    "technical_score" INTEGER,
    "object_fit" INTEGER,
    "requirements_fit" INTEGER,
    "experience_required" BOOLEAN,
    "financial_score" INTEGER,
    "estimated_cost" DECIMAL(14,2),
    "suggested_margin" DECIMAL(5,2),
    "competition_level" "TenderCompetitionLevel",
    "risk_level" "TenderRiskLevel",
    "conclusion" TEXT,
    "recommendation" "TenderAnalysisRecommendation",
    "price_research" JSONB,
    "competitors" JSONB,
    "attachments" JSONB,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_checklists" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "category" "TenderChecklistCategory" NOT NULL DEFAULT 'DOCUMENTATION',
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "status" "TenderChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "assigned_to" TEXT,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "notes" TEXT,
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_proposals" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "submitted_by" TEXT,
    "total_value" DECIMAL(14,2) NOT NULL,
    "discount_percent" DECIMAL(5,2),
    "item_values" JSONB,
    "technical_proposal" JSONB,
    "commercial_terms" JSONB,
    "observations" TEXT,
    "signature" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_disputes" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "status" "TenderDisputeStatus" NOT NULL DEFAULT 'SCHEDULED',
    "start_price" DECIMAL(14,2) NOT NULL,
    "current_price" DECIMAL(14,2) NOT NULL,
    "min_decrement" DECIMAL(10,2) NOT NULL,
    "extension_time" INTEGER NOT NULL DEFAULT 180,
    "started_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "winner_id" TEXT,
    "winner_amount" DECIMAL(14,2),
    "total_bids" INTEGER NOT NULL DEFAULT 0,
    "extensions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "tender_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_dispute_bids" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "previous_amount" DECIMAL(14,2),
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "is_winner" BOOLEAN,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "round" INTEGER NOT NULL,

    CONSTRAINT "tender_dispute_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_results" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "status" "TenderResultStatus" NOT NULL DEFAULT 'PENDING',
    "classification" INTEGER,
    "total_score" DECIMAL(10,2),
    "technical_score" DECIMAL(10,2),
    "commercial_score" DECIMAL(10,2),
    "winner_value" DECIMAL(14,2),
    "winner_name" VARCHAR(255),
    "winner_document" VARCHAR(20),
    "rankings" JSONB,
    "announced_at" TIMESTAMP(3),
    "appeal_deadline" TIMESTAMP(3),
    "contract_signed_at" TIMESTAMP(3),
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_participations" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "supplier_document" VARCHAR(20) NOT NULL,
    "status" "TenderParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "has_proposal" BOOLEAN NOT NULL DEFAULT false,
    "bid_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_deadlines" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "type" "TenderDeadlineType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "notify_before" INTEGER,
    "notified_at" TIMESTAMP(3),
    "status" "TenderDeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_timeline_entries" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "type" "TenderTimelineEntryType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_embeddings" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "corporate_name" VARCHAR(255) NOT NULL,
    "trade_name" VARCHAR(255),
    "cnpj" VARCHAR(14) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "compliance_score" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "auctions_tenant_id_status_idx" ON "auctions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "auctions_tenant_id_user_id_idx" ON "auctions"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "auctions_tenant_id_created_at_idx" ON "auctions"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "bids_tenant_id_auction_id_created_at_idx" ON "bids"("tenant_id", "auction_id", "created_at");

-- CreateIndex
CREATE INDEX "bids_tenant_id_user_id_idx" ON "bids"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_email_idx" ON "leads"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "leads_tenant_id_status_idx" ON "leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "leads_tenant_id_assigned_to_idx" ON "leads"("tenant_id", "assigned_to");

-- CreateIndex
CREATE INDEX "leads_tenant_id_score_idx" ON "leads"("tenant_id", "score");

-- CreateIndex
CREATE INDEX "leads_tenant_id_created_at_idx" ON "leads"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "leads_tenant_id_deleted_at_idx" ON "leads"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_lead_id_key" ON "customers"("lead_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_email_idx" ON "customers"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "customers_tenant_id_tax_id_idx" ON "customers"("tenant_id", "tax_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_status_idx" ON "customers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "customers_tenant_id_tier_idx" ON "customers"("tenant_id", "tier");

-- CreateIndex
CREATE INDEX "customers_tenant_id_segment_idx" ON "customers"("tenant_id", "segment");

-- CreateIndex
CREATE INDEX "customers_tenant_id_created_at_idx" ON "customers"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_deleted_at_idx" ON "customers"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "pipelines_tenant_id_is_default_idx" ON "pipelines"("tenant_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "pipelines_tenant_id_slug_key" ON "pipelines"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_pipeline_id_stage_idx" ON "opportunities"("tenant_id", "pipeline_id", "stage");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_customer_id_idx" ON "opportunities"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_lead_id_idx" ON "opportunities"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_assigned_to_idx" ON "opportunities"("tenant_id", "assigned_to");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_status_idx" ON "opportunities"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_expected_close_date_idx" ON "opportunities"("tenant_id", "expected_close_date");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_deleted_at_idx" ON "opportunities"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_pipeline_id_status_stage_order_idx" ON "opportunities"("tenant_id", "pipeline_id", "status", "stage_order");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_expected_close_date_status_idx" ON "opportunities"("tenant_id", "expected_close_date", "status");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_assigned_to_status_idx" ON "tasks"("tenant_id", "assigned_to", "status");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_due_date_status_idx" ON "tasks"("tenant_id", "due_date", "status");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_lead_id_idx" ON "tasks"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_customer_id_idx" ON "tasks"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_opportunity_id_idx" ON "tasks"("tenant_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_priority_status_idx" ON "tasks"("tenant_id", "priority", "status");

-- CreateIndex
CREATE INDEX "activities_tenant_id_lead_id_occurred_at_idx" ON "activities"("tenant_id", "lead_id", "occurred_at");

-- CreateIndex
CREATE INDEX "activities_tenant_id_customer_id_occurred_at_idx" ON "activities"("tenant_id", "customer_id", "occurred_at");

-- CreateIndex
CREATE INDEX "activities_tenant_id_opportunity_id_occurred_at_idx" ON "activities"("tenant_id", "opportunity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "activities_tenant_id_type_idx" ON "activities"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "activities_tenant_id_occurred_at_idx" ON "activities"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "activities_tenant_id_created_by_idx" ON "activities"("tenant_id", "created_by");

-- CreateIndex
CREATE INDEX "activities_tenant_id_created_by_occurred_at_idx" ON "activities"("tenant_id", "created_by", "occurred_at");

-- CreateIndex
CREATE INDEX "activities_tenant_id_type_created_by_occurred_at_idx" ON "activities"("tenant_id", "type", "created_by", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_entries_tenant_id_lead_id_occurred_at_idx" ON "timeline_entries"("tenant_id", "lead_id", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_entries_tenant_id_customer_id_occurred_at_idx" ON "timeline_entries"("tenant_id", "customer_id", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_entries_tenant_id_opportunity_id_occurred_at_idx" ON "timeline_entries"("tenant_id", "opportunity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_entries_tenant_id_type_occurred_at_idx" ON "timeline_entries"("tenant_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_entries_occurred_at_idx" ON "timeline_entries"("occurred_at");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_entity_type_idx" ON "workflow_definitions"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_is_active_idx" ON "workflow_definitions"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_created_at_idx" ON "workflow_definitions"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_deleted_at_idx" ON "workflow_definitions"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_tenant_id_slug_key" ON "workflow_definitions"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "workflow_stages_workflow_definition_id_order_idx" ON "workflow_stages"("workflow_definition_id", "order");

-- CreateIndex
CREATE INDEX "workflow_stages_workflow_definition_id_deleted_at_idx" ON "workflow_stages"("workflow_definition_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_workflow_definition_id_slug_key" ON "workflow_stages"("workflow_definition_id", "slug");

-- CreateIndex
CREATE INDEX "workflow_transitions_workflow_definition_id_from_stage_id_idx" ON "workflow_transitions"("workflow_definition_id", "from_stage_id");

-- CreateIndex
CREATE INDEX "workflow_transitions_workflow_definition_id_is_automatic_au_idx" ON "workflow_transitions"("workflow_definition_id", "is_automatic", "auto_trigger_event");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_transitions_workflow_definition_id_slug_key" ON "workflow_transitions"("workflow_definition_id", "slug");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_workflow_definition_id_idx" ON "workflow_instances"("tenant_id", "workflow_definition_id");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_entity_type_entity_id_idx" ON "workflow_instances"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_current_stage_id_idx" ON "workflow_instances"("tenant_id", "current_stage_id");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_status_idx" ON "workflow_instances"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_assigned_to_idx" ON "workflow_instances"("tenant_id", "assigned_to");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_deadline_at_idx" ON "workflow_instances"("tenant_id", "deadline_at");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_created_at_idx" ON "workflow_instances"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_priority_status_idx" ON "workflow_instances"("tenant_id", "priority", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_status_deadline_at_idx" ON "workflow_instances"("tenant_id", "status", "deadline_at");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_priority_status_deadline_at_idx" ON "workflow_instances"("tenant_id", "priority", "status", "deadline_at");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_entity_type_status_idx" ON "workflow_instances"("tenant_id", "entity_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_instances_workflow_definition_id_entity_type_entit_key" ON "workflow_instances"("workflow_definition_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_instance_stages_workflow_instance_id_entered_at_idx" ON "workflow_instance_stages"("workflow_instance_id", "entered_at");

-- CreateIndex
CREATE INDEX "workflow_instance_stages_tenant_id_workflow_instance_id_idx" ON "workflow_instance_stages"("tenant_id", "workflow_instance_id");

-- CreateIndex
CREATE INDEX "workflow_instance_stages_tenant_id_stage_id_entered_at_idx" ON "workflow_instance_stages"("tenant_id", "stage_id", "entered_at");

-- CreateIndex
CREATE INDEX "workflow_instance_stages_workflow_instance_id_stage_id_idx" ON "workflow_instance_stages"("workflow_instance_id", "stage_id");

-- CreateIndex
CREATE INDEX "workflow_transition_logs_workflow_instance_id_executed_at_idx" ON "workflow_transition_logs"("workflow_instance_id", "executed_at");

-- CreateIndex
CREATE INDEX "workflow_transition_logs_tenant_id_executed_at_idx" ON "workflow_transition_logs"("tenant_id", "executed_at");

-- CreateIndex
CREATE INDEX "workflow_transition_logs_workflow_instance_id_from_stage_id_idx" ON "workflow_transition_logs"("workflow_instance_id", "from_stage_id");

-- CreateIndex
CREATE INDEX "workflow_transition_logs_tenant_id_executed_by_executed_at_idx" ON "workflow_transition_logs"("tenant_id", "executed_by", "executed_at");

-- CreateIndex
CREATE INDEX "workflow_transition_logs_created_at_idx" ON "workflow_transition_logs"("created_at");

-- CreateIndex
CREATE INDEX "workflow_approvals_workflow_instance_id_stage_id_idx" ON "workflow_approvals"("workflow_instance_id", "stage_id");

-- CreateIndex
CREATE INDEX "workflow_approvals_workflow_instance_id_assigned_to_status_idx" ON "workflow_approvals"("workflow_instance_id", "assigned_to", "status");

-- CreateIndex
CREATE INDEX "workflow_approvals_tenant_id_assigned_to_status_idx" ON "workflow_approvals"("tenant_id", "assigned_to", "status");

-- CreateIndex
CREATE INDEX "workflow_approvals_tenant_id_deadline_at_idx" ON "workflow_approvals"("tenant_id", "deadline_at");

-- CreateIndex
CREATE INDEX "workflow_approvals_tenant_id_status_deadline_at_idx" ON "workflow_approvals"("tenant_id", "status", "deadline_at");

-- CreateIndex
CREATE INDEX "workflow_approvals_tenant_id_stage_id_status_idx" ON "workflow_approvals"("tenant_id", "stage_id", "status");

-- CreateIndex
CREATE INDEX "workflow_assignments_workflow_instance_id_user_id_idx" ON "workflow_assignments"("workflow_instance_id", "user_id");

-- CreateIndex
CREATE INDEX "workflow_assignments_tenant_id_user_id_status_idx" ON "workflow_assignments"("tenant_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "workflow_assignments_tenant_id_role_slug_idx" ON "workflow_assignments"("tenant_id", "role_slug");

-- CreateIndex
CREATE INDEX "workflow_tasks_workflow_instance_id_status_idx" ON "workflow_tasks"("workflow_instance_id", "status");

-- CreateIndex
CREATE INDEX "workflow_tasks_tenant_id_assigned_to_status_idx" ON "workflow_tasks"("tenant_id", "assigned_to", "status");

-- CreateIndex
CREATE INDEX "workflow_tasks_tenant_id_stage_id_idx" ON "workflow_tasks"("tenant_id", "stage_id");

-- CreateIndex
CREATE INDEX "workflow_tasks_tenant_id_due_date_idx" ON "workflow_tasks"("tenant_id", "due_date");

-- CreateIndex
CREATE INDEX "workflow_tasks_tenant_id_status_due_date_idx" ON "workflow_tasks"("tenant_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "workflow_timeline_events_workflow_instance_id_occurred_at_idx" ON "workflow_timeline_events"("workflow_instance_id", "occurred_at");

-- CreateIndex
CREATE INDEX "workflow_timeline_events_tenant_id_workflow_instance_id_typ_idx" ON "workflow_timeline_events"("tenant_id", "workflow_instance_id", "type");

-- CreateIndex
CREATE INDEX "workflow_timeline_events_tenant_id_occurred_at_idx" ON "workflow_timeline_events"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "workflow_timeline_events_occurred_at_idx" ON "workflow_timeline_events"("occurred_at");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_status_idx" ON "tenders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_modality_idx" ON "tenders"("tenant_id", "modality");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_uf_idx" ON "tenders"("tenant_id", "uf");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_organization_idx" ON "tenders"("tenant_id", "organization");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_opening_date_idx" ON "tenders"("tenant_id", "opening_date");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_closing_date_idx" ON "tenders"("tenant_id", "closing_date");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_assigned_to_idx" ON "tenders"("tenant_id", "assigned_to");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_created_at_idx" ON "tenders"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "tenders_tenant_id_workflow_instance_id_idx" ON "tenders"("tenant_id", "workflow_instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_tenant_id_external_id_key" ON "tenders"("tenant_id", "external_id");

-- CreateIndex
CREATE INDEX "tender_items_tender_id_category_idx" ON "tender_items"("tender_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "tender_items_tender_id_number_key" ON "tender_items"("tender_id", "number");

-- CreateIndex
CREATE INDEX "tender_documents_tender_id_category_idx" ON "tender_documents"("tender_id", "category");

-- CreateIndex
CREATE INDEX "tender_documents_tender_id_checklist_item_id_idx" ON "tender_documents"("tender_id", "checklist_item_id");

-- CreateIndex
CREATE INDEX "tender_documents_tender_id_is_latest_idx" ON "tender_documents"("tender_id", "is_latest");

-- CreateIndex
CREATE INDEX "tender_analyses_tender_id_idx" ON "tender_analyses"("tender_id");

-- CreateIndex
CREATE INDEX "tender_analyses_tender_id_analyst_id_idx" ON "tender_analyses"("tender_id", "analyst_id");

-- CreateIndex
CREATE UNIQUE INDEX "tender_analyses_tender_id_type_key" ON "tender_analyses"("tender_id", "type");

-- CreateIndex
CREATE INDEX "tender_checklists_tender_id_status_idx" ON "tender_checklists"("tender_id", "status");

-- CreateIndex
CREATE INDEX "tender_checklists_tender_id_assigned_to_idx" ON "tender_checklists"("tender_id", "assigned_to");

-- CreateIndex
CREATE INDEX "tender_checklists_tender_id_category_idx" ON "tender_checklists"("tender_id", "category");

-- CreateIndex
CREATE INDEX "tender_proposals_tender_id_is_submitted_idx" ON "tender_proposals"("tender_id", "is_submitted");

-- CreateIndex
CREATE UNIQUE INDEX "tender_proposals_tender_id_version_key" ON "tender_proposals"("tender_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "tender_disputes_tender_id_key" ON "tender_disputes"("tender_id");

-- CreateIndex
CREATE INDEX "tender_dispute_bids_dispute_id_timestamp_idx" ON "tender_dispute_bids"("dispute_id", "timestamp");

-- CreateIndex
CREATE INDEX "tender_dispute_bids_dispute_id_supplier_id_idx" ON "tender_dispute_bids"("dispute_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "tender_results_tender_id_key" ON "tender_results"("tender_id");

-- CreateIndex
CREATE INDEX "tender_participations_tender_id_status_idx" ON "tender_participations"("tender_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tender_participations_tender_id_supplier_id_key" ON "tender_participations"("tender_id", "supplier_id");

-- CreateIndex
CREATE INDEX "tender_deadlines_tender_id_deadline_at_idx" ON "tender_deadlines"("tender_id", "deadline_at");

-- CreateIndex
CREATE INDEX "tender_deadlines_tender_id_type_status_idx" ON "tender_deadlines"("tender_id", "type", "status");

-- CreateIndex
CREATE INDEX "tender_timeline_entries_tender_id_occurred_at_idx" ON "tender_timeline_entries"("tender_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tender_timeline_entries_tender_id_type_idx" ON "tender_timeline_entries"("tender_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "tender_embeddings_tender_id_key" ON "tender_embeddings"("tender_id");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_status_idx" ON "suppliers"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenant_id_cnpj_key" ON "suppliers"("tenant_id", "cnpj");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_is_read_created_at_idx" ON "notifications"("tenant_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_created_at_idx" ON "notifications"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_definition_id_fkey" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_rejection_target_stage_id_fkey" FOREIGN KEY ("rejection_target_stage_id") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflow_definition_id_fkey" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_definition_id_fkey" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instance_stages" ADD CONSTRAINT "workflow_instance_stages_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instance_stages" ADD CONSTRAINT "workflow_instance_stages_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_logs" ADD CONSTRAINT "workflow_transition_logs_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_logs" ADD CONSTRAINT "workflow_transition_logs_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_logs" ADD CONSTRAINT "workflow_transition_logs_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_assignments" ADD CONSTRAINT "workflow_assignments_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_timeline_events" ADD CONSTRAINT "workflow_timeline_events_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_items" ADD CONSTRAINT "tender_items_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_documents" ADD CONSTRAINT "tender_documents_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_documents" ADD CONSTRAINT "tender_documents_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "tender_checklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_analyses" ADD CONSTRAINT "tender_analyses_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_checklists" ADD CONSTRAINT "tender_checklists_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_proposals" ADD CONSTRAINT "tender_proposals_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_disputes" ADD CONSTRAINT "tender_disputes_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_dispute_bids" ADD CONSTRAINT "tender_dispute_bids_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "tender_disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_results" ADD CONSTRAINT "tender_results_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_participations" ADD CONSTRAINT "tender_participations_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_deadlines" ADD CONSTRAINT "tender_deadlines_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_timeline_entries" ADD CONSTRAINT "tender_timeline_entries_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_embeddings" ADD CONSTRAINT "tender_embeddings_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
