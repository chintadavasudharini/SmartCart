import { create } from "zustand";
import type { AuthResponse } from "../types/auth";

interface AuthState {
    user: AuthResponse | null;
    token: string | null;
    login: (user: AuthResponse) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: JSON.parse(localStorage.getItem("user") || "null"),
    token: localStorage.getItem("token"),
    login: (user) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", user.token);
        set({ user, token: user.token });
    },
    logout: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        set({ user: null, token: null });
    },
    isAuthenticated: () => {
        return !!get().token;
    }
}));