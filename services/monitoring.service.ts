import api from "@/lib/api";
import type { CohortStats, Anomaly, PatientRow } from "@/types/monitoring";

export interface DropoutScore {
  score: number;
  risk_tier: "RED" | "AMBER" | "GREEN";
  days_since_login: number | null;
  symptom_logs_week: number | null;
  wearable_uploads_week: number | null;
  scored_at: string;
}

export interface PatientDropoutRisk {
  trial_id: number;
  trial_title: string;
  trial_disease: string;
  risk_tier: "RED" | "AMBER" | "GREEN";
  dropout_score: number;
  scored_at: string;
  metrics: {
    days_since_login: number | null;
    symptom_logs_week: number | null;
    wearable_uploads_week: number | null;
  };
  historical: Array<{
    score: number;
    tier: string;
    scored_at: string;
  }>;
}

export interface PatientWithDropoutRisk {
  patient_id: number;
  hash_id: string;
  status: string;
  enrolled_at: string;
  match_score: number;
  dropout_risk: {
    score: number | null;
    tier: string;
    days_since_login: number | null;
    symptom_logs_week: number | null;
    wearable_uploads_week: number | null;
    scored_at: string | null;
  };
  anomaly_alerts_count: number;
  anomaly_alerts: Array<any>;
}

export const monitoringService = {
  getCohortStats: async (trialId: string) => {
    const { data } = await api.get<CohortStats>(
      `/monitoring/cohort/${trialId}`
    );
    return data;
  },

  getAnomalies: async (trialId: string, resolved = false) => {
    const { data } = await api.get<Anomaly[]>(
      `/monitoring/anomalies/${trialId}`,
      { params: { resolved } }
    );
    return data;
  },

  resolveAnomaly: async (anomalyId: string) => {
    const { data } = await api.patch(`/monitoring/anomalies/${anomalyId}/resolve`);
    return data;
  },

  getPatients: async (trialId: string, params?: { page?: number; search?: string }) => {
    const { data } = await api.get<{ patients: PatientRow[]; total: number }>(
      `/monitoring/patients/${trialId}`,
      { params }
    );
    return data;
  },

  // Patient endpoint - get own dropout risk
  getMyDropoutRisk: async () => {
    const { data } = await api.get<{
      trials: PatientDropoutRisk[];
      latest_scores: Array<{ score: number; tier: string }>;
    }>("/patient/dropout-risk");
    return data;
  },

  // Coordinator endpoint - get all patient dropout risks for a trial
  getTrialDropoutScores: async (trialId: number) => {
    const { data } = await api.get<DropoutScore[]>(
      `/monitoring/dropout/${trialId}`
    );
    return data;
  },

  // Coordinator endpoint - get patient detail with all metrics
  getPatientProfile: async (patientId: number) => {
    const { data } = await api.get(`/coordinator/patient/${patientId}`);
    return data;
  },

  // Coordinator endpoint - get cohort summary
  getCohortSummary: async (trialId: number) => {
    const { data } = await api.get<{
      trial_id: number;
      total_enrolled: number;
      avg_match_score: number;
      risk_distribution: Record<string, number>;
    }>(`/monitoring/cohort/${trialId}`);
    return data;
  },

  // Coordinator endpoint - get all patients with dropout risk for a trial
  getPatientsWithDropoutRisk: async (trialId: number) => {
    const { data } = await api.get<PatientWithDropoutRisk[]>(
      `/monitoring/cohort/${trialId}`
    );
    return data;
  },

  // Pharma endpoint - get all patients with dropout risk for their trial
  getPharmaPatientsWithDropoutRisk: async (trialId: number) => {
    const { data } = await api.get<PatientWithDropoutRisk[]>(
      `/pharma/patients/${trialId}/dropout-risk`
    );
    return data;
  },

  // Coordinator endpoint - get anomalies for a trial (with new parameter handling)
  getTrialAnomalies: async (trialId: number, resolved: boolean = false) => {
    const { data } = await api.get(`/monitoring/anomalies/${trialId}`, {
      params: { resolved },
    });
    return data;
  },

  // Coordinator endpoint - resolve anomaly (supports new API)
  resolveAnomalyById: async (alertId: number) => {
    const { data } = await api.post(
      `/monitoring/anomalies/${alertId}/resolve`
    );
    return data;
  },
};
