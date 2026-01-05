import axios from '@/config/axios';

// Types
export enum FeedbackType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  IMPROVEMENT = 'IMPROVEMENT',
  OTHER = 'OTHER',
}

export enum FeedbackStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
}

export interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  type: FeedbackType;
  status: FeedbackStatus;
  company_id: number;
  created_by: number;
  created_at: string;
  is_active: boolean;
  is_deleted: boolean;
  voteCount?: number;
  hasVoted?: boolean;
  createdBy?: {
    id: number;
    name: string | null;
    email: string;
  };
}

export interface CreateFeedbackDto {
  title: string;
  description: string;
  type: FeedbackType;
}

export interface FeedbackListFilters {
  status?: FeedbackStatus | string;
  type?: FeedbackType | string;
  search?: string;
}

// API Functions
export async function createFeedback(data: CreateFeedbackDto) {
  const res = await axios.post<{ success: boolean; result: FeedbackItem }>('/feedback', data);
  return res.data.result;
}

export async function getFeedbackList(filters?: FeedbackListFilters) {
  const res = await axios.get<{ success: boolean; result: FeedbackItem[] }>('/feedback', {
    params: filters,
  });
  return res.data.result;
}

export async function toggleFeedbackVote(feedbackId: number) {
  const res = await axios.post<{ success: boolean; result: { voted: boolean } }>(
    `/feedback/${feedbackId}/vote`
  );
  return res.data.result;
}

/* ---------- ADMIN ENDPOINTS ---------- */

export interface AdminFeedbackFilters {
  status?: FeedbackStatus | string;
  type?: FeedbackType | string;
  includeDeleted?: boolean;
}

/** Admin: list all feedbacks for company */
export async function getAdminFeedbackList(filters?: AdminFeedbackFilters) {
  const res = await axios.get<{ success: boolean; result: FeedbackItem[] }>(
    '/feedback/company',
    { params: filters }
  );
  return res.data.result;
}

/** Admin: update feedback status */
export async function updateFeedbackStatus(id: number, status: FeedbackStatus) {
  const res = await axios.patch<{ success: boolean; result: FeedbackItem }>(
    `/feedback/company/${id}/${status}`
  );
  return res.data.result;
}

/** Admin: soft delete feedback */
export async function softDeleteFeedback(id: number) {
  const res = await axios.delete<{ success: boolean; result: FeedbackItem }>(
    `/feedback/${id}`
  );
  return res.data.result;
}
