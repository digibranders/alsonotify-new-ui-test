import { API_BASE_URL } from "../constants/constants";
import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();
const axiosApi = axios.create({
  baseURL: API_BASE_URL,
});

// Set token from cookies on initialization
const token = cookies.get("_token") || "";
if (token) {
  axiosApi.defaults.headers.common["authorization"] = token;
}

// Request interceptor to add token to every request
axiosApi.interceptors.request.use(
  (config) => {
    const token = cookies.get("_token");
    if (token) {
      config.headers.authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Critical endpoints that require authentication - 401 on these means auth failure
const CRITICAL_AUTH_ENDPOINTS = [
  '/user/details',
  '/user',
  '/user/user-dropdown',
  '/workspace',
  '/auth/register/complete',
];

// Response interceptor to handle 401 errors
axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isCriticalEndpoint = CRITICAL_AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
      
      // Only redirect on 401 for critical authentication endpoints
      // Optional endpoints (like /calendar/events) can fail with 401 without meaning auth failure
      if (isCriticalEndpoint) {
        // Clear token and redirect to login
        cookies.remove("_token", { path: "/" });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosApi;

