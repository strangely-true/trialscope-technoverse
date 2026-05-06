"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { TOKEN_KEY, ROLE_KEY, USER_KEY, ROLE_DASHBOARDS } from "@/lib/constants";
import type { User, LoginPayload, RegisterPayload, UserRole } from "@/types/user";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Invalid stored user
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload, role: UserRole = "patient") => {
      setIsLoading(true);
      try {
        const { data } = await api.post("/auth/login", { ...payload, role });
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(ROLE_KEY, data.user.role);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        router.push(ROLE_DASHBOARDS[data.user.role as UserRole]);
        toast.success("Welcome back!");
      } catch {
        toast.error("Invalid credentials. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      try {
        const { data } = await api.post("/auth/register", payload);
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(ROLE_KEY, data.user.role);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        return data;
      } catch {
        toast.error("Registration failed. Please try again.");
        throw new Error("Registration failed");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
    toast.success("Logged out successfully.");
  }, [router]);

  return { user, isLoading, login, register, logout };
}

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  return user;
}
