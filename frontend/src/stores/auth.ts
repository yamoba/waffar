import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  avatarUrl?: string;
  locale: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("waffar_token", data.accessToken);
    localStorage.setItem("waffar_refresh_token", data.refreshToken);
    set({ user: data.user });
  },

  register: async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    localStorage.setItem("waffar_token", data.accessToken);
    localStorage.setItem("waffar_refresh_token", data.refreshToken);
    set({ user: data.user });
  },

  logout: () => {
    const refreshToken = localStorage.getItem("waffar_refresh_token");
    api.post("/auth/logout", { refreshToken }).catch(() => {});
    localStorage.removeItem("waffar_token");
    localStorage.removeItem("waffar_refresh_token");
    set({ user: null });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem("waffar_token");
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await api.get("/auth/me");
      set({ user: data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
