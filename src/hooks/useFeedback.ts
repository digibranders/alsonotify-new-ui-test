import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  createFeedback, 
  getFeedbackList, 
  toggleFeedbackVote, 
  getAdminFeedbackList,
  updateFeedbackStatus,
  softDeleteFeedback,
  CreateFeedbackDto, 
  FeedbackListFilters,
  AdminFeedbackFilters,
  FeedbackStatus,
} from '@/services/feedback';
import { queryKeys } from "../lib/queryKeys";

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFeedbackDto) => createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.admin() });
    },
  });
}

export function useFeedbackList(filters?: FeedbackListFilters) {
  return useQuery({
    queryKey: queryKeys.feedback.list(filters as Record<string, unknown> | undefined),
    queryFn: () => getFeedbackList(filters),
  });
}

export function useToggleFeedbackVote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (feedbackId: number) => toggleFeedbackVote(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all() });
    },
  });
}

/* ---------- ADMIN HOOKS ---------- */

export function useAdminFeedbackList(filters?: AdminFeedbackFilters) {
  return useQuery({
    queryKey: queryKeys.feedback.adminList(filters as Record<string, unknown> | undefined),
    queryFn: () => getAdminFeedbackList(filters),
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeedbackStatus }) => 
      updateFeedbackStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.admin() });
    },
  });
}

export function useSoftDeleteFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => softDeleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.admin() });
    },
  });
}
