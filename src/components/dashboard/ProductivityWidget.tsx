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
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateAgentResponse } from "@/services/assistant";
import { Tooltip, App } from "antd";
import { useUserDetails } from "@/hooks/useUser";
import { useTasks, useUpdateTaskStatus } from "@/hooks/useTask";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useMemo } from "react";
import { getAssignedTasks, startWorkLog, updateWorklog, getAssignedTaskDetail, type AssignedTaskDetailType } from "@/services/task";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WorklogModal } from "../modals/WorklogModal";
import { Modal } from "antd";

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actions?: string[];
  responseType?: string;
}

export function ProductivityWidget() {
  const { message: antdMessage } = App.useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // Current session elapsed seconds (for display)
  const [pausedTime, setPausedTime] = useState(0); // Elapsed seconds when paused (preserved when paused)
  const [resumeTime, setResumeTime] = useState<string>(""); // When timer was resumed (to calculate elapsed after resume)
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [conversations, setConversations] = useState<Message[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWorklogModal, setShowWorklogModal] = useState(false);
  const [worklogAction, setWorklogAction] = useState<'stuck' | 'complete' | null>(null);
  const [startTime, setStartTime] = useState<string>(""); // ISO string of worklog start_datetime
  const [worklogId, setWorklogId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskDetail, setTaskDetail] = useState<AssignedTaskDetailType | null>(null);
  const taskButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: { prompt: string; history: { role: "user" | "assistant"; content: string }[] }) =>
      generateAgentResponse(data.prompt, data.history),
  });

  // Timer effect - calculate elapsed time correctly accounting for pauses
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const taskStatus = (taskDetail?.status || '').toLowerCase();
    const isTaskCompleted = taskStatus.includes('completed') || taskStatus === 'done';

    if (isRunning && !isTaskCompleted && startTime) {
      // Calculate elapsed time:
      // - If we have pausedTime and resumeTime: pausedTime + (currentTime - resumeTime)
      // - Otherwise: currentTime - startTime
      interval = setInterval(() => {
        let elapsed = 0;
        if (pausedTime > 0 && resumeTime) {
          // We resumed from a pause, calculate: paused time + time since resume
          const timeSinceResume = Math.floor((new Date().getTime() - new Date(resumeTime).getTime()) / 1000);
          elapsed = pausedTime + timeSinceResume;
        } else if (pausedTime > 0) {
          // We're paused (shouldn't happen here, but handle it)
          elapsed = pausedTime;
        } else {
          // Normal running, calculate from startTime
          elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
        }
        setTime(Math.max(0, elapsed));
      }, 1000);
    } else if (isTaskCompleted) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, taskDetail, startTime, pausedTime, resumeTime]);

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

  // Fetch tasks assigned to current user using the dedicated endpoint
  const { data: assignedTasksData, refetch: refetchAssignedTasks } = useQuery({
    queryKey: ['assignedTasks'],
    queryFn: () => getAssignedTasks(),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Filter tasks: show only "Assigned" and "In_Progress" tasks
  // Do NOT show "Review" or "Completed" tasks
  // "In_Progress" tasks that were previously in Review (rework) will also show since they're "In_Progress"
  const tasks = useMemo(() => {
    return (assignedTasksData?.result || [])
      .filter((t: any) => {
        const status = (t.status || '').toLowerCase();
        // Show only Assigned and In_Progress tasks
        // Hide Review and Completed tasks
        const isAssigned = status === 'assigned';
        const isInProgress = status.includes('in_progress') || status.includes('in progress');
        const isReview = status.includes('review');
        const isCompleted = status.includes('completed') || status === 'done';
        
        return (isAssigned || isInProgress) && !isReview && !isCompleted;
      })
      .map((t: any) => ({
        id: t.id,
        name: t.name || t.title || "Untitled Task",
        project: t.project_id ? workspacesMap.get(t.project_id) || "Unknown Project" : "No Project",
        status: t.status
      }));
  }, [assignedTasksData, workspacesMap]);

  // Update Status Mutation
  const updateStatusMutation = useUpdateTaskStatus();

  // Start Worklog Mutation
  const startWorklogMutation = useMutation({
    mutationFn: ({ task_id, start_datetime }: { task_id: number; start_datetime: string }) =>
      startWorkLog(task_id, start_datetime),
  });

  // Update Worklog Mutation
  const updateWorklogMutation = useMutation({
    mutationFn: ({ params, worklogId }: { params: any; worklogId: number }) =>
      updateWorklog(params, worklogId),
  });

  // Fetch task detail when task is selected
  const { data: taskDetailData, refetch: refetchTaskDetail } = useQuery({
    queryKey: ['taskDetail', selectedTaskId],
    queryFn: () => getAssignedTaskDetail(selectedTaskId!),
    enabled: !!selectedTaskId,
    staleTime: 10 * 1000, // 10 seconds
  });

  useEffect(() => {
    if (taskDetailData?.result) {
      setTaskDetail(taskDetailData.result);

      // Don't restore timer if task is completed
      const taskStatus = (taskDetailData.result.status || '').toLowerCase();
      if (taskStatus.includes('completed') || taskStatus === 'done') {
        // Task is completed, stop timer and clear state
        setIsRunning(false);
        setTime(0);
        setPausedTime(0);
        setResumeTime("");
        setStartTime("");
        setWorklogId(null);
        localStorage.removeItem("activeTimer");
        return;
      }

      // Check if there's an active worklog (no end_datetime)
      const activeWorklog = taskDetailData.result.task_worklog;
      if (activeWorklog && !activeWorklog.end_datetime && activeWorklog.start_datetime) {
        // Restore timer from active worklog - task is running in database
        // Only restore if the worklogId matches what we have in state/localStorage
        // This prevents restoring from a different worklog when starting a new timer
        const saved = localStorage.getItem("activeTimer");
        let wasPaused = false;
        let savedPausedTime = 0;
        let savedResumeTime = "";
        let savedWorklogId = null;
        
        if (saved) {
          try {
            const savedData = JSON.parse(saved);
            savedWorklogId = savedData.worklogId;
            // Only restore if worklogId matches (same worklog session)
            if (savedData.taskId === selectedTaskId && savedData.worklogId === activeWorklog.id) {
              if (savedData.pausedTime && !savedData.isRunning) {
                // UI was paused but worklog is still open
                wasPaused = true;
                savedPausedTime = savedData.pausedTime;
                savedResumeTime = savedData.resumeTime || "";
              }
            } else if (savedData.taskId === selectedTaskId && savedData.worklogId !== activeWorklog.id) {
              // Different worklog - this means a new worklog was created (e.g., after stuck/complete)
              // Don't restore paused state, start fresh
              wasPaused = false;
              savedPausedTime = 0;
              savedResumeTime = "";
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        setStartTime(activeWorklog.start_datetime);
        setWorklogId(activeWorklog.id || null);
        
        if (wasPaused && savedPausedTime > 0 && savedWorklogId === activeWorklog.id) {
          // UI was paused, restore paused state (same worklog)
          setPausedTime(savedPausedTime);
          setResumeTime(savedResumeTime);
          setIsRunning(false);
          setTime(savedPausedTime);
        } else {
          // Task is running, restore running state or start fresh for new worklog
          setIsRunning(true);
          setPausedTime(0);
          setResumeTime("");
          // Calculate elapsed time from start for current worklog session only
          const elapsed = Math.floor((new Date().getTime() - new Date(activeWorklog.start_datetime).getTime()) / 1000);
          setTime(Math.max(0, elapsed));
        }

        // Save to localStorage for persistence
        const task = tasks.find(t => t.id === selectedTaskId);
        if (task) {
          localStorage.setItem(
            "activeTimer",
            JSON.stringify({
              taskId: selectedTaskId,
              taskName: task.name,
              startTime: activeWorklog.start_datetime,
              worklogId: activeWorklog.id,
              isRunning: !wasPaused,
              pausedTime: wasPaused ? savedPausedTime : 0,
              resumeTime: savedResumeTime,
            })
          );
        }
      } else {
        // No active worklog, check if we have a paused state in localStorage
        const saved = localStorage.getItem("activeTimer");
        if (saved) {
          try {
            const savedData = JSON.parse(saved);
            if (savedData.taskId === selectedTaskId && savedData.pausedTime) {
              // Restore paused state
              setPausedTime(savedData.pausedTime);
              setTime(savedData.pausedTime);
              setIsRunning(false);
              setResumeTime(savedData.resumeTime || "");
              // Keep worklogId and startTime if they exist (for resume)
              if (savedData.worklogId) {
                setWorklogId(savedData.worklogId);
              }
              if (savedData.startTime) {
                setStartTime(savedData.startTime);
              }
            } else {
              // No matching paused state, clear everything
              setIsRunning(false);
              setTime(0);
              setPausedTime(0);
              setResumeTime("");
            }
          } catch (e) {
            setIsRunning(false);
            setTime(0);
            setPausedTime(0);
            setResumeTime("");
          }
        } else {
          // No active worklog and no saved state, ensure timer is stopped
          setIsRunning(false);
          setTime(0);
          setPausedTime(0);
          setResumeTime("");
        }
      }
    }
  }, [taskDetailData, selectedTaskId, tasks]);

  // Load saved timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("activeTimer");
    if (saved) {
      try {
        const savedData = JSON.parse(saved);
          const { taskId, taskName, startTime: savedStart, worklogId: savedWorklogId, isRunning: savedIsRunning, pausedTime: savedPausedTime, resumeTime: savedResumeTime } = savedData;
        if (taskId && taskName) {
          // Set selected task
          setSelectedTask(taskName);
          setSelectedTaskId(taskId);

          // If was running, set startTime and worklogId so taskDetail fetch can restore
          if (savedIsRunning && savedStart) {
            setStartTime(savedStart);
            if (savedWorklogId) {
              setWorklogId(savedWorklogId);
            }
          } else if (savedPausedTime) {
            // If was paused, restore paused state
            setPausedTime(savedPausedTime);
            setTime(savedPausedTime);
            setResumeTime(savedResumeTime || "");
            if (savedStart) {
              setStartTime(savedStart);
            }
            if (savedWorklogId) {
              setWorklogId(savedWorklogId);
            }
          }
          // Fetch task detail to verify active worklog - this will properly restore the timer
        }
      } catch (error) {
        console.error("Error loading saved timer:", error);
        localStorage.removeItem("activeTimer");
      }
    }
  }, []);

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

    const task = tasks.find(t => t.name === selectedTask);
    if (!task) return;

    // Allow starting timer for Assigned and In_Progress tasks
    const taskStatus = (task.status || '').toLowerCase();
    const isAssigned = taskStatus === 'assigned';
    const isInProgress = taskStatus.includes('in_progress') || taskStatus.includes('in progress');
    
    if (!isAssigned && !isInProgress && !isRunning) {
      antdMessage.warning("Cannot start timer for this task status");
      return;
    }

    const newIsRunning = !isRunning;

    if (newIsRunning) {
      // Start/Resume Timer
      if (worklogId && startTime && pausedTime > 0) {
        // Resume from paused: worklog already exists and is still open
        const resumeIso = new Date().toISOString();
        setResumeTime(resumeIso);
        setIsRunning(true);
        setTime(pausedTime); // Start from paused time
        localStorage.setItem(
          "activeTimer",
          JSON.stringify({
            taskId: task.id,
            taskName: selectedTask,
            startTime: startTime, // Keep original startTime
            worklogId: worklogId,
            isRunning: true,
            pausedTime: pausedTime, // Keep paused time
            resumeTime: resumeIso,
          })
        );
        antdMessage.success(`Resumed timer for: ${task.name}`);
      } else if (worklogId && startTime) {
        // Resume existing active worklog (page refresh scenario)
        setIsRunning(true);
        setPausedTime(0);
        const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
        setTime(Math.max(0, elapsed));
        localStorage.setItem(
          "activeTimer",
          JSON.stringify({
            taskId: task.id,
            taskName: selectedTask,
            startTime: startTime,
            worklogId: worklogId,
            isRunning: true,
          })
        );
        antdMessage.success(`Resumed timer for: ${task.name}`);
      } else {
        // Start new timer -> Create worklog
        // IMPORTANT: Reset all timer state to ensure clean start
        const startIso = new Date().toISOString();
        setStartTime(startIso);
        setPausedTime(0);
        setResumeTime("");
        setTime(0);
        setWorklogId(null); // Clear any old worklogId

        startWorklogMutation.mutate(
          { task_id: task.id, start_datetime: startIso },
          {
            onSuccess: (data) => {
              const newWorklogId = data.result?.id || null;
              setWorklogId(newWorklogId);
              setIsRunning(true);
              // Ensure time starts at 0 for new worklog
              setTime(0);

              // Save to localStorage
              localStorage.setItem(
                "activeTimer",
                JSON.stringify({
                  taskId: task.id,
                  taskName: selectedTask,
                  startTime: startIso,
                  worklogId: newWorklogId,
                  isRunning: true,
                })
              );

              // Update selected task ID if not set
              if (!selectedTaskId) {
                setSelectedTaskId(task.id);
              }

              // Refetch task detail to get updated worked_time (includes previous closed worklogs)
              // This ensures worked_time is up-to-date before timer starts counting
              refetchTaskDetail().then(() => {
                // After refetch, timer will start from 0 and display: worked_time + 0
              });

              // Update task status to In_Progress if currently Assigned
              if (taskStatus === 'assigned') {
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
                antdMessage.success(`Started working on: ${task.name}`);
              }
            },
            onError: (error: any) => {
              antdMessage.error("Failed to start timer");
              console.error("Start worklog error:", error);
            }
          }
        );
      }
    } else {
      // Pause Timer -> DO NOT close worklog, just pause UI timer
      setIsRunning(false);
      setResumeTime(""); // Clear resume time
      
      // Calculate and save elapsed time at pause moment
      let currentPausedTime = 0;
      if (pausedTime > 0 && resumeTime) {
        // We were resumed, calculate: pausedTime + (currentTime - resumeTime)
        const timeSinceResume = Math.floor((new Date().getTime() - new Date(resumeTime).getTime()) / 1000);
        currentPausedTime = pausedTime + timeSinceResume;
      } else if (startTime) {
        // Normal pause, calculate from startTime
        const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
        currentPausedTime = Math.max(0, elapsed);
      }
      setPausedTime(currentPausedTime);
      setTime(currentPausedTime);

      // Save paused state to localStorage (worklog remains open)
      localStorage.setItem(
        "activeTimer",
        JSON.stringify({
          taskId: task.id,
          taskName: selectedTask,
          startTime: startTime,
          worklogId: worklogId,
          isRunning: false,
          pausedTime: currentPausedTime,
        })
      );

      antdMessage.info(`Paused timer for: ${task.name}`);
    }
  };

  const handleStuck = () => {
    if (!selectedTask) {
      antdMessage.warning("Please select a task first");
      return;
    }

    // Pause timer at this moment (but don't close worklog yet)
    if (isRunning) {
      setIsRunning(false);
      if (startTime) {
        const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
        const currentPausedTime = Math.max(0, elapsed);
        setPausedTime(currentPausedTime);
        setTime(currentPausedTime);
      }
    }

    setWorklogAction('stuck');
    setShowWorklogModal(true);
  };

  const handleComplete = () => {
    if (!selectedTask) {
      antdMessage.warning("Please select a task first");
      return;
    }

    // Stop timer at this moment (but don't close worklog yet - will close in modal submit)
    if (isRunning) {
      setIsRunning(false);
      if (startTime) {
        const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
        const currentPausedTime = Math.max(0, elapsed);
        setPausedTime(currentPausedTime);
        setTime(currentPausedTime);
      }
    }

    setWorklogAction('complete');
    setShowWorklogModal(true);
  };

  const handleWorklogSubmit = async (description: string) => {
    if (!selectedTask || !worklogAction) return;

    const task = tasks.find(t => t.name === selectedTask);
    if (!task) return;

    // Calculate end_datetime: use the actual elapsed time
    // The backend calculates time_in_seconds as (end_datetime - start_datetime)
    // So we need to send end_datetime = start_datetime + actual_elapsed_time
    let endDatetime: string;
    let actualElapsedTime = 0;
    
    if (pausedTime > 0 && resumeTime) {
      // We were resumed, calculate total elapsed: pausedTime + (currentTime - resumeTime)
      const timeSinceResume = Math.floor((new Date().getTime() - new Date(resumeTime).getTime()) / 1000);
      actualElapsedTime = pausedTime + timeSinceResume;
    } else if (pausedTime > 0) {
      // We're paused, use paused time
      actualElapsedTime = pausedTime;
    } else if (startTime) {
      // We're running normally, calculate from startTime
      actualElapsedTime = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
    }
    
    if (startTime && actualElapsedTime > 0) {
      const start = new Date(startTime);
      endDatetime = new Date(start.getTime() + actualElapsedTime * 1000).toISOString();
    } else {
      // Fallback to current time
      endDatetime = new Date().toISOString();
    }

    // If we have an active worklog (open worklog), close it
    if (startTime && worklogId) {
      const payload = {
        task_id: task.id,
        start_datetime: startTime,
        end_datetime: endDatetime,
        description,
      };

      updateWorklogMutation.mutate(
        { params: payload, worklogId },
        {
          onSuccess: () => {
            // Stop timer immediately when worklog is closed
            setIsRunning(false);

            // Update task status based on action
            // Match old frontend: stuck -> "Impediment", complete -> "Review"
            const newStatus = worklogAction === 'stuck' ? 'Impediment' : 'Review';
            updateStatusMutation.mutate(
              { id: task.id, status: newStatus },
              {
                onSuccess: () => {
                  antdMessage.success(
                    worklogAction === 'stuck'
                      ? `Marked "${task.name}" as stuck`
                      : `Marked "${task.name}" as completed`
                  );

                  // Clear timer state
                  setTime(0);
                  setPausedTime(0);
                  setResumeTime("");
                  setStartTime("");
                  setWorklogId(null);
                  localStorage.removeItem("activeTimer");

                  // If completed, clear selection and remove from task list
                  if (worklogAction === 'complete') {
                    setSelectedTask("");
                    setSelectedTaskId(null);
                    setTaskDetail(null);
                  }

                  // Refetch task detail to update worked_time
                  if (selectedTaskId) {
                    refetchTaskDetail();
                  }

                  // Close modal
                  setShowWorklogModal(false);
                  setWorklogAction(null);

                  // Add AI message for stuck
                  if (worklogAction === 'stuck') {
                    const stuckMessage: Message = {
                      id: Date.now(),
                      type: 'ai',
                      content: `I've marked "${task.name}" as stuck. What specific challenge are you facing? I can help you brainstorm or find resources.`,
                      timestamp: new Date(),
                      responseType: 'info'
                    };
                    setConversations(prev => [...prev, stuckMessage]);
                    setShowChatPopup(true);
                  }
                },
                onError: () => {
                  antdMessage.error("Failed to update task status");
                }
              }
            );
          },
          onError: (error: any) => {
            antdMessage.error("Failed to save worklog");
            console.error("Update worklog error:", error);
          }
        }
      );
    } else {
      // No active worklog in state, but check if there's an open worklog in task detail
      if (taskDetail?.task_worklog && !taskDetail.task_worklog.end_datetime && taskDetail.task_worklog.id) {
        // Close the active worklog - calculate actual elapsed time
        let endDatetime: string;
        let actualElapsedTime = 0;
        
        if (pausedTime > 0 && resumeTime) {
          const timeSinceResume = Math.floor((new Date().getTime() - new Date(resumeTime).getTime()) / 1000);
          actualElapsedTime = pausedTime + timeSinceResume;
        } else if (pausedTime > 0) {
          actualElapsedTime = pausedTime;
        } else if (taskDetail.task_worklog.start_datetime) {
          actualElapsedTime = Math.floor((new Date().getTime() - new Date(taskDetail.task_worklog.start_datetime).getTime()) / 1000);
        }
        
        if (taskDetail.task_worklog.start_datetime && actualElapsedTime > 0) {
          const start = new Date(taskDetail.task_worklog.start_datetime);
          endDatetime = new Date(start.getTime() + actualElapsedTime * 1000).toISOString();
        } else {
          endDatetime = new Date().toISOString();
        }

        const payload = {
          task_id: task.id,
          start_datetime: taskDetail.task_worklog.start_datetime,
          end_datetime: endDatetime,
          description,
        };

        updateWorklogMutation.mutate(
          { params: payload, worklogId: taskDetail.task_worklog.id },
          {
            onSuccess: () => {
              // Then update task status
              // Match old frontend: stuck -> "Impediment", complete -> "Review"
              const newStatus = worklogAction === 'stuck' ? 'Impediment' : 'Review';
              updateStatusMutation.mutate(
                { id: task.id, status: newStatus },
                {
                  onSuccess: () => {
                    antdMessage.success(
                      worklogAction === 'stuck'
                        ? `Marked "${task.name}" as stuck`
                        : `Marked "${task.name}" as completed`
                    );

                    // Clear timer state
                    setIsRunning(false);
                    setTime(0);
                    setPausedTime(0);
                    setResumeTime("");
                    setStartTime("");
                    setWorklogId(null);
                    localStorage.removeItem("activeTimer");

                    if (worklogAction === 'complete') {
                      setSelectedTask("");
                      setSelectedTaskId(null);
                      setTaskDetail(null);
                    }

                    // Refetch task detail
                    if (selectedTaskId) {
                      refetchTaskDetail();
                    }

                    setShowWorklogModal(false);
                    setWorklogAction(null);
                  },
                  onError: () => {
                    antdMessage.error("Failed to update task status");
                  }
                }
              );
            },
            onError: (error: any) => {
              antdMessage.error("Failed to close worklog");
              console.error("Update worklog error:", error);
            }
          }
        );
      } else {
        // No active worklog, just update status
        // Match old frontend: stuck -> "Impediment", complete -> "Review"
        const newStatus = worklogAction === 'stuck' ? 'Impediment' : 'Review';
        updateStatusMutation.mutate(
          { id: task.id, status: newStatus },
          {
            onSuccess: () => {
              antdMessage.success(
                worklogAction === 'stuck'
                  ? `Marked "${task.name}" as stuck`
                  : `Marked "${task.name}" as completed`
              );

              // Clear timer state
              setIsRunning(false);
              setTime(0);
              setPausedTime(0);
              setResumeTime("");
              setStartTime("");
              setWorklogId(null);
              localStorage.removeItem("activeTimer");

              if (worklogAction === 'complete') {
                setSelectedTask("");
                setSelectedTaskId(null);
                setTaskDetail(null);
              }

              // Refetch task detail
              if (selectedTaskId) {
                refetchTaskDetail();
              }

              setShowWorklogModal(false);
              setWorklogAction(null);
            },
            onError: () => {
              antdMessage.error("Failed to update task status");
            }
          }
        );
      }
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
    const task = tasks.find(t => t.name === taskName);
    if (task) {
      // Don't reset timer state here - let the taskDetail useEffect handle restoration
      setSelectedTask(taskName);
      setSelectedTaskId(task.id);
      setShowTaskSelector(false);

      // Task detail will be fetched automatically via the useQuery hook when selectedTaskId changes
      // This will properly restore the timer state if the task has an active worklog
    }
  };

  // Refetch assigned tasks when dropdown is opened
  useEffect(() => {
    if (showTaskSelector) {
      refetchAssignedTasks();
    }
  }, [showTaskSelector, refetchAssignedTasks]);

  // Periodic refresh of task detail while timer is running
  useEffect(() => {
    if (isRunning && selectedTaskId) {
      const interval = setInterval(() => {
        refetchTaskDetail();
      }, 30000); // Refresh every 30 seconds to update worked_time

      return () => clearInterval(interval);
    }
  }, [isRunning, selectedTaskId, refetchTaskDetail]);


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
        <div className={`absolute bottom-0 left-0 right-0 p-4 flex ${showChatPopup ? 'h-auto items-end' : 'h-full items-center'}`}>
          {/* Grid Layout: 3 columns matching dashboard layout with same gap-5 */}
          <div className={`grid grid-cols-3 gap-5 w-full ${showChatPopup ? 'items-end' : 'items-center h-full'}`}>
            {/* Left Section: Input Box (col-span-2 - aligned with Notes and Progress) */}
            <div className={`col-span-2 flex items-center ${showChatPopup ? 'h-auto' : 'h-full'}`}>
              <div className="flex items-center gap-3 px-6 py-2.5 bg-[#F7F7F7] rounded-full border border-[#EEEEEE] hover:bg-[#EEEEEE] hover:border-[#D3D2D2] transition-all w-full">
                <button className="text-[#666666] hover:text-[#ff3b3b] flex items-center justify-center transition-all active:scale-90 flex-shrink-0">
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
                  className="text-[#ff3b3b] hover:text-[#cc2f2f] flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
            <div className={`col-span-1 flex items-center gap-3 justify-between overflow-hidden ${showChatPopup ? 'h-auto' : 'h-full'}`}>
              {/* Left: Vertical Separator and Timer Section */}
              <div className={`flex items-center gap-3 flex-1 min-w-0 ${showChatPopup ? 'h-auto' : 'h-full'}`}>
                {/* Vertical Separator - Small line at the start */}
                <div className="h-8 w-px bg-[#EEEEEE] flex-shrink-0" />

                {/* Timer and Task Selector Layout - Vertically Centered */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0 justify-center">
                  {/* Top Row: Timer and Task Selector */}
                  <div className="flex items-center gap-2.5">
                    {/* Timer Display */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111] leading-none tracking-tight">
                        {selectedTask && taskDetail ? formatTime((taskDetail.worked_time || 0) + time) : formatTime(time)}
                      </div>
                      {isRunning && (
                        <div className="w-2 h-2 rounded-full bg-[#ff3b3b] animate-pulse flex-shrink-0" />
                      )}
                    </div>

                    {/* Task Selector Dropdown - Enhanced visibility */}
                    <button
                      ref={taskButtonRef}
                      onClick={() => setShowTaskSelector(!showTaskSelector)}
                      className={`flex items-center gap-1.5 group rounded-md px-2.5 py-0.5 transition-all text-left flex-1 min-w-0 h-fit ${selectedTask
                          ? 'bg-[#FFF5F5] border border-[#ff3b3b]/30 hover:bg-[#FFEBEB] hover:border-[#ff3b3b]/50'
                          : 'hover:bg-[#F7F7F7] border-0'
                        }`}
                    >
                      <p className={`text-[12px] font-['Manrope:SemiBold',sans-serif] transition-colors truncate ${selectedTask
                          ? 'text-[#ff3b3b]'
                          : 'text-[#666666] group-hover:text-[#111111]'
                        }`}>
                        {selectedTask || "Select Task"}
                      </p>
                      <ChevronDown24Filled className={`w-3 h-3 transition-colors flex-shrink-0 ${selectedTask
                          ? 'text-[#ff3b3b]'
                          : 'text-[#666666] group-hover:text-[#111111]'
                        }`} />
                    </button>
                  </div>

                  {/* Bottom Row: Estimated Time and Progress Bar - Below timer */}
                  {selectedTask && taskDetail && taskDetail.estimated_time > 0 && (() => {
                    // Calculate real-time progress including current timer
                    const estimatedSeconds = taskDetail.estimated_time * 3600;
                    const workedSeconds = taskDetail.worked_time || 0;
                    const currentTimerSeconds = time;
                    const totalWorkedSeconds = workedSeconds + currentTimerSeconds;

                    const progress = (totalWorkedSeconds / estimatedSeconds) * 100;
                    const isOverEstimate = totalWorkedSeconds > estimatedSeconds;
                    const displayProgress = isOverEstimate ? 100 : Math.min(progress, 100);

                    // Get task status for color coding
                    const task = tasks.find(t => t.name === selectedTask);
                    const taskStatus = task?.status || taskDetail.status || '';
                    const statusLower = taskStatus.toLowerCase();

                    // Color logic matching TaskRow component exactly
                    const progressBarColor = isOverEstimate
                      ? 'bg-[#dc2626]'  // Red for overtime
                      : statusLower.includes('completed')
                        ? 'bg-[#16a34a]'  // Green for completed
                        : statusLower.includes('delayed') || statusLower.includes('impediment') || statusLower.includes('stuck')
                          ? 'bg-[#dc2626]'  // Red for delayed/impediment/stuck
                          : statusLower.includes('review')
                            ? 'bg-[#fbbf24]'  // Yellow/Orange for review
                            : 'bg-[#0284c7]';  // Blue for Assigned/In_Progress

                    return (
                      <div className="flex flex-col gap-0.5">
                        {/* Estimated Time */}
                        <div className="text-[10px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                          Estimated: <span className="font-['Manrope:SemiBold',sans-serif] text-[#111111]">{Math.round(taskDetail.estimated_time * 60)}m</span>
                        </div>

                        {/* Progress Bar with real-time animation - matching TaskRow style */}
                        <div className="h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden w-full">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                            style={{
                              width: `${displayProgress}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right: Control Buttons - Pushed to far right */}
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Play/Pause Button */}
                <Tooltip title={isRunning ? "Pause" : "Play"}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    className="w-10 h-10 bg-[#EAEAEA] hover:bg-[#DDDDDD] text-[#666666] rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                    type="button"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStuck();
                    }}
                    className="w-10 h-10 bg-[#EAEAEA] hover:bg-[#DDDDDD] rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                    type="button"
                  >
                    <span className="text-[18px]">✋</span>
                  </button>
                </Tooltip>

                {/* Completed Button */}
                <Tooltip title="Mark as Complete">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComplete();
                    }}
                    className="w-10 h-10 bg-[#EAEAEA] hover:bg-[#DDDDDD] text-[#666666] rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                    type="button"
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

      {/* Worklog Modal */}
      <Modal
        open={showWorklogModal}
        onCancel={() => {
          setShowWorklogModal(false);
          setWorklogAction(null);
          // Resume timer if we have an active worklog (was running before)
          if (startTime && worklogId && !taskDetail?.task_worklog?.end_datetime) {
            setIsRunning(true);
            // If we have pausedTime, restore resume state
            if (pausedTime > 0) {
              setResumeTime(new Date().toISOString());
              setTime(pausedTime);
            } else {
              setResumeTime("");
              const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
              setTime(Math.max(0, elapsed));
            }
          }
        }}
        footer={null}
        width={600}
        styles={{
          body: { padding: 0 },
        }}
        className="worklog-modal"
      >
        <WorklogModal
          onSubmit={handleWorklogSubmit}
          onCancel={() => {
            setShowWorklogModal(false);
            setWorklogAction(null);
            // Resume timer if we have an active worklog (was running before)
            if (startTime && worklogId && !taskDetail?.task_worklog?.end_datetime) {
              setIsRunning(true);
              // Reset paused time since we're resuming
              setPausedTime(0);
              // Recalculate time from startTime
              const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
              setTime(Math.max(0, elapsed));
            }
          }}
          actionType={worklogAction || 'complete'}
        />
      </Modal>
    </div>
  );
}