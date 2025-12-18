import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Trash2, Users, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Modal, Checkbox, Popover } from "antd";
import { TaskForm } from '../../modals/TaskForm';
import { TaskRow } from './rows/TaskRow';
import { useTasks, useCreateTask } from '@/hooks/useTask';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { searchUsersByName } from '@/services/user';
import { getRequirementsDropdownByWorkspaceId } from '@/services/workspace';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, differenceInCalendarDays } from 'date-fns';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

type ITaskStatus = 'in-progress' | 'completed' | 'delayed' | 'todo' | 'review';

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
};

type StatusTab = 'all' | 'in-progress' | 'completed' | 'delayed';

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
  // Backend statuses: 'Assigned', 'In_Progress', 'Completed', 'Delayed', 'Impediment', 'Review', 'Stuck'
  const mapBackendStatusToUI = (status: string): 'in-progress' | 'completed' | 'delayed' | 'todo' | 'review' => {
    if (!status) return 'todo';
    
    // Normalize status (handle both 'In_Progress' and 'In Progress')
    const normalizedStatus = status.replace(/\s+/g, '_');
    
    // Map exact backend statuses to UI statuses
    switch (normalizedStatus) {
      case 'Assigned':
        return 'todo'; // Not started yet - shows clock icon
      case 'In_Progress':
        return 'in-progress'; // Active work - shows blue rotating ring
      case 'Completed':
        return 'completed'; // Done - shows green circle with checkmark
      case 'Delayed':
        return 'delayed'; // Delayed - shows red circle with exclamation
      case 'Impediment':
        return 'delayed'; // Blocked/Impediment - shows red circle with exclamation
      case 'Stuck':
        return 'delayed'; // Stuck - shows red circle with exclamation
      case 'Review':
        return 'review'; // Under review - can be treated as in-progress
      default:
        // Fallback: try to match by lowercase
        const statusLower = normalizedStatus.toLowerCase();
        if (statusLower === 'completed' || statusLower === 'done') return 'completed';
        if (statusLower === 'delayed' || statusLower === 'impediment' || statusLower === 'stuck') return 'delayed';
        if (statusLower === 'in_progress' || statusLower === 'in-progress' || statusLower.includes('progress')) return 'in-progress';
        if (statusLower === 'review') return 'review';
        if (statusLower === 'assigned') return 'todo';
        return 'todo'; // Default to todo for unknown statuses
    }
  };

  const tasks: UITask[] = useMemo(() => {
    if (!tasksData?.result) return [];

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return tasksData.result.map((t: any) => {
      const startDateObj = t.start_date ? new Date(t.start_date) : null;
      const dueDateObj = t.due_date ? new Date(t.due_date) : null;

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

      const baseStatus = mapBackendStatusToUI(t.status);
      const isDelayedByTime = isTimeOverdue || isOverEstimate;
      const uiStatus: ITaskStatus =
        baseStatus === 'completed'
          ? 'completed'
          : isDelayedByTime
            ? 'delayed'
            : baseStatus;

      return {
        id: String(t.id),
        name: t.name || t.title || '',
        taskId: String(t.id),
        client: t.client?.name || t.client_company_name || 'In-House',
        project:
          t.requirement?.name
            ? t.requirement.name
            : t.requirement_id
              ? `Requirement ${t.requirement_id}`
              : 'General',
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
      };
    });
  }, [tasksData]);

  useEffect(() => {
    // side-effects after tasks change (currently none)
  }, [tasks, tasksData]);

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

  const statuses = useMemo(() => ['All', 'In Progress', 'Completed', 'Delayed'], []);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Tab filtering: 'review' should show in 'in-progress' tab
      const matchesTab = activeTab === 'all' || 
        task.status === activeTab || 
        (activeTab === 'in-progress' && task.status === 'review');
      
      const matchesSearch = searchQuery === '' ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskId.includes(searchQuery) ||
        task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = filters.user === 'All' || task.assignedTo === filters.user;
      const matchesCompany = filters.company === 'All' || task.client === filters.company;
      const matchesProject = filters.project === 'All' || task.project === filters.project;
      const matchesStatus =
        filters.status === 'All' ||
        (filters.status === 'In Progress' &&
          (task.status === 'in-progress' || task.status === 'review')) ||
        (filters.status === 'Completed' && task.status === 'completed') ||
        (filters.status === 'Delayed' && task.status === 'delayed');

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

      return (
        matchesTab &&
        matchesSearch &&
        matchesUser &&
        matchesCompany &&
        matchesProject &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [tasks, activeTab, searchQuery, filters, dateRange]);

  useEffect(() => {
    // side-effects after filters, search, or date label change (currently none)
  }, [tasks.length, filteredTasks.length, activeTab, searchQuery, filters, dateLabel]);

  const stats = useMemo(() => ({
    all: tasks.length,
    'in-progress': tasks.filter(t => t.status === 'in-progress' || t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    delayed: tasks.filter(t => t.status === 'delayed').length,
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
                    className={`text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${
                      isActive 
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
              styles={{
                body: {
                  padding: 0,
                },
              }}
            >
              <TaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setIsDialogOpen(false)}
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
            {(['all', 'in-progress', 'completed', 'delayed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${activeTab === tab
                  ? 'text-[#ff3b3b]'
                  : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                {tab === 'all' ? 'All Tasks' : tab === 'in-progress' ? 'In Progress' : tab === 'completed' ? 'Completed' : 'Delayed'}
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
      <div className="flex-1 overflow-y-auto pb-24 relative">
        {/* Table Header */}
        <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2.5fr_1.2fr_1.1fr_1fr_1fr_1.4fr_0.6fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
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