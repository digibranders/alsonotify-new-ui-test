import { WorkspaceDto } from '../../types/dto/workspace.dto';
import { Workspace } from '../../types/domain';

export function mapWorkspaceToDomain(dto: WorkspaceDto): Workspace {
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
    
    partnerId: dto.partner_id,
    partner_id: dto.partner_id,
    inHouse: dto.in_house,
    in_house: dto.in_house,
    partnerName: dto.partner_name,
    partner_name: dto.partner_name,
    companyName: dto.company_name,
    company_name: dto.company_name,
    
    client: dto.client || dto.client_user ? { id: dto.client_user?.id || dto.client?.id || 0, name: dto.client_user?.name || dto.client?.name || null } : null,
    company: dto.company || null,
    
    clientCompanyName: dto.client_company_name || dto.client_user?.name, // fallback
    client_company_name: dto.client_company_name || dto.client_user?.name, // fallback
    
    endDate: dto.end_date,
    end_date: dto.end_date,
    assignedUsers: dto.assigned_users?.map(u => ({ ...u, imageUrl: u.image_url })),
    assigned_users: dto.assigned_users,
    
    totalTask: dto.total_task,
    total_task: dto.total_task,
    totalTaskCompleted: dto.total_task_completed,
    total_task_completed: dto.total_task_completed
  };
}

export const mapWorkspaceDtoToDomain = mapWorkspaceToDomain;
