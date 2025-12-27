
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from 'recharts';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
import { useTasks } from '@/hooks/useTask';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { getRequirementsByWorkspaceId } from '@/services/workspace';

const { RangePicker } = DatePicker;

export function ProgressWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [selectedRangeType, setSelectedRangeType] = useState<string>('this_month');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(() => {
    const now = dayjs();
    return [now.startOf('month'), now.endOf('month')];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Construct query string for tasks based on date range
  const taskQueryString = useMemo(() => {
    let query = "limit=1000&skip=0";
    if (dateRange && dateRange[0] && dateRange[1]) {
      query += `&start_date[start]=${dateRange[0].startOf('day').toISOString()}&start_date[end]=${dateRange[1].endOf('day').toISOString()}`;
    }
    return query;
  }, [dateRange]);

  // Handle Dropdown Selection
  const handleRangeTypeChange = (value: string) => {
    setSelectedRangeType(value);
    setIsDropdownOpen(false);

    if (value === 'custom') {
      setCalendarOpen(true);
      // If we already have a custom range, use it; otherwise reset
      if (dateRange && dateRange[0] && dateRange[1]) {
        setStartDate(dateRange[0]);
        setEndDate(dateRange[1]);
        setCurrentMonth(dateRange[0]);
      } else {
        setStartDate(null);
        setEndDate(null);
        setCurrentMonth(dayjs());
      }
      return;
    }

    setCalendarOpen(false);
    const now = dayjs();
    let newRange: [Dayjs, Dayjs] | null = null;

    switch (value) {
      case 'this_week':
        newRange = [now.startOf('isoWeek'), now.endOf('isoWeek')];
        break;
      case 'this_month':
        newRange = [now.startOf('month'), now.endOf('month')];
        break;
      case 'last_month':
        const lastMonth = now.subtract(1, 'month');
        newRange = [lastMonth.startOf('month'), lastMonth.endOf('month')];
        break;
      case 'this_year':
        newRange = [now.startOf('year'), now.endOf('year')];
        break;
      default:
        newRange = null;
    }

    if (newRange) {
      setDateRange(newRange);
    }
  };

  // Get display label for selected range
  const getRangeLabel = () => {
    if (selectedRangeType === 'custom') {
      return getCustomRangeLabel();
    }
    switch (selectedRangeType) {
      case 'this_week':
        return 'This week';
      case 'this_month':
        return 'This month';
      case 'last_month':
        return 'Last Month';
      case 'this_year':
        return 'This Year';
      default:
        return 'This week';
    }
  };

  // Check if date is in selected range (for highlighting)
  const isDateInRange = (date: Dayjs) => {
    if (!startDate || !endDate) {
      // If only start date is selected, don't highlight range yet
      return false;
    }
    const start = startDate.isBefore(endDate) ? startDate : endDate;
    const end = startDate.isBefore(endDate) ? endDate : startDate;
    return date.isAfter(start.startOf('day')) && date.isBefore(end.endOf('day'));
  };

  // Check if date is start or end of range
  const isDateStartOrEnd = (date: Dayjs) => {
    if (!startDate || !endDate) {
      // If only start date is selected, highlight it
      if (startDate) {
        return date.isSame(startDate, 'day');
      }
      return false;
    }
    return date.isSame(startDate, 'day') || date.isSame(endDate, 'day');
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Manual Date Selection (custom calendar)
  const handleDateClick = (date: Dayjs) => {
    if (!startDate || (startDate && endDate)) {
      // First click or reset: set start date
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Second click: set end date
      let finalStart = startDate;
      let finalEnd = date;

      if (date.isBefore(startDate)) {
        // If clicked date is before start, swap them
        finalStart = date;
        finalEnd = startDate;
      }

      // Set the range and close calendar
      setStartDate(finalStart);
      setEndDate(finalEnd);
      setDateRange([finalStart, finalEnd]);
      setSelectedRangeType('custom');
      setCalendarOpen(false);
    }
  };

  // Get display label for custom range
  const getCustomRangeLabel = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      return `${dateRange[0].format('MMM D')} - ${dateRange[1].format('MMM D')}`;
    }
    return 'Custom';
  };

  // Fetch all tasks
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks(taskQueryString);

  // Fetch all workspaces to get requirements
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useWorkspaces("");

  // Calculate task statistics
  const taskData = useMemo(() => {
    if (!tasksData?.result || isLoadingTasks) {
      return { completed: 0, total: 0, percentage: 0, inProgress: 0, delayed: 0 };
    }

    const tasks = tasksData.result;
    let completed = 0;
    let inProgress = 0;
    let delayed = 0;

    tasks.forEach((task: any) => {
      const status = task.status?.toLowerCase() || '';
      // Task statuses: Assigned, In_Progress, Completed, Delayed, Impediment, Review, Stuck, New Task
      if (status.includes('completed') || status === 'done') {
        completed++;
      } else if (status.includes('delayed') || status.includes('stuck') || status.includes('impediment') || status.includes('blocked')) {
        delayed++;
      } else {
        // Default everything else (In Progress, Assigned, New Task, etc.) to In Progress
        inProgress++;
      }
    });

    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage, inProgress, delayed };
  }, [tasksData, isLoadingTasks]);

  // Get all workspace IDs
  const workspaceIds = useMemo(() => {
    return workspacesData?.result?.projects?.map((w: any) => w.id) || [];
  }, [workspacesData]);

  // Fetch requirements for all workspaces in parallel
  const requirementQueries = useQueries({
    queries: workspaceIds.map((id: number) => ({
      queryKey: ['requirements', id],
      queryFn: () => getRequirementsByWorkspaceId(id),
      enabled: !!id && workspaceIds.length > 0 && !isLoadingWorkspaces,
    })),
  });

  const isLoadingRequirements = requirementQueries.some(q => q.isLoading);

  // Combine all requirements from all workspaces
  const allRequirements = useMemo(() => {
    const combined: any[] = [];
    requirementQueries.forEach((query) => {
      if (query.data?.result && Array.isArray(query.data.result)) {
        combined.push(...query.data.result);
      }
    });
    return combined;
  }, [requirementQueries]);

  // Calculate requirements statistics
  const requirementsData = useMemo(() => {
    if (isLoadingRequirements || isLoadingWorkspaces) {
      return { completed: 0, total: 0, percentage: 0, inProgress: 0, delayed: 0 };
    }

    let completed = 0;
    let inProgress = 0;
    let delayed = 0;
    let total = 0;

    allRequirements.forEach((req: any) => {
      // Filter by date if range is selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        // Use start_date for filtering requirements
        const reqDate = req.start_date ? dayjs(req.start_date) : null;
        if (!reqDate || reqDate.isBefore(dateRange[0].startOf('day')) || reqDate.isAfter(dateRange[1].endOf('day'))) {
          return;
        }
      }

      // Count this requirement in the total
      total++;

      const status = req.status?.toLowerCase() || '';
      // Requirement statuses: Assigned, In_Progress, On_Hold, Submitted, Completed, Waiting, Rejected, Review, Revision, Impediment, Stuck
      if (status.includes('completed')) {
        completed++;
      } else if (status.includes('stuck') || status.includes('impediment')) {
        delayed++;
      } else {
        // Default everything else (In Progress, Assigned, etc.) to In Progress
        inProgress++;
      }
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage, inProgress, delayed };
  }, [allRequirements, isLoadingRequirements, isLoadingWorkspaces, dateRange]);

  const isLoading = isLoadingTasks || isLoadingWorkspaces || isLoadingRequirements;

  return (
    <div className="bg-white rounded-[24px] p-5 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Progress</h3>
        <div className="relative" ref={dropdownRef}>
          {/* Custom Dropdown Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-full hover:border-[#CCCCCC] transition-colors"
          >
            <span className="font-['Manrope:Regular',sans-serif] text-[14px] text-[#111111]">
              {getRangeLabel()}
            </span>
            <ChevronDown className="w-4 h-4 text-[#111111]" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg z-50 min-w-[160px] overflow-hidden">
              {[
                { value: 'this_week', label: 'This week' },
                { value: 'this_month', label: 'This month' },
                { value: 'last_month', label: 'Last Month' },
                { value: 'this_year', label: 'This Year' },
                { value: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRangeTypeChange(option.value)}
                  className="w-full text-left px-3 py-2.5 font-['Manrope:Regular',sans-serif] text-[14px] text-[#111111] hover:bg-[#F7F7F7] transition-colors flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  {selectedRangeType === option.value && (
                    <CheckSquare className="w-4 h-4 text-[#ff3b3b] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Custom Calendar Popup - Single Calendar */}
          {calendarOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg z-50 w-[280px] p-3" ref={calendarRef}>
              {/* Select Range Header */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setCalendarOpen(false);
                    setIsDropdownOpen(false);
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
          )}
        </div>
      </div>

      {/* Sub-cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mt-2">
        <ProgressCard
          title="Requirements"
          data={requirementsData}
          isLoading={isLoading}
          dateRangeLabel={getRangeLabel()}
          onClick={() => onNavigate && onNavigate('requirements')}
          onStatusClick={(status: string) => {
            if (onNavigate) {
              // Map status to requirements page tab
              let tab = 'active'; // Default to active tab
              if (status === 'Completed') {
                tab = 'completed';
              } else if (status === 'In Progress') {
                tab = 'active';
              } else if (status === 'Delayed') {
                tab = 'active'; // Delayed is part of active tab
              }
              onNavigate(`requirements?tab=${tab}`);
            }
          }}
        />

        <ProgressCard
          title="Tasks"
          data={taskData}
          isLoading={isLoading}
          dateRangeLabel={getRangeLabel()}
          onClick={() => onNavigate && onNavigate('tasks')}
          onStatusClick={(status: string) => {
            if (onNavigate) {
              // Map status to tasks page tab
              let tab = 'all';
              if (status === 'In Progress') {
                tab = 'In_Progress';
              } else if (status === 'Completed') {
                tab = 'Completed';
              } else if (status === 'Delayed') {
                tab = 'Delayed';
              }
              onNavigate(`tasks?tab=${tab}`);
            }
          }}
        />
      </div>
    </div>
  );
}

interface ProgressCardProps {
  title: string;
  data: {
    completed: number;
    total: number;
    percentage: number;
    inProgress: number;
    delayed: number;
  };
  isLoading?: boolean;
  dateRangeLabel?: string;
  onClick?: () => void;
  onStatusClick?: (status: string) => void;
}

function ProgressCard({ title, data, isLoading = false, dateRangeLabel = 'this period', onClick, onStatusClick }: ProgressCardProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: '#0F9D58' },   // Green - matches reference
    { name: 'In Progress', value: data.inProgress, color: '#2F80ED' }, // Blue - matches reference
    { name: 'Delayed', value: data.delayed, color: '#ff3b3b' },      // Red - matches reference
  ];

  // Filter out zero values for the chart only
  const activeData = chartData.filter(d => d.value > 0);

  // Data to render: if total is 0, use a placeholder ring
  const renderData = data.total === 0
    ? [{ name: 'Empty', value: 1, color: '#f3f4f6' }]
    : activeData;

  if (isLoading) {
    return (
      <div className="group relative flex flex-col bg-white rounded-[20px] border border-gray-100 p-5 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 z-10 shrink-0">
          <h4 className="font-['Manrope',sans-serif] font-semibold text-[16px] text-[#111111]">{title}</h4>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[13px] text-[#666666] font-['Manrope',sans-serif]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative flex flex-col bg-white rounded-[20px] border border-gray-100 p-4 hover:shadow-lg hover:border-[#ff3b3b]/10 transition-all duration-300 cursor-pointer h-full"
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3 z-10 shrink-0">
        <h4 className="font-['Manrope',sans-serif] font-semibold text-[16px] text-[#111111]">{title}</h4>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#ff3b3b] transition-colors duration-300">
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
        </div>
      </div>

      {/* Content Container - Side by Side Layout */}
      <div className="flex-1 flex items-center gap-5 min-h-[140px] px-2">
        {/* Chart Section */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={renderData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                paddingAngle={data.total === 0 ? 0 : 4}
                cornerRadius={data.total === 0 ? 0 : 4}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {renderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      // If total is 0, show a message instead of "0 Total"
                      if (data.total === 0) {
                        const itemType = title.toLowerCase();
                        // Create a more readable message based on date range
                        let periodText = (dateRangeLabel || 'this period').toLowerCase();
                        // Handle custom date ranges (format: "MMM D - MMM D")
                        if (periodText.includes(' - ')) {
                          periodText = 'this period';
                        }
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 8}
                              className="fill-[#666666] text-[10px] font-medium font-['Manrope',sans-serif]"
                            >
                              No {itemType}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 8}
                              className="fill-[#666666] text-[10px] font-medium font-['Manrope',sans-serif]"
                            >
                              {periodText}
                            </tspan>
                          </text>
                        );
                      }

                      // Otherwise show the total number
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-[#111111] text-3xl font-extrabold font-['Manrope',sans-serif] tracking-tight"
                          >
                            {data.total || 0}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-[#999999] text-[11px] font-semibold font-['Manrope',sans-serif] uppercase tracking-wider"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Stats Section */}
        <div className="flex-1 flex flex-col justify-center">
          {chartData.map((item) => (
            <div
              key={item.name}
              onClick={(e) => {
                e.stopPropagation();
                if (onStatusClick) {
                  onStatusClick(item.name);
                }
              }}
              className={`flex items-center justify-between w-full py-2 border-b border-gray-50 last:border-0 group/item transition-colors rounded-lg px-2 -mx-2 ${onStatusClick
                  ? 'hover:bg-gray-50/50 cursor-pointer'
                  : 'cursor-default'
                } ${item.value === 0 ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: item.color }} />
                <span className={`text-[13px] font-medium font-['Manrope',sans-serif] whitespace-nowrap group-hover/item:text-[#111111] transition-colors ${item.value > 0 ? 'text-[#111111]' : 'text-[#666666]'
                  }`}>
                  {item.name === 'In Progress' ? 'In Progress' : item.name}
                </span>
              </div>
              <span className={`text-[16px] font-bold font-['Manrope',sans-serif] ${item.value > 0 ? 'text-[#111111]' : 'text-[#666666]'
                }`}>
                {item.value || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}