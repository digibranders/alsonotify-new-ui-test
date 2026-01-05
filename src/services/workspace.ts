import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

// Workspace/Project types (simplified - will expand based on actual backend types)
export interface WorkspaceType {
  id: number;
  name: string;
  description?: string;
  status?: string;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
}

export interface RequirementType {
  id: number;
  title: string;
  description?: string;
  workspace_id: number;
  status?: string;
  priority?: string;
  [key: string]: any;
}

export interface CommentType {
  id: number;
  comment: string;
  type: "PROJECT" | "TASK" | "WORKSPACE";
  reference_id: number;
  [key: string]: any;
}

// Create workspace
export const createWorkspace = async (params: WorkspaceType): Promise<ApiResponse<WorkspaceType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<WorkspaceType>>("/workspace/create", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update workspace
export const updateWorkspace = async (params: WorkspaceType): Promise<ApiResponse<WorkspaceType>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<WorkspaceType>>(`/workspace/update/${params.id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete workspace
export const deleteWorkspace = async (id: number): Promise<ApiResponse<WorkspaceType>> => {
  try {
    const { data } = await axiosApi.delete<ApiResponse<WorkspaceType>>(`/workspace/delete/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Reactivate workspace
export const reactivateWorkspace = async (id: number): Promise<ApiResponse<WorkspaceType>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<WorkspaceType>>(`/workspace/reactivate/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get workspaces
type TeamWorkspaceType = {
  workspaces: WorkspaceType[];
};

export const getWorkspace = async (options: string = ""): Promise<ApiResponse<TeamWorkspaceType>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TeamWorkspaceType>>(`/workspace?${options}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get workspace by id
export const getWorkspaceById = async (id: number): Promise<ApiResponse<any>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<any>>(`/workspace/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Search workspaces
export const searchWorkspaces = async (name = ""): Promise<ApiResponse<WorkspaceType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<WorkspaceType[]>>(`/workspace/dropdown?name=${name}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Requirement operations
export const addRequirementToWorkspace = async (params: RequirementType): Promise<ApiResponse<RequirementType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<RequirementType>>("/requirement", params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateRequirementById = async (params: RequirementType): Promise<ApiResponse<RequirementType>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<RequirementType>>(`/requirement/update/${params.id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteRequirementById = async (id: number, workspace_id: number): Promise<ApiResponse<RequirementType>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<RequirementType>>(`/workspace/requirement/update/${id}`, {
      is_deleted: true,
      workspace_id: workspace_id,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const approveRequirement = async (
  requirement_id: number,
  status: "Assigned" | "Rejected"
): Promise<ApiResponse<RequirementType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<RequirementType>>("/workspace/requirement/approve", {
      requirement_id,
      status,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getRequirementsByWorkspaceId = async (workspaceId: number): Promise<ApiResponse<RequirementType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<RequirementType[]>>(`/requirement/${workspaceId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCollaborativeRequirements = async (): Promise<ApiResponse<RequirementType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<RequirementType[]>>(`/requirement/collaborative`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get requirements dropdown by workspace ID
export const getRequirementsDropdownByWorkspaceId = async (workspaceId: number): Promise<ApiResponse<{ name: string; id: number }[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<{ name: string; id: number }[]>>(`/requirement/${workspaceId}/requirement/dropdown`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Comment operations
export const addCommentToProject = async (params: CommentType): Promise<ApiResponse<CommentType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<CommentType>>(`/comment/create`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateCommentById = async (comment: string, id: number): Promise<ApiResponse<CommentType>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<CommentType>>(`/comment/update/${id}`, { comment });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCommentById = async (
  id: number,
  type: "PROJECT" | "TASK" | "WORKSPACE"
): Promise<ApiResponse<CommentType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<CommentType[]>>(`/comment/${type}/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

