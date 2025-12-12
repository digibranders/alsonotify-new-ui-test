import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTask';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { getRequirementsByWorkspaceId } from '@/services/workspace';

export function ProgressWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  // Fetch all tasks (no filters to get all tasks)
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks("limit=1000&skip=0");

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
  }, [allRequirements, isLoadingRequirements, isLoadingWorkspaces]);

  const isLoading = isLoadingTasks || isLoadingWorkspaces || isLoadingRequirements;

  return (
    <div className="bg-white rounded-[24px] p-6 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Progress</h3>
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
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
                <div className={`w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm`} style={{ backgroundColor: item.color }} />
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