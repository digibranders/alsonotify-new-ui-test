export interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  hourlyRate: string;
  dateOfJoining: string;
  experience: number;
  skillsets: string;
  status: 'active' | 'inactive';
  department: string;
  access: 'Admin' | 'Manager' | 'Leader' | 'Employee';
  salary: number;
  currency: string;
  workingHours: number;
  leaves: number;
}

export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  status: 'active' | 'inactive';
  requirements: number;
  onboarding: string;
}

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
  status: 'impediment' | 'in-progress' | 'completed' | 'todo' | 'delayed';
  priority: 'high' | 'medium' | 'low';
}

export interface SubTask {
  id: string;
  name: string;
  taskId: string;
  assignedTo: string;
  dueDate: string;
  status: 'impediment' | 'in-progress' | 'completed' | 'todo' | 'delayed';
  type?: 'task' | 'revision';
}

export interface Requirement {
  id: number;
  title: string;
  description: string;
  company?: string;
  client: string;
  departments?: string[];
  assignedTo: string[];
  startDate?: string;
  createdDate?: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  type?: 'inhouse' | 'outsourced';
  status: 'in-progress' | 'completed' | 'delayed';
  category?: string;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  workspaceId?: number; // Optional as per RequirementsPage usage
  workspace?: string; // String name for display
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  subTasks?: SubTask[];
}

export interface Workspace {
  id: number;
  name: string;
  taskCount: number;
  client: string;
  status: 'active' | 'inactive';
}
