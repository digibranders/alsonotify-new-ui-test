import { useState } from 'react';
import {
  ChevronLeft, FolderOpen, Calendar, Clock, CheckCircle2,
  Loader2, AlertCircle, MoreVertical, RotateCcw,
  FileText, ListTodo, History, BarChart2, Columns,
  User, Edit, Trash2, ArrowRight, Flag, Plus, Send, Paperclip, X, Image as ImageIcon, MessageSquare
} from 'lucide-react';
import { Checkbox } from "./ui/checkbox";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { TabBar } from './TabBar';
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "./ui/dropdown-menu";

import { useParams, useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';
import { Task, SubTask } from '../lib/types';

export function RequirementDetailsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId;
  const reqId = params.reqId;
  const router = useRouter();
  const { getWorkspace, requirements: allRequirements } = useData();

  const workspace = getWorkspace(Number(workspaceId));
  const requirement = allRequirements.find(r => r.id === Number(reqId));

  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'gantt' | 'kanban'>('details');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

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
      // Handle message sending logic here
      console.log('Sending message:', messageText, attachments);
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

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Breadcrumb>
                <BreadcrumbList className="sm:gap-2">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => router.push('/workspaces')}
                      className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                    >
                      Workspaces
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="[&>svg]:size-5 text-[#999999]">
                    <span className="text-[20px] font-['Manrope:SemiBold',sans-serif]">/</span>
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => router.push(`/workspaces/${workspace.id}`)}
                      className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                    >
                      {workspace.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="[&>svg]:size-5 text-[#999999]">
                    <span className="text-[20px] font-['Manrope:SemiBold',sans-serif]">/</span>
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111] line-clamp-1 max-w-[300px]">
                      {requirement.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-4">
              <StatusBadge status={requirement.status} showLabel />
              <span className={`px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide ${getPriorityColor(requirement.priority)}`}>
                {requirement.priority}
              </span>
              <div className="flex -space-x-2">
                {requirement.assignedTo.slice(0, 3).map((person, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm" title={person}>
                    <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                      {person.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                ))}
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
                <p className="text-[14px] text-[#444444] font-['Inter:Regular',sans-serif] leading-relaxed whitespace-pre-wrap">
                  {requirement.description}
                </p>
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
                  <Button variant="outline" size="sm" className="h-8 text-[12px]">
                    <Plus className="w-4 h-4 mr-2" /> Add Task
                  </Button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_200px_150px_120px_40px] gap-4 px-4 pb-3 mb-2 border-b border-[#EEEEEE] items-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedTasks(tasks.map(t => t.id));
                        else setSelectedTasks([]);
                      }}
                      className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
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
                    {revisions.map(task => <SubTaskRow key={task.id} task={task} isRevision />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gantt' && (
            <div className="bg-white rounded-[16px] border border-[#EEEEEE] shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-[#EEEEEE] flex justify-between items-center shrink-0">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#ff3b3b]" />
                  Gantt Chart
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[12px]">Day</Button>
                  <Button variant="outline" size="sm" className="h-8 text-[12px] bg-[#F7F7F7]">Week</Button>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]">Month</Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {/* Gantt Header */}
                <div className="flex border-b border-[#EEEEEE] min-w-[800px]">
                  <div className="w-[250px] p-4 font-['Manrope:Bold',sans-serif] text-[13px] text-[#111111] border-r border-[#EEEEEE] sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Task Name
                  </div>
                  <div className="flex-1 grid grid-cols-10">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const date = new Date('2025-11-20');
                      date.setDate(date.getDate() + i);
                      return (
                        <div key={i} className="border-r border-[#EEEEEE] p-2 text-center min-w-[60px]">
                          <div className="text-[10px] text-[#999999] font-['Inter:SemiBold',sans-serif] uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-[12px] text-[#111111] font-['Manrope:Bold',sans-serif]">{date.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gantt Body */}
                <div className="min-w-[800px]">
                  {[...tasks, ...revisions].map((task, index) => {
                    // Mock start/end for visualization based on index
                    const startOffset = index % 5;
                    const duration = (index % 3) + 2;

                    return (
                      <div key={task.id} className="flex border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors group">
                        <div className="w-[250px] p-3 border-r border-[#EEEEEE] flex items-center gap-3 sticky left-0 bg-white group-hover:bg-[#FAFAFA] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${task.type === 'revision' ? 'bg-[#FFF5F5] text-[#ff3b3b]' : 'bg-[#F7F7F7] text-[#999999]'}`}>
                            #{task.taskId}
                          </span>
                          <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif] truncate">{task.name}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-10 relative py-3">
                          {/* Grid Lines */}
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="border-r border-[#FAFAFA] absolute inset-y-0" style={{ left: `${i * 10}%`, width: '1px' }} />
                          ))}

                          {/* Bar */}
                          <div
                            className={`absolute h-6 rounded-[4px] top-1/2 -translate-y-1/2 flex items-center px-2 shadow-sm
                                                  ${task.status === 'completed' ? 'bg-[#E8F5E9] border border-[#0F9D58] text-[#0F9D58]' :
                                task.status === 'delayed' ? 'bg-[#FDEDEC] border border-[#EB5757] text-[#EB5757]' :
                                  task.type === 'revision' ? 'bg-[#FFF5F5] border border-[#ff3b3b] text-[#ff3b3b]' :
                                    'bg-[#E3F2FD] border border-[#2F80ED] text-[#2F80ED]'
                              }
                                              `}
                            style={{
                              left: `${startOffset * 10}%`,
                              width: `${duration * 10}%`
                            }}
                          >
                            <span className="text-[10px] font-['Manrope:Bold',sans-serif] truncate w-full">{task.assignedTo.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="h-full overflow-x-auto">
              <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                {['todo', 'in-progress', 'impediment', 'completed'].map((status) => {
                  const columnTasks = [...tasks, ...revisions].filter(t => {
                    if (status === 'impediment') return t.status === 'impediment' || t.status === 'delayed';
                    return t.status === status;
                  });

                  const getStatusStyle = (s: string) => {
                    switch (s) {
                      case 'todo': return { color: 'text-[#555555]', bg: 'bg-[#F5F5F5]', label: 'To Do' };
                      case 'in-progress': return { color: 'text-[#2F80ED]', bg: 'bg-[#E3F2FD]', label: 'In Progress' };
                      case 'impediment': return { color: 'text-[#EB5757]', bg: 'bg-[#FDEDEC]', label: 'Blocked / Delayed' };
                      case 'completed': return { color: 'text-[#0F9D58]', bg: 'bg-[#E8F5E9]', label: 'Completed' };
                      default: return { color: 'text-[#555555]', bg: 'bg-[#F5F5F5]', label: 'Unknown' };
                    }
                  };

                  const style = getStatusStyle(status);

                  return (
                    <div key={status} className="flex-1 min-w-[280px] flex flex-col bg-[#F7F7F7] rounded-[16px] p-4 border border-[#EEEEEE]">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} w-fit`}>
                          <div className={`w-2 h-2 rounded-full ${style.color.replace('text', 'bg')}`} />
                          <span className={`text-[12px] font-['Manrope:Bold',sans-serif] ${style.color}`}>{style.label}</span>
                        </div>
                        <span className="text-[12px] font-['Inter:SemiBold',sans-serif] text-[#999999]">{columnTasks.length}</span>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                        {columnTasks.map(task => (
                          <div key={task.id} className="bg-white p-4 rounded-[12px] border border-[#EEEEEE] shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${task.type === 'revision' ? 'bg-[#FFF5F5] text-[#ff3b3b]' : 'bg-[#F7F7F7] text-[#999999]'}`}>
                                #{task.taskId}
                              </span>
                              {task.type === 'revision' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <RotateCcw className="w-3.5 h-3.5 text-[#ff3b3b]" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>Revision</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <h4 className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-3 leading-snug">
                              {task.name}
                            </h4>
                            <div className="flex items-center justify-between pt-3 border-t border-[#FAFAFA]">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#666666] to-[#999999] flex items-center justify-center">
                                  <span className="text-[9px] text-white font-['Manrope:Bold',sans-serif]">
                                    {task.assignedTo.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <span className="text-[11px] text-[#666666] truncate max-w-[80px]">{task.assignedTo.split(' ')[0]}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[#999999]">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px]">{task.dueDate.split('-').slice(0, 2).join('-')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button className="mt-3 flex items-center justify-center gap-2 py-2 rounded-[8px] hover:bg-[#EAEAEA] transition-colors text-[#666666] text-[12px] font-['Manrope:SemiBold',sans-serif] border border-dashed border-[#DDDDDD]">
                        <Plus className="w-4 h-4" /> Add Task
                      </button>
                    </div>
                  );
                })}
              </div>
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
          <p className="text-[12px] text-[#666666] font-['Inter:Regular',sans-serif] mt-1">
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
        <div className="p-4 border-t border-[#EEEEEE] bg-[#FAFAFA]">
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

          <div className="flex gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message or comment..."
              className="flex-1 px-3 py-2 border border-[#DDDDDD] rounded-[12px] text-[13px] font-['Inter:Regular',sans-serif] focus:outline-none focus:border-[#ff3b3b] resize-none h-[80px] bg-white"
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

function TimelineVisual({ startDate, dueDate }: { startDate?: string, dueDate: string }) {
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-');
    return new Date(`${month} ${day}, ${year}`);
  };

  const start = startDate ? parseDate(startDate) : new Date();
  const end = parseDate(dueDate);
  // Mock today
  const mockToday = new Date('2025-12-06');

  if (!start || !end) return null;

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = mockToday.getTime() - start.getTime();

  let percentage = 0;
  if (totalDuration > 0) {
    percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  } else {
    percentage = 100;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const isOverdue = mockToday > end;

  return (
    <div className="flex flex-col w-full gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-['Inter:Medium',sans-serif] text-[#666666]">
        <span>{formatDate(start)}</span>
        <span className={isOverdue ? "text-[#DC2626]" : "text-[#111111]"}>{formatDate(end)}</span>
      </div>
      <div className="relative w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${isOverdue ? 'bg-[#DC2626]' : 'bg-[#111111]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-[10px] text-right font-['Inter:SemiBold',sans-serif]">
        {isOverdue ? (
          <span className="text-[#DC2626]">
            {Math.ceil((mockToday.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))} days overdue
          </span>
        ) : (
          <span className="text-[#666666]">
            {Math.ceil((end.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24))} days left
          </span>
        )}
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
            onCheckedChange={onSelect}
            className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
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
            <span className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">
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
          <div className="hidden group-hover:block absolute bg-white px-2 py-1 rounded shadow-lg border border-gray-100 -bottom-8 left-1/2 -translate-x-1/2 z-20">
            <p className="text-[12px] text-[#666666] font-['Inter:Medium',sans-serif] whitespace-nowrap">
              {task.assignedTo || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex justify-center">
          <span className="text-[13px] text-[#666666] font-['Inter:Medium',sans-serif]">{task.dueDate}</span>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <StatusBadge status={task.status} />
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

function StatusBadge({ status, showLabel }: { status: string, showLabel?: boolean }) {
  let color = "bg-[#F3F4F6] text-[#6B7280]";
  let icon = <Clock className="w-3.5 h-3.5 animate-pulse" />;
  let label = status;

  switch (status) {
    case 'completed':
      color = "bg-[#E8F5E9] text-[#16A34A]";
      icon = <CheckCircle2 className="w-3.5 h-3.5 animate-[bounce_2s_ease-in-out_infinite]" />;
      label = "Completed";
      break;
    case 'delayed':
      color = "bg-[#FEE2E2] text-[#DC2626]";
      icon = <AlertCircle className="w-3.5 h-3.5 animate-pulse" />;
      label = "Delayed";
      break;
    case 'in-progress':
      color = "bg-[#DBEAFE] text-[#2563EB]";
      icon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      label = "In Progress";
      break;
    case 'todo':
      color = "bg-[#F3F4F6] text-[#6B7280]";
      icon = <Clock className="w-3.5 h-3.5" />;
      label = "To Do";
      break;
    case 'impediment':
      color = "bg-[#FEE2E2] text-[#DC2626]";
      icon = <AlertCircle className="w-3.5 h-3.5 animate-pulse" />;
      label = "Impediment";
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full ${color} border border-current/10 cursor-help transition-transform hover:scale-110`}>
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}