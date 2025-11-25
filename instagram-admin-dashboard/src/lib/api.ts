import axios from "axios";
import { tokenStorage } from "./tokenStorage";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export const setAuthHeader = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

setAuthHeader(tokenStorage.accessToken);

const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise<string | null>((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = tokenStorage.refreshToken;
    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }
    const response = await axios.post(`${baseURL}/auth/refresh-token`, {
      refreshToken,
    });
    const accessToken = response.data?.data?.accessToken ?? response.data?.accessToken;
    const newRefresh = response.data?.data?.refreshToken ?? refreshToken;
    if (accessToken) {
      tokenStorage.set(accessToken, newRefresh);
      setAuthHeader(accessToken);
      refreshQueue.forEach((resolve) => resolve(accessToken));
      refreshQueue = [];
      return accessToken;
    }
    throw new Error("Invalid refresh response");
  } catch (error) {
    refreshQueue.forEach((resolve) => resolve(null));
    refreshQueue = [];
    tokenStorage.clear();
    setAuthHeader(null);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.request.use((config) => {
  const token = tokenStorage.accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  async login(usernameOrEmail: string, password: string) {
    const response = await api.post("/auth/login", { usernameOrEmail, password });
    return response.data?.data ?? response.data;
  },
};

