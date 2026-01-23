'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, ListTodo, BarChart2, Columns,
  Plus, RotateCcw, Clock, MoreVertical,
  Paperclip, TrendingUp, Briefcase,
  CheckCircle2, AlertCircle,
  MessageSquare,
  Loader2,
  X,
  Send
} from 'lucide-react';
import { Breadcrumb, Checkbox, Button, Tooltip, App, Input, Select, Modal, Mentions } from 'antd';
import { Skeleton } from '../../ui/Skeleton';
import { sanitizeRichText } from '@/utils/sanitizeHtml';
import { useWorkspace, useRequirements, useUpdateRequirement, useWorkspaces } from '@/hooks/useWorkspace';
import { useTasks, useRequestRevision, useCreateTask } from '@/hooks/useTask';
import { TaskForm } from '../../modals/TaskForm';
import { CreateTaskRequestDto } from '@/types/dto/task.dto';
import { getErrorMessage } from '@/types/api-utils';
import { useEmployees, useUserDetails, usePartners } from '@/hooks/useUser';
import { useRequirementActivities, useCreateRequirementActivity } from '@/hooks/useRequirementActivity';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { TaskRow } from '@/components/features/tasks/rows/TaskRow';
import { Requirement, Task, Employee } from '@/types/domain';
import { getRequirementActionState, getRequirementTab } from './utils/requirementState.utils';
import { Archive } from 'lucide-react';

// Extracted components
import { ChatPanel, GanttChartTab, PnLTab, DocumentsTab, KanbanBoardTab } from './components';
import { fileService } from '@/services/file.service';

const { Option } = Select;


