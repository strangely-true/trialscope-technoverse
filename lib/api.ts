import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("trialgo_token")
      : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || "Something went wrong";

    if (status === 401) {
      localStorage.removeItem("trialgo_token");
      localStorage.removeItem("trialgo_role");
      localStorage.removeItem("trialgo_user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      toast.error("Access denied. You do not have permission.");
    } else if (status === 422) {
      toast.error("Validation error. Please check your input.");
    } else if (status && status >= 500) {
      toast.error("Server error. Please try again later.");
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
