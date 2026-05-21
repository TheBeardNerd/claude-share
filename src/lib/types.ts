export type ArtifactType = 'skill' | 'command' | 'agent' | 'prompt' | 'web-skill';
export type Surface = 'claude-code' | 'claude-ai' | 'all';

export const SURFACE_LABELS: Record<Surface, string> = {
  'claude-code': 'Claude Code',
  'claude-ai': 'Claude.ai',
  'all': 'All Surfaces',
};
export type ArtifactStatus = 'draft' | 'pending_review' | 'published' | 'rejected';
export type ReviewAction = 'approved' | 'changes_requested' | 'rejected';

export interface ArtifactMetadata {
  share_url?: string;
  variables?: string[];
  model?: string;
  setup_steps?: string[];
  context_url?: string;
}

export interface Artifact {
  id: string;
  slug: string;
  type: ArtifactType;
  surface: Surface;
  status: ArtifactStatus;
  title: string;
  description: string;
  content: string;
  tags: string[];
  department: string;
  metadata: ArtifactMetadata;
  submitted_by: string;
  submitter_user_id: string | null;
  reviewed_by: string | null;
  current_version: number;
  pii_flagged: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ArtifactVersion {
  id: string;
  artifact_id: string;
  version: number;
  content: string;
  metadata: ArtifactMetadata;
  change_note: string | null;
  published_by: string;
  created_at: string;
}

export interface ReviewNote {
  id: string;
  artifact_id: string;
  body: string;
  action: ReviewAction;
  created_at: string;
}

export interface PiiFlag {
  pattern: string;
  match: string;
  index: number;
}

export interface PiiScanResult {
  flagged: boolean;
  flags: PiiFlag[];
}

export interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string;
}
