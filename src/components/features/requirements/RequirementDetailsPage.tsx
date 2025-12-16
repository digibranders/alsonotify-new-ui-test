import { useState, useMemo } from 'react';
import {
  FileText, ListTodo, BarChart2, Columns,
  Plus, RotateCcw, Clock, MoreVertical,
  Paperclip, X, Send, MessageSquare, Calendar
} from 'lucide-react';
import { Checkbox, Breadcrumb, Button, Tooltip, Dropdown, MenuProps, message } from "antd";
import { TabBar } from '../../layout/TabBar';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace, useRequirements } from '@/hooks/useWorkspace';
import { useTasks } from '@/hooks/useTask';
import { SubTask } from '@/types/genericTypes';
import Image from "next/image";
import { GanttChart } from './GanttChart';

export function RequirementDetailsPage() {
  const params = useParams();
  const workspaceId = Number(params.workspaceId);
  const reqId = Number(params.reqId);
  const router = useRouter();

  const { data: workspaceData, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { data: requirementsData, isLoading: isLoadingRequirements } = useRequirements(workspaceId);
  const { data: tasksData } = useTasks(`project_id=${workspaceId}`);

  // Helper functions - must be defined before useMemo hooks
  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed') || statusLower.includes('stuck') || statusLower.includes('impediment')) return 'delayed';
    return 'in-progress';
  };

  const mapTaskStatus = (status: string): 'impediment' | 'in-progress' | 'completed' | 'todo' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('blocked') || statusLower === 'impediment') return 'impediment';
    if (statusLower.includes('progress') || statusLower === 'in_progress') return 'in-progress';
    if (statusLower.includes('delayed')) return 'delayed';
    return 'todo';
  };

  // Transform workspace
  const workspace = useMemo(() => {
    if (!workspaceData?.result) return null;
    return {
      id: workspaceData.result.id,
      name: workspaceData.result.name || '',
      client: workspaceData.result.client?.name || workspaceData.result.client_company_name || 'N/A',
      taskCount: workspaceData.result.total_task || 0,
      status: workspaceData.result.status === 'Active' || workspaceData.result.status === 'IN_PROGRESS' ? 'active' : 'inactive',
    };
  }, [workspaceData]);

  // Find requirement
  const requirement = useMemo(() => {
    if (!requirementsData?.result) return null;
    const found = requirementsData.result.find((r: any) => r.id === reqId);
    if (!found) return null;

    return {
      id: found.id,
      title: found.name || found.title || '',
      description: found.description || '',
      company: 'Internal',
      client: workspace?.client || 'N/A',
      assignedTo: found.manager ? [found.manager.name] : found.leader ? [found.leader.name] : [],
      dueDate: found.end_date ? new Date(found.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      createdDate: found.start_date ? new Date(found.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      priority: (found.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
      type: found.type || 'inhouse',
      status: mapRequirementStatus(found.status || ''),
      category: found.department?.name || 'General',
      progress: found.progress || 0,
      tasksCompleted: found.total_tasks ? Math.floor(found.total_tasks * (found.progress || 0) / 100) : 0,
      tasksTotal: found.total_tasks || 0,
      workspaceId: found.project_id || workspaceId,
      workspace: workspace?.name || 'Unknown',
      approvalStatus: found.approved_by ? 'approved' : 'pending',
      subTasks: (tasksData?.result || []).filter((t: any) => t.requirement_id === reqId).map((t: any) => ({
        id: String(t.id),
        name: t.name || t.title || '',
        taskId: String(t.id),
        assignedTo: t.assigned_to?.name || 'Unassigned',
        dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        status: mapTaskStatus(t.status || ''),
        type: 'task' as 'task' | 'revision',
      })),
    };
  }, [requirementsData, reqId, workspace, tasksData, workspaceId]);

  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'gantt' | 'kanban'>('details');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  if (isLoadingWorkspace || isLoadingRequirements) {
    return <div className="p-8">Loading requirement details...</div>;
  }

  if (!workspace || !requirement) {
    return <div className="p-8">Requirement or Workspace not found</div>;
  }

  const tasks = requirement.subTasks?.filter(t => !t.type || t.type === 'task') || [];
  const revisions = requirement.subTasks?.filter(t => t.type === 'revision') || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'medium': return 'bg-[#FEF3C7] text-[#D97706]';
      case 'low': return 'bg-[#DBEAFE] text-[#2563EB]';
      default: return 'bg-[#F3F4F6] text-[#6B7280]';
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() || attachments.length > 0) {
      console.log('Sending message:', messageText, attachments);
      setMessageText('');
      setAttachments([]);
      message.success('Message sent');
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

  // Parse description to extract sections (if HTML or structured)
  const parseDescription = (description: string) => {
    if (!description) return { overview: '', deliverables: [], technical: [] };
    
    let overview = description;
    
    // Try to extract structured content if it's HTML (only in browser)
    if (typeof window !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      overview = tempDiv.textContent || description;
    } else {
      // Server-side: strip HTML tags
      overview = description.replace(/<[^>]*>/g, '');
    }
    
    return {
      overview: overview.substring(0, 500) || 'Complete overhaul of the client portal to create a modern, responsive, and intuitive interface that enhances user experience and improves overall functionality.',
      deliverables: [
        'Dashboard Redesign',
        'User Management Module',
        'Reporting System',
        'UI/UX Improvements'
      ],
      technical: [
        'React 18 with TypeScript',
        'Tailwind CSS for styling',
        'Recharts for data visualization',
        'Shadcn/ui for component library'
      ]
    };
  };

  const descriptionContent = parseDescription(requirement.description);

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
                    title: <span className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors" onClick={() => router.push('/dashboard/workspace')}>Workspaces</span>
                  },
                  {
                    title: <span className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors" onClick={() => router.push(`/dashboard/workspace/${workspace.id}/requirements`)}>{workspace.name}</span>
                  },
                  {
                    title: <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111] line-clamp-1 max-w-[300px]">{requirement.title}</span>
                  }
                ]}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-[#EEEEEE] flex items-center justify-center">
                <RotateCcw className="w-3.5 h-3.5 text-[#666666] animate-spin" />
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide ${getPriorityColor(requirement.priority)}`}>
                {requirement.priority}
              </span>
              <div className="flex -space-x-2">
                {requirement.assignedTo.slice(0, 3).map((person, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm" title={person}>
                    <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                      {person.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center">
            <div className="flex items-center gap-8 border-b border-[#EEEEEE]">
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA]">
          {activeTab === 'details' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Description Section */}
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ff3b3b]" />
                  Description
                </h3>
                
                {/* Overview */}
                <div className="mb-6">
                  <p className="text-[14px] text-[#444444] font-['Manrope:Regular',sans-serif] leading-relaxed">
                    {descriptionContent.overview || requirement.description || 'Complete overhaul of the client portal to create a modern, responsive, and intuitive interface that enhances user experience and improves overall functionality.'}
                  </p>
                </div>

                {/* Key Deliverables */}
                <div className="mb-6">
                  <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-3">Key Deliverables</h4>
                  <ul className="space-y-2">
                    {descriptionContent.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[14px] text-[#444444] font-['Manrope:Regular',sans-serif]">
                        <span className="text-[#ff3b3b] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical Requirements */}
                <div>
                  <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-3">Technical Requirements</h4>
                  <ul className="space-y-2">
                    {descriptionContent.technical.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[14px] text-[#444444] font-['Manrope:Regular',sans-serif]">
                        <span className="text-[#ff3b3b] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
                  <Button icon={<Plus className="w-4 h-4" />} size="small" className="text-[12px] flex items-center">
                    Add Task
                  </Button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_200px_150px_120px_40px] gap-4 px-4 pb-3 mb-2 border-b border-[#EEEEEE] items-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTasks(tasks.map(t => t.id));
                        else setSelectedTasks([]);
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Task</p>
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
                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <SubTaskRow
                        key={task.id}
                        task={task}
                        selected={selectedTasks.includes(task.id)}
                        onSelect={() => {
                          if (selectedTasks.includes(task.id)) {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                          } else {
                            setSelectedTasks([...selectedTasks, task.id]);
                          }
                        }}
                      />
                    ))
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
                      <Checkbox disabled />
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
                    {revisions.map(task => <SubTaskRow key={task.id} task={task} isRevision />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gantt' && (
            <div className="max-w-full mx-auto">
              <GanttChart tasks={[]} />
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="bg-white rounded-[16px] border border-[#EEEEEE] shadow-sm p-4 text-center text-[#666666]">
              Kanban Board (Placeholder)
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer - Activity & Chat */}
      <div className="w-[400px] border-l border-[#EEEEEE] flex flex-col bg-white">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#EEEEEE]">
          <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#ff3b3b]" />
            Activity & Chat
          </h3>
          <p className="text-[12px] text-[#666666] font-['Manrope:Regular',sans-serif] mt-1">
            Team collaboration and updates
          </p>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                    {activity.date}
                  </span>
                </div>

                <div className={`${activity.type === 'comment'
                  ? 'bg-[#F7F7F7] p-3 rounded-[12px] rounded-tl-none'
                  : ''
                  }`}>
                  <p className="text-[13px] text-[#444444] font-['Manrope:Regular',sans-serif]">
                    {activity.message}
                  </p>
                  
                  {/* File attachments */}
                  {activity.attachments && activity.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {activity.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href="#"
                          className="text-[12px] text-[#2F80ED] font-['Manrope:Medium',sans-serif] hover:underline block"
                        >
                          {file}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Worklog tags */}
                  {activity.type === 'worklog' && activity.time && activity.task && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF3F2] border border-[#FECACA] text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#ff3b3b]">
                        {activity.time}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F7F7F7] border border-[#EEEEEE] text-[11px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                        {activity.task}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-[#EEEEEE] bg-[#FAFAFA]">
          <div className="flex gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message or comment..."
              className="flex-1 px-3 py-2 border border-[#DDDDDD] rounded-[12px] text-[13px] font-['Manrope:Regular',sans-serif] focus:outline-none focus:border-[#ff3b3b] resize-none h-[80px] bg-white"
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="file-upload" className="cursor-pointer p-2 hover:bg-white rounded-[8px] transition-colors">
                <Paperclip className="w-4 h-4 text-[#666666]" />
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
                className="p-2 bg-[#ff3b3b] hover:bg-[#ff5252] disabled:bg-[#DDDDDD] disabled:cursor-not-allowed rounded-[8px] transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
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
  task: SubTask;
  isRevision?: boolean;
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
      <div className="grid grid-cols-[40px_2fr_1fr_1fr_0.6fr_0.3fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={onSelect}
          />
        </div>

        {/* Task Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors">
              {task.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
              #{task.taskId}
            </span>
          </div>
        </div>

        {/* Assigned To */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
            <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
              {task.assignedTo ? task.assignedTo.split(' ').map((n: string) => n[0]).join('') : 'U'}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex justify-center">
          <span className="text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">{task.dueDate}</span>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <StatusBadge status={task.status} />
        </div>

        {/* Actions */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button type="text" shape="circle" icon={<MoreVertical className="w-4 h-4 text-[#666666]" />} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, showLabel }: { status: string, showLabel?: boolean }) {
  let color = "bg-[#F3F4F6] text-[#6B7280]";
  let icon = <Clock className="w-3.5 h-3.5 animate-pulse" />;
  let label = status;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${color}`}>
      {icon}
      {(showLabel || true) && <span className="text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide">{label}</span>}
    </div>
  );
}