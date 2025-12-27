import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Trash2, Users, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Modal, Checkbox, Popover, App } from "antd";
import { TaskForm } from '../../modals/TaskForm';
import { TaskRow } from './rows/TaskRow';
import { useTasks, useCreateTask, useDeleteTask, useUpdateTask } from '@/hooks/useTask';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { searchUsersByName } from '@/services/user';
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

type ITaskStatus = 'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck';

type UITask = {
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
  status: ITaskStatus;
  priority: 'high' | 'medium' | 'low';
  timelineDate: string;
  timelineLabel: string;
  // For date-range filtering
  dueDateValue: number | null;
  // For editing
  project_id?: number;
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
};

type StatusTab = 'all' | 'In_Progress' | 'Completed' | 'Delayed';

// Helper functions for date presets
const getPresetDateRangeHelper = (preset: string, now: Date): [Date, Date] | null => {
  let from: Date, to: Date;

  switch (preset) {
    case "This week":
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      return [from, to];
    case "This month":
      from = startOfMonth(now);
      to = endOfMonth(now);
      return [from, to];
    case "Last Month":
      const lastMonth = subMonths(now, 1);
      from = startOfMonth(lastMonth);
      to = endOfMonth(lastMonth);
      return [from, to];
    case "This Year":
      from = startOfYear(now);
      to = endOfYear(now);
      return [from, to];
    default:
      return null;
  }
};

const datesMatchHelper = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return date1.getTime() === date2.getTime();
};

