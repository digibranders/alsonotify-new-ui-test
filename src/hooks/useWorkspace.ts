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
  type WorkspaceType,
  type RequirementType,
} from "../services/workspace";
import { getTasks } from "../services/task";
export { useClients } from "./useUser";

// Workspaces
export const useWorkspaces = (options: string = "") => {
  return useQuery({
    queryKey: ["workspaces", options],
    queryFn: () => getWorkspace(options),
  });
};

export const useWorkspaceTasks = (workspaceId: number) => {
  return useQuery({
    queryKey: ["tasks", "workspace", workspaceId],
    queryFn: () => getTasks(`project_id=${workspaceId}`),
    enabled: !!workspaceId,
  });
};

export const useWorkspace = (id: number) => {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: () => getWorkspaceById(id),
    enabled: !!id,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: WorkspaceType) => createWorkspace(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: WorkspaceType) => updateWorkspace({ id, ...params } as WorkspaceType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.id] });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

// Requirements
export const useRequirements = (workspaceId: number) => {
  return useQuery({
    queryKey: ["requirements", workspaceId],
    queryFn: () => getRequirementsByWorkspaceId(workspaceId),
    enabled: !!workspaceId,
  });
};


export const useCollaborativeRequirements = () => {
  return useQuery({
    queryKey: ["requirements", "collaborative"],
    queryFn: () => getCollaborativeRequirements(),
  });
};

export const useCreateRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RequirementType) => addRequirementToWorkspace(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requirements", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.project_id] });
      // Invalidate all requirements queries
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });
};

export const useUpdateRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RequirementType) => updateRequirementById(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requirements", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.project_id] });
      // Invalidate all requirements queries
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });
};

export const useDeleteRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, project_id }: { id: number; project_id: number }) =>
      deleteRequirementById(id, project_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requirements", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.project_id] });
      // Invalidate all requirements queries
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
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
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    },
  });
};
