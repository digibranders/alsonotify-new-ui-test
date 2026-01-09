export interface TaskDto {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  is_high_priority?: boolean;
  workspace_id?: number;
  requirement_id?: number;
  assigned_to?: number;
  member_id?: number;
  leader_id?: number;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  priority?: string;
  estimated_time?: number;
  time_spent?: number;
  execution_mode?: 'parallel' | 'sequential';
  
  // Relations/Nested objects often returned by different endpoints
  task_project?: {
    company?: { name: string };
    client_user?: { company?: { name: string } };
  };
  leader_user?: { id: number; name?: string; email?: string; profile_pic?: string };
  member_user?: { id: number; name?: string; email?: string; profile_pic?: string };
  assigned_to_user?: { id: number; name: string };
  task_members?: Array<{
    id: number;
    user_id: number;
    status: string;
    estimated_time: number | null;
    seconds_spent: number;
    active_worklog_start_time?: string | null;
    is_current_turn: boolean;
    user: {
      id: number;
      name: string;
      profile_pic?: string;
    };
  }>;
  
  // Additional fields observed in usage or responses
  client?: { name: string };
  client_name?: string;
  client_company_name?: string;
  manager_user?: { name: string };
  total_count?: number; // Metadata often mixed in
}
