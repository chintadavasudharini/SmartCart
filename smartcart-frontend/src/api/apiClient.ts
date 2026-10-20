import axios from "axios";

const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
const API_BASE_URL = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, "")}/api`;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request interceptor: Automatically attach JWT Bearer token to headers
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized (expired or invalid token)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isAuthEndpoint = error.config?.url?.includes("/auth/signin") || error.config?.url?.includes("/auth/signup");
            if (!isAuthEndpoint) {
                // Clear expired/invalid session
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                // If not already on signin or admin login page, redirect to the appropriate login portal
                if (window.location.pathname.startsWith("/admin")) {
                    if (window.location.pathname !== "/admin/login") {
                        window.location.href = "/admin/login";
                    }
                } else if (window.location.pathname !== "/signin") {
                    window.location.href = "/signin";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
