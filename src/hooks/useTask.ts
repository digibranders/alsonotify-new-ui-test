import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTaskById,
  updateTaskStatusById,
  getWorkLogByTaskId,
  type TaskType,
} from "../services/task";

// Re-export useClients for convenience
export { useClients } from "./useUser";

export const useTasks = (options: string = "") => {
  return useQuery({
    queryKey: ["tasks", options],
    queryFn: () => getTasks(options),
  });
};

export const useTask = (id: number) => {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => getTaskById(id),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TaskType) => createTask(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: TaskType) => updateTask({ id, ...params } as TaskType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTaskById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTaskStatusById(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["assignedTasks"] });
    },
  });
};

export const useWorklogs = (taskId: number, limit = 50, skip = 0) => {
  return useQuery({
    queryKey: ["worklogs", taskId, limit, skip],
    queryFn: () => getWorkLogByTaskId(taskId, limit, skip),
    enabled: !!taskId,
  });
};

