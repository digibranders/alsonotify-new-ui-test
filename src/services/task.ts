import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

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
  [key: string]: any;
}

export interface TaskDetailType extends TaskType {
  worklogs?: any[];
  comments?: any[];
  [key: string]: any;
}

// Create task
export const createTask = async (params: TaskType | any): Promise<ApiResponse<TaskType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<TaskType>>("/task/create", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update task
export const updateTask = async (params: TaskType): Promise<ApiResponse<TaskType>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<TaskType>>(`/task/update/${params.id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update task status
export const updateTaskStatusById = async (id: number, status: string) => {
  try {
    const { data } = await axiosApi.post<ApiResponse<TaskType>>(`/task/${id}/update/${status}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete task
export const deleteTaskById = async (id: number): Promise<ApiResponse<TaskType>> => {
  try {
    const { data } = await axiosApi.delete<ApiResponse<TaskType>>(`/task/delete/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get tasks
export const getTasks = async (options: string = ""): Promise<ApiResponse<TaskType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TaskType[]>>(`/task?${options}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get task by id
export const getTaskById = async (id: number): Promise<ApiResponse<TaskDetailType>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TaskDetailType>>(`/task/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Create worklog/activity
export const createActivity = async (params: TaskType): Promise<ApiResponse<TaskType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<TaskType>>("/task/worklog/create", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get worklog by task id
export const getWorkLogByTaskId = async (
  taskId: number,
  limit = 25,
  skip = 0
): Promise<ApiResponse<any[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<any[]>>(`/task/${taskId}/worklog?limit=${limit}&skip=${skip}`);
    return data;
  } catch (error) {
    throw error;
  }
};

