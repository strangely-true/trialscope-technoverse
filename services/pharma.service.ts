import api from "@/lib/api";
import type { MatchedCandidate, SocialLead, DiscoveryStats } from "@/types/candidate";
import type { Trial } from "@/types/trial";

export const pharmaService = {
  getTrials: async () => {
    const { data } = await api.get<Trial[]>("/pharma/trials");
    return data;
  },

  getAnalytics: async (trialId: string) => {
    const { data } = await api.get(`/pharma/analytics/${trialId}`);
    return data;
  },

  getCandidates: async (
    trialId: string,
    params?: { status?: string; min_score?: number; sort?: string }
  ) => {
    const { data } = await api.get<MatchedCandidate[]>(
      `/pharma/candidates/${trialId}`,
      { params }
    );
    return data;
  },

  approveCandidate: async (candidateId: string) => {
    const { data } = await api.patch(
      `/pharma/candidates/${candidateId}/approve`
    );
    return data;
  },

  rejectCandidate: async (candidateId: string) => {
    const { data } = await api.patch(
      `/pharma/candidates/${candidateId}/reject`
    );
    return data;
  },

  revealIdentity: async (candidateId: string) => {
    const { data } = await api.post(
      `/pharma/candidates/${candidateId}/reveal`
    );
    return data;
  },

  getDiscoveryLeads: async (trialId: string) => {
    const { data } = await api.get<{
      leads: SocialLead[];
      stats: DiscoveryStats;
    }>(`/pharma/discovery/${trialId}`);
    return data;
  },

  sendOutreach: async (leadId: string) => {
    const { data } = await api.post(`/pharma/discovery/${leadId}/outreach`);
    return data;
  },

  dismissLead: async (leadId: string) => {
    const { data } = await api.patch(`/pharma/discovery/${leadId}/dismiss`);
    return data;
  },

  getFHIRBundle: async (trialId: string, format: "json" | "xml" = "json") => {
    const { data } = await api.get(`/pharma/fhir/${trialId}`, {
      params: { format },
    });
    return data;
  },
};
