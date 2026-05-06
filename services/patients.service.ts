import api from "@/lib/api";
import type { SymptomLog, QuestionnaireData } from "@/types/patient";

export const patientsService = {
  submitQuestionnaire: async (data: QuestionnaireData) => {
    const response = await api.post("/questionnaire/submit", data);
    return response.data;
  },

  getQuestionnaireStatus: async () => {
    const { data } = await api.get<{ completed: boolean }>(
      "/questionnaire/status"
    );
    return data;
  },

  submitSymptomLog: async (log: Omit<SymptomLog, "id" | "created_at">) => {
    const { data } = await api.post("/patient/symptom-log", log);
    return data;
  },

  getSymptomLogs: async (trialId: string) => {
    const { data } = await api.get<SymptomLog[]>(
      `/patient/symptom-logs/${trialId}`
    );
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get("/patient/dashboard");
    return data;
  },
};
