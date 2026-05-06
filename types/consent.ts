export interface ConsentDocument {
  id: string;
  trial_id: string;
  trial_name: string;
  version: string;
  sections: ConsentSection[];
  created_at: string;
}

export interface ConsentSection {
  id: string;
  title: string;
  content: string;
  simplified_content?: string;
  requires_initial: boolean;
}

export interface ConsentSubmission {
  id: string;
  patient_id: string;
  trial_id: string;
  document_id: string;
  signature_data: string;
  initials: Record<string, boolean>;
  signed_at: string;
  ip_address?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
}
