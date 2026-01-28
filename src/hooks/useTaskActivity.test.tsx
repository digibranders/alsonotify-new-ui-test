import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTaskActivities, useCreateTaskActivity } from './useTaskActivity';
import * as TaskActivityService from '@/services/task-activity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { TaskActivityDto } from '@/services/task-activity';

vi.mock('@/services/task-activity');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useTaskActivity Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('useTaskActivities should fetch and return data', async () => {
    const mockData = {
      success: true,
      message: 'Success',
      result: [{
        id: 1,
        message: 'Test',
        type: 'CHAT',
        user_id: 1,
        task_id: 123,
        created_at: new Date().toISOString(),
        user: { id: 1, name: 'User' },
        attachments: []
      } as unknown as TaskActivityDto]
    };
    vi.spyOn(TaskActivityService, 'getTaskActivities').mockResolvedValue(mockData);

    const { result } = renderHook(() => useTaskActivities(123), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('useCreateTaskActivity should call service and invalidate queries', async () => {
    const mockResult = {
      success: true,
      message: 'Created',
      result: {
        id: 1,
        message: 'New',
        type: 'CHAT',
        user_id: 1,
        task_id: 123,
        created_at: new Date().toISOString(),
        user: { id: 1, name: 'User' },
        attachments: []
      } as unknown as TaskActivityDto
    };
    const createSpy = vi.spyOn(TaskActivityService, 'createTaskActivity').mockResolvedValue(mockResult);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTaskActivity(), { wrapper });

    result.current.mutate({ task_id: 123, message: 'New', type: 'CHAT' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createSpy).toHaveBeenCalled();
    // Check if invalidateQueries was called with the correct key
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks', 'activities', 123] });
  });
});
