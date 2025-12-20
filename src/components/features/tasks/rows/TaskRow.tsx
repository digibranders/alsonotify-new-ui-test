import { Checkbox, Tooltip } from "antd";
import { AlertCircle, CheckCircle2, Clock, Loader2, MoreVertical, ArrowRightCircle, Eye, XCircle, Ban } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface Task {
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
  status: 'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck';
  priority: 'high' | 'medium' | 'low';
  timelineDate: string;
  timelineLabel: string;
}

interface TaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: () => void;
}

export function TaskRow({
  task,
  selected,
  onSelect
}: TaskRowProps) {
  const router = useRouter();
  const progress = task.estTime > 0 ? (task.timeSpent / task.estTime) * 100 : 0;
  const formatHours = (hours: number | string | null | undefined) =>
    Number(Number(hours || 0).toFixed(1));

  const isOverEstimate = task.estTime > 0 && task.timeSpent > task.estTime;
  const extraHours = isOverEstimate ? task.timeSpent - task.estTime : 0;
  
  // For delayed tasks, cap percentage at 100% and show overtime separately
  const displayProgress = isOverEstimate ? 100 : Math.round(progress);
  
  // Format duration: show "1" for 1 hour, "0.5" for half hour, etc. (no "HR" suffix)
  const formatDuration = (hours: number | string | null | undefined) => {
    const numHours = Number(hours || 0);
    // If it's a whole number, show without decimal. Otherwise show 1 decimal place
    return numHours % 1 === 0 ? numHours.toString() : numHours.toFixed(1);
  };

  return (
    <div
      onClick={() => {
        const targetUrl = `/dashboard/tasks/${task.id}`;
        router.push(targetUrl);
      }}
      className={`
        group bg-white border rounded-[16px] p-4 transition-all duration-300 cursor-pointer relative z-10
        ${selected
          ? 'border-[#ff3b3b] shadow-[0_0_0_1px_#ff3b3b] bg-[#FFF5F5]'
          : 'border-[#EEEEEE] hover:border-[#ff3b3b]/20 hover:shadow-lg'
        }
      `}
    >
      <div className="grid grid-cols-[40px_2.5fr_1.2fr_1.1fr_1fr_1fr_1.4fr_0.6fr_0.3fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="red-checkbox"
          />
        </div>

        {/* Task Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors">
              {task.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
              #{task.taskId}
            </span>
            <Link
              href="/dashboard/clients"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif] hover:text-[#ff3b3b] hover:underline"
            >
              • {task.client}
            </Link>
          </div>
        </div>

        {/* Project / Requirement */}
        <div>
          <Link
            href="/dashboard/workspace"
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif] truncate hover:text-[#ff3b3b] hover:underline"
          >
            {task.project}
          </Link>
        </div>

        {/* Timeline */}
        <div>
          <div className="mb-0.5">
            <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">
              {task.timelineDate}
            </span>
          </div>
          <span
            className={`text-[11px] font-['Manrope:Regular',sans-serif] ${
              task.status === 'Delayed' || task.status === 'Impediment' || task.status === 'Stuck' 
                ? 'text-[#dc2626]' 
                : task.status === 'Review'
                  ? 'text-[#fbbf24]'
                  : 'text-[#999999]'
            }`}
          >
            {task.timelineLabel}
          </span>
        </div>

        {/* Assigned To */}
        <div className="flex items-center justify-center gap-2">
          <Tooltip title={task.assignedTo}>
            <div className="w-7 h-7 rounded-full bg-[#ff3b3b] flex items-center justify-center">
              <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
                {task.assignedTo.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
          </Tooltip>
        </div>

        {/* Duration */}
        <div className="flex justify-center">
          <div className="w-9 h-9 rounded-full bg-[#F7F7F7] flex items-center justify-center">
            <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              {formatDuration(task.estTime)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif]">
              {formatHours(task.timeSpent)}h / {formatHours(task.estTime)}h
            </span>
            <span className="text-[11px] font-['Manrope:Regular',sans-serif]">
              {isOverEstimate ? (
                <span className="text-[#dc2626]">100%</span>
              ) : task.status === 'Completed' ? (
                <span className="text-[#16a34a]">100%</span>
              ) : task.status === 'Delayed' || task.status === 'Impediment' || task.status === 'Stuck' ? (
                <span className="text-[#dc2626]">{displayProgress}%</span>
              ) : task.status === 'Review' ? (
                <span className="text-[#fbbf24]">{displayProgress}%</span>
              ) : (
                <span className="text-[#999999]">{displayProgress}%</span>
              )}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverEstimate
                  ? 'bg-[#dc2626]'  // Red for any task with overtime (matches old frontend)
                  : task.status === 'Completed'
                    ? 'bg-[#16a34a]'  // Green for completed tasks without overtime (matches old frontend)
                    : task.status === 'Delayed' || task.status === 'Impediment' || task.status === 'Stuck'
                      ? 'bg-[#dc2626]'  // Red for delayed/impediment/stuck (matches old frontend)
                      : task.status === 'Review'
                        ? 'bg-[#fbbf24]'  // Yellow/Orange for review (matches old frontend)
                        : 'bg-[#0284c7]'  // Blue for Assigned/In_Progress (matches old frontend)
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {isOverEstimate && (
            <div className="mt-1 text-right text-[10px] font-['Manrope:Medium',sans-serif] text-[#EB5757]">
              +{formatHours(extraHours)}h overtime
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <StatusBadge status={task.status} />
        </div>

        {/* Actions */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors">
            <MoreVertical className="w-4 h-4 text-[#666666]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  // Map backend statuses to UI configuration with icons and colors matching old frontend
  const config: Record<string, {
    icon: any;
    bgColor: string;
    iconColor: string;
    label: string;
    showCircle: boolean;
    animate?: boolean;
  }> = {
    'Assigned': {
      icon: Clock,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#0284c7]', // Blue from old frontend
      label: 'Assigned',
      showCircle: false
    },
    'In_Progress': {
      icon: Loader2,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#0284c7]', // Blue from old frontend
      label: 'In Progress',
      showCircle: false,
      animate: true
    },
    'Completed': {
      icon: CheckCircle2,
      bgColor: 'bg-[#16a34a]', // Green from old frontend
      iconColor: 'text-white',
      label: 'Completed',
      showCircle: true
    },
    'Delayed': {
      icon: AlertCircle,
      bgColor: 'bg-[#dc2626]', // Red from old frontend
      iconColor: 'text-white',
      label: 'Delayed',
      showCircle: true
    },
    'Impediment': {
      icon: XCircle,
      bgColor: 'bg-[#9e36ff]', // Purple from old frontend
      iconColor: 'text-white',
      label: 'Impediment',
      showCircle: true
    },
    'Review': {
      icon: Eye,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#fbbf24]', // Yellow/Orange from old frontend
      label: 'Review',
      showCircle: false
    },
    'Stuck': {
      icon: Ban,
      bgColor: 'bg-[#9e36ff]', // Purple (similar to Impediment)
      iconColor: 'text-white',
      label: 'Stuck',
      showCircle: true
    }
  };

  const style = config[status] || config['todo'];
  const Icon = style.icon;

  return (
    <Tooltip title={style.label}>
      <div className="cursor-help flex items-center justify-center">
        {style.showCircle ? (
          <div className={`w-5 h-5 rounded-full ${style.bgColor} flex items-center justify-center`}>
            <Icon className={`w-3 h-3 ${style.iconColor}`} />
          </div>
        ) : (
          <Icon className={`w-4 h-4 ${style.iconColor} ${(style as any).animate ? 'animate-spin' : ''}`} />
        )}
      </div>
    </Tooltip>
  );
}