export function RequirementDetailsPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params.workspaceId);
  const reqId = Number(params.reqId);

  const { data: workspaceData, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { data: requirementsData, isLoading: isLoadingRequirements } = useRequirements(workspaceId);
  const { data: tasksData } = useTasks(`workspace_id=${workspaceId}`);
  const createTaskMutation = useCreateTask();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);


  const { data: userData } = useUserDetails();
  const { data: employeesData } = useEmployees();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: activityResponse, isLoading: isLoadingActivities } = useRequirementActivities(reqId);
  const createActivity = useCreateRequirementActivity();

  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'gantt' | 'kanban' | 'pnl' | 'documents'>('details');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ganttView, setGanttView] = useState<'day' | 'week' | 'month'>('week');
  const [activeMentionOptions, setActiveMentionOptions] = useState<{ value: string; label: string; key: string }[]>([]);

  // Partner / Receiver Logic
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedReceiverWorkspace, setSelectedReceiverWorkspace] = useState<string | undefined>(undefined);
  const { mutate: updateRequirement } = useUpdateRequirement();
    const { data: myWorkspacesData } = useWorkspaces();
  const { data: partnersData } = usePartners();
  const { mutate: requestRevision } = useRequestRevision();

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [targetTaskId, setTargetTaskId] = useState<number | null>(null);


  const handleAcceptRequirement = () => {
     if (!selectedReceiverWorkspace) {
        message.error("Please select a workspace to import this requirement into.");
        return;
     }
     if (!requirement) return;

     updateRequirement({
        id: reqId,
        workspace_id: requirement.workspace_id,
        title: requirement.title,
        status: 'Assigned',
        receiver_workspace_id: Number(selectedReceiverWorkspace)
     } as unknown as any, {
        onSuccess: () => {
           message.success("Requirement accepted and assigned to workspace.");
           setIsAcceptModalOpen(false);
        },
        onError: (err: Error) => {
           message.error((err as any).message || "Failed to accept requirement");
        }
     });
  };

  const workspace = useMemo(() => {
    if (!workspaceData?.result) return null;
    return workspaceData.result;
  }, [workspaceData]);

  const requirement = useMemo((): Requirement | undefined => {
    if (!requirementsData?.result) return undefined;
    return requirementsData.result.find((r: Requirement) => r.id === reqId);
  }, [requirementsData, reqId]);



  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed') || statusLower.includes('stuck') || statusLower.includes('impediment')) return 'delayed';
    return 'in-progress';
  };

  const tasks = useMemo((): Task[] => {
    if (!tasksData?.result || !requirement) return [];
    return tasksData.result.filter((t: any) => Number(t.requirement_id) === reqId && (!t.type || t.type === 'task'));
  }, [tasksData, requirement, reqId]);

  const revisions = useMemo(() => {
    if (!tasksData?.result || !requirement) return [];
    return tasksData.result.filter((t: Task & { type?: string }) => t.requirement_id === reqId && t.type === 'revision');
  }, [tasksData, requirement, reqId]);

  const { isPending, displayStatus, actionButton, actionButtonLabel } = useMemo(() => {
     return getRequirementActionState(requirement as any, user?.id);
  }, [requirement, user?.id]);

  const formatActivityMessage = (msg: string) => {
    if (!msg) return '';
    const allNames = mentionOptions.map(o => o.value);
    const taskNames = taskOptions.map(o => o.value);
    
    if (allNames.length === 0 && taskNames.length === 0) return msg;

    // Simpler approach for React grouping
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Combine both prefixes into one regex for systematic parsing
    const mentionRegex = new RegExp(`(@(?:${allNames.map(escapeRegExp).join('|')}))|(#(?:${taskNames.map(escapeRegExp).join('|')}))`, 'g');
    let match;

    while ((match = mentionRegex.exec(msg)) !== null) {
      if (match.index > lastIndex) {
        parts.push(msg.substring(lastIndex, match.index));
      }
      
      const isTask = match[0].startsWith('#');
      if (isTask) {
        parts.push(
          <span key={match.index} className="task-token-highlight cursor-pointer hover:underline text-[#2F80ED] bg-[#EBF3FF] px-1.5 py-0.5 rounded-md text-[12px] font-['Inter:Medium',sans-serif]">
            {match[0]}
          </span>
        );
      } else {
        parts.push(
          <span key={match.index} className="mention-token-highlight cursor-pointer hover:underline">
            {match[0]}
          </span>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < msg.length) {
      parts.push(msg.substring(lastIndex));
    }
    
    return parts;
  };

  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const taskOptions = useMemo(() => {
    return tasks.map(t => ({
      value: t.name || t.title || 'Untitled',
      label: t.name || t.title || 'Untitled',
      key: `task-${t.id}`
    }));
  }, [tasks]);

  const mentionOptions = useMemo(() => {
    const options: { value: string; label: string; key: string }[] = [];
    
    // Internal Employees
    if (employeesData?.result) {
      employeesData.result.forEach(emp => {
        options.push({
          value: emp.name,
          label: emp.name,
          key: `emp-${emp.id}`
        });
      });
    }

    // Partners
    if (partnersData?.result) {
      partnersData.result.forEach(partner => {
        options.push({
          value: partner.name,
          label: partner.name,
          key: `partner-${partner.id}`
        });
      });
    }

    // Deduplicate by value (name) to avoid UI confusion if a user is in both lists
    const seen = new Set();
    return options.filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [employeesData, partnersData]);

  // Initialize active options when mentionOptions are ready
  useEffect(() => {
    if (mentionOptions.length > 0 && activeMentionOptions.length === 0) {
      setActiveMentionOptions(mentionOptions);
    }
  }, [mentionOptions]);

  const activityData = useMemo(() => {
    if (!activityResponse?.result) return [];
    return activityResponse.result.map(act => ({
      id: act.id,
      type: act.type.toLowerCase(),
      user: act.user.name,
      avatar: act.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      date: format(new Date(act.created_at), 'MMM d, h:mm a'),
      message: formatActivityMessage(act.message),
      isSystem: act.type === 'SYSTEM',
      attachments: act.attachments.map(a => a.file_name),
      time: act.metadata && typeof act.metadata === 'object' && 'time' in act.metadata ? String((act.metadata as Record<string, unknown>).time) : undefined,
      category: act.metadata && typeof act.metadata === 'object' && 'category' in act.metadata ? String((act.metadata as Record<string, unknown>).category) : undefined,
      task: act.metadata && typeof act.metadata === 'object' && 'task' in act.metadata ? String((act.metadata as Record<string, unknown>).task) : undefined,
      raw: act
    }));
  }, [activityResponse, mentionOptions, taskOptions]);

  const handleMentionSearch = (text: string, prefix: string) => {
    if (prefix === '@') {
      setActiveMentionOptions(mentionOptions.filter(opt => 
        opt.value.toLowerCase().includes(text.toLowerCase())
      ));
    } else if (prefix === '#') {
      setActiveMentionOptions(taskOptions.filter(opt => 
        opt.value.toLowerCase().includes(text.toLowerCase())
      ));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activityResponse]);

  if (isLoadingWorkspace || isLoadingRequirements) {
    return (
      <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Section */}
          <div className="p-8 pb-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-24 rounded" />
              <span className="text-[#CCCCCC]">/</span>
              <Skeleton className="h-4 w-48 rounded" />
            </div>
            
            {/* Title Row with Status & Priority */}
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-80 rounded" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="w-8 h-8 rounded-full border-2 border-white" />
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-[#EEEEEE]">
              <div className="flex items-center gap-1">
                {['Details', 'Tasks & Revisions', 'Gantt Chart', 'Kanban Board', 'P&L', 'Documents'].map((tab, i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className={`h-4 rounded ${i === 0 ? 'w-16 bg-[#ff3b3b]/20' : i < 3 ? 'w-28' : 'w-24'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA]">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Description Card */}
              <div className="bg-white rounded-[16px] p-6 border border-[#EEEEEE] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>

              {/* Requirement Details Card */}
              <div className="bg-white rounded-[16px] p-6 border border-[#EEEEEE] shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-5 w-44 rounded" />
                </div>
                
                {/* Details Grid - 4 columns, 3 rows */}
                <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                  {[
                    { label: 'TYPE', value: 'w-24' },
                    { label: 'PRICING MODEL', value: 'w-36' },
                    { label: 'PARTNER / COMPANY', value: 'w-28' },
                    { label: 'REQUIREMENT BUDGET', value: 'w-20' },
                    { label: 'START DATE', value: 'w-20' },
                    { label: 'DUE DATE', value: 'w-20' },
                    { label: 'CONTACT PERSON', value: 'w-28' },
                    { label: 'QUOTED PRICE', value: 'w-16' },
                    { label: 'TOTAL TASKS', value: 'w-8' },
                    { label: 'PRIORITY', value: 'w-24' },
                    { label: '', value: '' },
                    { label: '', value: '' },
                  ].map((item, i) => (
                    <div key={i}>
                      {item.label && (
                        <>
                          <Skeleton className="h-3 w-24 mb-2 rounded" />
                          <Skeleton className={`h-4 ${item.value} rounded`} />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat Panel Skeleton */}
        <div className="w-[400px] border-l border-[#EEEEEE] flex flex-col bg-white">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-[#EEEEEE]">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <Skeleton className="h-3 w-48 rounded mt-2" />
          </div>

          {/* Activity Feed Skeleton */}
          <div className="flex-1 p-6 space-y-6 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className={`h-16 w-full rounded-xl ${i % 2 === 0 ? 'bg-gray-100' : ''}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Skeleton */}
          <div className="p-4 border-t border-[#EEEEEE]">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!workspace || !requirement) {
    return <div className="p-8">Requirement or Workspace not found</div>;
  }



  const handleSendMessage = async () => {
    if (messageText.trim() || attachments.length > 0) {
      try {
        let uploadedAttachmentIds: number[] = [];

        // Upload files if any
        if (attachments.length > 0) {
          message.loading({ content: 'Uploading attachments...', key: 'chat-upload' });
          
          const uploadPromises = attachments.map(file => 
            fileService.uploadFile(file, 'REQUIREMENT', reqId)
          );
          
          const uploadedFiles = await Promise.all(uploadPromises);
          uploadedAttachmentIds = uploadedFiles.map(f => f.id);
          
          message.success({ content: 'Attachments uploaded!', key: 'chat-upload' });
        }

        await createActivity.mutateAsync({
          requirement_id: reqId,
          message: messageText,
          type: attachments.length > 0 ? 'FILE' : 'CHAT',
          attachment_ids: uploadedAttachmentIds.length > 0 ? uploadedAttachmentIds : undefined
        });
        
        setMessageText('');
        setAttachments([]);
      } catch (err: unknown) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        message.error({ content: errorMessage, key: 'chat-upload' });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Backspace') {
      const { selectionStart, selectionEnd } = e.currentTarget;
      
      // Atomic deletion of mentions like WhatsApp
      if (selectionStart === selectionEnd && selectionStart > 0) {
        const text = messageText;
        const textBefore = text.slice(0, selectionStart);
        
        // Find if the cursor is at the end of a mention or task tag
        const lastAtIndex = textBefore.lastIndexOf('@');
        const lastHashIndex = textBefore.lastIndexOf('#');
        const lastTriggerIndex = Math.max(lastAtIndex, lastHashIndex);
        
        if (lastTriggerIndex !== -1) {
          const prefix = text[lastTriggerIndex];
          const namePart = textBefore.slice(lastTriggerIndex + 1);
          
          let matchedOption;
          if (prefix === '@') {
            matchedOption = mentionOptions.find(opt => 
              namePart === opt.value + ' ' || namePart === opt.value
            );
          } else if (prefix === '#') {
            matchedOption = taskOptions.find(opt => 
              namePart === opt.value + ' ' || namePart === opt.value
            );
          }
          
          if (matchedOption) {
            e.preventDefault();
            const newText = text.slice(0, lastTriggerIndex) + text.slice(selectionStart);
            setMessageText(newText);
          }
        }
      }
    }
  };

  const handleEditorSelectionJump = (e: React.SyntheticEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget as HTMLTextAreaElement;
    const { selectionStart, selectionEnd } = textarea;
    
    if (selectionStart !== selectionEnd) return; 

    const text = messageText;
    const allMentions = [
      ...mentionOptions.map(opt => `@${opt.value}`),
      ...taskOptions.map(opt => `#${opt.value}`)
    ];

    for (const mentionStr of allMentions) {
      let pos = text.indexOf(mentionStr);
      while (pos !== -1) {
        const end = pos + mentionStr.length;
        if (selectionStart > pos && selectionStart < end) {
          const mid = pos + (mentionStr.length / 2);
          const newPos = selectionStart < mid ? pos : end;
          textarea.setSelectionRange(newPos, newPos);
          return;
        }
        pos = text.indexOf(mentionStr, pos + 1);
      }
    }
  };



  const requirementStatus = mapRequirementStatus(displayStatus);
  const assignedTo = requirement.assignedTo || [];

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Breadcrumb
                separator={<span className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">/</span>}
                items={[
                  {
                    title: (
                      <span
                        onClick={() => router.push(`/dashboard/workspace/${workspace.id}/requirements`)}
                        className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                      >
                        {workspace.name}
                      </span>
                    ),
                  },
                  {
                    title: (
                      <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111] line-clamp-1 max-w-[300px]">
                        {requirement.title || requirement.name || 'Untitled Requirement'}
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Standardized Requirement Action CTA */}
              {actionButton && (
                <div className="flex items-center gap-2">
                   {actionButton === 'Map' && (
                     <Button 
                       type="primary" 
                       className="bg-[#111111] hover:bg-[#000000]/90"
                       onClick={() => setIsAcceptModalOpen(true)}
                     >
                       {actionButtonLabel}
                     </Button>
                   )}
                   {actionButton === 'Submit' && (
                      <Button 
                        type="primary" 
                        className="bg-[#111111]"
                        onClick={() => {
                           message.info("Please use the 'Edit' action in the requirements list to resubmit your quote.");
                        }}
                      >
                        {actionButtonLabel}
                      </Button>
                   )}
                   {actionButton === 'Approve' && (
                      <Button 
                        type="primary" 
                        className="bg-[#111111]"
                        onClick={() => {
                           // RequirementsPage handleReqAccept logic
                           updateRequirement({
                              id: reqId,
                              workspace_id: requirement.workspace_id,
                              status: requirement.status === 'Submitted' ? 'Assigned' : 'Completed'
                           } as any, {
                              onSuccess: () => message.success("Requirement accepted successfully")
                           });
                        }}
                      >
                        {actionButtonLabel}
                      </Button>
                   )}
                </div>
              )}

              {/* Reject Action (Secondary) */}
              {((requirement.receiver_company_id === user?.company_id && requirement.status === 'Waiting') || 
                (requirement.sender_company_id === user?.company_id && (requirement.status === 'Review' || requirement.status === 'Submitted'))) && (
                 <Button 
                   danger 
                   icon={<X className="w-4 h-4" />}
                   onClick={() => {
                      Modal.confirm({
                         title: 'Reject Requirement',
                         content: 'Are you sure you want to reject this requirement?',
                         onOk: () => {
                            updateRequirement({
                              id: reqId,
                              workspace_id: requirement.workspace_id,
                              status: 'Rejected'
                            } as any);
                         }
                      });
                   }}
                 >
                   Reject
                 </Button>
              )}

              {/* Accept Modal (Internal to the action trigger) */}
              <Modal
                  open={isAcceptModalOpen}
                  onCancel={() => setIsAcceptModalOpen(false)}
                  title="Accept Requirement"
                  onOk={handleAcceptRequirement}
                  okText="Accept & Import"
                  okButtonProps={{ className: "bg-[#111111]" }}
              >
                  <div className="py-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Select one of your existing workspaces to assign this requirement to.
                      </p>
                      <Select
                        className="w-full"
                        placeholder="Select your workspace"
                        value={selectedReceiverWorkspace}
                        onChange={setSelectedReceiverWorkspace}
                      >
                        {myWorkspacesData?.result?.workspaces?.map((w: { id: number; name: string }) => (
                            <Option key={w.id} value={String(w.id)}>{w.name}</Option>
                        ))}
                      </Select>
                  </div>
              </Modal>

              <StatusBadge status={requirementStatus} showLabel />
              {requirement.is_high_priority && (
                <span className="px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide bg-[#FFF5F5] text-[#ff3b3b]">
                  HIGH PRIORITY
                </span>
              )}
              <div className="flex -space-x-2">
                {Array.isArray(assignedTo) && assignedTo.slice(0, 3).map((person: { name: string } | string, i: number) => {
                  const name = typeof person === 'string' ? person : person?.name || 'U';
                  return (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm" title={name}>
                      <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                        {name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#EEEEEE]">
            <div className="flex items-center gap-8">
              <TabButton
                active={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
                icon={FileText}
                label="Details"
              />
              <TabButton
                active={activeTab === 'tasks'}
                onClick={() => setActiveTab('tasks')}
                icon={ListTodo}
                label="Tasks & Revisions"
              />
              <TabButton
                active={activeTab === 'gantt'}
                onClick={() => setActiveTab('gantt')}
                icon={BarChart2}
                label="Gantt Chart"
              />
              <TabButton
                active={activeTab === 'kanban'}
                onClick={() => setActiveTab('kanban')}
                icon={Columns}
                label="Kanban Board"
              />
              <TabButton
                active={activeTab === 'pnl'}
                onClick={() => setActiveTab('pnl')}
                icon={TrendingUp}
                label="P&L"
              />
              <TabButton
                active={activeTab === 'documents'}
                onClick={() => setActiveTab('documents')}
                icon={Paperclip}
                label="Documents"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA]">
          {activeTab === 'details' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Description Section */}
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ff3b3b]" />
                  Description
                </h3>

                {/* Parse description to extract sections */}
                {(() => {
                  const desc = requirement.description || '';
                  // Create a clean version without HTML tags for parsing logic
                  const cleanDesc = desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

                  const overviewMatch = cleanDesc.match(/Overview:\s*(.+?)(?=\s*Key Deliverables:|$)/i);
                  const deliverablesMatch = cleanDesc.match(/Key Deliverables:\s*([\s\S]+?)(?=\s*Technical Requirements:|$)/i);
                  const technicalMatch = cleanDesc.match(/Technical Requirements:\s*([\s\S]+?)$/i);

                  const overview = overviewMatch ? overviewMatch[1].trim() : '';
                  const listPattern = /•|\s-\s|\s-|-\s|\d+\./;
                  const deliverables = deliverablesMatch
                    ? deliverablesMatch[1].split(listPattern).filter(line => line.trim())
                    : [];
                  const technical = technicalMatch
                    ? technicalMatch[1].split(listPattern).filter(line => line.trim())
                    : [];

                  return (
                    <div className="space-y-6">
                      {/* Overview */}
                      {overview && (
                        <div>
                          <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">Overview</h4>
                          <p className="text-[14px] text-[#444444] font-['Inter:Regular',sans-serif] leading-relaxed">
                            {overview}
                          </p>
                        </div>
                      )}

                      {/* Key Deliverables */}
                      {deliverables.length > 0 && (
                        <div>
                          <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">Key Deliverables</h4>
                          <ul className="space-y-2">
                            {deliverables.map((item, idx) => {
                              const cleanItem = item.replace(/^[•\-*]\s*/, '').trim();
                              return (
                                <li key={idx} className="text-[14px] text-[#444444] font-['Inter:Regular',sans-serif] leading-relaxed flex items-start">
                                  <span className="text-[#ff3b3b] mr-2">•</span>
                                  <span>{cleanItem}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Technical Requirements */}
                      {technical.length > 0 && (
                        <div>
                          <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">Technical Requirements</h4>
                          <ul className="space-y-2">
                            {technical.map((item, idx) => {
                              const cleanItem = item.replace(/^[•\-*]\s*/, '').trim();
                              return (
                                <li key={idx} className="text-[14px] text-[#444444] font-['Inter:Regular',sans-serif] leading-relaxed flex items-start">
                                  <span className="text-[#ff3b3b] mr-2">•</span>
                                  <span>{cleanItem}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Fallback: if no structured format, show as-is but render as sanitized HTML */}
                      {!overview && deliverables.length === 0 && technical.length === 0 && (
                        <div
                          className="text-[14px] text-[#444444] font-['Inter:Regular',sans-serif] leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(requirement.description || '') }}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Requirement Details Section */}
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#ff3b3b]" />
                  Requirement Details
                </h3>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Type */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Type</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {workspace?.in_house ? 'In-house' : 'Client Project'}
                    </p>
                  </div>



                  {/* Partner / Company */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Partner / Company</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {requirement.sender_company?.name || 'In-house'}
                    </p>
                  </div>



                  {/* Start Date */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Start Date</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {requirement.start_date ? format(new Date(requirement.start_date), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>

                  {/* End Date */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Due Date</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {requirement.end_date ? format(new Date(requirement.end_date), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>

                  {/* Contact Person */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Contact Person</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {requirement.contact_person?.name || 'Unknown'}
                    </p>
                  </div>

                  {/* Quoted Price */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Quoted Price</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      ${requirement.quoted_price ? Number(requirement.quoted_price).toFixed(2) : '0.00'}
                    </p>
                  </div>

                  {/* Total Tasks */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Total Tasks</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {requirement.total_task || tasks.length || 0}
                    </p>
                  </div>

                  {/* Leader */}
                  {requirement.leader_user && (
                    <div>
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Leader</p>
                      <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                        {requirement.leader_user.name || 'N/A'}
                      </p>
                    </div>
                  )}

                  {/* Manager */}
                  {requirement.manager_user && (
                    <div>
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Manager</p>
                      <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                        {requirement.manager_user.name || 'N/A'}
                      </p>
                    </div>
                  )}

                  {/* Document Link */}
                  {requirement.document_link && (
                    <div>
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Document</p>
                      <a
                        href={requirement.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] font-['Inter:Medium',sans-serif] text-[#2F80ED] hover:underline truncate block"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {/* Priority */}
                  {requirement.is_high_priority && (
                    <div>
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Priority</p>
                      <span className="px-2 py-1 bg-[#FFF5F5] text-[#ff3b3b] text-[12px] font-['Manrope:Bold',sans-serif] rounded-full">
                        High Priority
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Tasks Section */}
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-[#ff3b3b]" />
                    Tasks Breakdown
                  </h3>
                  <Button 
                    type="default" 
                    size="small" 
                    className="h-8 text-[12px] border-[#EEEEEE]"
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Task
                  </Button>
                </div>

                {/* Table Header - matches TaskRow grid (without requirements) */}
                <div className="px-4 pb-3 mb-2">
                  <div className="grid grid-cols-[40px_2.5fr_1.1fr_1fr_0.8fr_1.5fr_0.6fr_40px] gap-4 items-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTasks(tasks.map((t: Task) => String(t.id)));
                          else setSelectedTasks([]);
                        }}
                        className="border-[#DDDDDD] [&.ant-checkbox-checked]:bg-[#ff3b3b] [&.ant-checkbox-checked]:border-[#ff3b3b]"
                      />
                    </div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Task</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Timeline</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide text-center">Assigned</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide text-center">Duration</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide text-center">Progress</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide text-center">Status</p>
                    <p></p>
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map((task: Task) => {
                      // Map task data to TaskRow expected format
                      const mappedTask = {
                        id: String(task.id),
                        name: task.name || task.title || 'Untitled',
                        taskId: String(task.id),
                        client: workspace?.client_user?.name || workspace?.name || 'N/A',
                        project: requirement?.title || 'N/A',
                        leader: task.leader_user?.name || '',
                        assignedTo: task.member_user?.name || task.task_members?.[0]?.user?.name || 'Unassigned',
                        startDate: task.start_date || '',
                        dueDate: task.end_date || '',
                        estTime: Number(task.estimated_time) || 0,
                        timeSpent: task.time_spent || 0,
                        total_seconds_spent: task.total_seconds_spent || 0,
                        activities: 0,
                        status: task.status || 'Assigned',
                        is_high_priority: task.is_high_priority || (task as any).priority === 'HIGH' || false,
                        timelineDate: task.end_date ? format(new Date(task.end_date), 'MMM dd') : 'N/A',
                        timelineLabel: task.status === 'Delayed' ? 'Overdue' : '',
                        execution_mode: task.execution_mode,
                        task_members: task.task_members || []
                      };
                      return (
                        <TaskRow
                          key={task.id}
                          task={mappedTask as unknown as any}
                          selected={selectedTasks.includes(String(task.id))}
                          onSelect={() => {
                            if (selectedTasks.includes(String(task.id))) {
                              setSelectedTasks(selectedTasks.filter(id => id !== String(task.id)));
                            } else {
                              setSelectedTasks([...selectedTasks, String(task.id)]);
                            }
                          }}
                          onStatusChange={() => {}} // Handle if needed
                          hideRequirements={true}

                          onRequestRevision={() => {
                            setTargetTaskId(task.id as any);
                            setIsRevisionModalOpen(true);
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-[#999999] text-[13px]">No tasks created yet</div>
                  )}
              </div>

              {/* Revision Confirmation Modal */}
              <Modal
                title="Request Revision"
                open={isRevisionModalOpen}
                onCancel={() => {
                   setIsRevisionModalOpen(false);
                   setRevisionNotes('');
                }}
                onOk={() => {
                  if (!targetTaskId || !revisionNotes.trim()) return;
                  requestRevision({ id: targetTaskId, revisionNotes }, {
                    onSuccess: () => {
                      message.success("Revision requested successfully");
                      setIsRevisionModalOpen(false);
                      setRevisionNotes('');
                    },
                    onError: (err: Error) => {
                      message.error((err as any).message || "Failed to request revision");
                    }
                  });
                }}
                okText="Submit Revision"
                okButtonProps={{ className: "bg-[#111111]" }}
              >
                <div className="py-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Describe exactly what needs to be changed. This will create a new revision task for the team.
                  </p>
                  <Input.TextArea 
                    rows={4}
                    placeholder="Revision details..."
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                  />
                </div>
              </Modal>

              </div>

              {/* Revisions Section */}
              {revisions.length > 0 && (
                <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                  <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-[#ff3b3b]" />
                    Revisions
                  </h3>
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_1fr_200px_150px_120px_40px] gap-4 px-4 pb-3 mb-2 border-b border-[#EEEEEE] items-center">
                    <div className="flex justify-center">
                      <Checkbox disabled className="border-[#DDDDDD]" />
                    </div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Revision</p>
                    <div className="flex justify-center">
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Assigned</p>
                    </div>
                    <div className="flex justify-center">
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Due Date</p>
                    </div>
                    <div className="flex justify-center">
                      <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Status</p>
                    </div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
                  </div>
                  <div className="space-y-2">
                    {revisions.map((task: Task) => (
                      <SubTaskRow key={task.id} task={task} isRevision />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gantt' && (
            <GanttChartTab
              tasks={tasks}
              revisions={revisions}
              ganttView={ganttView}
              setGanttView={setGanttView}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoardTab tasks={tasks} revisions={revisions} />
          )}

          {activeTab === 'pnl' && (
            <PnLTab requirement={requirement} tasks={tasks} />
          )}
          
          {activeTab === 'documents' && (
            <DocumentsTab activityData={activityData} />
          )}
        </div>
      </div>

      {/* Right Drawer - Activity & Chat */}
      <ChatPanel
        activityData={activityData}
        isLoadingActivities={isLoadingActivities}
        messageText={messageText}
        setMessageText={setMessageText}
        attachments={attachments}
        setAttachments={setAttachments}
        mentionOptions={mentionOptions}
        taskOptions={taskOptions}
        activeMentionOptions={activeMentionOptions}
        onMentionSearch={handleMentionSearch}
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileSelect}
        onEditorKeyDown={handleEditorKeyDown}
        onEditorSelectionJump={handleEditorSelectionJump}
      />
      <Modal
        open={isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        styles={{
          body: {
            padding: 0,
            height: 'calc(100vh - 100px)',
            overflow: 'hidden',
          },
        }}
      >
        <TaskForm
          isEditing={false}
          initialData={{
            name: '',
            workspace_id: String(workspaceId),
            requirement_id: String(reqId),
            assigned_members: [],
            execution_mode: 'parallel',
            member_id: '',
            leader_id: '',
            end_date: '',
            estimated_time: '',
            is_high_priority: false,
            description: '',
          }}
          disabledFields={{
            workspace: true,
            requirement: true
          }}
          workspaces={workspaceData?.result ? [{ id: workspaceData.result.id, name: workspaceData.result.name }] : []}
          requirements={requirementsData?.result ? (requirementsData.result as Requirement[]).map((r: Requirement) => ({ id: r.id, name: r.title || r.name || `Requirement ${r.id}` })) : []}
          users={employeesData?.result ? (employeesData.result as Employee[]).map((u: Employee) => ({ 
              id: u.user_id || u.id || 0, 
              name: u.name || 'Unknown User',
              profile_pic: u.profile_pic || undefined 
          })) : []}
          onCancel={() => setIsTaskModalOpen(false)}
          onSubmit={(data) => {
              const payload: CreateTaskRequestDto = {
                name: data.name,
                workspace_id: data.workspace_id,
                requirement_id: data.requirement_id,
                start_date: data.start_date || new Date().toISOString(),
                end_date: data.end_date,
                assigned_to: data.assigned_members.length > 0 ? data.assigned_members[0] : undefined,
                member_id: data.member_id ? Number(data.member_id) : undefined,
                leader_id: data.leader_id,
                description: data.description,
                is_high_priority: data.is_high_priority,
                estimated_time: data.estimated_time,
                priority: data.is_high_priority ? 'High' : 'Normal',
                status: 'Assigned',
                assigned_members: data.assigned_members,
                execution_mode: data.execution_mode
              };

              createTaskMutation.mutate(payload, {
                onSuccess: () => {
                    message.success("Task created successfully!");
                    setIsTaskModalOpen(false);
                },
                onError: (error) => {
                    const errorMessage = getErrorMessage(error, "Failed to create task");
                    message.error(errorMessage);
                }
              });
          }}
        />
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 pb-3 relative transition-colors
        ${active ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'}
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[13px] font-['Manrope:Bold',sans-serif]">{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
    </button>
  );
}

function SubTaskRow({
  task,
  isRevision,
  selected = false,
  onSelect
}: Readonly<{
  task: any;
  isRevision?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}>) {
  const assignedName = task.assigned_to ? `User ${task.assigned_to}` : 'Unassigned';
  const initials = assignedName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

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
      <div className="grid grid-cols-[40px_2fr_1fr_1fr_0.6fr_0.3fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={onSelect}
            disabled={isRevision}
            className="border-[#DDDDDD] [&.ant-checkbox-checked]:bg-[#ff3b3b] [&.ant-checkbox-checked]:border-[#ff3b3b]"
          />
        </div>

        {/* Task Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors">
              {task.title || task.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">
              #{task.id}
            </span>
          </div>
        </div>

        {/* Assigned To */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
            <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
              {initials}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex justify-center">
          <span className="text-[13px] text-[#666666] font-['Inter:Medium',sans-serif]">
            {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'N/A'}
          </span>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <StatusBadge status={task.status || 'todo'} />
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

function StatusBadge({ status, showLabel }: { status: string; showLabel?: boolean }) {
  let color = "bg-[#F7F7F7] text-[#666666]";
  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = status;

  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
      color = "bg-[#E8F5E9] text-[#0F9D58]";
      icon = <CheckCircle2 className="w-3.5 h-3.5" />;
      label = "Completed";
      break;
    case 'delayed':
      color = "bg-[#FFF5F5] text-[#ff3b3b]";
      icon = <AlertCircle className="w-3.5 h-3.5" />;
      label = "Delayed";
      break;
    case 'in-progress':
    case 'in_progress':
      color = "bg-[#E3F2FD] text-[#2F80ED]";
      icon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      label = "In Progress";
      break;
    case 'todo':
    case 'pending':
      color = "bg-[#F7F7F7] text-[#666666]";
      icon = <Clock className="w-3.5 h-3.5" />;
      label = "To Do";
      break;
    case 'impediment':
      color = "bg-[#FFF5F5] text-[#ff3b3b]";
      icon = <AlertCircle className="w-3.5 h-3.5" />;
      label = "Impediment";
      break;
  }

  return (
    <Tooltip title={label}>
      <div className={`flex items-center justify-center w-7 h-7 rounded-full ${color} border border-current/10 cursor-help transition-transform hover:scale-110`}>
        {icon}
      </div>
    </Tooltip>
  );
}