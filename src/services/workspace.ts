/* eslint-disable no-useless-catch */
import axiosApi from "../config/axios";
import { ApiResponse } from "../types/api";
import { WorkspaceDto, ProjectCommentDto } from "../types/dto/workspace.dto";
import { RequirementDto } from "../types/dto/requirement.dto";

// Create workspace
export const createWorkspace = async (params: WorkspaceDto): Promise<ApiResponse<WorkspaceDto>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<WorkspaceDto>>("/workspace/create", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update workspace
export const updateWorkspace = async (params: WorkspaceDto): Promise<ApiResponse<WorkspaceDto>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<WorkspaceDto>>(`/workspace/update/${params.id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete workspace
export const deleteWorkspace = async (id: number): Promise<ApiResponse<WorkspaceDto>> => {
  try {
    const { data } = await axiosApi.delete<ApiResponse<WorkspaceDto>>(`/workspace/delete/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Reactivate workspace
export const reactivateWorkspace = async (id: number): Promise<ApiResponse<WorkspaceDto>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<WorkspaceDto>>(`/workspace/reactivate/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get workspaces
type TeamWorkspaceDto = {
  workspaces: WorkspaceDto[];
};

export const getWorkspace = async (options: string = ""): Promise<ApiResponse<TeamWorkspaceDto>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TeamWorkspaceDto>>(`/workspace?${options}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get workspace by id
export const getWorkspaceById = async (id: number): Promise<ApiResponse<WorkspaceDto>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<WorkspaceDto>>(`/workspace/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Search workspaces
export const searchWorkspaces = async (name = ""): Promise<ApiResponse<WorkspaceDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<WorkspaceDto[]>>(`/workspace/dropdown?name=${name}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Requirement operations
export const addRequirementToWorkspace = async (params: Partial<RequirementDto>): Promise<ApiResponse<RequirementDto>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<RequirementDto>>("/requirement", params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateRequirementById = async (params: Partial<RequirementDto>): Promise<ApiResponse<RequirementDto>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<RequirementDto>>(`/requirement/update/${params.id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteRequirementById = async (id: number, workspace_id: number): Promise<ApiResponse<RequirementDto>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<RequirementDto>>(`/workspace/requirement/update/${id}`, {
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
): Promise<ApiResponse<RequirementDto>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<RequirementDto>>("/workspace/requirement/approve", {
      requirement_id,
      status,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getRequirementsByWorkspaceId = async (workspaceId: number): Promise<ApiResponse<RequirementDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<RequirementDto[]>>(`/requirement/${workspaceId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCollaborativeRequirements = async (): Promise<ApiResponse<RequirementDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<RequirementDto[]>>(`/requirement/collaborative`);
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
export const addCommentToProject = async (params: ProjectCommentDto): Promise<ApiResponse<ProjectCommentDto>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<ProjectCommentDto>>(`/comment/create`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateCommentById = async (comment: string, id: number): Promise<ApiResponse<ProjectCommentDto>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<ProjectCommentDto>>(`/comment/update/${id}`, { comment });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCommentById = async (
  id: number,
  type: "PROJECT" | "TASK" | "WORKSPACE"
): Promise<ApiResponse<ProjectCommentDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<ProjectCommentDto[]>>(`/comment/${type}/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

