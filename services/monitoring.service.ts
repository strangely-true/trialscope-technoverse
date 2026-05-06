import api from "@/lib/api";
import type { CohortStats, Anomaly, PatientRow } from "@/types/monitoring";

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
};
