import api from "@/lib/api";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  VerifyOTPPayload,
  User,
} from "@/types/user";

export const authService = {
  login: async (payload: LoginPayload & { role?: string }) => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  verifyOTP: async (payload: VerifyOTPPayload) => {
    const { data } = await api.post<{ verified: boolean }>(
      "/auth/verify-phone",
      payload
    );
    return data;
  },

  me: async () => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  resendOTP: async (phone: string) => {
    const { data } = await api.post<{ sent: boolean }>("/auth/resend-otp", {
      phone,
    });
    return data;
  },
};
