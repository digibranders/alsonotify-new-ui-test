
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Trash2, Users, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { PaginationBar } from '../../ui/PaginationBar';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Modal, Checkbox, App, Tooltip } from "antd";
import { DateRangeSelector } from '../../common/DateRangeSelector';
import { useFloatingMenu } from '../../../context/FloatingMenuContext';
import { TaskForm } from '../../modals/TaskForm';
import { TaskRow } from './rows/TaskRow';
import { useTasks, useCreateTask, useDeleteTask, useUpdateTask } from '@/hooks/useTask';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { searchEmployees } from '@/services/user';
import { getRoleFromUser } from '@/utils/roleUtils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Skeleton } from '../../ui/Skeleton';

import { useUserDetails, useCurrentUserCompany } from '@/hooks/useUser';
import { getRequirementsDropdownByWorkspaceId } from '@/services/workspace';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, differenceInCalendarDays } from 'date-fns';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import { Task, TaskStatus } from '@/types/domain';
import { TaskDto, CreateTaskRequestDto, UpdateTaskRequestDto } from '@/types/dto/task.dto';
import { getErrorMessage } from '@/types/api-utils';

// Local alias if needed to avoid massive rename, or just use Task
// transforming UITask -> Task in the code
type UITask = Task; 
type ITaskStatus = TaskStatus;

type StatusTab = 'all' | 'In_Progress' | 'Completed' | 'Delayed';

// Helper function to convert filter object to query params
// Helper function to convert filter object to query params
const toQueryParams = (params: Record<string, unknown>): string => {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== "" && value !== undefined && value !== 'All')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
};

