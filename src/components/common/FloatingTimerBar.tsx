'use client';
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { 
  Play,
  Pause,
  CheckCircle,
  ChevronDown
} from "lucide-react";
import { useFloatingMenu } from '../../context/FloatingMenuContext';

// Global floating timer bar - expands with bulk actions from pages
const HIDDEN_ROUTES = ['/dashboard/reports', '/dashboard/finance', '/dashboard/settings', '/dashboard/profile'];

export function FloatingTimerBar() {
  const pathname = usePathname();
  const isHidden = pathname && HIDDEN_ROUTES.some(route => pathname.startsWith(route));
  const { expandedContent } = useFloatingMenu();
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState("Design System Planning");

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const tasks = [
    { id: 1, name: "Design System Planning", requirement: "Acme Corp" },
    { id: 2, name: "Website Redesign", requirement: "Acme Corp" },
    { id: 3, name: "Client Presentation", requirement: "TechStart Inc" },
    { id: 4, name: "User Research Analysis", requirement: "Digital Solutions" },
    { id: 5, name: "Prototype Review", requirement: "Acme Corp" }
  ];

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleTaskSelect = (taskName: string) => {
    setSelectedTask(taskName);
    setShowTaskSelector(false);
  };

  const handleComplete = () => {
    setIsRunning(false);
    // You can add toast notification here
    setTime(0);
  };

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ease-out"
      style={{ 
        bottom: '24px',
        display: isHidden ? 'none' : undefined
      }}
    >
      <div 
        className={`
          bg-[#111111] text-white rounded-full shadow-2xl flex items-center border border-[#111111]
          transition-all duration-300 ease-out h-[60px] relative overflow-hidden
          ${expandedContent ? 'px-6 gap-4' : 'px-8 gap-6'}
        `}
      >
        {/* Progress Bar at Bottom */}
        <div 
          className="absolute bottom-0 left-0 h-[4px] bg-[#ff3b3b] transition-all duration-1000 ease-linear"
          style={{ width: isRunning ? `${(time % 60) * (100/60)}%` : '0%' }}
        />

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
          >
            <p className="text-[14px] text-white font-['Inter:Medium',sans-serif] group-hover:text-white transition-colors truncate max-w-[200px]">
              {selectedTask}
            </p>
            <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0" />
          </button>

          {/* Task Selector Dropdown */}
          {showTaskSelector && (
            <>
              {/* Backdrop to close dropdown */}
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
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskSelect(task.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-left transition-all ${
                        selectedTask === task.name
                          ? 'bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white shadow-sm'
                          : 'hover:bg-[#F7F7F7] text-[#111111]'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`text-[13px] font-['Manrope:SemiBold',sans-serif] ${
                          selectedTask === task.name ? 'text-white' : 'text-[#111111]'
                        }`}>
                          {task.name}
                        </p>
                        <p className={`text-[10px] font-['Inter:Regular',sans-serif] mt-0.5 ${
                          selectedTask === task.name ? 'text-white/80' : 'text-[#999999]'
                        }`}>
                          {task.requirement}
                        </p>
                      </div>
                      {selectedTask === task.name && (
                        <CheckCircle className="w-4 h-4 text-white flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
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
            title={isRunning ? "Pause" : "Play"}
          >
            {isRunning ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            className="text-white hover:text-white/80 transition-all active:scale-90"
            title="Mark as Complete"
            onClick={handleComplete}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="font-['Manrope:Bold',sans-serif] text-white leading-none tracking-tight text-[20px]">
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
}
