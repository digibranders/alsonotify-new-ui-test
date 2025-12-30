'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, ListTodo, BarChart2, Columns,
  Plus, RotateCcw, Clock, MoreVertical,
  Paperclip, X, Send, MessageSquare, Calendar,
  TrendingUp, TrendingDown, Briefcase,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Breadcrumb, Checkbox, Button, Tooltip, App } from 'antd';
import DOMPurify from 'dompurify';
import { useWorkspace, useRequirements } from '@/hooks/useWorkspace';
import { useTasks } from '@/hooks/useTask';
import { SubTask } from '@/types/genericTypes';
import { format } from 'date-fns';
import { TaskRow } from '@/components/features/tasks/rows/TaskRow';

export function RequirementDetailsPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params.workspaceId);
  const reqId = Number(params.reqId);

  const { data: workspaceData, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { data: requirementsData, isLoading: isLoadingRequirements } = useRequirements(workspaceId);
  const { data: tasksData } = useTasks(`project_id=${workspaceId}`);

  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'gantt' | 'kanban' | 'pnl'>('details');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ganttView, setGanttView] = useState<'day' | 'week' | 'month'>('week');

  const workspace = useMemo(() => {
    if (!workspaceData?.result) return null;
    return workspaceData.result;
  }, [workspaceData]);

  const requirement = useMemo(() => {
    if (!requirementsData?.result) return null;
    return requirementsData.result.find((r: any) => r.id === reqId);
  }, [requirementsData, reqId]);

  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed') || statusLower.includes('stuck') || statusLower.includes('impediment')) return 'delayed';
    return 'in-progress';
  };

  const tasks = useMemo(() => {
    if (!tasksData?.result || !requirement) return [];
    return tasksData.result.filter((t: any) => t.requirement_id === reqId && (!t.type || t.type === 'task'));
  }, [tasksData, requirement, reqId]);

  const revisions = useMemo(() => {
    if (!tasksData?.result || !requirement) return [];
    return tasksData.result.filter((t: any) => t.requirement_id === reqId && t.type === 'revision');
  }, [tasksData, requirement, reqId]);

  if (isLoadingWorkspace || isLoadingRequirements) {
    return <div className="p-8">Loading...</div>;
  }

  if (!workspace || !requirement) {
    return <div className="p-8">Requirement or Workspace not found</div>;
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-[#FFF5F5] text-[#ff3b3b]';
      case 'medium': return 'bg-[#FFF8E1] text-[#F59E0B]';
      case 'low': return 'bg-[#F0F9FF] text-[#2F80ED]';
      default: return 'bg-[#F3F4F6] text-[#6B7280]';
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() || attachments.length > 0) {
      setMessageText('');
      setAttachments([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock activity data
  const activityData = [
    { id: 1, type: 'comment', user: 'Siddique Ahmed', avatar: 'SA', date: '2 hours ago', message: 'The homepage design looks great! Just a few minor tweaks needed on the spacing.', attachments: [] },
    { id: 2, type: 'file', user: 'Appurva Panchabhai', avatar: 'AP', date: '5 hours ago', message: 'Uploaded design mockups', attachments: ['homepage-v2.fig', 'assets-bundle.zip'] },
    { id: 3, type: 'worklog', user: 'Siddique Ahmed', avatar: 'SA', date: 'Yesterday', message: 'Logged 4h 30m on Homepage UI Design', time: '4h 30m', task: 'Homepage UI Design' },
    { id: 4, type: 'comment', user: 'Manager', avatar: 'M', date: '2 days ago', message: 'Great progress team! Let\'s aim to complete this by end of week.', attachments: [] },
    { id: 5, type: 'status', user: 'System', avatar: 'S', date: '3 days ago', message: 'Status changed from "Todo" to "In Progress"', isSystem: true },
    { id: 6, type: 'worklog', user: 'Appurva Panchabhai', avatar: 'AP', date: '3 days ago', message: 'Logged 3h 00m on Login Flow Integration', time: '3h', task: 'Login Flow Integration' },
  ];

  const requirementStatus = mapRequirementStatus(requirement.status || 'in-progress');
  const assignedTo = requirement.assignedTo || [];

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Breadcrumb
                separator={<span className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">/</span>}
                items={[
                  {
                    title: (
                      <span
                        onClick={() => router.push('/dashboard/workspace')}
                        className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                      >
                        Workspaces
                      </span>
                    ),
                  },
                  {
                    title: (
                      <span
                        onClick={() => router.push(`/dashboard/workspace/${workspace.id}`)}
                        className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                      >
                        {workspace.name}
                      </span>
                    ),
                  },
                  {
                    title: (
                      <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111] line-clamp-1 max-w-[300px]">
                        {requirement.title}
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            <div className="flex items-center gap-4">
              <StatusBadge status={requirementStatus} showLabel />
              {requirement.priority && (
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide ${getPriorityColor(requirement.priority)}`}>
                  {requirement.priority}
                </span>
              )}
              <div className="flex -space-x-2">
                {Array.isArray(assignedTo) && assignedTo.slice(0, 3).map((person: any, i: number) => {
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
                              const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
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
                              const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
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
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(requirement.description || '') }}
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

                  {/* Pricing Model */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Pricing Model</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111] flex items-center gap-1">
                      <span className="text-[#ff3b3b]">$</span>
                      {requirement.pricing_model || 'Requirement Basis'}
                    </p>
                  </div>

                  {/* Company / Client */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Company / Client</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {workspace?.client_user?.company?.name || workspace?.name || 'N/A'}
                      {workspace?.client_user?.name && ` · ${workspace.client_user.name}`}
                    </p>
                  </div>

                  {/* Requirement Budget */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-2">Requirement Budget</p>
                    <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      ${requirement.budget ? Number(requirement.budget).toFixed(2) : '0.00'}
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

                  {/* High Priority */}
                  {requirement.high_priority && (
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
                  <Button type="default" size="small" className="h-8 text-[12px] border-[#EEEEEE]">
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
                          if (e.target.checked) setSelectedTasks(tasks.map((t: any) => String(t.id)));
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
                    tasks.map((task: any) => {
                      // Map task data to TaskRow expected format
                      const mappedTask = {
                        id: String(task.id),
                        name: task.name || task.title || 'Untitled',
                        taskId: String(task.id),
                        client: workspace?.client_user?.name || workspace?.name || 'N/A',
                        project: requirement?.name || 'N/A',
                        leader: task.leader_user?.name || '',
                        assignedTo: task.member_user?.name || task.task_members?.[0]?.user?.name || 'Unassigned',
                        startDate: task.start_date || '',
                        dueDate: task.end_date || '',
                        estTime: Number(task.estimated_time) || 0,
                        timeSpent: task.time_spent || 0,
                        total_seconds_spent: task.total_seconds_spent || 0,
                        activities: 0,
                        status: task.status || 'Assigned',
                        priority: task.high_priority ? 'high' : 'low',
                        timelineDate: task.end_date ? format(new Date(task.end_date), 'MMM dd') : 'N/A',
                        timelineLabel: task.status === 'Delayed' ? 'Overdue' : '',
                        execution_mode: task.execution_mode,
                        task_members: task.task_members || []
                      };
                      return (
                        <TaskRow
                          key={task.id}
                          task={mappedTask as any}
                          selected={selectedTasks.includes(String(task.id))}
                          onSelect={() => {
                            if (selectedTasks.includes(String(task.id))) {
                              setSelectedTasks(selectedTasks.filter(id => id !== String(task.id)));
                            } else {
                              setSelectedTasks([...selectedTasks, String(task.id)]);
                            }
                          }}
                          hideRequirements={true}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-[#999999] text-[13px]">No tasks created yet</div>
                  )}
                </div>
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
                    {revisions.map((task: any) => (
                      <SubTaskRow key={task.id} task={task} isRevision />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gantt' && (() => {
            // Calculate timeline from actual task dates
            const allTasks = [...tasks, ...revisions];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find earliest start and latest end dates
            let minDate = new Date();
            let maxDate = new Date();
            let hasValidDates = false;

            allTasks.forEach((task: any) => {
              if (task.start_date) {
                const start = new Date(task.start_date);
                if (!hasValidDates || start < minDate) minDate = new Date(start);
                hasValidDates = true;
              }
              if (task.end_date) {
                const end = new Date(task.end_date);
                if (!hasValidDates || end > maxDate) maxDate = new Date(end);
                hasValidDates = true;
              }
            });

            // If no valid dates, use today +/- 2 weeks
            if (!hasValidDates) {
              minDate = new Date(today);
              minDate.setDate(minDate.getDate() - 7);
              maxDate = new Date(today);
              maxDate.setDate(maxDate.getDate() + 14);
            } else {
              // Add buffer days
              minDate.setDate(minDate.getDate() - 3);
              maxDate.setDate(maxDate.getDate() + 7);
            }

            minDate.setHours(0, 0, 0, 0);
            maxDate.setHours(0, 0, 0, 0);

            // Calculate columns based on view mode
            let columnDates: Date[] = [];
            const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            if (ganttView === 'day') {
              // Show individual days (max 21 days)
              const daysToShow = Math.min(totalDays, 21);
              for (let i = 0; i < daysToShow; i++) {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i);
                columnDates.push(d);
              }
            } else if (ganttView === 'week') {
              // Show days grouped by week (14 days)
              const daysToShow = Math.min(totalDays, 14);
              for (let i = 0; i < daysToShow; i++) {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i);
                columnDates.push(d);
              }
            } else {
              // Month view - show weeks (28 days)
              const daysToShow = Math.min(totalDays, 28);
              for (let i = 0; i < daysToShow; i++) {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i);
                columnDates.push(d);
              }
            }

            const timelineStart = columnDates[0];
            const timelineEnd = columnDates[columnDates.length - 1];
            const timelineDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            // Calculate today position
            const todayPosition = today >= timelineStart && today <= timelineEnd
              ? ((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) / timelineDays * 100
              : -1;

            // Calculate bar position for a task
            const getBarPosition = (task: any) => {
              const startDate = task.start_date ? new Date(task.start_date) : today;
              const endDate = task.end_date ? new Date(task.end_date) : new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);

              const startDiff = (startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
              const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

              const left = Math.max(0, (startDiff / timelineDays) * 100);
              const width = Math.min(100 - left, (duration / timelineDays) * 100);

              return { left, width };
            };

            // Get status color
            const getStatusColor = (task: any) => {
              const status = (task.status || '').toLowerCase();
              if (status === 'completed' || status === 'done') return 'bg-[#E8F5E9] border-[#0F9D58] text-[#0F9D58]';
              if (status === 'delayed' || status === 'stuck' || status === 'impediment') return 'bg-[#FFF5F5] border-[#ff3b3b] text-[#ff3b3b]';
              if (status === 'in_progress') return 'bg-[#E3F2FD] border-[#2F80ED] text-[#2F80ED]';
              return 'bg-[#FFF8E1] border-[#F59E0B] text-[#F59E0B]';
            };

            // Get assigned name
            const getAssignedName = (task: any) => {
              if (task.member_user?.name) return task.member_user.name;
              if (task.task_members?.[0]?.user?.name) return task.task_members[0].user.name;
              return 'Unassigned';
            };

            return (
              <div className="bg-white rounded-[16px] border border-[#EEEEEE] shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-[#EEEEEE] flex justify-between items-center shrink-0">
                  <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#ff3b3b]" />
                    Gantt Chart
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      type={ganttView === 'day' ? 'primary' : 'default'}
                      size="small"
                      className="h-8 text-[12px] !rounded-lg"
                      style={ganttView === 'day' ? { backgroundColor: '#ff3b3b', borderColor: '#ff3b3b' } : { borderColor: '#EEEEEE' }}
                      onClick={() => setGanttView('day')}
                    >
                      Day
                    </Button>
                    <Button
                      type={ganttView === 'week' ? 'primary' : 'default'}
                      size="small"
                      className="h-8 text-[12px] !rounded-lg"
                      style={ganttView === 'week' ? { backgroundColor: '#ff3b3b', borderColor: '#ff3b3b' } : { borderColor: '#EEEEEE' }}
                      onClick={() => setGanttView('week')}
                    >
                      Week
                    </Button>
                    <Button
                      type={ganttView === 'month' ? 'primary' : 'default'}
                      size="small"
                      className="h-8 text-[12px] !rounded-lg"
                      style={ganttView === 'month' ? { backgroundColor: '#ff3b3b', borderColor: '#ff3b3b' } : { borderColor: '#EEEEEE' }}
                      onClick={() => setGanttView('month')}
                    >
                      Month
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {/* Gantt Header */}
                  <div className="flex border-b border-[#EEEEEE] min-w-[800px] sticky top-0 bg-white z-20">
                    <div className="w-[250px] p-4 font-['Manrope:Bold',sans-serif] text-[13px] text-[#111111] border-r border-[#EEEEEE] sticky left-0 bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Task Name
                    </div>
                    <div className="flex-1 flex relative">
                      {columnDates.map((date, i) => {
                        const isToday = date.toDateString() === today.toDateString();
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <div
                            key={i}
                            className={`flex-1 border-r border-[#EEEEEE] p-2 text-center min-w-[60px] ${isWeekend ? 'bg-[#FAFAFA]' : ''} ${isToday ? 'bg-[#FFF5F5]' : ''}`}
                          >
                            <div className="text-[10px] text-[#999999] font-['Inter:SemiBold',sans-serif] uppercase">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className={`text-[12px] font-['Manrope:Bold',sans-serif] ${isToday ? 'text-[#ff3b3b]' : 'text-[#111111]'}`}>
                              {date.getDate()}
                            </div>
                            {ganttView !== 'day' && i === 0 && (
                              <div className="text-[9px] text-[#999999] mt-0.5">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gantt Body */}
                  <div className="min-w-[800px] relative">
                    {/* Today Marker */}
                    {todayPosition >= 0 && todayPosition <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[#ff3b3b] z-10 pointer-events-none"
                        style={{ left: `calc(250px + ${todayPosition}% * (100% - 250px) / 100)` }}
                      />
                    )}

                    {allTasks.length > 0 ? allTasks.map((task: any) => {
                      const { left, width } = getBarPosition(task);
                      const statusColor = getStatusColor(task);
                      const assignedName = getAssignedName(task);
                      const isRevision = task.type === 'revision';

                      return (
                        <div key={task.id} className="flex border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors group">
                          <div className="w-[250px] p-3 border-r border-[#EEEEEE] flex items-center gap-3 sticky left-0 bg-white group-hover:bg-[#FAFAFA] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isRevision ? 'bg-[#FFF5F5] text-[#ff3b3b]' : 'bg-[#F7F7F7] text-[#999999]'}`}>
                              #{task.id}
                            </span>
                            <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif] truncate">
                              {task.name || task.title}
                            </span>
                          </div>
                          <div className="flex-1 relative py-3" style={{ minHeight: '44px' }}>
                            {/* Grid Lines */}
                            {columnDates.map((date, i) => {
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                              return (
                                <div
                                  key={i}
                                  className={`absolute inset-y-0 ${isWeekend ? 'bg-[#FAFAFA]' : ''}`}
                                  style={{ left: `${(i / columnDates.length) * 100}%`, width: `${100 / columnDates.length}%`, borderRight: '1px solid #FAFAFA' }}
                                />
                              );
                            })}

                            {/* Task Bar */}
                            <Tooltip title={
                              <div className="text-xs">
                                <div className="font-bold">{task.name || task.title}</div>
                                <div>Start: {task.start_date ? format(new Date(task.start_date), 'MMM d, yyyy') : 'Not set'}</div>
                                <div>End: {task.end_date ? format(new Date(task.end_date), 'MMM d, yyyy') : 'Not set'}</div>
                                <div>Assigned: {assignedName}</div>
                                <div>Status: {task.status || 'Pending'}</div>
                              </div>
                            }>
                              <div
                                className={`absolute h-6 rounded-[4px] top-1/2 -translate-y-1/2 flex items-center px-2 shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${statusColor}`}
                                style={{
                                  left: `${left}%`,
                                  width: `${Math.max(width, 5)}%`,
                                  minWidth: '40px'
                                }}
                              >
                                <span className="text-[10px] font-['Manrope:Bold',sans-serif] truncate w-full">
                                  {assignedName.split(' ')[0]}
                                </span>
                              </div>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-12 text-[#999999] text-[13px]">No tasks to display</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'kanban' && (() => {
            // Map actual statuses to Kanban columns
            const allTasks = [...tasks, ...revisions];

            const getColumnTasks = (column: string) => {
              return allTasks.filter((t: any) => {
                const status = (t.status || '').toLowerCase().replace(' ', '_');
                switch (column) {
                  case 'todo':
                    return status === 'assigned' || status === 'pending' || status === 'todo' || !t.status;
                  case 'in-progress':
                    return status === 'in_progress' || status === 'inprogress';
                  case 'impediment':
                    return status === 'stuck' || status === 'impediment' || status === 'delayed' || status === 'blocked';
                  case 'completed':
                    return status === 'completed' || status === 'done' || status === 'review';
                  default:
                    return false;
                }
              });
            };

            const getAssignedInfo = (task: any) => {
              if (task.member_user?.name) return { name: task.member_user.name, pic: task.member_user.profile_pic };
              if (task.task_members?.[0]?.user?.name) return { name: task.task_members[0].user.name, pic: task.task_members[0].user.profile_pic };
              return { name: 'Unassigned', pic: null };
            };

            return (
              <div className="h-full overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                  {['todo', 'in-progress', 'impediment', 'completed'].map((status) => {
                    const columnTasks = getColumnTasks(status);

                    const getStatusStyle = (s: string) => {
                      switch (s) {
                        case 'todo': return { color: 'text-[#666666]', bg: 'bg-[#F7F7F7]', dotBg: 'bg-[#666666]', label: 'To Do' };
                        case 'in-progress': return { color: 'text-[#2F80ED]', bg: 'bg-[#E3F2FD]', dotBg: 'bg-[#2F80ED]', label: 'In Progress' };
                        case 'impediment': return { color: 'text-[#ff3b3b]', bg: 'bg-[#FFF5F5]', dotBg: 'bg-[#ff3b3b]', label: 'Blocked / Delayed' };
                        case 'completed': return { color: 'text-[#0F9D58]', bg: 'bg-[#E8F5E9]', dotBg: 'bg-[#0F9D58]', label: 'Completed' };
                        default: return { color: 'text-[#666666]', bg: 'bg-[#F5F5F5]', dotBg: 'bg-[#666666]', label: 'Unknown' };
                      }
                    };

                    const style = getStatusStyle(status);

                    return (
                      <div key={status} className="flex-1 min-w-[280px] flex flex-col bg-[#F7F7F7] rounded-[16px] p-4 border border-[#EEEEEE]">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} w-fit`}>
                            <div className={`w-2 h-2 rounded-full ${style.dotBg}`} />
                            <span className={`text-[12px] font-['Manrope:Bold',sans-serif] ${style.color}`}>{style.label}</span>
                          </div>
                          <span className="text-[12px] font-['Inter:SemiBold',sans-serif] text-[#999999]">{columnTasks.length}</span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                          {columnTasks.map((task: any) => {
                            const assigned = getAssignedInfo(task);
                            const initials = assigned.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                            const isRevision = task.type === 'revision';
                            return (
                              <div key={task.id} className="bg-white p-4 rounded-[12px] border border-[#EEEEEE] shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isRevision ? 'bg-[#FFF5F5] text-[#ff3b3b]' : 'bg-[#F7F7F7] text-[#999999]'}`}>
                                    {isRevision ? '#REV-' : '#'}{task.id}
                                  </span>
                                  {isRevision && (
                                    <Tooltip title="Revision">
                                      <RotateCcw className="w-3.5 h-3.5 text-[#ff3b3b]" />
                                    </Tooltip>
                                  )}
                                </div>
                                <h4 className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-3 leading-snug">
                                  {task.name || task.title}
                                </h4>
                                <div className="flex items-center justify-between pt-3 border-t border-[#FAFAFA]">
                                  <div className="flex items-center gap-2">
                                    {assigned.pic ? (
                                      <img src={assigned.pic} alt={assigned.name} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
                                        <span className="text-[9px] text-white font-['Manrope:Bold',sans-serif]">
                                          {initials}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-[11px] text-[#666666] truncate max-w-[80px]">{assigned.name.split(' ')[0]}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[#999999]">
                                    <Calendar className="w-3 h-3" />
                                    <span className="text-[10px]">{task.end_date ? format(new Date(task.end_date), 'dd-MMM') : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button className="mt-3 flex items-center justify-center gap-2 py-2 rounded-[8px] hover:bg-[#EAEAEA] transition-colors text-[#666666] text-[12px] font-['Manrope:SemiBold',sans-serif] border border-dashed border-[#DDDDDD]">
                          <Plus className="w-4 h-4" /> Add Task
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {activeTab === 'pnl' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ff3b3b]" />
                  Profit & Loss Analysis
                </h3>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EEEEEE]">
                    <p className="text-[12px] text-[#666666] font-['Inter:Medium',sans-serif] mb-1">Total Requirement Price</p>
                    <p className="text-[24px] text-[#111111] font-['Manrope:Bold',sans-serif]">$12,500</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EEEEEE]">
                    <p className="text-[12px] text-[#666666] font-['Inter:Medium',sans-serif] mb-1">Resource Investment</p>
                    <p className="text-[24px] text-[#111111] font-['Manrope:Bold',sans-serif]">$8,200</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#D1FADF]">
                    <p className="text-[12px] text-[#027A48] font-['Inter:Medium',sans-serif] mb-1">Net Profit</p>
                    <p className="text-[24px] text-[#027A48] font-['Manrope:Bold',sans-serif]">+$4,300</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Week 1', price: 2500, invested: 1200 },
                      { name: 'Week 2', price: 4000, invested: 2500 },
                      { name: 'Week 3', price: 6500, invested: 4000 },
                      { name: 'Week 4', price: 8500, invested: 5800 },
                      { name: 'Week 5', price: 10500, invested: 7200 },
                      { name: 'Week 6', price: 12500, invested: 8200 },
                    ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff3b3b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ff3b3b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#111111" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#999999', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#999999', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EEEEEE', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        name="Total Requirement Price"
                        stroke="#ff3b3b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                      <Area
                        type="monotone"
                        dataKey="invested"
                        name="Amount Invested"
                        stroke="#111111"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorInvested)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analysis Section */}
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#ff3b3b]" />
                  Cost Analysis Breakdown
                </h3>

                <div className="overflow-x-auto rounded-xl border border-[#EEEEEE]">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-[#F7F7F7] border-b border-[#EEEEEE]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Task</th>
                        <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Allotted Hrs</th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Engaged Hrs</th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Extra Hrs</th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Resource Invested
                          <span className="block text-[10px] normal-case text-[#999999] font-normal">(Engaged × Rate)</span>
                        </th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]">
                      {/* Mock data rows */}
                      <tr className="bg-white hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <span className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Backend API Integration</span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm shrink-0">
                              <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">SA</span>
                            </div>
                            <div>
                              <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Sharifudeen</p>
                              <p className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif]">Developer ($40/hr)</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#666666]">40</span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">55</span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Bold',sans-serif] text-[#DC2626]">+15</span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">$2,200</span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 text-[#DC2626]">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif]">-$600</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer - Activity & Chat */}
      <div className="w-[400px] border-l border-[#EEEEEE] flex flex-col bg-white rounded-tr-[24px] rounded-br-[24px]">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#EEEEEE]">
          <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#ff3b3b]" />
            Activity & Chat
          </h3>
          <p className="text-[12px] text-[#666666] font-['Inter:Regular',sans-serif] mt-1">
            Team collaboration and updates
          </p>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activityData.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.isSystem
                ? 'bg-[#F0F0F0]'
                : 'bg-gradient-to-br from-[#666666] to-[#999999]'
                }`}>
                <span className={`text-[11px] font-['Manrope:Bold',sans-serif] ${activity.isSystem ? 'text-[#999999]' : 'text-white'
                  }`}>
                  {activity.avatar}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-[13px] font-['Manrope:SemiBold',sans-serif] ${activity.isSystem ? 'text-[#999999]' : 'text-[#111111]'
                    }`}>
                    {activity.user}
                  </span>
                  <span className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">
                    {activity.date}
                  </span>
                </div>

                <div className={`${activity.type === 'comment'
                  ? 'bg-[#F7F7F7] p-3 rounded-[12px] rounded-tl-none'
                  : ''
                  }`}>
                  <p className="text-[13px] text-[#444444] font-['Inter:Regular',sans-serif]">
                    {activity.message}
                  </p>

                  {activity.type === 'worklog' && activity.time && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 rounded bg-white text-[#666666] text-[11px] font-mono border border-[#EEEEEE]">
                        {activity.time}
                      </span>
                      <span className="text-[11px] text-[#ff3b3b] font-['Inter:Medium',sans-serif]">
                        {activity.task}
                      </span>
                    </div>
                  )}

                  {activity.attachments && activity.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {activity.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-[#EEEEEE]">
                          <Paperclip className="w-3.5 h-3.5 text-[#666666]" />
                          <span className="text-[11px] text-[#444444] truncate">{file}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-[#EEEEEE] bg-white">
          {attachments.length > 0 && (
            <div className="mb-3 space-y-1">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-[#EEEEEE]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                    <span className="text-[11px] text-[#444444] truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    className="p-1 hover:bg-[#FAFAFA] rounded transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-[#999999]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message or comment..."
              className="w-full min-h-[80px] p-3 pr-10 rounded-[12px] border border-[#DDDDDD] bg-[#FAFAFA] text-[13px] focus:outline-none focus:border-[#ff3b3b]/30 resize-none font-['Inter:Medium',sans-serif]"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <label htmlFor="file-upload" className="cursor-pointer text-[#999999] hover:text-[#666666] transition-colors">
                <Paperclip className="w-4 h-4" />
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() && attachments.length === 0}
                className="text-[#ff3b3b] hover:text-[#E03131] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 pb-4 relative transition-colors
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
}: {
  task: any;
  isRevision?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
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

