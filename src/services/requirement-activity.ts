import axiosApi from "../config/axios";
import { ApiResponse } from "../types/api";

export interface RequirementActivityDto {
  id: number;
  message: string;
  type: 'CHAT' | 'SYSTEM' | 'FILE';
  sub_type?: string;
  metadata?: Record<string, unknown>;
  user_id: number;
  requirement_id: number;
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

export interface CreateRequirementActivityRequest {
  requirement_id: number;
  message: string;
  type?: 'CHAT' | 'SYSTEM' | 'FILE';
  sub_type?: string;
  metadata?: Record<string, unknown>;
  attachment_ids?: number[];
}

export const getRequirementActivities = async (requirementId: number): Promise<ApiResponse<RequirementActivityDto[]>> => {
  const { data } = await axiosApi.get<ApiResponse<RequirementActivityDto[]>>(`/requirement/${requirementId}/activity`);
  return data;
};

export const createRequirementActivity = async (params: CreateRequirementActivityRequest): Promise<ApiResponse<RequirementActivityDto>> => {
  const { data } = await axiosApi.post<ApiResponse<RequirementActivityDto>>("/requirement/activity", params);
  return data;
};
