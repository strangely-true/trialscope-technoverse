export type CandidateStatus = "pending" | "approved" | "rejected";
export type LeadSource = "registry" | "reddit" | "twitter";
export type Sentiment = "positive" | "neutral" | "negative";

export interface MatchedCandidate {
  id: string;
  anonymous_id: string;
  trial_id: string;
  match_score: number;
  matched_criteria: string[];
  source: LeadSource;
  status: CandidateStatus;
  identity_revealed: boolean;
  real_name?: string;
  email?: string;
  phone?: string;
  medical_profile?: {
    conditions: string[];
    medications: string[];
    demographics: Record<string, string>;
  };
  created_at: string;
}

export interface SocialLead {
  id: string;
  trial_id: string;
  platform: "reddit" | "twitter";
  username: string;
  conditions: string[];
  post_snippet: string;
  confidence: number;
  sentiment: Sentiment;
  outreach_sent: boolean;
  dismissed: boolean;
  created_at: string;
}

export interface DiscoveryStats {
  total_leads: number;
  outreach_sent: number;
  responses: number;
}
