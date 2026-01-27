'use client';
import { useState, useEffect, useMemo } from "react";
import { usePathname } from 'next/navigation';
import { 
  Play,
  Pause,
  CheckCircle,
  ChevronDown,
  Loader2
} from "lucide-react";
import { useFloatingMenu } from '../../context/FloatingMenuContext';
import { useTimer } from '../../context/TimerContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAssignedTasks } from '../../services/task';
import { useUserDetails } from '../../hooks/useUser';
import { App } from 'antd';
import { queryKeys } from '../../lib/queryKeys';

// Global floating timer bar - expands with bulk actions from pages
const HIDDEN_ROUTES = ['/dashboard/reports', '/dashboard/finance', '/dashboard/settings', '/dashboard/profile'];

interface TaskOption {
  id: number;
  name: string;
  project: string;
  estimatedTime: number;
  disabled?: boolean;
  secondsSpent: number; // Accumulated time from history
}

export function FloatingTimerBar() {
  const pathname = usePathname();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    // Function to check if any drawer or modal is open
    const checkFormOpen = () => {
      // Check for Ant Design Drawer open state on body
      const isDrawerOpen = document.body.classList.contains('ant-scrolling-effect') || 
                           document.querySelector('.ant-drawer-open') !== null ||
                           document.querySelector('.ant-drawer-mask:not(.ant-drawer-mask-hidden)') !== null;
      
      // Check for Ant Design Modal open state
      const isModalOpen = document.querySelector('.ant-modal-wrap:not([style*="display: none"])') !== null ||
                          document.body.classList.contains('ant-modal-open');

      setIsFormOpen(!!isDrawerOpen || !!isModalOpen);
    };

    // Initial check
    checkFormOpen();

    // Create observer
    const observer = new MutationObserver((mutations) => {
      checkFormOpen();
    });

    // Start observing body for class changes and DOM mutations
    observer.observe(document.body, {
      attributes: true, 
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);
  
  // Visibility Logic - also hide on task details and requirement details
  const isHidden = (pathname && (
    HIDDEN_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.includes('/dashboard/requirements/') ||
    pathname.includes('/dashboard/tasks/')
  )) || isFormOpen;
  
  const { expandedContent } = useFloatingMenu();
  const { timerState, startTimer, stopTimer, isLoading: timerLoading } = useTimer();
  
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState("Select Task");
  const [localTime, setLocalTime] = useState(0);

  // ✅ FIX BUG #21: Sync with TimerContext on load (once)
  useEffect(() => {
    if (!timerLoading && timerState.taskId) {
      setSelectedTaskId(timerState.taskId);
      setSelectedTaskName(timerState.taskName || "Unknown Task");
      // Don't setLocalTime to just elapsed. It's handled by display logic now.
      // But we can init it to prevent jump if needed.
    }
  }, [timerLoading]); // Only run on load

  // ✅ FIX BUG #21: Update local time ONLY when timer stops
  useEffect(() => {
    if (!timerState.isRunning) {
       // When stopped, reset local time to 0 because we will rely on fetching fresh "secondsSpent" from backend
       // However, to prevent split-second flash of 0 before refetch, we might want to keep it.
       // But our improved displayTime logic handles "baseSeconds" from props.
       // So we can safely reset localTime to 0 OR keep it as the "just finished" value until the user selects another task.
       // Let's NOT reset it here, but rely on the handlePlayPause to set it correctly.
       // But if it stopped externally?
       // Let's leave it, but handleTaskSelect will reset it.
    }
  }, [timerState.isRunning, timerState.elapsedSeconds]);



  const { data: userDetailsData } = useUserDetails();
  // Using flattened Employee object from useUserDetails
  const userId = userDetailsData?.result?.id;

  const { data: assignedTasksData, isLoading: tasksLoading } = useQuery({
    queryKey: queryKeys.tasks.assigned(),
    queryFn: () => getAssignedTasks(),
    enabled: !!userId,
  });

  // Filter tasks logic:
  // 1. Must be Assigned/Active (not completed)
  // 2. Must be the user's turn (backend sends disabled=true for sequential out-of-turn)
  // 3. Must be a member (User request: "show only the tasks that logged in user is a member")
  const tasks: TaskOption[] = useMemo(() => {
    return (assignedTasksData?.result || [])
    .filter((t) => {
      const status = (t.status || '').toLowerCase();
      
      // 1. Status Filter
      if (status.includes('completed')) return false;

      // 2. Disabled/Sequential Filter (Backend Logic)
      if (t.disabled) return false;

      // 3. Membership Filter (Frontend Check)
      // Leader sees all tasks in backend response, but might not be a "working member"
      // If task_members is present, verify userId is in it.
      if (t.task_members && Array.isArray(t.task_members) && t.task_members.length > 0) {
        const isMember = t.task_members.some(m => m.user_id === userId);
        if (!isMember) return false;
      }

      return true;
    })
    .map((t) => {
      // Find user's specific member record for correct time tracking
      const memberRecord = t.task_members?.find(m => m.user_id === userId);
      const secondsSpent = memberRecord?.seconds_spent || t.time_spent || 0; // Use user-specific time or total task time as fallback

      return {
        id: t.id,
        name: t.name || t.title || "Untitled Task",
        project: t.task_workspace?.name || 
                 t.task_project?.company?.name || 
                 "Unknown Project",
        estimatedTime: t.estimated_time || 0,
        disabled: t.disabled,
        secondsSpent: secondsSpent
      };
    });
  }, [assignedTasksData, userId]);

  // ✅ FIX BUG #21: Use context as single source of truth
  // Calculate display time: Base (Historical) + Current Session
  const currentActiveTask = tasks.find(t => t.id === (timerState.taskId || selectedTaskId));
  const baseSeconds = currentActiveTask?.secondsSpent || 0;
  
  // If running and matching task: Base + Session. Else: just Base (unless we have a local override/simulated time)
  // We use localTime when strictly not running to show the "last known" or "static" time.
  const displayTime = timerState.isRunning && timerState.taskId === selectedTaskId 
    ? baseSeconds + timerState.elapsedSeconds 
    : (localTime > 0 ? localTime : baseSeconds);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!selectedTaskId) {
      message.warning("Please select a task first");
      return;
    }

    if (timerState.isRunning) {
      // Capture current total time before stopping to prevent 00:00:00 glitch
      const currentTask = tasks.find(t => t.id === timerState.taskId);
      const baseTime = currentTask?.secondsSpent || 0;
      const totalCurrentTime = baseTime + timerState.elapsedSeconds;
      setLocalTime(totalCurrentTime);

      await stopTimer();
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.listRoot() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.assigned() });
      if (selectedTaskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(selectedTaskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.worklogsRoot(selectedTaskId) });
      }
      message.info("Timer paused");
    } else {
      // Find project name for the selected task
      const task = tasks.find((t) => t.id === selectedTaskId);
      const projectName = task?.project || "Unknown Project";
      
      await startTimer(selectedTaskId, selectedTaskName, projectName);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.listRoot() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.assigned() });
      message.success("Timer started");
    }
  };

  const handleTaskSelect = async (task: TaskOption) => {
    // Automatically stop the current timer when switching to a different task
    // to ensure accurate time tracking and prevent overlapping sessions.
    if (timerState.isRunning && timerState.taskId !== task.id) {
      try {
        await stopTimer();
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.listRoot() });
        message.info("Previous timer stopped, switching task");
      } catch (_error) {
        message.error("Failed to stop timer");
        setShowTaskSelector(false);
        return;
      }
    }
    
    setSelectedTaskId(task.id);
    setSelectedTaskName(task.name);
    // Reset local time so we start showing the new task's base time immediately
    setLocalTime(0); 
    setShowTaskSelector(false);
  };

  // Handle task completion by stopping the timer and updating state.
  // This ensures the worklog is closed properly before any status changes.
  const handleComplete = async () => {
    if (!timerState.isRunning || !selectedTaskId) {
      message.warning("No active timer to complete");
      return;
    }

    try {
      // Stop timer (this closes the worklog in TimerContext)
      await stopTimer();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.listRoot() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.assigned() });
      if (selectedTaskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(selectedTaskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.worklogsRoot(selectedTaskId) });
      }

      message.success("Worklog saved! Don't forget to update task status if complete.");
      setLocalTime(0);
    } catch (error) {
      message.error("Failed to save worklog");
    }
  };

  if (isHidden) return null;

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ease-out flex flex-col items-center"
      style={{ bottom: '30px' }}
    >
      {/* Dropdown Menu - Now outside the overflow-hidden container */}
      {showTaskSelector && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowTaskSelector(false)}
          />
          <div className="absolute bottom-full mb-3 bg-white rounded-[20px] shadow-xl border border-[#EEEEEE] p-3 animate-in slide-in-from-bottom-2 duration-200 z-[10000] w-[320px]">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="text-[10px] text-[#999999] font-['Inter:SemiBold',sans-serif] uppercase tracking-wide">
                Select Task
              </span>
              <div className="flex-1 h-px bg-[#EEEEEE]" />
            </div>
            <div className="space-y-1 max-h-[240px] overflow-y-auto">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-[#999999] animate-spin" />
                </div>
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelect(task)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-left transition-all ${
                      selectedTaskId === task.id
                        ? 'bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white shadow-sm'
                        : 'hover:bg-[#F7F7F7] text-[#111111]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-['Manrope:SemiBold',sans-serif] truncate ${
                        selectedTaskId === task.id ? 'text-white' : 'text-[#111111]'
                      }`}>
                        {task.name}
                      </p>
                      <p className={`text-[10px] font-['Inter:Regular',sans-serif] mt-0.5 truncate ${
                        selectedTaskId === task.id ? 'text-white/80' : 'text-[#999999]'
                      }`}>
                        {task.project || "Unknown Project"}
                      </p>
                    </div>
                    {selectedTaskId === task.id && (
                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-[#999999] text-xs">
                  No assigned tasks found
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Bar (Pill) */}
      <div 
        className={`
          bg-[#111111] text-white rounded-full shadow-2xl flex items-center border border-[#111111]
          transition-all duration-300 ease-out h-[48px] relative overflow-hidden
          ${expandedContent ? 'px-6 gap-4' : 'px-8 gap-6'}
        `}
      >
        {/* Progress Bar at Bottom */}
        {(() => {
          const currentTask = tasks.find(t => t.id === (timerState.taskId || selectedTaskId));
          const estimatedSeconds = (currentTask?.estimatedTime || 0) * 3600;
          const progress = (timerState.isRunning && estimatedSeconds > 0) 
            ? Math.min((displayTime / estimatedSeconds) * 100, 100) 
            : (timerState.isRunning ? (displayTime % 60) * (100/60) : 0);
          
          return (
            <div 
              className="absolute bottom-0 left-0 h-[4px] bg-[#ff3b3b] transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          );
        })()}

        {/* Expanded Content (Bulk Actions) */}
        {expandedContent && (
          <>
            {expandedContent}
            <div className="w-px h-5 bg-white/30" />
          </>
        )}

        {/* Task Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowTaskSelector(!showTaskSelector)}
            className="flex items-center gap-2 group hover:bg-white/10 rounded-full px-4 py-2 transition-all"
            disabled={timerLoading}
          >
            {timerLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <>
                <p className="text-[14px] text-white font-['Inter:Medium',sans-serif] group-hover:text-white transition-colors truncate max-w-[200px]">
                  {selectedTaskName}
                </p>
                <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* Timer Controls - Centered */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-white/80 transition-all active:scale-90 disabled:opacity-50"
            title={timerState.isRunning ? "Pause" : "Play"}
            disabled={timerLoading || !selectedTaskId}
          >
            {timerState.isRunning ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            className="text-white hover:text-white/80 transition-all active:scale-90 disabled:opacity-50"
            title="Stop Timer & Save Worklog"
            onClick={handleComplete}
            disabled={timerLoading}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="font-['Manrope:Bold',sans-serif] text-white leading-none tracking-tight text-[20px] tabular-nums">
          {formatTime(displayTime)}
        </div>
      </div>
    </div>
  );
}
