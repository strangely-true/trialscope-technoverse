import api from "@/lib/api";
import type { Trial, TrialListResponse, TrialCreatePayload } from "@/types/trial";

export const trialsService = {
  list: async (params?: {
    search?: string;
    phase?: string;
    disease?: string;
    page?: number;
    per_page?: number;
  }) => {
    const { data } = await api.get<TrialListResponse>("/trials", { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Trial>(`/trials/${id}`);
    return data;
  },

  create: async (payload: TrialCreatePayload) => {
    const { data } = await api.post<Trial>("/trials/create", payload);
    return data;
  },

  apply: async (trialId: string, applicationData: Record<string, unknown>) => {
    const { data } = await api.post(`/trials/${trialId}/apply`, applicationData);
    return data;
  },

  getEnrolled: async () => {
    const { data } = await api.get<Trial[]>("/trials/enrolled");
    return data;
  },
};
