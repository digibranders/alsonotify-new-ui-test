import { TaskDto } from '../../types/dto/task.dto';
import { Task, TaskStatus } from '../../types/domain';
import { format } from 'date-fns';

export function mapTaskDtoToDomain(dto: TaskDto): Task {
  // Normalize Status
  let status: TaskStatus = 'Assigned';
  if (dto.status) {
    if (dto.status === 'In Progress' || dto.status === 'In_Progress') status = 'In_Progress';
    else if (['Completed', 'Delayed', 'Impediment', 'Review', 'Stuck', 'Assigned', 'Todo'].includes(dto.status)) {
      status = dto.status as TaskStatus;
    }
  }

  // Safe Date parsing
  const startDate = dto.start_date || '';
  const dueDate = dto.end_date || dto.due_date || '';
  const timelineDate = dto.end_date ? format(new Date(dto.end_date), 'MMM dd') : 'N/A';
  
  // assignedTo name resolution
  let assignedToName = 'Unassigned';
  if (dto.member_user?.name) assignedToName = dto.member_user.name;
  else if (dto.assigned_to_user?.name) assignedToName = dto.assigned_to_user.name;
  else if (dto.task_members && dto.task_members.length > 0) {
    assignedToName = dto.task_members[0].user?.name || 'Unassigned';
  }

  // client/project/leader resolution
  const clientName = dto.client?.name || dto.client_name || dto.task_project?.client_user?.company?.name || 'Unknown';
  const projectName = dto.task_project?.company?.name || dto.client_company_name || 'Unknown';
  const leaderName = dto.leader_user?.name || dto.manager_user?.name || 'Unknown';

  return {
    id: String(dto.id),
    name: dto.name || dto.title || 'Untitled',
    taskId: String(dto.id),
    title: dto.title || dto.name || 'Untitled', // Keep compatibility
    
    // Resolved Display Fields
    client: clientName,
    project: projectName,
    leader: leaderName,
    assignedTo: assignedToName,
    
    // Dates
    startDate,
    dueDate,
    start_date: startDate,
    end_date: dueDate,
    endDateIso: dueDate,
    
    // Metrics
    estTime: Number(dto.estimated_time || 0),
    estimated_time: Number(dto.estimated_time || 0),
    timeSpent: Number(dto.time_spent || 0),
    time_spent: Number(dto.time_spent || 0),
    activities: 0, // Not in DTO usually
    total_seconds_spent: 0, // needs calculation or separate field if available
    
    // Status & Priority
    status,
    is_high_priority: dto.is_high_priority || dto.priority === 'High' || dto.priority === 'HIGH' || false,
    
    // Timeline
    timelineDate,
    timelineLabel: status === 'Delayed' ? 'Overdue' : '',
    dueDateValue: dueDate ? new Date(dueDate).getTime() : null,
    
    // Metadata
    description: dto.description,
    workspace_id: dto.workspace_id,
    requirement_id: dto.requirement_id,
    member_id: dto.member_id,
    leader_id: dto.leader_id,
    execution_mode: dto.execution_mode,
    
    // Nested/Original - strictly map to ensure 'name' is present if object exists
    task_members: dto.task_members || [],
    worklogs: [], // Usually fetched separately or empty by default from list
    
    // Relations preserved for compatibility
    task_project: dto.task_project,
    member_user: dto.member_user ? {
      ...dto.member_user,
      name: dto.member_user.name || 'Unknown'
    } : undefined,
    leader_user: dto.leader_user ? {
      ...dto.leader_user,
      name: dto.leader_user.name || 'Unknown'
    } : undefined,
    assigned_to_user: dto.assigned_to_user,
  };
}
