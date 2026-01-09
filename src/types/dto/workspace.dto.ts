export interface WorkspaceDto {
  id: number;
  name: string;
  description?: string;
  status?: string;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  
  // Counts
  total_count?: number;
  total_task?: number;
  total_task_in_progress?: number;
  total_task_delayed?: number;
  total_task_completed?: number;
  
  in_house?: boolean;
  partner_name?: string;
  company_name?: string;
  partner_id?: number;
  is_active?: boolean;
  isActive?: boolean; // sometimes used?
  
  client_user?: { name: string; id?: number };
  client?: { id: number; name: string };
  company?: { id: number; name: string };
  
  client_company_name?: string;
  assigned_users?: Array<{ name: string; image_url?: string }>;
  
  // Requirements related counts
  totalRequirements?: number;
  inProgressRequirements?: number;
  delayedRequirements?: number;
  taskCount?: number;
  inProgressCount?: number;
  delayedCount?: number;
  completedCount?: number;
}
