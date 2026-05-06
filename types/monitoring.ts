export type RiskLevel = "GREEN" | "AMBER" | "RED";
export type AnomalySeverity = "critical" | "warning";

export interface Anomaly {
  id: string;
  patient_id: string;
  trial_id: string;
  metric: string;
  value: number;
  unit: string;
  z_score: number;
  severity: AnomalySeverity;
  message: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface CohortStats {
  total_enrolled: number;
  avg_match_score: number;
  dropout_risk: number;
  active_anomalies: number;
  risk_distribution: {
    green: number;
    amber: number;
    red: number;
  };
}

export interface CohortEvent {
  type: "enrollment" | "anomaly" | "dropout_update" | "symptom_log";
  data: Record<string, unknown>;
  timestamp: string;
}

export interface PatientRow {
  id: string;
  enrollment_date: string;
  match_score: number;
  dropout_risk: RiskLevel;
  last_activity: string;
  symptom_logs_this_week: number;
  anomaly_count: number;
}
