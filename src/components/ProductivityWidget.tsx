import { useState, useRef, useEffect } from "react";
import {
  Play24Filled,
  Pause24Filled,
  ArrowCounterclockwise24Filled,
  Sparkle24Filled,
  Send24Filled,
  Clock24Filled,
  Flash24Filled,
  CheckmarkCircle24Filled,
  Dismiss24Filled,
  ChevronDown24Filled,
  Mic24Filled,
  Document24Filled,
  Person24Filled
} from "@fluentui/react-icons";

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actions?: string[];
  responseType?: string;
}

export function ProductivityWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [conversations, setConversations] = useState<Message[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState("Design System Planning");
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

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

  // Animate popup on open
  useEffect(() => {
    if (showChatPopup) {
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [showChatPopup]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversations]);

  const tasks = [
    { id: 1, name: "Design System Planning", project: "Acme Corp" },
    { id: 2, name: "Website Redesign", project: "Acme Corp" },
    { id: 3, name: "Client Presentation", project: "TechStart Inc" },
    { id: 4, name: "User Research Analysis", project: "Digital Solutions" },
    { id: 5, name: "Prototype Review", project: "Acme Corp" }
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

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Add user message to conversation
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setConversations(prev => [...prev, userMessage]);

    const query = message.toLowerCase();
    let response: any = null;

    // Task Creation & New Work
    if (query.includes("new work") || query.includes("new task") || query.includes("create task")) {
      response = {
        type: "task_creation",
        message: "Found 2 new client requests: Website redesign (Acme Corp) and Mobile app prototype (TechStart Inc)",
        actions: ["Create Tasks", "View Details"]
      };
    }
    // Timer Controls
    else if (query.includes("start timer") || query.includes("start tracking")) {
      response = {
        type: "timer_action",
        message: `Timer started for ${selectedTask}`,
        task: selectedTask
      };
      setIsRunning(true);
    }
    else if (query.includes("stop timer") || query.includes("pause timer")) {
      response = {
        type: "info",
        message: `Timer paused at ${formatTime(time)} for ${selectedTask}`
      };
      setIsRunning(false);
    }
    else if (query.includes("reset timer")) {
      response = {
        type: "info",
        message: "Timer has been reset"
      };
      handleReset();
    }
    // Team Status
    else if (query.includes("team status") || query.includes("team update") || query.includes("who's working")) {
      response = {
        type: "team_status",
        message: "4 team members active: Satyam (Design System), Priya (Client Review), Rahul (Development), Anjali (User Research)",
        actions: ["View Team", "Send Message"]
      };
    }
    // Workspace/Project Info
    else if (query.includes("workspace") || query.includes("project status") || query.includes("project update")) {
      response = {
        type: "workspace_info",
        message: "Acme Corp workspace: 12 active tasks, 67% complete. Next deadline: Website Redesign (Nov 25)",
        actions: ["View Workspace", "Update Progress"]
      };
    }
    // Meetings
    else if (query.includes("meeting") || query.includes("schedule") || query.includes("calendar")) {
      response = {
        type: "meeting_info",
        message: "You have 2 meetings today: Client Review (10:00 AM) and Design Sprint Planning (2:30 PM)",
        actions: ["View Calendar", "Join Meeting"]
      };
    }
    // Time Tracking Summary
    else if (query.includes("time today") || query.includes("hours today") || query.includes("my time")) {
      response = {
        type: "time_summary",
        message: "Today: 4h 23m tracked across 3 tasks. Top task: Design System Planning (2h 15m)",
        actions: ["View Report", "Export"]
      };
    }
    // Leave Requests
    else if (query.includes("leave") || query.includes("time off") || query.includes("vacation")) {
      response = {
        type: "leave_info",
        message: "You have 12 leave days remaining. 1 pending request: Dec 24-26 (Awaiting approval)",
        actions: ["Apply Leave", "View Calendar"]
      };
    }
    // Deadlines & Due Tasks
    else if (query.includes("deadline") || query.includes("due") || query.includes("overdue")) {
      response = {
        type: "deadline_alert",
        message: "3 tasks due this week: Website Redesign (Nov 25), Client Presentation (Nov 22), Prototype Review (Nov 24)",
        actions: ["View Tasks", "Prioritize"]
      };
    }
    // Notes
    else if (query.includes("note") || query.includes("reminder")) {
      response = {
        type: "note_info",
        message: "Latest note: 'Design feedback from client call' - 2 hours ago",
        actions: ["View Notes", "Add Note"]
      };
    }
    // Productivity Stats
    else if (query.includes("productivity") || query.includes("stats") || query.includes("performance")) {
      response = {
        type: "stats",
        message: "This week: 87% task completion rate, 22h tracked, 15 tasks completed. Up 12% from last week! 🎉",
        actions: ["View Dashboard", "Weekly Report"]
      };
    }
    // Help & Commands
    else if (query.includes("help") || query.includes("what can you do")) {
      response = {
        type: "help",
        message: "I can help with: task management, time tracking, team status, meetings, workspace updates, and productivity insights. Try 'team status' or 'start timer'!"
      };
    }
    // Default fallback
    else {
      response = {
        type: "default",
        message: "I'm here to help! Try asking about tasks, time tracking, team status, meetings, or workspace progress.",
        actions: ["View Help", "Quick Actions"]
      };
    }

    setConversations(prev => [...prev, { id: conversations.length + 1, type: 'ai', content: response.message, timestamp: new Date(), actions: response.actions, responseType: response.type }]);
    setMessage("");
    setIsFocused(false);
  };

  const handleTaskSelect = (taskName: string) => {
    setSelectedTask(taskName);
    setShowTaskSelector(false);
  };

  return (
    <div className="flex flex-col gap-3 w-full relative">
      {/* Conversation History - Only show latest AI response when popup is closed */}
      {!showChatPopup && conversations.length > 0 && conversations[conversations.length - 1].type === 'ai' && (
        <div className="bg-white rounded-full border border-[#EEEEEE] pl-6 pr-4 py-3.5 w-full animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] rounded-full flex items-center justify-center flex-shrink-0 shadow-[2px_2px_4px_0px_inset_rgba(255,255,255,0.3)]">
              <Sparkle24Filled className="w-4 h-4 text-white fill-white" />
            </div>
            <p className="flex-1 text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
              {conversations[conversations.length - 1].content}
            </p>

            {/* Action Buttons for responses with actions */}
            {conversations[conversations.length - 1]?.actions && conversations[conversations.length - 1]?.actions!.length > 0 && (
              <div className="flex gap-2">
                <button className="px-5 py-2 bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] hover:shadow-md transition-all active:scale-95 shadow-[2px_2px_4px_0px_inset_rgba(255,255,255,0.3)]">
                  {conversations[conversations.length - 1]?.actions?.[0]}
                </button>
                {conversations[conversations.length - 1]?.actions?.[1] && (
                  <button className="px-5 py-2 bg-[#F7F7F7] text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] hover:bg-[#EEEEEE] transition-all active:scale-95">
                    {conversations[conversations.length - 1]?.actions?.[1]}
                  </button>
                )}
              </div>
            )}

            {/* Success indicator for timer actions */}
            {conversations[conversations.length - 1].responseType === "timer_action" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] rounded-full">
                <CheckmarkCircle24Filled className="w-3.5 h-3.5 text-[#16a34a]" />
                <span className="text-[12px] text-[#16a34a] font-['Manrope:SemiBold',sans-serif]">Started</span>
              </div>
            )}

            {/* Info indicator for general info responses */}
            {conversations[conversations.length - 1].responseType === "info" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F0F9FF] rounded-full">
                <CheckmarkCircle24Filled className="w-3.5 h-3.5 text-[#0284c7]" />
                <span className="text-[12px] text-[#0284c7] font-['Manrope:SemiBold',sans-serif]">Done</span>
              </div>
            )}

            <button
              onClick={() => setConversations(prev => prev.slice(0, -1))}
              className="w-8 h-8 rounded-full hover:bg-[#F7F7F7] flex items-center justify-center transition-all flex-shrink-0"
            >
              <Dismiss24Filled className="w-4 h-4 text-[#999999]" />
            </button>
          </div>
        </div>
      )}

      {/* Expandable Command Center - White Rectangle Expands Upward */}
      <div
        className="bg-white w-full border border-[#EEEEEE] relative transition-all duration-500 ease-out overflow-hidden"
        style={{
          height: showChatPopup ? 'calc(100vh - 140px)' : '88px',
          borderRadius: showChatPopup ? '24px' : '9999px',
          position: showChatPopup ? 'absolute' : 'relative',
          bottom: showChatPopup ? '0' : 'auto',
          left: showChatPopup ? '0' : 'auto',
          right: showChatPopup ? '0' : 'auto',
          zIndex: showChatPopup ? 50 : 1
        }}
      >
        {/* Close Button - Top Left Corner (only visible when expanded) */}
        {showChatPopup && (
          <button
            onClick={() => setShowChatPopup(false)}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-all active:scale-90"
          >
            <Dismiss24Filled className="w-5 h-5 text-[#666666]" />
          </button>
        )}

        {/* Chat Messages Area - Only visible when expanded */}
        {showChatPopup && (
          <div
            ref={conversationRef}
            className="absolute top-0 left-0 right-0 overflow-y-auto px-6 pt-6 flex flex-col justify-end"
            style={{ height: 'calc(100% - 100px)' }}
          >
            <div className="space-y-4 flex flex-col justify-end min-h-full">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] rounded-full flex items-center justify-center shadow-lg">
                    <Sparkle24Filled className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">How can I help you?</h4>
                    <p className="text-[14px] text-[#999999] font-['Inter:Regular',sans-serif] max-w-md">
                      Ask me about tasks, time tracking, team status, meetings, or workspace updates
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    <button
                      onClick={() => { setMessage("team status"); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all"
                    >
                      Team status
                    </button>
                    <button
                      onClick={() => { setMessage("my time"); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all"
                    >
                      My time
                    </button>
                    <button
                      onClick={() => { setMessage("workspace"); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all"
                    >
                      Workspace
                    </button>
                  </div>
                </div>
              ) : (
                conversations.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'ai'
                      ? 'bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] shadow-[2px_2px_4px_0px_inset_rgba(255,255,255,0.3)]'
                      : 'bg-[#F7F7F7]'
                      }`}>
                      {msg.type === 'ai' ? (
                        <Sparkle24Filled className="w-4 h-4 text-white fill-white" />
                      ) : (
                        <Person24Filled className="w-4 h-4 text-[#666666]" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col gap-2 max-w-[70%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-[20px] px-5 py-3 ${msg.type === 'user'
                        ? 'bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white shadow-sm'
                        : 'bg-[#F7F7F7] text-[#111111]'
                        }`}>
                        <p className="text-[14px] font-['Inter:Medium',sans-serif]">
                          {msg.content}
                        </p>
                      </div>

                      {/* Action Buttons for AI messages */}
                      {msg.type === 'ai' && msg.actions && msg.actions.length > 0 && (
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white rounded-full text-[12px] font-['Manrope:SemiBold',sans-serif] hover:shadow-md transition-all active:scale-95 shadow-[2px_2px_4px_0px_inset_rgba(255,255,255,0.3)]">
                            {msg.actions[0]}
                          </button>
                          {msg.actions[1] && (
                            <button className="px-4 py-2 bg-[#F7F7F7] text-[#666666] rounded-full text-[12px] font-['Manrope:SemiBold',sans-serif] hover:bg-[#EEEEEE] transition-all active:scale-95">
                              {msg.actions[1]}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Status Badges */}
                      {msg.type === 'ai' && msg.responseType === 'timer_action' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] rounded-full">
                          <CheckmarkCircle24Filled className="w-3 h-3 text-[#16a34a]" />
                          <span className="text-[11px] text-[#16a34a] font-['Manrope:SemiBold',sans-serif]">Started</span>
                        </div>
                      )}
                      {msg.type === 'ai' && msg.responseType === 'info' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F9FF] rounded-full">
                          <CheckmarkCircle24Filled className="w-3 h-3 text-[#0284c7]" />
                          <span className="text-[11px] text-[#0284c7] font-['Manrope:SemiBold',sans-serif]">Done</span>
                        </div>
                      )}

                      <span className="text-[10px] text-[#999999] font-['Inter:Regular',sans-serif] px-2">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Fixed Input & Timer Controls at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between w-full gap-6">
            {/* Left: AI Command Input */}
            <div className="flex-1 flex items-center gap-3 px-6 py-2.5 bg-[#F7F7F7] rounded-full border border-[#EEEEEE] hover:bg-[#EEEEEE] hover:border-[#D3D2D2] transition-all">
              <Sparkle24Filled className="w-4 h-4 text-[#ff3b3b] fill-[#ff3b3b] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setShowChatPopup(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything or give command..."
                className="flex-1 bg-transparent text-[14px] font-['Inter:Regular',sans-serif] text-[#111111] placeholder:text-[#999999] focus:outline-none min-w-0"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="text-[#666666] hover:text-[#ff3b3b] flex items-center justify-center transition-all active:scale-90">
                  <Mic24Filled className="w-[18px] h-[18px]" />
                </button>
                <button className="text-[#666666] hover:text-[#ff3b3b] flex items-center justify-center transition-all active:scale-90">
                  <Document24Filled className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={handleSend}
                  className="text-[#ff3b3b] hover:text-[#cc2f2f] flex items-center justify-center transition-all active:scale-90"
                >
                  <Send24Filled className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Right: Timer Section (Display + Controls) */}
            <div className="flex items-center gap-4">
              <div className="h-6 w-px bg-[#EEEEEE]" />

              {/* Timer Display with Task Selector */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="text-[22px] font-['Manrope:Bold',sans-serif] text-[#111111] leading-none tracking-tight">
                    {formatTime(time)}
                  </div>
                  {/* Task Selector Button */}
                  <button
                    onClick={() => setShowTaskSelector(!showTaskSelector)}
                    className="flex items-center gap-1.5 mt-1 group hover:bg-[#F7F7F7] rounded-full pr-2 -ml-1 transition-all"
                  >
                    <p className="text-[11px] text-[#666666] font-['Inter:Medium',sans-serif] group-hover:text-[#111111] transition-colors pl-1">
                      {selectedTask}
                    </p>
                    <ChevronDown24Filled className="w-3 h-3 text-[#666666] group-hover:text-[#111111] transition-colors" />
                  </button>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full flex items-center justify-center transition-all active:scale-90 group"
                >
                  {isRunning ? (
                    <Pause24Filled className="w-5 h-5 group-hover:text-white" fill="currentColor" />
                  ) : (
                    <Play24Filled className="w-5 h-5 ml-0.5 group-hover:text-white" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="w-10 h-10 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full flex items-center justify-center transition-all active:scale-90 group"
                >
                  <ArrowCounterclockwise24Filled className="w-5 h-5 group-hover:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Selector Dropdown */}
          {showTaskSelector && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-[20px] shadow-lg border border-[#EEEEEE] p-3 animate-in slide-in-from-bottom-1 duration-200 z-10 w-[320px]">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-left transition-all ${selectedTask === task.name
                      ? 'bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white shadow-sm'
                      : 'hover:bg-[#F7F7F7] text-[#111111]'
                      }`}
                  >
                    <div className="flex-1">
                      <p className={`text-[13px] font-['Manrope:SemiBold',sans-serif] ${selectedTask === task.name ? 'text-white' : 'text-[#111111]'
                        }`}>
                        {task.name}
                      </p>
                      <p className={`text-[10px] font-['Inter:Regular',sans-serif] mt-0.5 ${selectedTask === task.name ? 'text-white/80' : 'text-[#999999]'
                        }`}>
                        {task.project}
                      </p>
                    </div>
                    {selectedTask === task.name && (
                      <CheckmarkCircle24Filled className="w-4 h-4 text-white flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}