// Helper function to convert filter object to query params
const toQueryParams = (params: Record<string, any>): string => {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== "" && value !== undefined && value !== 'All')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
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
  const { data: userDetailsData } = useUserDetails();
  const { data: companyData } = useCurrentUserCompany();

  // Get current user's company name as fallback for in-house tasks
  const currentUserCompanyName = useMemo(() => {
    // First try the company API endpoint
    if (companyData?.result?.name) {
      return companyData.result.name;
    }
    // Fallback to user details
    try {
      if (typeof window !== 'undefined') {
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (localUser?.company?.name) {
          return localUser.company.name;
        }
      }
    } catch (error) {
      // Error reading company from localStorage
    }
    const apiUser = userDetailsData?.result?.user || userDetailsData?.result || {};
    return apiUser?.company?.name || null;
  }, [companyData, userDetailsData]);

  // Get current user name
  const currentUserName = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (localUser && localUser.name) {
          return localUser.name;
        }
      }
    } catch (error) {
      // Error reading user from localStorage
    }
    const apiUser = userDetailsData?.result?.user || userDetailsData?.result || {};
    return apiUser.name || apiUser.user_profile?.first_name || null;
  }, [userDetailsData]);

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

  // Initialize filters
  const [filters, setFilters] = useState<Record<string, string>>({
    user: 'All',
    company: 'All',
    workspace: 'All',
    status: 'All',
    requirement: 'All'
  });

  // Track if filter has been initialized to avoid resetting user's manual changes
  const [filterInitialized, setFilterInitialized] = useState(false);

  // Set initial filter to current user when page loads (only once)
  useEffect(() => {
    if (currentUserName && !filterInitialized) {
      setFilters(prev => ({ ...prev, user: currentUserName }));
      setFilterInitialized(true);
    }
  }, [currentUserName, filterInitialized]);
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
  const [dateLabel, setDateLabel] = useState<string>("All time");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [dateView, setDateView] = useState<'presets' | 'calendar'>('presets');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch users and requirements for form dropdowns
  const [usersDropdown, setUsersDropdown] = useState<Array<{ id: number; name: string }>>([]);
  const [requirementsDropdown, setRequirementsDropdown] = useState<Array<{ id: number; name: string }>>([]);

  // Build query params for API call
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: pagination.limit,
      skip: pagination.skip,
    };

    // Add filters
    if (filters.user !== 'All') {
      // Need to find user ID from name - for now, we'll keep client-side filtering for user
      // params.member_id = filters.user;
    }
    if (filters.company !== 'All') {
      // Need to find company ID from name - for now, we'll keep client-side filtering for company
      // params.client_company_id = filters.company;
    }
    if (filters.workspace !== 'All') {
      // Find workspace ID from name
      const selectedWorkspace = workspacesData?.result?.projects?.find(
        (p: any) => p.name === filters.workspace
      );
      if (selectedWorkspace?.id) {
        params.project_id = selectedWorkspace.id;
      }
    }
    // Add tab filter (status-based) - only if status filter is not explicitly set
    if (activeTab !== 'all' && filters.status === 'All') {
      if (activeTab === 'In_Progress') {
        params.status = 'In_Progress';
      } else if (activeTab === 'Completed') {
        params.status = 'Completed';
      } else if (activeTab === 'Delayed') {
        params.status = 'Delayed';
      }
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
    const params: Record<string, any> = {
      limit: 1, // Only need one item to get status_counts
      skip: 0,
    };

    // Apply same filters EXCEPT status/activeTab
    if (filters.workspace !== 'All') {
      const selectedWorkspace = workspacesData?.result?.projects?.find(
        (p: any) => p.name === filters.workspace
      );
      if (selectedWorkspace?.id) {
        params.project_id = selectedWorkspace.id;
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
        const response = await searchUsersByName();
        if (response.success) {
          const transformed = (response.result || []).map((item: any) => ({
            id: item.value || item.id,
            name: item.label || item.name,
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
        if (!workspacesData?.result?.projects) return;
        const allRequirements: Array<{ id: number; name: string }> = [];

        for (const workspace of workspacesData.result.projects) {
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

    return tasksData.result.map((t: any) => {
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

      const baseStatus = normalizeBackendStatus(t.status);
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
      const clientCompanyName = (t as any).task_project?.client_user?.company?.name ||
        t.client?.name ||
        t.client_company_name ||
        null;

      // For in-house tasks, get company name from task's company relation, project's company, or current user's company
      const inHouseCompanyName = t.company?.name ||
        t.company_name ||
        (t as any).task_project?.company?.name ||
        (t as any).task_project?.company_name ||
        currentUserCompanyName ||
        null;

      // If there's a client company, it's client work; otherwise show in-house company name
      const displayCompanyName = clientCompanyName || inHouseCompanyName || 'In-House';

      // Get requirement name - check multiple possible paths
      // First try from API response (nested relation)
      let requirementName =
        (t as any).requirement?.name ||
        (t as any).task_requirement?.name ||
        (t as any).requirement_relation?.name ||
        (t as any).requirement_name ||
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
          t.leader?.name ||
          (t as any).leader_user?.name ||
          'Unassigned',
        assignedTo:
          (t as any).member_user?.name ||
          t.assigned_to?.name ||
          t.assigned_to_user?.name ||
          'Unassigned',
        startDate,
        dueDate,
        estTime,
        timeSpent,
        activities: t.worklogs?.length || 0,
        status: uiStatus,
        priority: (t.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
        timelineDate,
        timelineLabel,
        dueDateValue,
        // Store IDs for editing
        project_id: t.project_id,
        requirement_id: t.requirement_id,
        member_id: (t as any).member_user?.id || t.member_id,
        leader_id: (t as any).leader_user?.id || t.leader_id,
        description: t.description || '',
        endDateIso: t.end_date || '',
        task_members: t.task_members || [],
        total_seconds_spent: (t as any).total_seconds_spent || 0,
        execution_mode: (t as any).execution_mode,
      };
    });
  }, [tasksData, requirementMap, currentUserCompanyName]);

  const currentUserId = userDetailsData?.result?.id || userDetailsData?.result?.user?.id;

  useEffect(() => {
    // side-effects after tasks change (currently none)
  }, [tasks, tasksData]);

  const users = useMemo(() => {
    // Collect all unique member names from task_members
    const userNames = new Set<string>();
    tasks.forEach(t => {
      // Add primary assignee
      if (t.assignedTo && t.assignedTo !== 'Unassigned') {
        userNames.add(t.assignedTo);
      }
      // Add all task members
      t.task_members?.forEach((m: any) => {
        if (m.user?.name) {
          userNames.add(m.user.name);
        }
      });
    });
    return ['All', 'Multiple', ...Array.from(userNames).sort()];
  }, [tasks]);

  const companies = useMemo(() => {
    const companyNames = tasks.map(t => t.client).filter((name): name is string => typeof name === 'string' && name !== 'In-House');
    return ['All', ...Array.from(new Set(companyNames))];
  }, [tasks]);

  const workspaces = useMemo(() => {
    if (!workspacesData?.result?.projects) return ['All'];
    return ['All', ...workspacesData.result.projects.map((p: any) => p.name)];
  }, [workspacesData]);

  const statuses = useMemo(() => ['All', 'Assigned', 'In Progress', 'Completed', 'Delayed', 'Impediment', 'Review', 'Stuck'], []);

  const requirements = useMemo(() => {
    const requirementNames = tasks.map(t => t.project).filter((name): name is string => typeof name === 'string' && name !== 'General');
    return ['All', ...Array.from(new Set(requirementNames))];
  }, [tasks]);

  const filterOptions: FilterOption[] = [
    { id: 'user', label: 'User', options: users, defaultValue: 'All' },
    { id: 'company', label: 'Company', options: companies, placeholder: 'Company' },
    { id: 'workspace', label: 'Workspace', options: workspaces, placeholder: 'Workspace' },
    { id: 'requirement', label: 'Requirement', options: requirements, placeholder: 'Requirement' },
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

  const handleCreateTask = async (data: any) => {
    // `TaskForm` already validates all required fields, but we keep a
    // defensive check here to avoid sending an incomplete payload.
    if (!data?.start_date) {
      message.error("Start Date is required");
      return;
    }

    createTaskMutation.mutate(data as any, {
      onSuccess: () => {
        message.success("Task created successfully!");
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message || error?.message || "Failed to create task";
        message.error(errorMessage);
      },
    });
  };

  // Handle edit task
  const [editingTask, setEditingTask] = useState<any>(null);
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
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message || error?.message || "Failed to delete task";
            message.error(errorMessage);
          },
        });
      },
    });
  };

  // Get total count from API response
  const totalTasks = useMemo(() => {
    const firstTask = tasksData?.result?.[0] as any;
    return firstTask?.total_count ?? tasks.length ?? 0;
  }, [tasksData, tasks.length]);

  // Apply client-side filters for user/company (since we can't easily map names to IDs)
  // Workspace filtering is now done server-side via query params
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Client-side filtering for user, company, requirement (name-based)
      // Check if ANY task member's name matches the filter (not just the primary assignee)
      let matchesUser = true;
      if (filters.user === 'All') {
        matchesUser = true;
      } else if (filters.user === 'Multiple') {
        // Show tasks with multiple members
        matchesUser = (task.task_members?.length || 0) > 1;
      } else {
        // Show tasks where the selected user is a member
        matchesUser = task.assignedTo === filters.user ||
          (task.task_members?.some((m: any) => m.user?.name === filters.user) || false);
      }
      const matchesCompany = filters.company === 'All' || task.client === filters.company;
      const matchesRequirement = filters.requirement === 'All' || task.project === filters.requirement;

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

      return matchesUser && matchesCompany && matchesRequirement && matchesDate;
    });
  }, [tasks, filters, dateRange]);

  useEffect(() => {
    // side-effects after filters, search, or date label change (currently none)
  }, [tasks.length, filteredTasks.length, activeTab, searchQuery, filters, dateLabel]);

  // Note: Stats are now fetched separately without status filter for stable tab counts
  // Use statsData (global counts) instead of tasksData (filtered)
  const stats = useMemo(() => {
    const firstTask = statsData?.result?.[0] as any;
    const backendCounts = firstTask?.status_counts || {};

    // Calculate total from counts if available
    const calculatedTotal = (backendCounts.All) ||
      ((backendCounts.Assigned || 0) + (backendCounts.In_Progress || 0) +
        (backendCounts.Completed || 0) + (backendCounts.Delayed || 0) +
        (backendCounts.Impediment || 0) + (backendCounts.Stuck || 0) +
        (backendCounts.Review || 0));

    return {
      all: backendCounts.All || calculatedTotal || totalTasks,
      'In_Progress': backendCounts.In_Progress || 0,
      'Completed': backendCounts.Completed || 0,
      'Delayed': (backendCounts.Delayed || 0) + (backendCounts.Impediment || 0) + (backendCounts.Stuck || 0),
    };
  }, [statsData, totalTasks]);

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

  // Date Presets
  const datePresets = [
    "This week",
    "This month",
    "Last Month",
    "This Year",
    "All time",
    "Custom"
  ];

  // Helper function to get date range for a preset
  const getPresetDateRange = (preset: string): [Date, Date] | null => {
    return getPresetDateRangeHelper(preset, new Date());
  };

  // Update label when dateRange changes or dropdown opens
  const updateDateLabel = useCallback((range: [Dayjs | null, Dayjs | null] | null) => {
    let detectedPreset: string | null = null;
    if (range && range[0] && range[1]) {
      const from = range[0].toDate();
      const to = range[1].toDate();

      for (const preset of ["This week", "This month", "Last Month", "This Year"]) {
        const presetRange = getPresetDateRangeHelper(preset, new Date());
        if (presetRange && datesMatchHelper(from, presetRange[0]) && datesMatchHelper(to, presetRange[1])) {
          detectedPreset = preset;
          break;
        }
      }
    } else {
      detectedPreset = "All time";
    }

    if (detectedPreset) {
      setDateLabel(detectedPreset);
    } else if (range && range[0] && range[1]) {
      setDateLabel(`${format(range[0].toDate(), "MMM d")} - ${format(range[1].toDate(), "MMM d")}`);
    } else {
      setDateLabel("All time");
    }
  }, []);

  const handleSelectDatePreset = (preset: string) => {
    if (preset === "Custom") {
      setDateView('calendar');
      if (dateRange && dateRange[0] && dateRange[1]) {
        setStartDate(dateRange[0]);
        setEndDate(dateRange[1]);
        setCurrentMonth(dateRange[0]);
      } else {
        setStartDate(null);
        setEndDate(null);
        setCurrentMonth(dayjs());
      }
    } else {
      setDateView('presets');
      if (preset === "All time") {
        setDateRange(null);
        setDateLabel("All time");
        setStartDate(null);
        setEndDate(null);
      } else {
        const presetRange = getPresetDateRange(preset);
        if (presetRange) {
          const newRange: [Dayjs, Dayjs] = [dayjs(presetRange[0]), dayjs(presetRange[1])];
          setDateRange(newRange);
          setDateLabel(preset);
          setStartDate(newRange[0]);
          setEndDate(newRange[1]);
        }
      }
      setIsDateOpen(false);
    }
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const days: Dayjs[] = [];
    let current = start;
    while (current.isSameOrBefore(end, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }
    return days;
  };

  // Check if date is in selected range (for highlighting)
  const isDateInRange = (date: Dayjs) => {
    if (!startDate || !endDate) {
      return false;
    }
    const start = startDate.isBefore(endDate) ? startDate : endDate;
    const end = startDate.isBefore(endDate) ? endDate : startDate;
    return date.isAfter(start.startOf('day')) && date.isBefore(end.endOf('day'));
  };

  // Check if date is start or end of range
  const isDateStartOrEnd = (date: Dayjs) => {
    if (!startDate || !endDate) {
      if (startDate) {
        return date.isSame(startDate, 'day');
      }
      return false;
    }
    return date.isSame(startDate, 'day') || date.isSame(endDate, 'day');
  };

  // Handle Manual Date Selection (custom calendar)
  const handleDateClick = (date: Dayjs) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      let finalStart = startDate;
      let finalEnd = date;

      if (date.isBefore(startDate)) {
        finalStart = date;
        finalEnd = startDate;
      }

      setStartDate(finalStart);
      setEndDate(finalEnd);
      const newRange: [Dayjs, Dayjs] = [finalStart, finalEnd];
      setDateRange(newRange);
      updateDateLabel(newRange);
      setIsDateOpen(false);
      setDateView('presets');
    }
  };

  // Reset date view when popover closes
  useEffect(() => {
    if (!isDateOpen && dateView === 'calendar') {
      setDateView('presets');
    }
  }, [isDateOpen, dateView]);

  // Date Filter Component
  const DateFilter = (
    <Popover
      open={isDateOpen}
      onOpenChange={setIsDateOpen}
      trigger="click"
      placement="bottomRight"
      overlayClassName={dateView === 'calendar' ? 'date-range-popover-calendar' : 'date-range-popover-presets'}
      content={
        <div className="w-auto">
          {dateView === 'calendar' ? (
            <div className="bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg w-[280px] p-3">
              {/* Select Range Header */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setDateView('presets');
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-[#F7F7F7] rounded transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#666666]" />
                </button>
                <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                  Select Range
                </h4>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                  className="w-7 h-7 rounded-lg bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#111111]" />
                </button>
                <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                  {currentMonth.format('MMMM YYYY')}
                </h4>
                <button
                  onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                  className="w-7 h-7 rounded-lg bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#111111]" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center text-[11px] font-['Manrope:Regular',sans-serif] text-[#999999] py-0.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = date.month() === currentMonth.month();
                  const isInRange = isDateInRange(date);
                  const isStartOrEnd = isDateStartOrEnd(date);

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        w-8 h-8 rounded-lg text-[12px] font-['Manrope:Regular',sans-serif] transition-colors
                        ${!isCurrentMonth ? 'text-[#CCCCCC]' : 'text-[#111111]'}
                        ${isStartOrEnd
                          ? 'bg-[#111111] text-white'
                          : isInRange
                            ? 'bg-[#F7F7F7]'
                            : 'hover:bg-[#F7F7F7]'
                        }
                      `}
                    >
                      {date.date()}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-1 min-w-[140px]">
              {datePresets.map((preset) => {
                const isActive =
                  (preset === "All time" && !dateRange) ||
                  (preset !== "All time" && preset !== "Custom" && dateLabel === preset);

                return (
                  <button
                    key={preset}
                    onClick={() => handleSelectDatePreset(preset)}
                    className={`text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${isActive
                      ? 'text-[#ff3b3b] font-medium bg-gray-50'
                      : 'text-[#111111]'
                      }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    >
      <button className="h-9 px-3 text-[12px] font-medium rounded-lg bg-white border border-[#EEEEEE] hover:border-[#ff3b3b] hover:text-[#ff3b3b] transition-all flex items-center gap-2 outline-none min-w-[140px] justify-between">
        <span className="truncate">{dateLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
    </Popover>
  );

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Title + Add button */}
          <div className="flex items-center gap-2">
            <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">
              Tasks
            </h2>

            <button
              onClick={() => {
                setEditingTask(null); // Reset editing task for new task
                setIsDialogOpen(true);
              }}
              className="hover:scale-110 active:scale-95 transition-transform"
            >
              <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
            </button>

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
                },
              }}
            >
              <TaskForm
                key={editingTask ? `edit-${editingTask.id}` : `new-${Date.now()}`}
                initialData={editingTask ? {
                  name: editingTask.name,
                  project_id: String(editingTask.project_id || ''),
                  requirement_id: String(editingTask.requirement_id || ''),
                  assigned_members: [],
                  execution_mode: 'parallel',
                  member_id: String(editingTask.member_id || ''),
                  leader_id: String(editingTask.leader_id || ''),
                  end_date: editingTask.endDateIso || '',
                  estimated_time: String(editingTask.estTime || ''),
                  high_priority: editingTask.priority === 'high',
                  description: editingTask.description || '',
                } : undefined}
                isEditing={!!editingTask}
                onSubmit={(data) => {
                  if (editingTask) {
                    // Update task
                    updateTaskMutation.mutate({
                      id: parseInt(editingTask.id),
                      ...data,
                    } as any, {
                      onSuccess: () => {
                        message.success("Task updated successfully!");
                        setIsDialogOpen(false);
                        setEditingTask(null);
                      },
                      onError: (error: any) => {
                        const errorMessage =
                          error?.response?.data?.message || error?.message || "Failed to update task";
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
                workspaces={workspacesData?.result?.projects?.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                })) || []}
              />
            </Modal>
          </div>

          {/* Right: Date range selector */}
          {DateFilter}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center">
          <div className="flex items-center gap-6 border-b border-[#EEEEEE]">
            {(['all', 'In_Progress', 'Completed', 'Delayed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${activeTab === tab
                  ? 'text-[#ff3b3b]'
                  : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                {tab === 'all' ? 'All Tasks' : tab === 'In_Progress' ? 'In Progress' : tab === 'Completed' ? 'Completed' : 'Delayed'}
                <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === tab
                  ? 'bg-[#ff3b3b] text-white'
                  : 'bg-[#F7F7F7] text-[#666666]'
                  }`}>
                  {tab === 'all' ? stats.all : stats[tab]}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

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
              checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
              onChange={toggleSelectAll}
              className="red-checkbox"
            />
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
            Task
          </p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
            Requirements
          </p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
            Timeline
          </p>
          <div className="flex justify-center">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
              Assigned
            </p>
          </div>
          <div className="flex justify-center">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
              Duration
            </p>
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
            Progress
          </p>
          <div className="flex justify-center">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
              Status
            </p>
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selectedTasks.includes(task.id)}
              onSelect={() => toggleSelect(task.id)}
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onStatusChange={(status) => updateTaskMutation.mutate({ id: task.id, status } as any)}
              currentUserId={currentUserId ? Number(currentUserId) : undefined}
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

      {/* Pagination - Fixed at bottom */}
      {!isLoading && totalTasks > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-[#EEEEEE] pt-6">
          <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
            {pagination.skip + 1}-{Math.min(pagination.skip + pagination.pageSize, totalTasks)} of {totalTasks} tasks
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePaginationChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current === 1}
              className="w-8 h-8 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-[#666666]" />
            </button>

            {Array.from({ length: Math.min(5, Math.ceil(totalTasks / pagination.pageSize)) }, (_, i) => {
              const totalPages = Math.ceil(totalTasks / pagination.pageSize);
              let pageNum: number;

              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.current <= 3) {
                pageNum = i + 1;
              } else if (pagination.current >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.current - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePaginationChange(pageNum, pagination.pageSize)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all font-['Manrope:SemiBold',sans-serif] text-[13px] ${pagination.current === pageNum
                    ? 'bg-[#ff3b3b] text-white'
                    : 'border border-[#EEEEEE] text-[#666666] hover:bg-[#F7F7F7]'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePaginationChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(totalTasks / pagination.pageSize)}
              className="w-8 h-8 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-[#666666]" />
            </button>

            <select
              value={pagination.pageSize}
              onChange={(e) => handlePaginationChange(1, Number(e.target.value))}
              className="ml-2 px-2 py-1 rounded-lg border border-[#EEEEEE] text-[13px] font-['Manrope:Regular',sans-serif] text-[#666666] bg-white hover:bg-[#F7F7F7] hover:border-[#EEEEEE] focus:outline-none focus:border-[#ff3b3b] transition-colors cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}