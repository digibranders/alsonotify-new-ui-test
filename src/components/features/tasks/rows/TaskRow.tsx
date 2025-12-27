import { Checkbox, Tooltip, Dropdown, Popover, Input, Button, message, Avatar } from "antd";
import { AlertCircle, CheckCircle2, Clock, Loader2, MoreVertical, ArrowRightCircle, Eye, XCircle, Ban, Edit, Trash2, Play, CircleStop } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MenuProps } from "antd";
import { useState, useEffect } from "react";
import { provideEstimate } from "../../../../services/task";
import { SegmentedProgressBar } from "./SegmentedProgressBar";
import { useTimer } from "../../../../context/TimerContext";

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
  estTime: number; // Total Estimate Hours (Static)
  timeSpent: number; // Legacy Total Time (Closed Logs), mapped from total_seconds_spent
  total_seconds_spent: number; // Total Closed Seconds
  activities: number;
  status: 'Assigned' | 'In_Progress' | 'Completed' | 'Delayed' | 'Impediment' | 'Review' | 'Stuck';
  priority: 'high' | 'medium' | 'low';
  timelineDate: string;
  timelineLabel: string;
  execution_mode?: 'parallel' | 'sequential';
  task_members?: {
    id: number;
    user_id: number;
    status: string;
    estimated_time: number | null;
    seconds_spent: number; // Closed logs seconds
    active_worklog_start_time?: string | null; // If running
    is_current_turn: boolean;
    user: {
      id: number;
      name: string;
      profile_pic?: string;
    };
  }[];
}

interface TaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  currentUserId?: number;
}

