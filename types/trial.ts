export type TrialPhase = "Phase I" | "Phase II" | "Phase III" | "Phase IV";
export type TrialStatus = "Recruiting" | "Active" | "Completed" | "Suspended";

export interface Trial {
  id: string;
  title: string;
  description: string;
  sponsor: string;
  phase: TrialPhase;
  status: TrialStatus;
  disease: string;
  start_date: string;
  end_date?: string;
  target_enrollment: number;
  current_enrollment: number;
  location: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  match_score?: number;
  created_at: string;
}

export interface TrialListResponse {
  trials: Trial[];
  total: number;
  page: number;
  per_page: number;
}

export interface TrialCreatePayload {
  title: string;
  description: string;
  disease: string;
  phase: TrialPhase;
  sponsor: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  target_enrollment: number;
  start_date: string;
  end_date?: string;
  locations: string[];
}
