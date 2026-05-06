import type { UserRole } from "@/types/user";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",


  // Patient
  dashboard: "/dashboard",
  trials: "/trials",
  trialDetail: (id: string) => `/trials/${id}`,
  symptomLog: "/patient/symptom-log",
  questionnaire: "/onboarding/questionnaire",
  consent: "/consent",
  chatbot: "/chatbot",

  // Coordinator
  cohort: "/coordinator/cohort",
  anomalies: "/coordinator/anomalies",

  // Pharma
  pharmaAnalytics: "/pharma/analytics",
  pharmaTrials: "/pharma/trials",
  createTrial: "/pharma/create-trial",
  candidates: (trialId: string) => `/pharma/candidates/${trialId}`,
  discovery: (trialId: string) => `/pharma/discovery/${trialId}`,
  fhir: (trialId: string) => `/pharma/fhir/${trialId}`,
} as const;

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  patient: ROUTES.dashboard,
  coordinator: ROUTES.cohort,
  pharma: ROUTES.pharmaAnalytics,
};

export const TOKEN_KEY = "trialgo_token";
export const ROLE_KEY = "trialgo_role";
export const USER_KEY = "trialgo_user";
