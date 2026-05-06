import api from "@/lib/api";
import type { ConsentDocument, ConsentSubmission, AuditEntry } from "@/types/consent";

export const consentService = {
  getDocument: async (trialId: string) => {
    const { data } = await api.get<ConsentDocument>(
      `/consent/document/${trialId}`
    );
    return data;
  },

  submitConsent: async (submission: Omit<ConsentSubmission, "id" | "signed_at">) => {
    const { data } = await api.post("/consent/submit", submission);
    return data;
  },

  getAuditTrail: async (trialId: string) => {
    const { data } = await api.get<AuditEntry[]>(
      `/consent/audit/${trialId}`
    );
    return data;
  },

  uploadTemplate: async (trialId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(
      `/consent/upload/${trialId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },
};
