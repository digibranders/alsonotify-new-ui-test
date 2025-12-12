import { useState, useMemo, useEffect } from 'react';
import { Plus, CheckSquare, Trash2, Users } from 'lucide-react';
import { FilterBar, FilterOption } from './FilterBar';
import { Modal, Checkbox } from "antd";
import { TaskForm, TaskFormData } from './forms/TaskForm';
import { TaskRow } from './rows/TaskRow';
import { useTasks, useCreateTask } from '@/hooks/useTask';
import { useClients as useGetClients, useEmployees } from '@/hooks/useUser';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { searchUsersByName } from '@/services/user';
import { getRequirementsDropdownByWorkspaceId } from '@/services/workspace';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { Task } from '../lib/types';

type StatusTab = 'all' | 'in-progress' | 'completed' | 'impediment';

export function TasksPage() {
  const router = useRouter();
  const { data: tasksData, isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const { data: workspacesData } = useWorkspaces();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    user: 'All',
    company: 'All',
    project: 'All',
    status: 'All'
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch users and requirements for form dropdowns
  const [usersDropdown, setUsersDropdown] = useState<Array<{ id: number; name: string }>>([]);
  const [requirementsDropdown, setRequirementsDropdown] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await searchUsersByName();
        if (response.success) {
          const transformed = (response.result || []).map((item: any) => ({
            id: item.value || item.id,
            name: item.label || item.name,
          }));
          setUsersDropdown(transformed);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        if (!workspacesData?.result?.projects) return;
        const allRequirements: Array<{ id: number; name: string }> = [];

        for (const workspace of workspacesData.result.projects) {
          try {
            const response = await getRequirementsDropdownByWorkspaceId(workspace.id);
            if (response.success && response.result) {
              allRequirements.push(...response.result);
            }
          } catch (error) {
            console.error(`Failed to fetch requirements for workspace ${workspace.id}:`, error);
          }
        }
        setRequirementsDropdown(allRequirements);
      } catch (error) {
        console.error('Failed to fetch requirements:', error);
      }
    };
    fetchRequirements();
  }, [workspacesData]);

  // Transform backend data to UI format
  // Transform backend data to UI format
  const mapBackendStatusToUI = (status: string): 'impediment' | 'in-progress' | 'completed' | 'todo' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('blocked') || statusLower === 'impediment') return 'impediment';
    if (statusLower.includes('progress') || statusLower === 'in_progress') return 'in-progress';
    if (statusLower.includes('delayed')) return 'delayed';
    return 'todo';
  };

  const tasks = useMemo(() => {
    if (!tasksData?.result) return [];
    return tasksData.result.map((t: any) => ({
      id: String(t.id),
      name: t.name || t.title || '',
      taskId: String(t.id),
      client: t.client?.name || t.client_company_name || 'In-House',
      project: t.requirement?.name || t.requirement_id ? `Requirement ${t.requirement_id}` : 'General',
      leader: t.leader?.name || 'Unassigned',
      assignedTo: t.assigned_to?.name || t.assigned_to_user?.name || 'Unassigned',
      startDate: t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      estTime: t.estimated_time || 0,
      timeSpent: t.time_spent || 0,
      activities: t.worklogs?.length || 0,
      status: mapBackendStatusToUI(t.status),
      priority: (t.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
    }));
  }, [tasksData]);

  const users = useMemo(() => {
    const userNames = tasks.map(t => t.assignedTo).filter((name): name is string => name !== 'Unassigned');
    return ['All', ...Array.from(new Set(userNames))];
  }, [tasks]);

  const companies = useMemo(() => {
    const companyNames = tasks.map(t => t.client).filter((name): name is string => name !== 'In-House');
    return ['All', ...Array.from(new Set(companyNames))];
  }, [tasks]);

  const projects = useMemo(() => {
    return ['All', ...Array.from(new Set(tasks.map(t => t.project)))];
  }, [tasks]);

  const statuses = useMemo(() => ['All', 'In Progress', 'Completed', 'Impediment'], []);

  const filterOptions: FilterOption[] = [
    { id: 'user', label: 'User', options: users, defaultValue: 'All' },
    { id: 'company', label: 'Company', options: companies, placeholder: 'Company' },
    { id: 'project', label: 'Project', options: projects, placeholder: 'Project' },
    { id: 'status', label: 'Status', options: statuses, placeholder: 'Status' }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      user: 'All',
      company: 'All',
      project: 'All',
      status: 'All'
    });
    setSearchQuery('');
  };

  const handleCreateTask = async (data: TaskFormData) => {
    if (!data.name) {
      message.error("Task name is required");
      return;
    }

    createTaskMutation.mutate(
      {
        name: data.name,
        description: data.description || '',
        status: 'IN_PROGRESS',
        priority: data.high_priority ? 'HIGH' : 'MEDIUM',
        requirement_id: data.requirement_id ? parseInt(data.requirement_id) : undefined,
        assigned_to: data.member_id ? parseInt(data.member_id) : undefined,
        leader_id: data.leader_id ? parseInt(data.leader_id) : undefined,
        project_id: data.project_id ? parseInt(data.project_id) : undefined,
        due_date: undefined, // Form doesn't seem to have due date, or it's not in TaskFormData
        start_date: data.start_date ? new Date(data.start_date).toISOString() : undefined,
        estimated_time: data.estimated_time ? parseFloat(data.estimated_time) : 0,
        high_priority: data.high_priority,
      } as any,
      {
        onSuccess: () => {
          message.success("Task created successfully!");
          setIsDialogOpen(false);
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to create task";
          message.error(errorMessage);
        },
      }
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesTab = activeTab === 'all' || task.status === activeTab;
      const matchesSearch = searchQuery === '' ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskId.includes(searchQuery) ||
        task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = filters.user === 'All' || task.assignedTo === filters.user;
      const matchesCompany = filters.company === 'All' || task.client === filters.company;
      const matchesProject = filters.project === 'All' || task.project === filters.project;
      const matchesStatus = filters.status === 'All' ||
        (filters.status === 'In Progress' && task.status === 'in-progress') ||
        (filters.status === 'Completed' && task.status === 'completed') ||
        (filters.status === 'Impediment' && task.status === 'impediment');
      return matchesTab && matchesSearch && matchesUser && matchesCompany && matchesProject && matchesStatus;
    });
  }, [tasks, activeTab, searchQuery, filters]);

  const stats = useMemo(() => ({
    all: tasks.length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    impediment: tasks.filter(t => t.status === 'impediment').length,
  }), [tasks]);

  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedTasks.includes(id)) {
      setSelectedTasks(selectedTasks.filter(taskId => taskId !== id));
    } else {
      setSelectedTasks([...selectedTasks, id]);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Tasks</h2>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
          </button>

          <Modal
            open={isDialogOpen}
            onCancel={() => setIsDialogOpen(false)}
            footer={null}
            width={600}
            centered
            className="rounded-[16px] overflow-hidden"
          >
            <div className="border-b border-[#EEEEEE] mb-6 pb-4">
              <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <CheckSquare className="w-5 h-5 text-[#666666]" />
                </div>
                Assign Task
              </div>
              <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
                Assign task for people join to team
              </p>
            </div>

            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setIsDialogOpen(false)}
              users={usersDropdown}
              requirements={requirementsDropdown}
            />
          </Modal>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-6 border-b border-[#EEEEEE]">
          {(['all', 'in-progress', 'completed', 'impediment'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${activeTab === tab
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
                }`}
            >
              {tab === 'all' ? 'All Tasks' : tab === 'in-progress' ? 'In Progress' : tab === 'completed' ? 'Completed' : 'Blocked'}
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === tab
                ? 'bg-[#ff3b3b] text-white'
                : 'bg-[#F7F7F7] text-[#666666]'
                }`}>
                {stats[tab]}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          searchPlaceholder="Search"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto pb-24 relative">
        {/* Table Header */}
        <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2.5fr_1.2fr_1fr_1fr_1.4fr_0.6fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
          <div className="flex justify-center">
            <Checkbox
              checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
              onChange={toggleSelectAll}
              className="data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
            />
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Task</p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Requirements</p>
          <div className="flex justify-center">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Assigned</p>
          </div>
          <div className="flex justify-center">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Duration</p>
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Progress</p>
          <div className="flex justify-center">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Status</p>
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
        </div>

        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selectedTasks.includes(task.id)}
              onSelect={() => toggleSelect(task.id)}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
              No tasks found
            </p>
          </div>
        ) : null}

        {/* Bulk Action Bar */}
        {selectedTasks.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2 border-r border-white/20 pr-6">
              <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {selectedTasks.length}
              </div>
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors tooltip-trigger" title="Mark as Completed">
                <CheckSquare className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Assign To">
                <Users className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => setSelectedTasks([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}