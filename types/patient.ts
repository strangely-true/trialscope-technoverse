export interface SymptomLog {
  id: string;
  trial_id: string;
  patient_id: string;
  week_start: string;
  symptoms: SymptomEntry[];
  overall_feeling: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  created_at: string;
}

export interface SymptomEntry {
  name: string;
  severity: number; // 1-10
}

export interface QuestionnaireData {
  demographics: {
    age: number;
    gender: string;
    ethnicity: string[];
    country: string;
    city: string;
  };
  medical_history: {
    chronic_conditions: string[];
    previous_diagnoses: string[];
    allergies: string[];
  };
  medications: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  symptoms: {
    name: string;
    severity: number;
    duration: string;
  }[];
  lifestyle: {
    smoking: "never" | "former" | "current";
    alcohol: "never" | "occasional" | "regular";
    exercise: "none" | "1-2x" | "3-4x" | "daily";
  };
  preferences: {
    conditions: string[];
    near_me: boolean;
    radius_km?: number;
    travel_willing: boolean;
    phases: string[];
  };
}

export interface PatientProfile {
  id: string;
  user_id: string;
  questionnaire: QuestionnaireData;
  health_score: "good" | "moderate" | "poor";
  enrolled_trials: string[];
  created_at: string;
}
