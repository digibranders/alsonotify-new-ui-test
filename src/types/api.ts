import { ApiResponse } from "../constants/constants";

export { type ApiResponse };

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DropdownOption {
  label: string;
  value: number | string;
}
