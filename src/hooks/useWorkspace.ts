import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkspace,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getRequirementsByWorkspaceId,
  addRequirementToWorkspace,
  updateRequirementById,
  deleteRequirementById,
  approveRequirement,
  getCollaborativeRequirements,
  reactivateWorkspace,
} from "../services/workspace";
import { WorkspaceDto } from "../types/dto/workspace.dto";
import { RequirementDto } from "../types/dto/requirement.dto";
import { getTasks } from "../services/task";
export { usePartners } from "./useUser";

import { mapWorkspaceDtoToDomain } from "../utils/mappers/workspace";
import { queryKeys } from "../lib/queryKeys";

// Workspaces
export const useWorkspaces = (options: string = "") => {
  return useQuery({
    queryKey: queryKeys.workspaces.list(options),
    queryFn: () => getWorkspace(options),
    select: (data) => ({
      ...data,
      result: {
        ...data.result,
        workspaces: data.result && data.result.workspaces ? data.result.workspaces.map(mapWorkspaceDtoToDomain) : []
      }
    })
  });
};

import { mapTaskDtoToDomain } from "../utils/mappers/task";

export const useWorkspaceTasks = (workspaceId: number) => {
  return useQuery({
    queryKey: queryKeys.tasks.byWorkspace(workspaceId),
    queryFn: () => getTasks(`workspace_id=${workspaceId}`),
    enabled: !!workspaceId,
    select: (data) => ({
      ...data,
      result: data.result ? data.result.map(mapTaskDtoToDomain) : []
    })
  });
};

export const useWorkspace = (id: number) => {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => getWorkspaceById(id),
    enabled: !!id,
    select: (data) => ({
      ...data,
      result: data.result ? mapWorkspaceDtoToDomain(data.result) : undefined
    })
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: WorkspaceDto) => createWorkspace(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.listRoot() });
    },
  });
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: WorkspaceDto) => updateWorkspace({ id, ...params } as WorkspaceDto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.listRoot() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(variables.id) });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.listRoot() });
    },
  });
};

import { mapRequirementDtoToDomain } from "../utils/mappers/requirement";

// Requirements
export const useRequirements = (workspaceId: number) => {
  return useQuery({
    queryKey: queryKeys.requirements.byWorkspace(workspaceId),
    queryFn: () => getRequirementsByWorkspaceId(workspaceId),
    enabled: !!workspaceId,
    select: (data) => ({
      ...data,
      result: data.result ? data.result.map(mapRequirementDtoToDomain) : []
    })
  });
};


export const useCollaborativeRequirements = () => {
  return useQuery({
    queryKey: queryKeys.requirements.collaborative(),
    queryFn: () => getCollaborativeRequirements(),
  });
};

export const useCreateRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<RequirementDto>) => addRequirementToWorkspace(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.byWorkspace(variables.workspace_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(variables.workspace_id) });
      // Invalidate all requirements queries
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all() });
    },
  });
};

export const useUpdateRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<RequirementDto>) => updateRequirementById(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.byWorkspace(variables.workspace_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(variables.workspace_id) });
      // Invalidate all requirements queries
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all() });
    },
  });
};

export const useDeleteRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, workspace_id }: { id: number; workspace_id: number }) =>
      deleteRequirementById(id, workspace_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.byWorkspace(variables.workspace_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(variables.workspace_id) });
      // Invalidate all requirements queries
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all() });
    },
  });
};

export const useApproveRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requirement_id, status }: { requirement_id: number; status: "Assigned" | "Rejected" }) =>
      approveRequirement(requirement_id, status),
    onSuccess: () => {
      // Invalidate all requirements queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all() });
    },
  });
};
export const useReactivateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reactivateWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.listRoot() });
    },
  });
};
