import apiClient from "./apiClient";
import type { SignupRequest, SigninRequest, AuthResponse } from "../types/auth";

export const signup = async (data: SignupRequest): Promise<string> => {
    const response = await apiClient.post<string>("/auth/signup", data);
    return response.data;
};

export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/signin", data);
    return response.data;
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
    const response = await apiClient.get<AuthResponse>("/auth/me");
    return response.data;
};