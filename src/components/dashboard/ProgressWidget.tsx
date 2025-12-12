
import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from 'recharts';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { DatePicker, ConfigProvider, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
import { useTasks } from '@/hooks/useTask';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { getRequirementsByWorkspaceId } from '@/services/workspace';

const { Option } = Select;
const { RangePicker } = DatePicker;

export function ProgressWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [selectedRangeType, setSelectedRangeType] = useState<string>('this_month');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(() => {
    const now = dayjs();
    return [now.startOf('month'), now.endOf('month')];
  });

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
      case 'this_quarter':
        newRange = [now.startOf('quarter'), now.endOf('quarter')];
        break;
      case 'this_year':
        newRange = [now.startOf('year'), now.endOf('year')];
        break;
      case 'custom':
        // Do nothing to dateRange, let user pick
        break;
      default:
        newRange = null;
    }

    if (newRange) {
      setDateRange(newRange);
    }
  };

  // Handle Manual Date Selection
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    setSelectedRangeType('custom');
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
  }, [requirementQueries, workspaceIds.length]);

  // Calculate requirements statistics
  const requirementsData = useMemo(() => {
    if (isLoadingRequirements || isLoadingWorkspaces) {
      return { completed: 0, total: 0, percentage: 0, inProgress: 0, delayed: 0 };
    }

    let completed = 0;
    let inProgress = 0;
    let delayed = 0;

    allRequirements.forEach((req: any) => {
      // Filter by date if range is selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        // Use start_date for filtering requirements
        const reqDate = req.start_date ? dayjs(req.start_date) : null;
        if (!reqDate || reqDate.isBefore(dateRange[0].startOf('day')) || reqDate.isAfter(dateRange[1].endOf('day'))) {
          return;
        }
      }

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

    const total = allRequirements.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage, inProgress, delayed };
  }, [allRequirements, isLoadingRequirements, isLoadingWorkspaces, dateRange]);

  const isLoading = isLoadingTasks || isLoadingWorkspaces || isLoadingRequirements;

  return (
    <div className="bg-white rounded-[24px] p-6 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Progress</h3>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#ff3b3b',
              borderRadius: 8,
              colorBorder: '#EEEEEE',
              controlHeight: 40,
            },
            components: {
              Select: {
                selectorBg: '#F7F7F7',
                colorIcon: '#666666',
                colorBorder: '#EEEEEE',
              },
              DatePicker: {
                colorBgContainer: '#F7F7F7',
                colorBorder: '#EEEEEE',
                activeBorderColor: '#ff3b3b',
              }
            }
          }}
        >
          <div className="flex items-center gap-3">
            {selectedRangeType === 'custom' && (
              <RangePicker
                value={dateRange}
                onChange={(dates) => handleDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
                className="font-['Manrope',sans-serif] hover:border-[#ff3b3b] focus:border-[#ff3b3b]"
                allowClear={false}
                format="MMM D, YYYY"
              />
            )}

            <Select
              value={selectedRangeType}
              onChange={handleRangeTypeChange}
              className="w-[140px] font-['Manrope',sans-serif]"
              dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            >
              <Option value="this_week">This Week</Option>
              <Option value="this_month">This Month</Option>
              <Option value="last_month">Last Month</Option>
              <Option value="this_quarter">This Quarter</Option>
              <Option value="this_year">This Year</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </div>
        </ConfigProvider>
      </div>

      {/* Sub-cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 mt-3">
        <ProgressCard
          title="Requirements"
          data={requirementsData}
          isLoading={isLoading}
          onClick={() => onNavigate && onNavigate('requirements')}
        />

        <ProgressCard
          title="Tasks"
          data={taskData}
          isLoading={isLoading}
          onClick={() => onNavigate && onNavigate('tasks')}
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
  onClick?: () => void;
}

function ProgressCard({ title, data, isLoading = false, onClick }: ProgressCardProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: '#ff3b3b' },
    { name: 'In Progress', value: data.inProgress, color: '#ff8080' },
    { name: 'Delayed', value: data.delayed, color: '#ffcccc' },
  ];

  // Filter out zero values for the chart only
  const activeData = chartData.filter(d => d.value > 0);

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
      className="group relative flex flex-col bg-white rounded-[20px] border border-gray-100 p-5 hover:shadow-lg hover:border-[#ff3b3b]/10 transition-all duration-300 cursor-pointer h-full"
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 z-10 shrink-0">
        <h4 className="font-['Manrope',sans-serif] font-semibold text-[16px] text-[#111111]">{title}</h4>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#ff3b3b] transition-colors duration-300">
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
        </div>
      </div>

      {/* Content Container - Side by Side Layout */}
      <div className="flex-1 flex items-center gap-6 min-h-[160px] px-2">
        {/* Chart Section */}
        <div className="relative w-[150px] h-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={activeData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={70}
                paddingAngle={4}
                cornerRadius={4}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell - ${index} `} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
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
                            {data.total}
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
              className="flex items-center justify-between w-full py-3 border-b border-gray-50 last:border-0 group/item transition-colors hover:bg-gray-50/50 rounded-lg px-2 -mx-2"
            >
              <div className="flex items-center gap-3">
                <div className={`w - 2 h - 2 rounded - full shrink - 0 ring - 2 ring - white shadow - sm`} style={{ backgroundColor: item.color }} />
                <span className="text-[13px] text-[#666666] font-medium font-['Manrope',sans-serif] whitespace-nowrap group-hover/item:text-[#111111] transition-colors">
                  {item.name === 'In Progress' ? 'In Progress' : item.name}
                </span>
              </div>
              <span className="text-[16px] font-bold text-[#111111] font-['Manrope',sans-serif]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}