export function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  const updateTaskMutation = useUpdateTask();
  const { data: workspacesData } = useWorkspaces();
  
  // Use new centralized hook
  const { user: currentUser } = useCurrentUser();
  
  const { data: userDetailsData } = useUserDetails(); // Keep for legacy/edge cases if needed, but prefer currentUser
  const { data: companyData } = useCurrentUserCompany();

  // Get current user's company name as fallback for in-house tasks
  const currentUserCompanyName = useMemo(() => {
    // First try the company API endpoint
    if (companyData?.result?.name) {
      return companyData.result.name;
    }
    // Fallback to centralized user hook
    if (currentUser?.company?.name) {
        return currentUser.company.name;
    }
    return null;
  }, [companyData, currentUser]);

  // Get current user name
  const currentUserName = useMemo(() => {
    if (currentUser?.name) {
        return currentUser.name;
    }
    if (currentUser?.user_profile?.first_name) {
        return currentUser.user_profile.first_name;
    }
    return null;
  }, [currentUser]);

  // Read tab from URL params
  const tabFromUrl = searchParams.get('tab');
  const initialTab = (tabFromUrl === 'In_Progress' || tabFromUrl === 'Completed' || tabFromUrl === 'Delayed')
    ? tabFromUrl as StatusTab
    : 'all';
  const [activeTab, setActiveTab] = useState<StatusTab>(initialTab);

  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'In_Progress' || tabFromUrl === 'Completed' || tabFromUrl === 'Delayed') {
      setActiveTab(tabFromUrl as StatusTab);
    } else if (tabFromUrl === null) {
      setActiveTab('all');
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState<Record<string, string>>({
    user: 'All',
    company: 'All',
    workspace: 'All',
    status: 'All',
    requirement: 'All'
  });

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Track if filter has been initialized to avoid resetting user's manual changes
  const [filterInitialized, setFilterInitialized] = useState(false);

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    limit: 10,
    skip: 0,
  });

  // Date Picker State
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch users and requirements for form dropdowns
  const [usersDropdown, setUsersDropdown] = useState<Array<{ id: number; name: string }>>([]);
  const [requirementsDropdown, setRequirementsDropdown] = useState<Array<{ id: number; name: string }>>([]);

  // Set initial filter to current user when page loads (only once)
  // Skip auto-filter for Admin users - they should see all tasks by default
  useEffect(() => {
    // Wait for user details to be sure about the role
    if (!filterInitialized && currentUserName && usersDropdown.length > 0 && userDetailsData) {
      // Check if current user is Admin
      const apiUser = userDetailsData?.result?.user || userDetailsData?.result || {};
      const userRole = getRoleFromUser(apiUser);
      const isAdmin = userRole?.toLowerCase() === 'admin';

      if (!isAdmin) {
        // Only auto-apply user filter for non-admin users
        setFilters(prev => ({ ...prev, user: currentUserName }));
      }
      setFilterInitialized(true);
    }
  }, [currentUserName, filterInitialized, usersDropdown, userDetailsData]);

  // Build query params for API call
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: pagination.limit,
      skip: pagination.skip,
    };

    // Add filters
    if (filters.user !== 'All') {
      const selectedUser = usersDropdown.find(u => u.name === filters.user);
      if (selectedUser?.id) {
        params.member_id = selectedUser.id;
      }
    }
    if (filters.company !== 'All') {
      // Need to find company ID from name - for now, we'll keep client-side filtering for company
      // params.client_company_id = filters.company;
    }
    if (filters.workspace !== 'All') {
      // Find workspace ID from name
      const selectedWorkspace = workspacesData?.result?.workspaces?.find(
        (p: { name: string; id: number }) => p.name === filters.workspace
      );
      if (selectedWorkspace?.id) {
        params.workspace_id = selectedWorkspace.id;
      }
    }
    if (filters.requirement !== 'All') {
      const selectedReq = requirementsDropdown.find(r => r.name === filters.requirement);
      if (selectedReq?.id) {
        params.requirement_id = selectedReq.id;
      }
    }
    // Add tab filter (status-based) - only if status filter is not explicitly set

    if (activeTab !== 'all' && filters.status === 'All') {
      if (activeTab === 'Completed') {
        params.status = 'Completed';
      }
      // Note: In_Progress tab shows all tasks except Assigned and Completed - filter client-side
      // Note: Delayed tab doesn't use status filter - it's time-based (end_date < today)
      // We'll filter client-side after fetching all tasks
    } else if (filters.status !== 'All') {
      // Map UI status to backend status
      const statusMap: Record<string, string> = {
        'Assigned': 'Assigned',
        'In Progress': 'In_Progress',
        'Completed': 'Completed',
        'Delayed': 'Delayed',
        'Impediment': 'Impediment',
        'Review': 'Review',
        'Stuck': 'Stuck',
      };
      params.status = statusMap[filters.status] || filters.status;
    }
    if (searchQuery) {
      params.name = searchQuery;
    }

    // Add date range filter if applicable
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.start_date = dateRange[0].format('YYYY-MM-DD');
      params.end_date = dateRange[1].format('YYYY-MM-DD');
    }


    return toQueryParams(params);
  }, [pagination.limit, pagination.skip, filters, searchQuery, dateRange, activeTab, workspacesData]);

  // Build query params for STATS (without status filter to get global counts)
  const statsQueryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: 1, // Only need one item to get status_counts
      skip: 0,
    };

    if (filters.user !== 'All') {
      const selectedUser = usersDropdown.find(u => u.name === filters.user);
      if (selectedUser?.id) {
        params.member_id = selectedUser.id;
      }
    }
    if (filters.workspace !== 'All') {
      const selectedWorkspace = workspacesData?.result?.workspaces?.find(
        (p: { name: string; id: number }) => p.name === filters.workspace
      );
      if (selectedWorkspace?.id) {
        params.workspace_id = selectedWorkspace.id;
      }
    }
    if (filters.requirement !== 'All') {
      const selectedReq = requirementsDropdown.find(r => r.name === filters.requirement);
      if (selectedReq?.id) {
        params.requirement_id = selectedReq.id;
      }
    }
    if (searchQuery) {
      params.name = searchQuery;
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.start_date = dateRange[0].format('YYYY-MM-DD');
      params.end_date = dateRange[1].format('YYYY-MM-DD');
    }

    return toQueryParams(params);
  }, [filters.workspace, searchQuery, dateRange, workspacesData]);

  // Fetch tasks with query params
  const { data: tasksData, isLoading } = useTasks(queryParams);

  // Fetch stats separately (without status filter)
  const { data: statsData } = useTasks(statsQueryParams);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await searchEmployees();
        if (response.success) {
          const transformed = (response.result || []).map((item: { label: string; value: number }) => ({
            id: item.value,
            name: item.label,
          }));
          setUsersDropdown(transformed);
        }
      } catch (error) {
        // Failed to fetch users
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        if (!workspacesData?.result?.workspaces) return;
        const allRequirements: Array<{ id: number; name: string }> = [];

        for (const workspace of workspacesData.result.workspaces) {
          try {
            const response = await getRequirementsDropdownByWorkspaceId(workspace.id);
            if (response.success && response.result) {
              allRequirements.push(...response.result);
            }
          } catch (error) {
            // Failed to fetch requirements for workspace
          }
        }
        setRequirementsDropdown(allRequirements);
      } catch (error) {
        // Failed to fetch requirements
      }
    };
    fetchRequirements();
  }, [workspacesData]);

  // Transform backend data to UI format
  // Backend statuses: 'Assigned', 'In_Progress', 'Completed', 'Delayed', 'Impediment', 'Review', 'Stuck'
  // Use backend statuses directly - no mapping needed
  const normalizeBackendStatus = (status: string): ITaskStatus => {
    if (!status) return 'Assigned';

    // Normalize status (handle both 'In_Progress' and 'In Progress')
    const normalizedStatus = status.replace(/\s+/g, '_');

    // Map to backend enum values
    const validStatuses: ITaskStatus[] = ['Assigned', 'In_Progress', 'Completed', 'Delayed', 'Impediment', 'Review', 'Stuck'];
    const matchedStatus = validStatuses.find(s => s === normalizedStatus || s.toLowerCase() === normalizedStatus.toLowerCase());

    return matchedStatus || 'Assigned'; // Default to Assigned
  };

  // Create a map of requirement IDs to names for quick lookup
  const requirementMap = useMemo(() => {
    const map = new Map<number, string>();
    requirementsDropdown.forEach(req => {
      map.set(req.id, req.name);
    });
    return map;
  }, [requirementsDropdown]);

  const tasks: UITask[] = useMemo(() => {
    if (!tasksData?.result) return [];

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return tasksData.result.map((t: Task) => {
      const startDateObj = t.start_date ? new Date(t.start_date) : null;
      const dueDateObj = t.end_date ? new Date(t.end_date) : null;

      const startDate = startDateObj
        ? startDateObj
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/ /g, '-')
        : 'TBD';

      let dueDate = 'TBD';
      let timelineDate = 'No due date';
      let timelineLabel = 'No due date';
      let isTimeOverdue = false;
      let dueDateValue: number | null = null;

      if (dueDateObj) {
        const dueMidnight = new Date(
          dueDateObj.getFullYear(),
          dueDateObj.getMonth(),
          dueDateObj.getDate()
        );

        dueDateValue = dueMidnight.getTime();

        dueDate = dueDateObj
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/ /g, '-');

        timelineDate = format(dueDateObj, 'MMM d');

        const diffDays = differenceInCalendarDays(todayMidnight, dueMidnight);

        if (diffDays > 0) {
          // Today is after due date
          isTimeOverdue = true;
          timelineLabel = `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
          timelineLabel = 'Due today';
        } else {
          const daysLeft = Math.abs(diffDays);
          timelineLabel = `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
        }
      }

      const estTime = t.estimated_time || 0;
      const timeSpent = t.time_spent || 0;
      const isOverEstimate = estTime > 0 && timeSpent > estTime;

      const baseStatus = normalizeBackendStatus(t.status || 'Assigned');
      const isDelayedByTime = isTimeOverdue || isOverEstimate;
      // If task is delayed by time but status is not already Delayed/Impediment/Stuck, mark as Delayed
      const uiStatus: ITaskStatus =
        baseStatus === 'Completed'
          ? 'Completed'
          : isDelayedByTime && !['Delayed', 'Impediment', 'Stuck'].includes(baseStatus)
            ? 'Delayed'
            : baseStatus;

      // Determine company/client name: if client exists, it's client work, otherwise show company name for in-house
      // Client company comes from task_project.client_user.company.name
      let clientCompanyName = t.task_project?.client_user?.company?.name ||
        t.client ||
        t.client_company_name ||
        null;
        
      if (clientCompanyName === 'Unknown') clientCompanyName = null;

      // For in-house tasks, get company name from task's company relation, project's company, or current user's company
      let inHouseCompanyName = t.company?.name ||
        t.company_name ||
        t.task_project?.company?.name ||
        // t.task_project?.company_name || // removed as not in DTO
        currentUserCompanyName ||
        null;
      
      if (inHouseCompanyName === 'Unknown') inHouseCompanyName = null;

      // If there's a client company, it's client work; otherwise show in-house company name
      const displayCompanyName = clientCompanyName || inHouseCompanyName || 'In-House';

      // Get requirement name - check multiple possible paths
      // First try from API response (nested relation)
      let requirementName =
        t.task_requirement?.name ||
        t.requirement_relation?.name ||
        t.requirement_name ||
        null;

      // If not found in API response, look it up from the requirements dropdown map
      if (!requirementName && t.requirement_id) {
        requirementName = requirementMap.get(t.requirement_id) || null;
      }

      const requirementDisplay = requirementName
        ? requirementName
        : t.requirement_id
          ? `Requirement ${t.requirement_id}`
          : 'General';

      return {
        id: String(t.id),
        name: t.name || t.title || '',
        taskId: String(t.id),
        client: displayCompanyName,
        project: requirementDisplay,
        leader:
          t.leader_user?.name ||
          'Unassigned',
        assignedTo:
          t.member_user?.name ||
          (typeof t.assigned_to === 'object' && t.assigned_to !== null ? (t.assigned_to as { name: string }).name : undefined) ||
          t.assigned_to_user?.name ||
          'Unassigned',
        startDate,
        dueDate,
        estTime,
        timeSpent,

        activities: t.worklogs?.length || 0,
        status: uiStatus,
        is_high_priority: t.is_high_priority ?? false,
        timelineDate,
        timelineLabel,
        dueDateValue,
        // Store IDs for editing
        workspace_id: t.workspace_id,
        requirement_id: t.requirement_id,
        member_id: t.member_user?.id || t.member_id,
        leader_id: t.leader_user?.id || t.leader_id,
        description: t.description || '',
        endDateIso: t.end_date || '',
        task_members: t.task_members || [],
        total_seconds_spent: t.total_seconds_spent || 0,
        totalSecondsSpent: t.total_seconds_spent || 0,
        execution_mode: t.execution_mode,
      };
    });
  }, [tasksData, requirementMap, currentUserCompanyName]);


  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  const currentUserId = userDetailsData?.result?.id || userDetailsData?.result?.user?.id;

  useEffect(() => {
    // side-effects after tasks change (currently none)
  }, [tasks, tasksData]);

  const users = useMemo(() => {
    return ['All', ...usersDropdown.map(u => u.name).sort()];
  }, [usersDropdown]);

  const companies = useMemo(() => {
    const companyNames = tasks.map(t => t.client).filter((name): name is string => typeof name === 'string' && name !== 'In-House');
    return ['All', ...Array.from(new Set(companyNames))];
  }, [tasks]);

  const workspaces = useMemo(() => {
    if (!workspacesData?.result?.workspaces) return ['All'];
    return ['All', ...workspacesData.result.workspaces.map((p: { name: string }) => p.name)];
  }, [workspacesData]);

  const statuses = useMemo(() => ['All', 'Assigned', 'In Progress', 'Completed', 'Delayed', 'Impediment', 'Review', 'Stuck'], []);

  const requirementsList = useMemo(() => {
    return ['All', ...requirementsDropdown.map(r => r.name).sort()];
  }, [requirementsDropdown]);

  const filterOptions: FilterOption[] = [
    { id: 'user', label: 'User', options: users, defaultValue: 'All' },
    { id: 'company', label: 'Company', options: companies, placeholder: 'Company' },
    { id: 'workspace', label: 'Workspace', options: workspaces, placeholder: 'Workspace' },
    { id: 'requirement', label: 'Requirement', options: requirementsList, placeholder: 'Requirement' },
    { id: 'status', label: 'Status', options: statuses, placeholder: 'Status' }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, current: 1, skip: 0 }));
  };

  // Reset pagination when search query or active tab changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1, skip: 0 }));
  }, [searchQuery, activeTab]);

  const clearFilters = () => {
    setFilters({
      user: 'All',
      company: 'All',
      workspace: 'All',
      status: 'All',
      requirement: 'All'
    });
    setSearchQuery('');
    // Reset to first page when clearing filters
    setPagination(prev => ({ ...prev, current: 1, skip: 0 }));
  };

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      current: page,
      pageSize,
      limit: pageSize,
      skip: (page - 1) * pageSize,
    });
  };

  const handleCreateTask = async (data: Partial<Task>) => {
    // `TaskForm` already validates all required fields, but we keep a
    // defensive check here to avoid sending an incomplete payload.
    if (!data?.start_date) {
      message.error("Start Date is required");
      return;
    }

    const payload: CreateTaskRequestDto = {
      name: data.name || '',
      start_date: data.start_date,
      end_date: data.end_date,
      assigned_to: typeof data.assigned_to === 'object' ? data.assigned_to.id : undefined,
      workspace_id: data.workspace_id,
      requirement_id: data.requirement_id,
      description: data.description,
      is_high_priority: data.is_high_priority,
      estimated_time: data.estimated_time,
      priority: data.is_high_priority ? 'High' : 'Normal', // Mapping priority based on flag
      status: 'Assigned', // Default status for new task
    };

    createTaskMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Task created successfully!");
        setIsDialogOpen(false);
      },
      onError: (error: Error) => {
        const errorMessage = getErrorMessage(error, "Failed to create task");
        message.error(errorMessage);
      },
    });
  };

  // Handle edit task
  const [editingTask, setEditingTask] = useState<UITask | null>(null);
  const handleEditTask = (task: UITask) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteTaskMutation.mutate(parseInt(taskId), {
          onSuccess: () => {
            message.success("Task deleted successfully!");
          },
          onError: (error: Error) => {
            const errorMessage = getErrorMessage(error, "Failed to delete task");
            message.error(errorMessage);
          },
        });
      },
    });
  };

  // ✅ FIX BUG #6: Bulk Delete
  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Delete Tasks',
      content: `Are you sure you want to delete ${selectedTasks.length} tasks?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await Promise.all(selectedTasks.map(id => deleteTaskMutation.mutateAsync(parseInt(id))));
          message.success(`${selectedTasks.length} tasks deleted`);
          setSelectedTasks([]);
        } catch (error) {
          message.error('Failed to delete some tasks');
        }
      },
    });
  };

  // ✅ FIX BUG #6: Bulk Complete
  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        selectedTasks.map(id => {
          // Use status 'Completed' (matching backend enum)
          return updateTaskMutation.mutateAsync({ id: parseInt(id), status: 'Completed' } as any);
        })
      );
      message.success(`${selectedTasks.length} tasks marked as completed`);
      setSelectedTasks([]);
    } catch (error) {
       message.error('Failed to complete some tasks');
    }
  };

  // Get total count from API response
  const totalTasks = useMemo(() => {
    const firstTask = tasksData?.result?.[0] as TaskDto | undefined;
    
    return firstTask?.total_count ?? tasks.length ?? 0;
  }, [tasksData, tasks.length]);

  // Apply client-side filters for user/company (since we can't easily map names to IDs)
  // Workspace filtering is now done server-side via query params
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    return tasks.filter(task => {
      // Client-side filtering for items not supported by backend yet (e.g. company name match)
      const matchesCompany = filters.company === 'All' || task.client === filters.company;

      // Date filtering (client-side since API might not support it exactly as we need)
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const from = dateRange[0].startOf('day').toDate().getTime();
        const to = dateRange[1].endOf('day').toDate().getTime();

        if (task.dueDateValue == null) {
          matchesDate = false;
        } else {
          matchesDate = task.dueDateValue >= from && task.dueDateValue <= to;
        }
      }

      // In Progress tab: show all tasks except Assigned and Completed
      if (activeTab === 'In_Progress') {
        const isActiveTask = task.status !== 'Assigned' && task.status !== 'Completed';
        if (!isActiveTask) return false;
      }

      // Delayed tab: show tasks where end_date has passed and task is NOT completed
      if (activeTab === 'Delayed') {
        const isOverdue = task.dueDateValue != null && task.dueDateValue < todayTime;
        const isNotCompleted = task.status !== 'Completed';
        if (!isOverdue || !isNotCompleted) return false;
      }

      return matchesCompany && matchesDate;
    });
  }, [tasks, filters, dateRange, activeTab]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
          case 'name':
            aVal = (a.name || '').toLowerCase();
            bVal = (b.name || '').toLowerCase();
            break;
          case 'project':
            aVal = (a.project || '').toLowerCase();
            bVal = (b.project || '').toLowerCase();
            break;
          case 'timeline':
            aVal = a.dueDateValue || 0;
            bVal = b.dueDateValue || 0;
            break;
          case 'assignedTo': {
            const getAssigneeName = (val: any) => typeof val === 'string' ? val : (val?.name || '');
            aVal = getAssigneeName(a.assignedTo).toLowerCase();
            bVal = getAssigneeName(b.assignedTo).toLowerCase();
            break;
          }
          case 'timeSpent':
            aVal = a.timeSpent || 0;
            bVal = b.timeSpent || 0;
            break;
          case 'status':
            aVal = (a.status || '').toLowerCase();
            bVal = (b.status || '').toLowerCase();
            break;
          default:
            aVal = (a as any)[sortColumn];
            bVal = (b as any)[sortColumn];
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [filteredTasks, sortColumn, sortDirection]);

  useEffect(() => {
    // side-effects after filters, search, or date label change (currently none)
  }, [tasks.length, filteredTasks.length, activeTab, searchQuery, filters]);

  // Note: Stats are now fetched separately without status filter for stable tab counts
  // Use statsData (global counts) instead of tasksData (filtered)
  const stats = useMemo(() => {
    // Stats usually come as metadata or first item. Using TaskDto to access potential extra fields
    const firstTask = statsData?.result?.[0] as unknown as { status_counts?: Record<string, number> }; 
    const backendCounts = firstTask?.status_counts || {};
    const allTasks = (statsData?.result || []) as Task[];

    // Calculate delayed count: tasks where end_date < today AND not completed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let delayedCount = 0;
    allTasks.forEach((t: Task) => {
      if (t.end_date && t.status !== 'Completed') {
        const endDateObj = new Date(t.end_date);
        endDateObj.setHours(0, 0, 0, 0);
        if (endDateObj.getTime() < todayTime) {
          delayedCount++;
        }
      }
    });

    // Calculate total from counts if available
    const calculatedTotal = (backendCounts.All) ||
      ((backendCounts.Assigned || 0) + (backendCounts.In_Progress || 0) +
        (backendCounts.Completed || 0) + (backendCounts.Delayed || 0) +
        (backendCounts.Impediment || 0) + (backendCounts.Stuck || 0) +
        (backendCounts.Review || 0));

    return {
      all: backendCounts.All || calculatedTotal || totalTasks,
      // In Progress = all tasks except Assigned and Completed
      'In_Progress': (backendCounts.In_Progress || 0) + (backendCounts.Delayed || 0) +
        (backendCounts.Impediment || 0) + (backendCounts.Stuck || 0) + (backendCounts.Review || 0),
      'Completed': backendCounts.Completed || 0,
      'Delayed': delayedCount > 0 ? delayedCount : ((backendCounts.Delayed || 0) + (backendCounts.Impediment || 0) + (backendCounts.Stuck || 0)),
    };
  }, [statsData, totalTasks]);

  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  // ✅ FIX BUG #2 Frontend: Permission check for status changes
  const canChangeTaskStatus = useCallback((task: UITask): boolean => {
    if (!currentUserId) return false;
    
    // Check if user is task leader
    const isLeader = task.leader_id === Number(currentUserId);
    
    // Check if user is a task member
    const isMember = task.task_members?.some(
      (member) => member.user_id === Number(currentUserId) || member.user?.id === Number(currentUserId)
    );
    
    return isLeader || (isMember ?? false);
  }, [currentUserId]);

  const { setExpandedContent } = useFloatingMenu();

  // Update floating menu with bulk actions
  useEffect(() => {
    if (selectedTasks.length > 0) {
      setExpandedContent(
        <>
            <div className="flex items-center gap-2 border-r border-white/20 pr-6">
              <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {selectedTasks.length}
              </div>
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip title="Mark as Completed">
                <button 
                  onClick={handleBulkComplete}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              </Tooltip>
              {/* Assign To - Future implementation 
              <Tooltip title="Assign To">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Users className="w-4 h-4" />
                </button>
              </Tooltip>
              */}
              <Tooltip title="Delete">
                <button 
                  onClick={handleBulkDelete}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <button onClick={() => setSelectedTasks([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
              Cancel
            </button>
        </>
      );
    } else {
      setExpandedContent(null);
    }

    return () => {
      setExpandedContent(null);
    };
  }, [selectedTasks]);

  const toggleSelect = (id: string) => {
    if (selectedTasks.includes(id)) {
      setSelectedTasks(selectedTasks.filter(taskId => taskId !== id));
    } else {
      setSelectedTasks([...selectedTasks, id]);
    }
  };

  const DateFilter = (
    <DateRangeSelector
      value={dateRange}
      onChange={setDateRange}
      availablePresets={['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year', 'all_time', 'custom']}
    />
  );

  return (
    <PageLayout
      title="Tasks"
      titleAction={{
        onClick: () => {
          setEditingTask(null);
          setIsDialogOpen(true);
        },
        label: "Add Task"
      }}
      tabs={[
        { id: 'all', label: 'All Tasks' },
        { id: 'In_Progress', label: 'In Progress' },
        { id: 'Completed', label: 'Completed' },
        { id: 'Delayed', label: 'Delayed', count: stats.Delayed },
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => {
        setActiveTab(tabId as StatusTab);
        const params = new URLSearchParams(searchParams.toString());
        if (tabId === 'all') {
          params.delete('tab');
        } else {
          params.set('tab', tabId);
        }
        router.push(`?${params.toString()}`);
      }}

      customFilters={DateFilter}
    >
      <Modal
        open={isDialogOpen}
        onCancel={() => {
          setIsDialogOpen(false);
          setEditingTask(null);
        }}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        styles={{
          body: {
            padding: 0,
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <TaskForm
          key={editingTask ? `edit-${editingTask.id}` : `new-${Date.now()}`}
          initialData={editingTask ? {
            name: editingTask.name,
            workspace_id: String(editingTask.workspace_id || ''),
            requirement_id: String(editingTask.requirement_id || ''),
            assigned_members: [],
            execution_mode: 'parallel',
            member_id: String(editingTask.member_id || ''),
            leader_id: String(editingTask.leader_id || ''),
            end_date: editingTask.endDateIso || '',
            estimated_time: String(editingTask.estTime || ''),
            is_high_priority: editingTask.is_high_priority,
            description: editingTask.description || '',
          } : undefined}
          isEditing={!!editingTask}
          onSubmit={(data) => {
            if (editingTask) {
              // Update task
              updateTaskMutation.mutate({
                id: parseInt(editingTask.id),
                ...data,
                // Ensure required fields for update are present
              } as UpdateTaskRequestDto, {
                onSuccess: () => {
                  message.success("Task updated successfully!");
                  setIsDialogOpen(false);
                  setEditingTask(null);
                },
                onError: (error: Error) => {
                  const errorMessage =
                    (error as any)?.response?.data?.message || (error as any)?.message || "Failed to update task";
                  message.error(errorMessage);
                },
              });
            } else {
              // Create task
              handleCreateTask(data);
            }
          }}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditingTask(null);
          }}
          users={usersDropdown}
          requirements={requirementsDropdown}
          workspaces={workspacesData?.result?.workspaces?.map((p: any) => ({
            id: p.id,
            name: p.name,
          })) || []}
        />
      </Modal>

      {/* Filters Bar */}

      {/* Filters Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
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
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Table Header */}
        <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2.5fr_1.2fr_1.1fr_1fr_0.8fr_1.5fr_0.6fr_40px] gap-4 px-4 py-3 mb-2 items-center">
          <div className="flex justify-center">
            <Checkbox
              checked={sortedTasks.length > 0 && selectedTasks.length === sortedTasks.length}
              onChange={toggleSelectAll}
              className="red-checkbox"
            />
          </div>
          
          <button
            className="flex items-center gap-1 group outline-none cursor-pointer"
            onClick={() => handleSort('name')}
          >
            <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${sortColumn === 'name' ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
              Task
            </span>
            {getSortIcon('name')}
          </button>

          <button
            className="flex items-center gap-1 group outline-none cursor-pointer"
            onClick={() => handleSort('project')}
          >
            <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${sortColumn === 'project' ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
              Requirements
            </span>
            {getSortIcon('project')}
          </button>

          <button
            className="flex items-center gap-1 group outline-none cursor-pointer"
            onClick={() => handleSort('timeline')}
          >
            <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${sortColumn === 'timeline' ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
              Due Date
            </span>
            {getSortIcon('timeline')}
          </button>

          <button
            className="flex items-center gap-1 group outline-none cursor-pointer justify-center"
            onClick={() => handleSort('assignedTo')}
          >
            <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${sortColumn === 'assignedTo' ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
              Assigned
            </span>
            {getSortIcon('assignedTo')}
          </button>

          <button
            className="flex items-center gap-1 group outline-none cursor-pointer justify-center"
            onClick={() => handleSort('timeSpent')}
          >
            <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${sortColumn === 'timeSpent' ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
              Duration
            </span>
            {getSortIcon('timeSpent')}
          </button>

          <div className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
            Progress
          </div>

          <button
            className="flex items-center gap-1 group outline-none cursor-pointer justify-center"
            onClick={() => handleSort('status')}
          >
            <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${sortColumn === 'status' ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
              Status
            </span>
            {getSortIcon('status')}
          </button>
          
          <div />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#EEEEEE] rounded-[16px] grid grid-cols-[40px_2.5fr_1.2fr_1.1fr_1fr_0.8fr_1.5fr_0.6fr_40px] gap-4 px-4 py-4 items-center">
                <div className="flex justify-center"><Skeleton className="h-4 w-4 rounded" /></div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <div className="flex justify-center"><Skeleton className="h-8 w-8 rounded-full" /></div>
                <div className="flex justify-center"><Skeleton className="h-4 w-12" /></div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-center"><Skeleton className="h-6 w-16 rounded-full" /></div>
                <div className="flex justify-center"><Skeleton className="h-4 w-4 rounded" /></div>
              </div>
            ))
          ) : sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={{
                ...task,
                 status: (task.status === 'In Progress' ? 'In_Progress' : 
                         task.status === 'Todo' ? 'Assigned' : 
                         task.status) as unknown as TaskStatus
              }}
              selected={selectedTasks.includes(task.id)}
              onSelect={() => toggleSelect(task.id)}
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onStatusChange={
                canChangeTaskStatus(task)
                  ? (status) => updateTaskMutation.mutate({ id: Number(task.id), status })
                  : undefined  // ✅ FIX BUG #2: Disable status change if no permission
              }
              currentUserId={currentUserId ? Number(currentUserId) : undefined}
            />
          ))}
        </div>

        {!isLoading && filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
              No tasks found
            </p>
          </div>
        ) : null}


      </div>

      {/* Pagination - Fixed at bottom */}
      {!isLoading && (
        <PaginationBar
          currentPage={pagination.current}
          totalItems={totalTasks}
          pageSize={pagination.pageSize}
          onPageChange={(page) => handlePaginationChange(page, pagination.pageSize)}
          onPageSizeChange={(size) => handlePaginationChange(1, size)}
          itemLabel="tasks"
        />
      )}
    </PageLayout>
  );
}