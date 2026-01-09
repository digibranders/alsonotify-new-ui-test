'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, ListTodo, Calendar, Clock, CheckCircle2,
  Loader2, AlertCircle, Briefcase, FolderOpen,
  ArrowRight, Plus, Send, Paperclip, X, MessageSquare
} from 'lucide-react';
import { Breadcrumb, Checkbox, Tooltip, App } from 'antd';
import { useTask, useTaskTimer } from '@/hooks/useTask';
import { useWorkspaces, useRequirements } from '@/hooks/useWorkspace';
import { useEmployees } from '@/hooks/useUser';
import { format } from 'date-fns';
import { PageLayout } from '../../layout/PageLayout';

export function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const taskId = Number(params.taskId);

  const { data: taskData, isLoading } = useTask(taskId);
  const { data: timerData } = useTaskTimer(taskId);
  const { data: employeesData } = useEmployees();
  const { data: workspacesData } = useWorkspaces();

  const task = taskData?.result;
  const { data: requirementsData } = useRequirements(task?.workspace_id || 0);
  const timer = timerData?.result;

  // Use pre-populated relation data from API
  const assignee = task?.member_user || (task?.task_members?.[0]?.user);
  const leader = task?.leader_user;
  const taskProject = task?.taskProject?.company;
  const workspace = taskProject ? { name: taskProject.name, id: task.workspace_id } : undefined;

  const requirement = task?.task_requirement;

  // Calculate progress
  const estimatedHours = timer?.estimated_time || 0;
  const workedSeconds = timer?.worked_time || 0;
  const workedHours = workedSeconds / 3600;
  const progressPercent = estimatedHours > 0
    ? Math.min(Math.round((workedHours / estimatedHours) * 100), 100)
    : 0;
  const formattedLogged = workedHours < 0.1 && workedHours > 0 ? '< 0.1' : workedHours.toFixed(1);

  const [activeTab, setActiveTab] = useState<'details' | 'steps'>('details');
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!task) {
    return <div className="p-8">Task not found</div>;
  }



  // Mock activity data
  const activityData = [
    { id: 1, type: 'comment', user: 'Satyam Yadav', avatar: 'SY', date: '2 hours ago', message: 'Started working on the wireframes.', attachments: [] },
    { id: 2, type: 'status', user: 'System', avatar: 'S', date: 'Yesterday', message: 'Status changed from "Todo" to "In Progress"', isSystem: true },
  ];

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

  // Mock steps data - replace with actual data when available
  const steps: any[] = [];

  const rightDrawer = (
    <div className="w-[400px] border-l border-[#EEEEEE] flex flex-col bg-white rounded-tr-[24px] rounded-br-[24px]">
      {/* Drawer Header */}
      <div className="p-6 border-b border-[#EEEEEE]">
        <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#ff3b3b]" />
          Activity & Chat
        </h3>
        <p className="text-[12px] text-[#666666] font-['Inter:Regular',sans-serif] mt-1">
          Task updates and comments
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
            <label htmlFor="file-upload-task" className="cursor-pointer text-[#999999] hover:text-[#666666] transition-colors">
              <Paperclip className="w-4 h-4" />
              <input
                id="file-upload-task"
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
  );

  return (
    <PageLayout
      title={
        <Breadcrumb
          separator={<span className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">/</span>}
          items={[
            {
              title: (
                <span
                  onClick={() => router.push('/dashboard/tasks')}
                  className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                >
                  Tasks
                </span>
              ),
            },
            {
              title: (
                <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111] line-clamp-1 max-w-[300px]">
                  {task.name || 'Untitled Task'}
                </span>
              ),
            },
          ]}
        />
      }
      action={
        <div className="flex items-center gap-4">
          <StatusBadge status={task.status || 'todo'} showLabel />
          {task.is_high_priority && (
            <span className="px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide bg-[#FFF5F5] text-[#ff3b3b]">
              HIGH PRIORITY
            </span>
          )}
        </div>
      }
      tabs={[
        { id: 'details', label: 'Details' },
        { id: 'steps', label: `Steps (${steps.length})` }
      ]}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
      sideContent={rightDrawer}
    >
      <div className="h-full overflow-y-auto p-0 bg-[#FAFAFA]">
        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* Description Section */}
            <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
              <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ff3b3b]" />
                Description
              </h3>
              <p className="text-[14px] text-[#444444] font-['Inter:Regular',sans-serif] leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </div>

            {/* Task Metadata */}
            <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#ff3b3b]" />
                  Task Overview
                </h3>
              </div>

              {/* Top Row: Context & People */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Assigned To */}
                <div className="bg-[#FAFAFA] rounded-xl p-4 border border-[#F5F5F5]">
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-3">Assigned To</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm text-white font-['Manrope:Bold',sans-serif] text-[14px]">
                      {assignee?.name ? assignee.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] truncate" title={assignee?.name || 'Unassigned'}>
                        {assignee?.name || 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-[#666666] truncate">Member</p>
                    </div>
                  </div>
                </div>

                {/* Leader */}
                <div className="bg-[#FAFAFA] rounded-xl p-4 border border-[#F5F5F5]">
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-3">Leader</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E0E0E0] border border-[#CCCCCC] flex items-center justify-center shadow-sm text-[#666666] font-['Manrope:Bold',sans-serif] text-[14px]">
                      {leader?.name ? leader.name.charAt(0) : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] truncate">{leader?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-[#666666] truncate">Creator</p>
                    </div>
                  </div>
                </div>

                {/* Workspace */}
                <div className="bg-[#FAFAFA] rounded-xl p-4 border border-[#F5F5F5]">
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-3">Workspace</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#EEEEEE] flex items-center justify-center text-[#111111]">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] truncate">
                        {workspace?.name || 'No Workspace'}
                      </p>
                      <p className="text-[11px] text-[#666666] truncate">Project</p>
                    </div>
                  </div>
                </div>

                {/* Requirement */}
                <div className="bg-[#FAFAFA] rounded-xl p-4 border border-[#F5F5F5]">
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-3">Requirement</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#EEEEEE] flex items-center justify-center text-[#111111]">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] truncate">
                        {requirement?.name || (task?.requirement_id ? `Req ${task.requirement_id}` : 'None')}
                      </p>
                      <p className="text-[11px] text-[#666666] truncate">Scope</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Timeline & Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#EEEEEE]">
                {/* Timeline */}
                <div className="flex flex-col">
                  <h4 className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#999999]" />
                    Timeline
                  </h4>
                  <div className="bg-[#FAFAFA] p-5 rounded-xl border border-[#F5F5F5] flex items-center justify-between flex-1 h-full">
                    <div>
                      <p className="text-[11px] text-[#999999] mb-1">Start Date</p>
                      <p className="text-[14px] font-['Inter:SemiBold',sans-serif] text-[#111111]">
                        {task.start_date ? format(new Date(task.start_date), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                    <div className="flex flex-col items-center px-4 opacity-30">
                      <span className="h-[1px] w-12 bg-black mb-1"></span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#999999] mb-1">Due Date</p>
                      <p className="text-[14px] font-['Inter:SemiBold',sans-serif] text-[#111111]">
                        {task.end_date ? format(new Date(task.end_date), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Metrics */}
                <div className="flex flex-col">
                  <h4 className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#999999]" />
                    Progress Tracking
                  </h4>
                  <div className="bg-[#FAFAFA] p-5 rounded-xl border border-[#F5F5F5] space-y-4 flex-1 h-full flex flex-col justify-center">
                    <div className="flex justify-between items-end w-full">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[24px] font-['Manrope:Bold',sans-serif] text-[#111111] leading-none">{estimatedHours}</span>
                          <span className="text-[13px] text-[#666666] font-['Inter:Medium',sans-serif]">hrs estimated</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[18px] font-['Manrope:Bold',sans-serif] leading-none ${task.status?.toLowerCase() === 'delayed' ? 'text-[#ff3b3b]' :
                          task.status?.toLowerCase() === 'completed' ? 'text-[#0F9D58]' :
                            'text-[#2F80ED]'
                          }`}>
                          {progressPercent}%
                        </p>
                      </div>
                    </div>

                    <div className="relative pt-2 w-full">
                      <div className="flex justify-between text-[10px] font-['Inter:SemiBold',sans-serif] text-[#999999] mb-1.5 uppercase tracking-wide">
                        <span>0h</span>
                        <span>{formattedLogged}h logged</span>
                      </div>
                      <div className="w-full h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${task.status?.toLowerCase() === 'delayed' ? 'bg-[#ff3b3b]' :
                            task.status?.toLowerCase() === 'completed' ? 'bg-[#0F9D58]' :
                              'bg-[#2F80ED]'
                            }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-[#ff3b3b]" />
                  Steps Breakdown
                </h3>
                <button className="h-8 px-3 text-[12px] border border-[#EEEEEE] rounded-md hover:bg-[#FAFAFA] transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_1.5fr_1fr_1fr] gap-4 px-4 pb-3 mb-2 border-b border-[#EEEEEE] items-center">
                <div className="flex justify-center">
                  <Checkbox
                    checked={steps.length > 0 && selectedSteps.length === steps.length}
                    onChange={(e) => {
                      if (e.target.checked && steps.length > 0) {
                        setSelectedSteps(steps.map((s: any) => s.id));
                      } else {
                        setSelectedSteps([]);
                      }
                    }}
                    className="border-[#DDDDDD] [&.ant-checkbox-checked]:bg-[#ff3b3b] [&.ant-checkbox-checked]:border-[#ff3b3b]"
                  />
                </div>
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Assignee</p>
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Role</p>
                <div className="flex justify-center">
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Est. Hours</p>
                </div>
                <div className="flex justify-center">
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Status</p>
                </div>
              </div>

              <div className="space-y-2">
                {steps.length > 0 ? (
                  steps.map((step: any) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      selected={selectedSteps.includes(step.id)}
                      onSelect={() => {
                        if (selectedSteps.includes(step.id)) {
                          setSelectedSteps(selectedSteps.filter(id => id !== step.id));
                        } else {
                          setSelectedSteps([...selectedSteps, step.id]);
                        }
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-[#999999] text-[13px]">No steps defined</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
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
    case 'in-review':
    case 'review':
      color = "bg-[#F3E5F5] text-[#9C27B0]";
      icon = <Loader2 className="w-3.5 h-3.5" />;
      label = "In Review";
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

function StepRow({
  step,
  selected = false,
  onSelect
}: {
  step: any;
  selected?: boolean;
  onSelect?: () => void;
}) {
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
      <div className="grid grid-cols-[40px_1fr_1.5fr_1fr_1fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={onSelect}
            className="border-[#DDDDDD] [&.ant-checkbox-checked]:bg-[#ff3b3b] [&.ant-checkbox-checked]:border-[#ff3b3b]"
          />
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
            <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
              {step.assignee ? step.assignee.charAt(0) : 'U'}
            </span>
          </div>
          <span className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">{step.assignee || 'Unassigned'}</span>
        </div>

        {/* Role */}
        <div>
          <span className="text-[13px] text-[#666666] font-['Inter:Medium',sans-serif]">{step.role || 'N/A'}</span>
        </div>

        {/* Hours */}
        <div className="flex justify-center">
          <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">{step.estHours || 0} hrs</span>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <StatusBadge status={step.status || 'todo'} />
        </div>
      </div>
    </div>
  );
}

