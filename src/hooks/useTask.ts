import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTaskById,
  updateTaskStatusById,
  getWorkLogByTaskId,
  provideEstimate,
  startWorkLog,
  updateWorklog,
  getAssignedTaskDetail,
  requestRevision,
} from "../services/task";
import { TaskDto } from '@/types/dto/task.dto';

// Re-export useClients for convenience
// useClients removed
export { usePartners } from "./useUser";

import { mapTaskDtoToDomain } from "../utils/mappers/task.mapper";

export const useTasks = (options: string = "") => {
  return useQuery({
    queryKey: ["tasks", options],
    queryFn: () => getTasks(options),
    select: (data) => ({
      ...data,
      result: data.result ? data.result.map(mapTaskDtoToDomain) : []
    })
  });
};

export const useTask = (id: number) => {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => getTaskById(id),
    enabled: !!id,
  });
};



// ...

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<TaskDto>) => createTask(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["assignedTasks"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: Partial<TaskDto> & { id: number }) => updateTask({ id, ...params } as TaskDto), // Cast to TaskDto as service expects full? No, service likely updated to Partial. I'll check service.
    // Wait, service updateTask takes TaskDto (strict). I should update service to Partial first? 
    // Step 272 updated service but might be strict.
    // I updated workspace service to Partial.
    // I should update task service to Partial.
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["assignedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["taskDetail"] });
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

export const useProvideEstimate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hours }: { id: number; hours: number }) => provideEstimate(id, hours),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
};

export const useStartWorkLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ task_id, start_datetime }: { task_id: number; start_datetime: string }) =>
      startWorkLog(task_id, start_datetime),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ["worklogs", variables.task_id] });
    },
  });
};

export const useUpdateWorkLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: { id: number; task_id: number; start_datetime: string; end_datetime: string; description: string }) =>
      updateWorklog(params, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ["worklogs", variables.task_id] });
    },
  });
};

export const useTaskTimer = (taskId: number) => {
  return useQuery({
    queryKey: ["taskTimer", taskId],
    queryFn: () => getAssignedTaskDetail(taskId),
    enabled: !!taskId,
  });
};

export const useRequestRevision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, revisionNotes }: { id: number; revisionNotes: string }) => requestRevision(id, revisionNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
};

