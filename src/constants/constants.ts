// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