export function TaskRow({
  task,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  currentUserId
}: TaskRowProps) {
  const router = useRouter();
  const { timerState, startTimer, stopTimer } = useTimer();
  const { taskId: activeTaskId, elapsedSeconds, isRunning } = timerState;
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateHours, setEstimateHours] = useState("");
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // Local ticker state for re-rendering live times for OTHER members (not current user)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Check if ANY member has an active start time
    const hasActiveMembers = task.task_members?.some(m => m.active_worklog_start_time);

    // Also if this task is the active one in context
    const isContextActive = String(activeTaskId) === String(task.id);

    if (hasActiveMembers || isContextActive) {
      const interval = setInterval(() => {
        setNow(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.task_members, activeTaskId, task.id]);

  // Calculate live data for all members
  const liveMembers = (task.task_members || []).map(m => {
    let liveSeconds = m.seconds_spent;

    // Check if this member is currently running in global context (Current User)
    const isCurrentUser = m.user_id === currentUserId; // currentUserId passed as prop (number)
    const isContextActive = String(activeTaskId) === String(task.id) && isRunning;

    if (isCurrentUser && isContextActive) {
      // Use the global context elapsed time for perfect sync
      // Context elapsedSeconds = Duration of active log
      // Seconds Spent (backend) = Closed Logs Sum
      liveSeconds += elapsedSeconds;
    } else if (m.active_worklog_start_time) {
      // For other members (or fallback), calculate from start time
      const startTime = new Date(m.active_worklog_start_time).getTime();
      const diff = Math.max(0, (now.getTime() - startTime) / 1000);
      liveSeconds += diff;
    }

    return {
      ...m,
      seconds_spent: liveSeconds,
      // Status overrides for SegmentedProgressBar color logic:
      // If active (live seconds increasing), ensure status reflects 'In Progress' for color blue
      isWorking: (isCurrentUser && isContextActive) || !!m.active_worklog_start_time
    };
  });

  // Calculate Aggregated Totals
  const totalSeconds = liveMembers.reduce((acc, m) => acc + m.seconds_spent, 0);
  const totalHours = totalSeconds / 3600;

  // Format helpers
  const formatHours = (hours: number) => Number(hours.toFixed(1));
  const formatDuration = (hours: number | string | null | undefined) => {
    const num = Number(hours || 0);
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  };

  // Determine row-level status (Aggregated)
  // Priority: Stuck > Impediment > Delayed > Review > In_Progress > Assigned > Completed
  // Or simply use the task.status which backend might already compute?
  // User req: "Show the Aggregated Status (e.g., if Mayur is "Blocked", the status badge for the whole row..."
  // Backend `task.status` is already computed by `calculateAggregatedTaskStatus`. We should trust it.

  // Play/Stop Logic
  // Disable if: Sequential & Not My Turn
  const myMember = task.task_members?.find(m => m.user_id === currentUserId);
  const isMyTurn = task.execution_mode === 'sequential' ? myMember?.is_current_turn : true;
  const isPlayDisabled = task.execution_mode === 'sequential' && !isMyTurn;
  const isActive = String(activeTaskId) === String(task.id);

  const handleTimerClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      await stopTimer();
    } else {
      if (isPlayDisabled) return;
      await startTimer(Number(task.id), task.name, task.project); // Pass task info
    }
  };

  // Progress/Styling Logic (Moved to top level scope)
  const percentage = task.estTime > 0 ? (totalSeconds / (task.estTime * 3600)) * 100 : 0;
  const isOvertime = percentage > 100;
  const isBlockedOrDelayed = ['Stuck', 'Impediment', 'Delayed'].includes(task.status);
  const showRed = isOvertime || isBlockedOrDelayed;
  const textColor = showRed ? 'text-[#ff3b3b]' : 'text-[#666666]';
  const isPendingEstimate = myMember && myMember.status === 'PendingEstimate';

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
      <div className="grid grid-cols-[40px_2.5fr_1.2fr_1.1fr_1fr_0.8fr_0.6fr_1.5fr_0.6fr_40px] gap-4 items-center">
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
            <span className="font-['Manrope:Bold',sans-serif] text-[14px] !text-[#111111] group-hover:text-[#ff3b3b] transition-colors">
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
              className="text-[11px] !text-[#111111] visited:!text-[#111111] font-['Manrope:Medium',sans-serif] hover:text-[#ff3b3b] hover:underline"
            >
              • {task.client}
            </Link>
          </div>
        </div>

        {/* Project (Mapped to Requirements Header) */}
        <div>
          <Link
            href="/dashboard/workspace"
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] !text-[#111111] visited:!text-[#111111] font-['Manrope:Medium',sans-serif] truncate hover:text-[#ff3b3b] hover:underline"
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
            className={`text-[11px] font-['Manrope:Regular',sans-serif] ${task.status === 'Delayed' || task.status === 'Impediment' || task.status === 'Stuck'
              ? 'text-[#dc2626]'
              : task.status === 'Review'
                ? 'text-[#fbbf24]'
                : 'text-[#999999]'
              }`}
          >
            {task.timelineLabel}
          </span>
        </div>

        {/* Assigned To (Avatar Stack) */}
        <div className="flex items-center justify-center">
          <Avatar.Group maxCount={3} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
            {task.task_members && task.task_members.length > 0 ? (
              task.task_members.map((member) => (
                <Tooltip key={member.id} title={`${member.user.name} (${member.status})`}>
                  <div className={`relative ${member.is_current_turn ? 'ring-2 ring-blue-500 rounded-full z-20 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>
                    {member.user.profile_pic ? (
                      <Avatar src={member.user.profile_pic} />
                    ) : (
                      <Avatar style={{ backgroundColor: '#ff3b3b' }}>
                        {member.user.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    )}
                  </div>
                </Tooltip>
              ))
            ) : (
              <Tooltip title={task.assignedTo}>
                <Avatar style={{ backgroundColor: '#ff3b3b' }}>
                  {task.assignedTo ? task.assignedTo.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </Tooltip>
            )}
          </Avatar.Group>
        </div>

        {/* Duration Text */}
        <div className="flex justify-center items-center">
          <span className={`text-[11px] font-['Manrope:Medium',sans-serif] ${textColor}`}>
            {formatHours(totalHours)}h / {formatDuration(task.estTime)}h
          </span>
        </div>

        {/* Timer / Action Button */}
        <div className="flex justify-center items-center">
          <Tooltip title={isPlayDisabled ? "Waiting for turn" : (isActive ? "Stop Timer" : "Start Timer")}>
            <button
              onClick={handleTimerClick}
              disabled={isPlayDisabled && !isActive}
              className={`transition-colors flex items-center justify-center ${isPlayDisabled && !isActive ? 'opacity-30 cursor-not-allowed' : 'hover:text-[#ff3b3b]'}`}
            >
              {isActive ? (
                <CircleStop className="w-5 h-5 text-red-500 animate-pulse" />
              ) : (
                <Play className="w-5 h-5 text-[#666666]" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* Progress Bar or Nudge */}
        <div className="flex flex-col gap-1 w-full justify-center">
          {isPendingEstimate ? (
            // Nudge Button
            <div className="w-full">
              <Popover
                open={estimateOpen}
                onOpenChange={setEstimateOpen}
                trigger="click"
                content={
                  <div className="p-2 w-48">
                    <p className="text-xs font-medium mb-2">Your Estimate</p>
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={estimateHours}
                      onChange={(e) => setEstimateHours(e.target.value)}
                      className="mb-2 text-sm"
                    />
                    <Button
                      type="primary"
                      size="small"
                      loading={submissionLoading}
                      className="w-full bg-[#EAB308] text-black"
                      onClick={async () => {
                        if (!estimateHours) return;
                        try {
                          setSubmissionLoading(true);
                          await provideEstimate(Number(task.id), Number(estimateHours));
                          message.success("Estimate submitted");
                          setEstimateOpen(false);
                          window.location.reload();
                        } catch (err) {
                          message.error("Failed");
                        } finally {
                          setSubmissionLoading(false);
                        }
                      }}
                    >
                      Submit
                    </Button>
                  </div>
                }
              >
                <Button
                  block
                  variant="solid"
                  color="yellow"
                  className="!bg-yellow-400 hover:!bg-yellow-500 !text-black border-none font-bold text-xs h-6 flex items-center justify-center gap-1 shadow-sm"
                >
                  <Clock className="w-3 h-3" /> EST
                </Button>
              </Popover>
            </div>
          ) : (
            // Progress Bar + Percentage
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-end">
                <span className={`text-[10px] font-bold ${textColor}`}>
                  {Math.round(percentage)}%
                </span>
              </div>
              <SegmentedProgressBar
                members={liveMembers}
                totalEstimate={task.estTime}
                taskStatus={task.status}
              />
            </div>
          )}
        </div>

        {/* Status (Aggregated) */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={task.status} onChange={onStatusChange} />
        </div>

        {/* Actions */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: 'Edit',
                  icon: <Edit className="w-3.5 h-3.5" />,
                  onClick: () => onEdit?.(),
                  className: "text-[13px] font-['Manrope:Medium',sans-serif]"
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  onClick: () => onDelete?.(),
                  danger: true,
                  className: "text-[13px] font-['Manrope:Medium',sans-serif]"
                }
              ] as MenuProps['items']
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors">
              <MoreVertical className="w-4 h-4 text-[#666666]" />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, onChange }: { status: string; onChange?: (s: string) => void }) {
  // Map backend statuses to UI configuration with icons and colors matching old frontend
  // User Req: "Map both Stuck and Impediment to a single visual 'Blocked' badge"

  // Normalize status for UI
  let uiStatus = status;
  if (status === 'Stuck' || status === 'Impediment') {
    uiStatus = 'Blocked';
  }

  const config: Record<string, {
    icon: any;
    bgColor: string;
    iconColor: string;
    label: string;
    showCircle: boolean;
    animate?: boolean;
    pulse?: boolean;
    val: string; // The actual backend status value
  }> = {
    'Assigned': {
      icon: Clock,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#0284c7]',
      label: 'Assigned',
      showCircle: false,
      val: 'Assigned'
    },
    'In_Progress': {
      icon: Loader2,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#0284c7]',
      label: 'In Progress',
      showCircle: false,
      animate: true,
      val: 'In_Progress'
    },
    'Completed': {
      icon: CheckCircle2,
      bgColor: 'bg-[#16a34a]',
      iconColor: 'text-white',
      label: 'Completed',
      showCircle: true,
      val: 'Completed'
    },
    'Delayed': {
      icon: AlertCircle,
      bgColor: 'bg-[#dc2626]',
      iconColor: 'text-white',
      label: 'Delayed',
      showCircle: true,
      val: 'Delayed'
    },
    'Blocked': { // Mapped from Stuck/Impediment for display purposes
      icon: XCircle,
      bgColor: 'bg-[#ef4444]',
      iconColor: 'text-white',
      label: 'Blocked',
      showCircle: true,
      pulse: true,
      val: 'Stuck' // Default mapping back to Stuck if selected? Or we can't map back easily. This `val` won't be used directly for 'Blocked' in the popover.
    },
    'Review': {
      icon: Eye,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#fbbf24]',
      label: 'Review',
      showCircle: false,
      val: 'Review'
    }
  };

  const style = config[uiStatus] || config['Assigned'];
  const Icon = style.icon;

  const content = (
    <div className="flex flex-col gap-1 p-1">
      {Object.entries(config).map(([key, conf]) => {
        if (key === 'Blocked') {
          // Show both Stuck and Impediment options
          return (
            <>
              <button key="Stuck" onClick={() => onChange?.('Stuck')} className="text-left px-3 py-1.5 hover:bg-gray-50 rounded text-xs flex items-center gap-2">
                <XCircle className="w-3 h-3 text-[#ef4444]" /> Stuck
              </button>
              <button key="Impediment" onClick={() => onChange?.('Impediment')} className="text-left px-3 py-1.5 hover:bg-gray-50 rounded text-xs flex items-center gap-2">
                <Ban className="w-3 h-3 text-[#ef4444]" /> Impediment
              </button>
            </>
          );
        }
        return (
          <button key={key} onClick={() => onChange?.(conf.val)} className="text-left px-3 py-1.5 hover:bg-gray-50 rounded text-xs flex items-center gap-2">
            <conf.icon className={`w-3 h-3 ${conf.iconColor}`} /> {conf.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <Popover content={content} trigger="click" overlayInnerStyle={{ padding: 0 }}>
      <div className="cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity">
        {style.showCircle ? (
          <div className={`w-5 h-5 rounded-full ${style.bgColor} flex items-center justify-center ${style.pulse ? 'animate-pulse' : ''}`}>
            <Icon className={`w-3 h-3 ${style.iconColor}`} />
          </div>
        ) : (
          <Icon className={`w-4 h-4 ${style.iconColor} ${(style as any).animate ? 'animate-spin' : ''}`} />
        )}
      </div>
    </Popover>
  );
}