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

// Response interceptor to handle 401 errors
axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      cookies.remove("_token", { path: "/" });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosApi;

