import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateAgentResponse } from "@/services/assistant";
import { message as antdMessage, Tooltip } from "antd";
import { useUserDetails } from "@/hooks/useUser";
import { useTasks, useUpdateTaskStatus } from "@/hooks/useTask";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useMemo } from "react";

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
  const [selectedTask, setSelectedTask] = useState("");
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: { prompt: string; history: { role: "user" | "assistant"; content: string }[] }) =>
      generateAgentResponse(data.prompt, data.history),
  });

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

  // Fetch user details to get current user ID
  const { data: userDetailsData } = useUserDetails();
  const user = useMemo(() => {
    return userDetailsData?.result?.user || userDetailsData?.result || {};
  }, [userDetailsData]);

  // Fetch workspaces to map project names
  const { data: workspacesData } = useWorkspaces();
  const workspacesMap = useMemo(() => {
    const map = new Map();
    if (workspacesData?.result?.projects) {
      workspacesData.result.projects.forEach((p: any) => map.set(p.id, p.name));
    }
    return map;
  }, [workspacesData]);

  // Fetch tasks
  const { data: tasksData } = useTasks("limit=1000&skip=0");

  // Filter tasks assigned to current user
  const tasks = useMemo(() => {
    const userIds = [user?.id, user?.user_id, user?.employee_detail?.id].filter(Boolean).map(String);

    return (tasksData?.result || [])
      .filter((t: any) => {
        const assignedTo = String(t.assigned_to);
        const isAssignedToUser = userIds.includes(assignedTo);
        const status = (t.status || '').toLowerCase();
        const isNotCompleted = status !== 'completed' && status !== 'done';

        return isAssignedToUser && isNotCompleted;
      })
      .map((t: any) => ({
        id: t.id,
        name: t.title || "Untitled Task",
        project: t.project_id ? workspacesMap.get(t.project_id) || "Unknown Project" : "No Project",
        status: t.status
      }));
  }, [tasksData, user, workspacesMap]);

  // Update Status Mutation
  const updateStatusMutation = useUpdateTaskStatus();

  // Set initial selected task if available and none selected
  // Removed auto-selection to show placeholder "Select Task" as requested
  // useEffect(() => {
  //   if (tasks.length > 0 && !selectedTask) {
  //     setSelectedTask(tasks[0].name);
  //   }
  // }, [tasks]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!selectedTask) {
      antdMessage.warning("Please select a task first");
      return;
    }

    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    const task = tasks.find(t => t.name === selectedTask);
    if (task) {
      if (newIsRunning) {
        // Start Timer -> Set status to In Progress
        updateStatusMutation.mutate(
          { id: task.id, status: 'In_Progress' },
          {
            onSuccess: () => {
              antdMessage.success(`Started working on: ${task.name}`);
            },
            onError: () => {
              antdMessage.error("Failed to update task status");
            }
          }
        );
      } else {
        // Pause Timer -> Set status back to Assigned (or keep In Progress if preferred, but usually Pause means stop working)
        // Here we set it to 'Assigned' to indicate not actively working
        updateStatusMutation.mutate(
          { id: task.id, status: 'Assigned' },
          {
            onSuccess: () => {
              antdMessage.info(`Paused working on: ${task.name}`);
            },
            onError: () => {
              antdMessage.error("Failed to update task status");
            }
          }
        );
      }
    }
  };

  const handleStuck = () => {
    if (!selectedTask) {
      antdMessage.warning("Please select a task first");
      return;
    }

    if (isRunning) {
      setIsRunning(false);
    }

    const task = tasks.find(t => t.name === selectedTask);
    if (task) {
      updateStatusMutation.mutate(
        { id: task.id, status: 'Stuck' },
        {
          onSuccess: () => {
            antdMessage.success(`Marked "${task.name}" as stuck`);
            const stuckMessage: Message = {
              id: Date.now(),
              type: 'ai',
              content: `I've marked "${task.name}" as stuck. What specific challenge are you facing? I can help you brainstorm or find resources.`,
              timestamp: new Date(),
              responseType: 'info'
            };
            setConversations(prev => [...prev, stuckMessage]);
            setShowChatPopup(true);
          },
          onError: () => {
            antdMessage.error("Failed to update task status");
          }
        }
      );
    }
  };

  const handleComplete = () => {
    if (!selectedTask) {
      antdMessage.warning("Please select a task first");
      return;
    }

    if (isRunning) {
      setIsRunning(false);
    }

    const task = tasks.find(t => t.name === selectedTask);
    if (task) {
      updateStatusMutation.mutate(
        { id: task.id, status: 'Completed' },
        {
          onSuccess: () => {
            antdMessage.success(`Marked "${task.name}" as completed`);
            setSelectedTask("");
            setTime(0);
          },
          onError: () => {
            antdMessage.error("Failed to update task status");
          }
        }
      );
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isPending) return;

    const query = message.trim();

    // Add user message to conversation
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };

    setConversations(prev => [...prev, userMessage]);
    setMessage("");
    setIsFocused(false);

    // Handle timer commands locally (these are UI actions, not AI queries)
    const queryLower = query.toLowerCase();
    if (queryLower.includes("start timer") || queryLower.includes("start tracking")) {
      setIsRunning(true);
      const timerMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Timer started for ${selectedTask}`,
        timestamp: new Date(),
        responseType: "timer_action"
      };
      setConversations(prev => [...prev, timerMessage]);
      return;
    }
    if (queryLower.includes("stop timer") || queryLower.includes("pause timer")) {
      setIsRunning(false);
      const timerMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Timer paused at ${formatTime(time)} for ${selectedTask}`,
        timestamp: new Date(),
        responseType: "info"
      };
      setConversations(prev => [...prev, timerMessage]);
      return;
    }
    if (queryLower.includes("reset timer")) {
      setIsRunning(false);
      setTime(0);
      const timerMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Timer has been reset",
        timestamp: new Date(),
        responseType: "info"
      };
      setConversations(prev => [...prev, timerMessage]);
      return;
    }

    // Prepare History (Last 6 valid messages) excluding the current one we just added
    const history = conversations
      .filter((m) => m.type === "user" || m.type === "ai")
      .slice(-6)
      .map((m) => ({
        role: (m.type === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

    try {
      const result = await mutateAsync({ prompt: query, history });

      if (result.error) {
        const errorMessage: Message = {
          id: Date.now() + 1,
          type: 'ai',
          content: result.error,
          timestamp: new Date()
        };
        setConversations(prev => [...prev, errorMessage]);
        antdMessage.error(result.error);
        return;
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.answer ?? "I couldn't generate a response for that request.",
        timestamp: new Date()
      };
      setConversations(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("ProductivityWidget handleSend error", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Unable to reach the assistant. Please try again.",
        timestamp: new Date()
      };
      setConversations(prev => [...prev, errorMessage]);
      antdMessage.error("Unable to reach the assistant. Please try again.");
    }
  };

  const handleTaskSelect = (taskName: string) => {
    setSelectedTask(taskName);
    setShowTaskSelector(false);
  };

  const markdownComponents = useMemo<Components>(
    () => ({
      p: ({ children }) => (
        <p className="mb-2 last:mb-0 text-[14px] font-['Manrope:Medium',sans-serif] leading-relaxed">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="mb-2 pl-4 list-disc space-y-1 text-[14px] font-['Manrope:Medium',sans-serif]">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-2 pl-4 list-decimal space-y-1 text-[14px] font-['Manrope:Medium',sans-serif]">{children}</ol>
      ),
      li: ({ children }) => (
        <li className="pl-1">{children}</li>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-[#111111]">{children}</strong>
      ),
      a: ({ href, children }) => (
        <a href={href} className="text-[#ff3b3b] underline hover:text-[#cc2f2f]" target="_blank" rel="noopener noreferrer">{children}</a>
      ),
      table: ({ children }) => (
        <div className="my-2 overflow-x-auto rounded-lg border border-[#EEEEEE]">
          <table className="w-full text-[13px] text-left">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-[#F7F7F7] font-semibold text-[#111111]">{children}</thead>,
      tbody: ({ children }) => <tbody className="divide-y divide-[#EEEEEE]">{children}</tbody>,
      tr: ({ children }) => <tr className="hover:bg-[#F7F7F7]/50">{children}</tr>,
      th: ({ children }) => <th className="px-3 py-2 whitespace-nowrap">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2">{children}</td>,
    }),
    []
  );

  return (
    <div className="flex flex-col gap-3 w-full relative pr-1">


      {/* Expandable Command Center - White Rectangle Expands Upward */}
      <div
        className={`bg-white w-full border border-[#EEEEEE] relative transition-all duration-500 ease-out ${showChatPopup ? 'overflow-hidden' : 'overflow-visible'}`}
        style={{
          height: showChatPopup ? 'calc(100vh - 140px)' : '88px',
          borderRadius: showChatPopup ? '24px' : '9999px',
          position: showChatPopup ? 'absolute' : 'relative',
          bottom: showChatPopup ? '0' : 'auto',
          left: showChatPopup ? '0' : 'auto',
          right: showChatPopup ? '0' : 'auto',
          zIndex: showChatPopup || showTaskSelector ? 50 : 20
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
            className="absolute top-0 left-0 right-0 overflow-y-auto px-6 pt-6"
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
                    <p className="text-[14px] text-[#999999] font-['Manrope:Regular',sans-serif] max-w-md">
                      Ask me about tasks, time tracking, team status, meetings, or workspace updates
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    <button
                      onClick={() => { setMessage("Give me all the requirements for the project."); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all"
                    >
                      Requirements
                    </button>
                    <button
                      onClick={() => { setMessage("List down all my tasks for today."); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all"
                    >
                      Tasks
                    </button>
                    <button
                      onClick={() => { setMessage("Show the approved leave requests for this month."); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-[#F7F7F7] hover:bg-gradient-to-br hover:from-[#ff3b3b] hover:to-[#cc2f2f] hover:text-white text-[#666666] rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-all"
                    >
                      Leaves
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
                        <p className="text-[14px] font-['Manrope:Medium',sans-serif]">
                          {msg.type === 'ai' ? (
                            <ReactMarkdown
                              components={markdownComponents}
                              remarkPlugins={[remarkGfm]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </p>
                      </div>


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

                      <span className="text-[10px] text-[#999999] font-['Manrope:Regular',sans-serif] px-2">
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
          {/* Grid Layout: 3 columns matching dashboard layout with same gap-5 */}
          <div className="grid grid-cols-3 gap-5 w-full items-center">
            {/* Left Section: Input Box (col-span-2 - aligned with Notes and Progress) */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 px-6 py-2.5 bg-[#F7F7F7] rounded-full border border-[#EEEEEE] hover:bg-[#EEEEEE] hover:border-[#D3D2D2] transition-all">
                <button className="text-[#666666] hover:text-[#ff3b3b] flex items-center justify-center transition-all active:scale-90">
                  <Mic24Filled className="w-[18px] h-[18px]" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setShowChatPopup(true)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything or give command..."
                  className="flex-1 bg-transparent text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111] placeholder:text-[#999999] focus:outline-none min-w-0"
                />
                <button
                  onClick={handleSend}
                  disabled={isPending || !message.trim()}
                  className="text-[#ff3b3b] hover:text-[#cc2f2f] flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <div className="w-[18px] h-[18px] border-2 border-[#ff3b3b] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send24Filled className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Right Section: Timer & Controls (col-span-1 - aligned with Meetings and Leaves left start) */}
            <div className="col-span-1 flex items-center gap-4 justify-between">
              {/* Left: Vertical Separator and Timer Display with Task Selector */}
              <div className="flex items-center gap-4">
                {/* Vertical Separator - Small line at the start */}
                <div className="h-12 w-px bg-[#EEEEEE] flex-shrink-0" />

                {/* Timer Display with Task Selector */}
                <div className="flex flex-col">
                  <div className="text-[22px] font-['Manrope:Bold',sans-serif] text-[#111111] leading-none tracking-tight">
                    {formatTime(time)}
                  </div>
                  {/* Task Selector Dropdown */}
                  <button
                    onClick={() => setShowTaskSelector(!showTaskSelector)}
                    className="flex items-center gap-1.5 mt-1 group hover:bg-[#F7F7F7] rounded-md px-1 transition-all text-left"
                  >
                    <p className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif] group-hover:text-[#111111] transition-colors">
                      {selectedTask || "Select Task"}
                    </p>
                    <ChevronDown24Filled className="w-3 h-3 text-[#666666] group-hover:text-[#111111] transition-colors" />
                  </button>
                </div>
              </div>

              {/* Right: Control Buttons - Pushed to far right */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Play/Pause Button */}
                <Tooltip title={isRunning ? "Pause" : "Play"}>
                  <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 bg-[#EAEAEA] hover:bg-[#DDDDDD] text-[#666666] rounded-full flex items-center justify-center transition-all active:scale-90"
                  >
                    {isRunning ? (
                      <Pause24Filled className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Play24Filled className="w-5 h-5 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                </Tooltip>

                {/* Stuck Button (Palm/Hand) */}
                <Tooltip title="I'm stuck">
                  <button
                    onClick={handleStuck}
                    className="w-10 h-10 bg-[#EAEAEA] hover:bg-[#DDDDDD] rounded-full flex items-center justify-center transition-all active:scale-90"
                  >
                    <span className="text-[18px]">✋</span>
                  </button>
                </Tooltip>

                {/* Completed Button */}
                <Tooltip title="Mark as Complete">
                  <button
                    onClick={handleComplete}
                    className="w-10 h-10 bg-[#EAEAEA] hover:bg-[#DDDDDD] text-[#666666] rounded-full flex items-center justify-center transition-all active:scale-90"
                  >
                    <CheckmarkCircle24Filled className="w-5 h-5 text-[#666666]" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Task Selector Dropdown */}
          {showTaskSelector && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-[20px] shadow-lg border border-[#EEEEEE] p-3 animate-in slide-in-from-bottom-1 duration-200 z-10 w-[320px]">
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-[10px] text-[#999999] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide">
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
                      <p className={`text-[10px] font-['Manrope:Regular',sans-serif] mt-0.5 ${selectedTask === task.name ? 'text-white/80' : 'text-[#999999]'
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