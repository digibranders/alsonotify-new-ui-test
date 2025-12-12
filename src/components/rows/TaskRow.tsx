import { Checkbox, Tooltip } from "antd";
import { AlertCircle, CheckCircle2, Clock, Loader2, MoreVertical } from "lucide-react";
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
  status: 'impediment' | 'in-progress' | 'completed' | 'todo' | 'delayed';
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
            href="/workspaces"
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif] truncate hover:text-[#ff3b3b] hover:underline"
          >
            {task.project}
          </Link>
        </div>

        {/* Assigned To */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
            <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
              {task.assignedTo.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div className="hidden group-hover:block absolute bg-white px-2 py-1 rounded shadow-lg border border-gray-100 -bottom-8 left-1/2 -translate-x-1/2 z-20">
            <p className="text-[12px] text-[#666666] font-['Manrope:Medium',sans-serif] whitespace-nowrap">
              {task.assignedTo.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex justify-center">
          <div className="relative w-9 h-9 rounded-full border-[2.5px] border-[#F0F0F0] group-hover:border-[#ff3b3b]/20 transition-all flex flex-col items-center justify-center bg-white">
            {/* Little top knob for stopwatch look */}
            <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-[2px] h-[3px] bg-[#F0F0F0] group-hover:bg-[#ff3b3b]/20 transition-all" />

            <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#111111] leading-none -mt-0.5">
              {task.estTime}
            </span>
            <span className="text-[7px] font-['Manrope:SemiBold',sans-serif] text-[#999999] leading-none mt-[1px]">
              HR
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
                ? 'bg-[#2E7D32]'
                : progress >= 75
                  ? 'bg-[#FF9800]'
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
  const config = {
    'completed': {
      icon: CheckCircle2,
      color: 'text-[#0F9D58]',
      label: 'Completed'
    },
    'in-progress': {
      icon: Loader2,
      color: 'text-[#2F80ED]',
      label: 'In Progress'
    },
    'impediment': {
      icon: AlertCircle,
      color: 'text-[#EB5757]',
      label: 'Blocked'
    },
    'delayed': {
      icon: AlertCircle,
      color: 'text-[#EB5757]',
      label: 'Delayed'
    },
    'todo': {
      icon: Clock,
      color: 'text-[#555555]',
      label: 'Todo'
    }
  };

  const style = config[status as keyof typeof config] || config['todo'];
  const Icon = style.icon;

  return (
    <Tooltip title={style.label}>
      <div className="cursor-help p-1">
        <Icon className={`w-5 h-5 ${style.color} ${status === 'in-progress' ? 'animate-spin' : ''}`} />
      </div>
    </Tooltip>
  );
}