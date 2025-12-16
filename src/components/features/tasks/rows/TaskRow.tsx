import { Checkbox, Tooltip } from "antd";
import { AlertCircle, CheckCircle2, Clock, Loader2, MoreVertical, ArrowRightCircle } from "lucide-react";
import Link from "next/link";

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
  status: 'in-progress' | 'completed' | 'delayed' | 'todo' | 'review';
  priority: 'high' | 'medium' | 'low';
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
  const progress = task.estTime > 0 ? (task.timeSpent / task.estTime) * 100 : 0;

  return (
    <div
      onClick={onSelect}
      className={`
        group bg-white border rounded-[16px] p-4 transition-all duration-300 cursor-pointer relative z-10
        ${selected
          ? 'border-[#ff3b3b] shadow-[0_0_0_1px_#ff3b3b] bg-[#FFF5F5]'
          : 'border-[#EEEEEE] hover:border-[#ff3b3b]/20 hover:shadow-lg'
        }
      `}
    >
      <div className="grid grid-cols-[40px_2.5fr_1.2fr_1fr_1fr_1.4fr_0.6fr_0.3fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
          />
        </div>

        {/* Task Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/tasks/${task.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] hover:text-[#ff3b3b] transition-colors hover:underline"
            >
              {task.name}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
              #{task.taskId}
            </span>
            <Link
              href="/clients"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif] hover:text-[#ff3b3b] hover:underline"
            >
              • {task.client}
            </Link>
          </div>
        </div>

        {/* Project */}
        <div>
          <Link
            href="/dashboard/workspace"
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif] truncate hover:text-[#ff3b3b] hover:underline"
          >
            {task.project}
          </Link>
        </div>

        {/* Assigned To */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#ff3b3b] flex items-center justify-center">
            <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
              {task.assignedTo.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="flex justify-center">
          <div className="w-9 h-9 rounded-full bg-[#F7F7F7] flex items-center justify-center">
            <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              {task.estTime} HR
            </span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif]">
              {task.timeSpent}h / {task.estTime}h
            </span>
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progress >= 100
                ? 'bg-[#0F9D58]'
                : 'bg-[#3B82F6]'
                }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
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
  const config: Record<string, {
    icon: any;
    bgColor: string;
    iconColor: string;
    label: string;
    showCircle: boolean;
    animate?: boolean;
  }> = {
    'completed': {
      icon: CheckCircle2,
      bgColor: 'bg-[#0F9D58]',
      iconColor: 'text-white',
      label: 'Completed',
      showCircle: true
    },
    'in-progress': {
      icon: Loader2,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#2F80ED]',
      label: 'In Progress',
      showCircle: false,
      animate: true
    },
    'delayed': {
      icon: AlertCircle,
      bgColor: 'bg-[#EB5757]',
      iconColor: 'text-white',
      label: 'Delayed',
      showCircle: true
    },
    'review': {
      icon: Loader2,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#2F80ED]',
      label: 'Review',
      showCircle: false,
      animate: true
    },
    'todo': {
      icon: Clock,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#555555]',
      label: 'Assigned',
      showCircle: false
    }
  };

  const style = config[status] || config['todo'];
  const Icon = style.icon;

  return (
    <Tooltip title={style.label}>
      <div className="cursor-help p-1">
        {style.showCircle ? (
          <div className={`w-5 h-5 rounded-full ${style.bgColor} flex items-center justify-center`}>
            <Icon className={`w-3 h-3 ${style.iconColor}`} />
          </div>
        ) : (
          <Icon className={`w-5 h-5 ${style.iconColor} ${(style as any).animate ? 'animate-spin' : ''}`} />
        )}
      </div>
    </Tooltip>
  );
}