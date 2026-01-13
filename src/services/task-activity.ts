import axiosApi from "../config/axios";
import { ApiResponse } from "../types/api";

export interface TaskActivityDto {
  id: number;
  message: string;
  type: 'CHAT' | 'SYSTEM' | 'FILE';
  sub_type?: string;
  metadata?: Record<string, unknown>;
  user_id: number;
  task_id: number;
  created_at: string;
  user: {
    id: number;
    name: string;
    user_profile?: {
      profile_pic: string | null;
    };
  };
  attachments: {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }[];
}

export interface CreateTaskActivityRequest {
  task_id: number;
  message: string;
  type?: 'CHAT' | 'SYSTEM' | 'FILE';
  sub_type?: string;
  metadata?: Record<string, unknown>;
  attachment_ids?: number[];
}

export const getTaskActivities = async (taskId: number): Promise<ApiResponse<TaskActivityDto[]>> => {
  const { data } = await axiosApi.get<ApiResponse<TaskActivityDto[]>>(`/task/${taskId}/activity`);
  return data;
};

export const createTaskActivity = async (params: CreateTaskActivityRequest): Promise<ApiResponse<TaskActivityDto>> => {
  const { data } = await axiosApi.post<ApiResponse<TaskActivityDto>>("/task/activity", params);
  return data;
};
