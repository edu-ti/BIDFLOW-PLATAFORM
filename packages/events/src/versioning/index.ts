// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Versioning utility
// ═══════════════════════════════════════════════════════════════════════════

export interface EventVersion {
  major: number;
  minor: number;
}

export type VersionStatus = 'active' | 'deprecated' | 'sunset' | 'removed';

export interface VersionMetadata {
  version: string;         // "v1", "v2"
  status: VersionStatus;
  since: string;           // ISO date when this version was introduced
  deprecationDate?: string;// ISO date when deprecation was announced
  sunsetDate?: string;    // ISO date when it will be removed
  changelog: string[];
}

/**
 * Extracts version from a CloudEvents type string.
 * com.bidflow.workflow.stage.changed.v1 → "v1"
 */
export function extractVersion(eventType: string): string | null {
  const match = eventType.match(/\.v(\d+)$/);
  return match ? `v${match[1]}` : null;
}

/**
 * Returns the base event type without version suffix.
 * com.bidflow.workflow.stage.changed.v1 → com.bidflow.workflow.stage.changed
 */
export function baseEventType(eventType: string): string {
  return eventType.replace(/\.v\d+$/, '');
}

/**
 * Event version registry.
 * Maintained centrally. Updated when new versions are published.
 *
 * Versioning policy:
 * - Adição de campo opcional → NON-breaking (same version)
 * - Remoção de campo       → BREAKING (new version)
 * - Renomeio de campo      → BREAKING (new version)
 * - Mudança de tipo        → BREAKING (new version)
 * - Depreciação: 90 days notice before sunset
 * - Parallel publish: v1 and v2 published simultaneously during migration
 */
export const EventVersionRegistry: Record<string, VersionMetadata[]> = {
  'com.bidflow.workflow.instance.started': [
    { version: 'v1', status: 'active', since: '2026-05-15', changelog: ['Initial version'] },
  ],
  'com.bidflow.workflow.stage.changed': [
    { version: 'v1', status: 'active', since: '2026-05-15', changelog: ['Initial version'] },
  ],
  'com.bidflow.workflow.approval.granted': [
    { version: 'v1', status: 'active', since: '2026-05-15', changelog: ['Initial version'] },
  ],
  'com.bidflow.workflow.instance.completed': [
    { version: 'v1', status: 'active', since: '2026-05-15', changelog: ['Initial version'] },
  ],
  'com.bidflow.tender.captured': [
    { version: 'v1', status: 'active', since: '2026-05-15', changelog: ['Initial version'] },
  ],
  'com.bidflow.crm.lead.captured': [
    { version: 'v1', status: 'active', since: '2026-05-15', changelog: ['Initial version'] },
  ],
};
