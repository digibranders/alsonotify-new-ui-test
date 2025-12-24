import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";
import { ApiError, NetworkError, getErrorMessage, isAxiosError } from "../types/errors";

export interface TaskType {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id?: number;
  requirement_id?: number;
  assigned_to?: number;
  due_date?: string;
}

export interface Worklog {
  id: number;
  task_id: number;
  user_id: number;
  hours: number;
  description?: string;
  date: string;
  created_at?: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskDetailType extends TaskType {
  worklogs?: Worklog[];
  comments?: Comment[];
}

/**
 * Validate task ID
 */
function validateTaskId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(`Invalid task ID: ${id}`, 400);
  }
}

/**
 * Validate pagination parameters
 */
function validatePagination(limit: number, skip: number): void {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new ApiError(`Invalid skip parameter: ${skip}`, 400);
  }
  if (!Number.isInteger(limit) || limit <= 0 || limit > 1000) {
    throw new ApiError(`Invalid limit parameter: ${limit}. Must be between 1 and 1000`, 400);
  }
}

/**
 * Create a new task
 */
export const createTask = async (params: Partial<TaskType> & { name?: string }): Promise<ApiResponse<TaskType>> => {
  try {
    // Handle both 'name' (from form) and 'title' (from TaskType interface) - backend expects 'name'
    const taskName = (params as any).name || params.title;
    
    // Validate name/title field
    if (!taskName || (typeof taskName === 'string' && taskName.trim().length === 0)) {
      throw new ApiError('Task title is required', 400);
    }
    
    // Map to backend 'name' field (remove both title and name from params, then add name)
    const { title, name, ...restParams } = params as any;
    const payload = {
      ...restParams,
      name: taskName,
    };
    
    const { data } = await axiosApi.post<ApiResponse<TaskType>>("/task/create", payload);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (params: TaskType): Promise<ApiResponse<TaskType>> => {
  try {
    validateTaskId(params.id);
    
    const { data } = await axiosApi.put<ApiResponse<TaskType>>(`/task/update/${params.id}`, params);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Update task status
 */
export const updateTaskStatusById = async (id: number, status: string): Promise<ApiResponse<TaskType>> => {
  try {
    validateTaskId(id);
    
    if (!status || status.trim().length === 0) {
      throw new ApiError('Task status is required', 400);
    }
    
    const { data } = await axiosApi.post<ApiResponse<TaskType>>(`/task/${id}/update/${status}`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Delete a task
 */
export const deleteTaskById = async (id: number): Promise<ApiResponse<TaskType>> => {
  try {
    validateTaskId(id);
    
    const { data } = await axiosApi.delete<ApiResponse<TaskType>>(`/task/delete/${id}`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Get tasks with optional query parameters
 */
export const getTasks = async (options: string = ""): Promise<ApiResponse<TaskType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TaskType[]>>(`/task?${options}`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (id: number): Promise<ApiResponse<TaskDetailType>> => {
  try {
    validateTaskId(id);
    
    const { data } = await axiosApi.get<ApiResponse<TaskDetailType>>(`/task/${id}`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Create a worklog/activity for a task
 */
export const createActivity = async (params: Partial<TaskType>): Promise<ApiResponse<TaskType>> => {
  try {
    if (!params.id) {
      throw new ApiError('Task ID is required', 400);
    }
    
    validateTaskId(params.id);
    
    const { data } = await axiosApi.post<ApiResponse<TaskType>>("/task/worklog/create", params);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Get worklogs for a task
 */
export const getWorkLogByTaskId = async (
  taskId: number,
  limit = 25,
  skip = 0
): Promise<ApiResponse<Worklog[]>> => {
  try {
    validateTaskId(taskId);
    validatePagination(limit, skip);
    
    const { data } = await axiosApi.get<ApiResponse<Worklog[]>>(
      `/task/${taskId}/worklog?limit=${limit}&skip=${skip}`
    );
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Get tasks assigned to the current logged-in user
 */
export const getAssignedTasks = async (): Promise<ApiResponse<TaskType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TaskType[]>>(`/task/assigned`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Get assigned task detail with timer information
 * Returns: estimated_time, worked_time, active worklog, etc.
 */
export interface AssignedTaskDetailType {
  estimated_time: number; // in hours
  worked_time: number; // in seconds
  status: string;
  worked_sessions: number;
  task_worklog?: {
    id: number | null;
    task_id: number;
    description: string;
    end_datetime: string | null;
    start_datetime: string;
    time_in_seconds: number | null;
  } | null;
}

export const getAssignedTaskDetail = async (taskId: number): Promise<ApiResponse<AssignedTaskDetailType>> => {
  try {
    validateTaskId(taskId);
    
    const { data } = await axiosApi.get<ApiResponse<AssignedTaskDetailType>>(`/task/${taskId}/timer`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Start a worklog/timer for a task
 */
export const startWorkLog = async (task_id: number, start_datetime: string): Promise<ApiResponse<Worklog>> => {
  try {
    validateTaskId(task_id);
    
    const { data } = await axiosApi.post<ApiResponse<Worklog>>(`/task/worklog/create`, {
      task_id,
      start_datetime
    });
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Update a worklog
 */
export interface UpdateWorklogPayload {
  task_id: number;
  start_datetime: string;
  end_datetime: string;
  description: string;
}

export const updateWorklog = async (params: UpdateWorklogPayload, worklogId: number): Promise<ApiResponse<Worklog>> => {
  try {
    validateTaskId(params.task_id);
    
    if (!worklogId || worklogId <= 0) {
      throw new ApiError(`Invalid worklog ID: ${worklogId}`, 400);
    }
    
    const { data } = await axiosApi.put<ApiResponse<Worklog>>(`/task/worklog/update/${worklogId}`, params);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

