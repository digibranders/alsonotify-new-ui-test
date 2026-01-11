import { useState, useEffect, useRef } from "react";
import { 
  Play24Filled,
  Pause24Filled,
  CheckmarkCircle24Filled,
  ChevronDown24Filled,
} from "@fluentui/react-icons";
import { useTimer } from "@/context/TimerContext";
import { usePathname } from "next/navigation";
import { useUserDetails } from "@/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { getAssignedTasks } from "@/services/task";
import { App } from "antd";

export function FloatingProductivityWidget() {
  const pathname = usePathname();
  const { message } = App.useApp();
  
  // Visibility Logic
  // Hidden on: /dashboard/requirements/*, /dashboard/tasks/* (details), /dashboard/finance/create
  const shouldHide = 
    pathname?.includes('/dashboard/requirements/') || 
    pathname?.includes('/dashboard/tasks/') || 
    pathname?.includes('/dashboard/finance/create');

  const { timerState, startTimer, stopTimer, isLoading: timerLoading } = useTimer();
  
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState("Select Task");
  const [localTime, setLocalTime] = useState(0);

  // Sync with TimerContext
  useEffect(() => {
    if (!timerLoading) {
      if (timerState.taskId) {
        setSelectedTaskId(timerState.taskId);
        setSelectedTaskName(timerState.taskName || "Unknown Task");
      }
      setLocalTime(timerState.elapsedSeconds);
    }
  }, [timerState, timerLoading]);

  // Local timer increment for smooth UI
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setLocalTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  // Fetch Tasks
  const { data: userDetailsData } = useUserDetails();
  const userId = userDetailsData?.result?.user?.id || userDetailsData?.result?.id;

  const { data: assignedTasksData } = useQuery({
    queryKey: ['assignedTasks'],
    queryFn: () => getAssignedTasks(),
    enabled: !!userId,
  });

  const tasks = (assignedTasksData?.result || [])
    .filter((t: any) => {
        const status = (t.status || '').toLowerCase();
        return (status === 'assigned' || status.includes('in_progress') || status.includes('impediment')) && !status.includes('completed');
    })
    .map((t: any) => ({
      id: t.id,
      name: t.name || t.title || "Untitled Task",
      project: t.project?.name || "Unknown Project" // Adjust based on actual API response structure if needed
    }));

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
      await stopTimer();
      message.info("Timer paused");
    } else {
      // For now, simple start:
      // We need to find the project name from the tasks list if possible, or use the one we have
      // Since selectedTaskName might not have project info if restored from context blindly, 
      // but here we select from list so we should have it. 
      // Actually, let's look up the task in our list to get the project name to be safe.
      const task = tasks.find((t: any) => t.id === selectedTaskId);
      const projectName = task?.project || "Unknown Project";
      
      await startTimer(selectedTaskId, selectedTaskName, projectName);
      message.success("Timer started");
    }
  };

  const handleTaskSelect = (task: { id: number; name: string }) => {
    setSelectedTaskId(task.id);
    setSelectedTaskName(task.name);
    setShowTaskSelector(false);
  };

  const handleComplete = async () => {
    if (timerState.isRunning) {
        await stopTimer();
    }
    // In a real implementation, this would open a worklog modal or confirm completion.
    // For this pass, we'll just stop the timer as a "mark complete" action on the widget usually involves more steps.
    message.success("Timer stopped. Don't forget to submit your worklog!");
  };

  if (shouldHide) return null;

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[999] transition-all duration-300 ease-out"
      style={{ 
        bottom: '24px',
      }}
    >
      <div 
        className="bg-[#111111] text-white rounded-full shadow-2xl flex items-center border border-[#111111] transition-all duration-300 ease-out h-[60px] relative overflow-hidden px-8 gap-6"
      >
        {/* Progress Bar at Bottom */}
        <div 
          className="absolute bottom-0 left-0 h-[4px] bg-[#ff3b3b] transition-all duration-1000 ease-linear"
          style={{ width: timerState.isRunning ? `${(localTime % 60) * (100/60)}%` : '0%' }}
        />

        {/* Task Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowTaskSelector(!showTaskSelector)}
            className="flex items-center gap-2 group hover:bg-white/10 rounded-full px-4 py-2 transition-all"
          >
            <p className="text-[14px] text-white font-['Inter:Medium',sans-serif] group-hover:text-white transition-colors truncate max-w-[200px]">
              {selectedTaskName}
            </p>
            <ChevronDown24Filled className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0" />
          </button>

          {/* Task Selector Dropdown */}
          {showTaskSelector && (
            <>
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setShowTaskSelector(false)}
              />
              <div className="absolute bottom-full left-0 mb-3 bg-white rounded-[20px] shadow-xl border border-[#EEEEEE] p-3 animate-in slide-in-from-bottom-2 duration-200 z-[9999] w-[320px]">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="text-[10px] text-[#999999] font-['Inter:SemiBold',sans-serif] uppercase tracking-wide">
                    Select Task
                  </span>
                  <div className="flex-1 h-px bg-[#EEEEEE]" />
                </div>
                <div className="space-y-1 max-h-[240px] overflow-y-auto">
                  {tasks.length > 0 ? tasks.map((task: any) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskSelect(task)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-left transition-all ${
                        selectedTaskId === task.id
                          ? 'bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white shadow-sm'
                          : 'hover:bg-[#F7F7F7] text-[#111111]'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`text-[13px] font-['Manrope:SemiBold',sans-serif] ${
                          selectedTaskId === task.id ? 'text-white' : 'text-[#111111]'
                        }`}>
                          {task.name}
                        </p>
                        <p className={`text-[10px] font-['Inter:Regular',sans-serif] mt-0.5 ${
                          selectedTaskId === task.id ? 'text-white/80' : 'text-[#999999]'
                        }`}>
                          {task.project}
                        </p>
                      </div>
                      {selectedTaskId === task.id && (
                        <CheckmarkCircle24Filled className="w-4 h-4 text-white flex-shrink-0 ml-2" />
                      )}
                    </button>
                  )) : (
                    <div className="p-3 text-center text-[#999999] text-xs">No assigned tasks found</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Timer Controls - Centered */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-white/80 transition-all active:scale-90"
            title={timerState.isRunning ? "Pause" : "Play"}
          >
            {timerState.isRunning ? (
              <Pause24Filled className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play24Filled className="w-6 h-6 ml-0.5" fill="currentColor" />
            )}
          </button>
          <button
            className="text-white hover:text-white/80 transition-all active:scale-90"
            title="Mark as Complete (Stop Timer)"
            onClick={handleComplete}
          >
            <CheckmarkCircle24Filled className="w-6 h-6" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="font-['Manrope:Bold',sans-serif] text-white leading-none tracking-tight text-[20px] tabular-nums">
          {formatTime(localTime)}
        </div>
      </div>
    </div>
  );
}
