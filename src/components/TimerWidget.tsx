import { useState, useEffect } from "react";
// import svgPaths from "../imports/svg-tngfkx4wt1";
import {
  Play24Filled,
  Pause24Filled,
  Stop24Filled,
  ChevronDown24Filled,
  ChevronUp24Filled,
  Timer24Filled
} from "@fluentui/react-icons";

export function TimerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Mock tasks - in real app, this would come from props or context
  const tasks = [
    { id: "1", name: "Website Redesign", allocated: 36000 }, // 10h in seconds
    { id: "2", name: "Mobile App Development", allocated: 28800 }, // 8h
    { id: "3", name: "Client Meeting Prep", allocated: 7200 }, // 2h
  ];

  const currentTask = tasks.find((t) => t.id === selectedTask);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handlePlayPause = () => {
    if (!selectedTask) return;
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
  };

  const getBalance = () => {
    if (!currentTask) return 0;
    return currentTask.allocated - time;
  };

  const getProgressPercentage = () => {
    if (!currentTask) return 0;
    return Math.min((time / currentTask.allocated) * 100, 100);
  };

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className="bg-gradient-to-br from-[#ff3b3b] via-[#ff5252] to-[#cc2f2f] rounded-[21px] w-full shadow-[-3px_-3px_4px_0px_inset_rgba(255,255,255,0.25),4px_7px_4px_-1px_inset_rgba(255,255,255,0.25)] relative overflow-hidden">
        <div className="flex flex-col p-4 gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                <Timer24Filled className="w-4 h-4 text-white" />
              </div>
              <p className="font-['Manrope:ExtraBold',sans-serif] text-[16px] text-white">Timer</p>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <ChevronUp24Filled className="w-5 h-5" />
            </button>
          </div>

          {/* Time Display */}
          <div className="text-center">
            <p className="font-['Manrope:ExtraBold',sans-serif] text-[32px] text-white leading-none tabular-nums">
              {formatTime(time)}
            </p>
            {selectedTask && currentTask && (
              <p className="font-['Manrope:SemiBold',sans-serif] text-[12px] text-white/70 mt-1">
                {currentTask.name}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handlePlayPause}
              disabled={!selectedTask}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all transform active:scale-95
                ${!selectedTask
                  ? "bg-white/20 cursor-not-allowed"
                  : isRunning
                    ? "bg-white/30 hover:bg-white/40"
                    : "bg-white hover:bg-white/90"
                }
              `}
            >
              {isRunning ? (
                <Pause24Filled className={`w-5 h-5 ${isRunning ? "text-white" : "text-[#ff3b3b]"}`} />
              ) : (
                <Play24Filled className={`w-5 h-5 ${!selectedTask ? "text-white/50" : "text-[#ff3b3b]"} ml-0.5`} />
              )}
            </button>
            <button
              onClick={handleStop}
              disabled={time === 0}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all transform active:scale-95
                ${time === 0
                  ? "bg-white/20 cursor-not-allowed"
                  : "bg-white/30 hover:bg-white/40"
                }
              `}
            >
              <Stop24Filled className={`w-4 h-4 ${time === 0 ? "text-white/50" : "text-white"} fill-current`} />
            </button>
          </div>

          {/* Progress Bar */}
          {currentTask && (
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="bg-gradient-to-br from-[#ff3b3b] via-[#ff5252] to-[#cc2f2f] rounded-[21px] w-full shadow-[-3px_-3px_4px_0px_inset_rgba(255,255,255,0.25),4px_7px_4px_-1px_inset_rgba(255,255,255,0.25)] relative overflow-hidden">
      <div className="flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
              <Timer24Filled className="w-4 h-4 text-white" />
            </div>
            <p className="font-['Manrope:ExtraBold',sans-serif] text-[16px] text-white">Timer</p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <ChevronDown24Filled className="w-5 h-5" />
          </button>
        </div>

        {/* Task Selector */}
        <div className="relative">
          <select
            value={selectedTask || ""}
            onChange={(e) => {
              setSelectedTask(e.target.value);
              setTime(0);
              setIsRunning(false);
            }}
            className="w-full bg-white rounded-lg px-4 py-2.5 
              font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#000000]
              appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-white/50
              transition-all"
          >
            <option value="">Select a task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
          <ChevronDown24Filled className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
        </div>

        {/* Time Display */}
        <div className="text-center py-2">
          <p className="font-['Manrope:ExtraBold',sans-serif] text-[40px] text-white leading-none tabular-nums">
            {formatTime(time)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePlayPause}
            disabled={!selectedTask}
            className={`
              px-6 py-2.5 rounded-full flex items-center gap-2
              font-['Manrope:Bold',sans-serif] text-[14px]
              transition-all transform active:scale-95
              ${!selectedTask
                ? "bg-white/20 text-white/50 cursor-not-allowed"
                : isRunning
                  ? "bg-white/30 hover:bg-white/40 text-white"
                  : "bg-white hover:bg-white/90 text-[#ff3b3b]"
              }
            `}
          >
            {isRunning ? (
              <>
                <Pause24Filled className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play24Filled className="w-4 h-4 ml-0.5" />
                Start
              </>
            )}
          </button>
          <button
            onClick={handleStop}
            disabled={time === 0}
            className={`
              px-6 py-2.5 rounded-full flex items-center gap-2
              font-['Manrope:Bold',sans-serif] text-[14px]
              transition-all transform active:scale-95
              ${time === 0
                ? "bg-white/20 text-white/50 cursor-not-allowed"
                : "bg-white/30 hover:bg-white/40 text-white"
              }
            `}
          >
            <Stop24Filled className="w-3.5 h-3.5 fill-current" />
            Stop
          </button>
        </div>

        {/* Time Stats */}
        {currentTask && (
          <div className="space-y-2 pt-2 border-t border-white/20">
            <div className="flex justify-between items-center">
              <span className="font-['Manrope:SemiBold',sans-serif] text-[12px] text-white/70">
                Time Allocated
              </span>
              <span className="font-['Manrope:Bold',sans-serif] text-[12px] text-white">
                {formatDuration(currentTask.allocated)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-['Manrope:SemiBold',sans-serif] text-[12px] text-white/70">
                Worked Time
              </span>
              <span className="font-['Manrope:Bold',sans-serif] text-[12px] text-white">
                {formatDuration(time)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-['Manrope:SemiBold',sans-serif] text-[12px] text-white/70">
                Balance
              </span>
              <span
                className={`font-['Manrope:Bold',sans-serif] text-[12px] ${getBalance() < 0 ? "text-yellow-200" : "text-white"
                  }`}
              >
                {getBalance() < 0 ? "-" : ""}
                {formatDuration(Math.abs(getBalance()))}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressPercentage() > 100 ? "bg-yellow-300" : "bg-white/60"
                  }`}
                style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}