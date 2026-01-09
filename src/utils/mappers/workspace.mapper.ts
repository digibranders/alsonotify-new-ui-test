import { WorkspaceDto } from '../../types/dto/workspace.dto';
import { Workspace } from '../../types/domain';

export function mapWorkspaceDtoToDomain(dto: WorkspaceDto): Workspace {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    status: dto.status || 'Active',
    isActive: dto.is_active !== false, // Default to true if undefined, strict false check
    
    taskCount: dto.taskCount ?? dto.total_count ?? dto.total_task ?? 0,
    inProgressCount: dto.inProgressCount ?? dto.total_task_in_progress ?? 0,
    delayedCount: dto.delayedCount ?? dto.total_task_delayed ?? 0,
    completedCount: dto.completedCount ?? dto.total_task_completed ?? 0,
    
    totalRequirements: dto.totalRequirements ?? 0,
    inProgressRequirements: dto.inProgressRequirements ?? 0,
    delayedRequirements: dto.delayedRequirements ?? 0,
    
    partner_id: dto.partner_id,
    in_house: dto.in_house,
    partner_name: dto.partner_name,
    company_name: dto.company_name,
    client: dto.client || dto.client_user ? { id: dto.client_user?.id || dto.client?.id || 0, name: dto.client_user?.name || dto.client?.name || 'Unknown' } : null,
    company: dto.company || null,
    
    client_company_name: dto.client_company_name || dto.client_user?.name, // fallback
    end_date: dto.end_date,
    assigned_users: dto.assigned_users,
    total_task: dto.total_task,
    total_task_completed: dto.total_task_completed
  };
}
