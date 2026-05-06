export type UserRole = "patient" | "coordinator" | "pharma";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  company_name?: string;
  created_at: string;
  is_verified: boolean;
  profile_completed: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  company_name?: string;
}

export interface VerifyOTPPayload {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
