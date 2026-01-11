export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  result: T;
}

export interface PaginationMeta {
  total: number;
  skip: number;
  limit: number;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  error?: any;    
}
