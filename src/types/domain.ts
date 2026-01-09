/**
 * Centralized Domain Types
 * 
 * This file contains the core domain entities used across the UI.
 * It replaces scattered local interfaces and 'any' usages.
 */

export interface Requirement {
  id: number;
  title: string;
  description: string;
  company: string;
  client: string;
  assignedTo: string[];
  dueDate: string;
  createdDate: string;
  startDate?: string;
  is_high_priority: boolean;
  type: 'inhouse' | 'outsourced' | 'client';
  status: 'in-progress' | 'completed' | 'delayed' | 'draft' | 'Waiting';
  category: string;
  departments?: string[];
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  workspaceId: number;
  workspace: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  invoiceStatus?: 'unbilled' | 'billed' | 'paid';
  estimatedCost?: number;
  budget?: number;
  hourlyRate?: number;
  estimatedHours?: number;
  pricingModel?: 'hourly' | 'project';
  contactPerson?: string;
  rejectionReason?: string;
  headerContact?: string;
  workspace_id?: number;
  headerCompany?: string;
  quotedPrice?: number;
  rawStatus?: string;
  client_id?: number;
  contact_person_id?: number;
  sender_company_id?: number;
  receiver_company_id?: number;
  receiver_company?: { name: string; id: number };
  receiver_workspace_id?: number;
  negotiation_reason?: string;
  isReceiver?: boolean;
  isSender?: boolean;
  receiver_project_id?: number;
  
  // These fields might be needed based on usage in other files, 
  // keeping them optional for now as we discover them
  project_id?: number;
  manager?: { name: string; id?: number };
  leader?: { name: string; id?: number };
  department?: { name: string; id?: number };
  
  // Backend fields used in RequirementDetailsPage (snake_case)
  pricing_model?: 'hourly' | 'project';
  start_date?: string;
  end_date?: string;
  quoted_price?: number;
  total_task?: number;
  leader_user?: { name: string; id?: number; avatar?: string };
  manager_user?: { name: string; id?: number; avatar?: string };
  sender_company?: { name: string; id?: number };
  document_link?: string;
  
  // Expanded fields for UI usage
  // 'title' is already defined above
  total_tasks?: number; // Backend alias
  // sender_company already defined above
  created_user?: { name: string; id: number };
  created_user_data?: { name: string; id: number };
  approved_by?: { id: number; name?: string };
  invoice?: { status: string; id?: number };
  invoice_id?: number;
  contact_person?: { name: string; id: number };
}

export type TaskStatus = 'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck' | 'In Progress' | 'Todo';

export interface Task {
  id: string;
  name: string;
  taskId: string;
  client: string;
  project: string;
  leader: string;
  assignedTo: string;
  startDate: string;
  dueDate: string;
  estTime: number;
  timeSpent: number;
  activities: number;
  status: TaskStatus;
  is_high_priority: boolean;
  timelineDate: string;
  timelineLabel: string;
  // For date-range filtering
  dueDateValue: number | null;
  // For editing
  workspace_id?: number;
  requirement_id?: number;
  member_id?: number;
  leader_id?: number;
  description?: string;
  endDateIso?: string; // Raw ISO string for form editing
  execution_mode?: 'parallel' | 'sequential';
  total_seconds_spent: number;
  task_members?: {
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
  }[];
  // Expanded fields for UI usage
  start_date?: string;
  end_date?: string; 
  estimated_time?: number;
  time_spent?: number;
  worklogs?: Array<{ id: number; time_spent: number }>;
  company?: { name: string; id?: number };
  company_name?: string;
  client_company_name?: string; // Added for TasksPage
  title?: string; // Added for TasksPage compatibility
  
  // Relations used in TasksPage
  task_project?: {
    client_user?: { company?: { name: string } };
    company?: { name: string };
    company_name?: string;
  };
  member_user?: { name: string; id: number; profile_pic?: string };
  leader_user?: { name: string; id: number; profile_pic?: string };
  assigned_to_user?: { name: string; id: number };
  assigned_to?: { name: string; id: number } | string; // Sometimes string in older parts
  
  // Requirement relation aliases
  task_requirement?: { name: string; id: number };
  requirement_relation?: { name: string; id: number };
  requirement_name?: string;
  requirement?: { name: string; id: number };
}

export interface Workspace {
  id: number;
  name: string;
  taskCount?: number;
  inProgressCount?: number;
  delayedCount?: number;
  completedCount?: number;
  totalRequirements?: number;
  inProgressRequirements?: number;
  delayedRequirements?: number;
  status: string;
  isActive: boolean;
  description?: string;
  partner_id?: number;
  in_house?: boolean;
  partner_name?: string;
  company_name?: string;
  client?: { id: number; name: string } | null;
  company?: { id: number; name: string } | null;
  // Additional fields used in ProjectCard
  client_company_name?: string;
  end_date?: string;
  assigned_users?: { name: string; image_url?: string }[];
  total_task?: number;
  total_task_completed?: number;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  hourlyRate: string;
  dateOfJoining: string;
  experience: number | string; // UI uses string or number sometimes
  skillsets: string;
  status: 'active' | 'inactive';
  department: string;
  access: string; // 'Admin' | 'Manager' | 'Leader' | 'Employee' but might be loose
  managerName?: string;
  manager_id?: number;
  salary: number;
  currency: string;
  workingHours: number;
  leaves: number;
  roleId?: number;
  roleColor?: string;
  employmentType?: string; // 'Full-time' | 'Contract' etc
  rawWorkingHours?: Record<string, unknown>; // Keeping loose for now as backend object structure varies
  profile_pic?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  timezone?: string;
  
  // Extended fields for EmployeesPage mapping
  user_id?: number;
  designation?: string;
  mobile_number?: string;
  user_profile?: { mobile_number?: string; phone?: string };
  user?: { mobile_number?: string; phone?: string };
  hourly_rates?: number;
  date_of_joining?: string;
  skills?: string[];
  user_employee?: { is_active?: boolean };
  employee_type?: string;
  employee_access?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date | string;
  end: Date | string;
  type: string;
  // Add more as we refactor CalendarPage
  [key: string]: unknown;
}

export interface Holiday {
  id: number | string;
  name: string;
  date: string;
  is_api?: boolean;
  is_deleted?: boolean;
}

export interface Department {
  id: string | number;
  name: string;
  active?: boolean;
  is_active?: boolean;
}

export interface Role {
  id: number;
  name: string;
  color?: string;
  description?: string;
  is_active?: boolean;
}
