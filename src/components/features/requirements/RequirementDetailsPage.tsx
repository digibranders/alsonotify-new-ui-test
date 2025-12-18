import { useState, useMemo, useEffect } from 'react';
import {
  FileText, ListTodo, BarChart2, Columns,
  Plus, RotateCcw, Clock, MoreVertical,
  Paperclip, X, Send, MessageSquare, Calendar,
  TrendingUp, TrendingDown, DollarSign, Briefcase,
  CheckCircle2, Loader2, AlertCircle
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

    // Derive pricing/contact/rejection data similar to global Requirements page
    const mockPricingModel =
      found.pricing_model || (found.hourly_rate ? 'hourly' : 'project');

    const mockContactPerson =
      found.type === 'outsourced' && !found.contact_person
        ? 'External Vendor'
        : found.contact_person;

    const mockRejectionReason =
      found.status?.toLowerCase().includes('rejected') && !found.rejection_reason
        ? 'Requirement was rejected during review process'
        : found.rejection_reason;

    return {
      id: found.id,
      title: found.name || found.title || '',
      description: found.description || '',
      company: 'Internal',
      client: workspace?.client || 'N/A',
      assignedTo: found.manager ? [found.manager.name] : found.leader ? [found.leader.name] : [],
      dueDate: found.end_date
        ? new Date(found.end_date)
            .toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            .replace(/ /g, '-')
        : 'TBD',
      createdDate: found.start_date
        ? new Date(found.start_date)
            .toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            .replace(/ /g, '-')
        : 'TBD',
      priority: (found.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
      type: found.type || 'inhouse',
      status: mapRequirementStatus(found.status || ''),
      category: found.department?.name || 'General',
      progress: found.progress || 0,
      tasksCompleted: found.total_tasks
        ? Math.floor((found.total_tasks * (found.progress || 0)) / 100)
        : 0,
      tasksTotal: found.total_tasks || 0,
      workspaceId: found.project_id || workspaceId,
      workspace: workspace?.name || 'Unknown',
      approvalStatus: found.approved_by ? 'approved' : 'pending',
      // Pricing / cost fields
      estimatedCost: found.estimated_cost || (found.budget || undefined),
      budget: found.budget || undefined,
      hourlyRate: found.hourly_rate || undefined,
      estimatedHours: found.estimated_hours || undefined,
      pricingModel: mockPricingModel as 'hourly' | 'project' | undefined,
      contactPerson: mockContactPerson,
      rejectionReason: mockRejectionReason,
      subTasks: (tasksData?.result || [])
        .filter((t: any) => t.requirement_id === reqId)
        .map((t: any) => ({
          id: String(t.id),
          name: t.name || t.title || '',
          taskId: String(t.id),
          assignedTo: t.assigned_to?.name || 'Unassigned',
          dueDate: t.due_date
            ? new Date(t.due_date)
                .toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                .replace(/ /g, '-')
            : 'TBD',
          status: mapTaskStatus(t.status || ''),
          type: 'task' as 'task' | 'revision',
        })),
    };
  }, [requirementsData, reqId, workspace, tasksData, workspaceId]);

  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'gantt' | 'kanban' | 'pnl'>(
    'details',
  );
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
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ff3b3b]" />
                  Description
                </h3>
                
                {/* Overview */}
                <div className="mb-6">
                  <p className="text-[14px] text-[#444444] font-['Manrope:Regular',sans-serif] leading-relaxed">
                    {descriptionContent.overview ||
                      requirement.description ||
                      'Complete overhaul of the client portal to create a modern, responsive, and intuitive interface that enhances user experience and improves overall functionality.'}
                  </p>
                </div>

                {/* Key Deliverables */}
                <div className="mb-6">
                  <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-3">
                    Key Deliverables
                  </h4>
                  <ul className="space-y-2">
                    {descriptionContent.deliverables.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[14px] text-[#444444] font-['Manrope:Regular',sans-serif]"
                      >
                        <span className="text-[#ff3b3b] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical Requirements */}
                <div>
                  <h4 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-3">
                    Technical Requirements
                  </h4>
                  <ul className="space-y-2">
                    {descriptionContent.technical.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[14px] text-[#444444] font-['Manrope:Regular',sans-serif]"
                      >
                        <span className="text-[#ff3b3b] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Requirement Details Card (copied from AlsoNotify_Satyam_V3) */}
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#ff3b3b]" />
                  Requirement Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide block mb-1">
                        Type
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                          {requirement.type || 'inhouse'}
                        </span>
                        {requirement.type === 'outsourced' && (requirement as any).contactPerson && (
                          <span className="text-[13px] text-[#666666]">
                            - {(requirement as any).contactPerson}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide block mb-1">
                        Company / Client
                      </label>
                      <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                        {requirement.company || 'Internal'}
                        <span className="text-[#999999] mx-2">•</span>
                        {requirement.client}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide block mb-1">
                        Pricing Model
                      </label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#666666]" />
                        <span className="capitalize text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                          {(requirement as any).pricingModel === 'hourly'
                            ? 'Hourly Basis'
                            : 'Project Basis'}
                        </span>
                      </div>
                    </div>

                    {(requirement as any).pricingModel === 'hourly' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide block mb-1">
                            Hourly Rate
                          </label>
                          <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            $
                            {((requirement as any).hourlyRate
                              ? Number((requirement as any).hourlyRate).toFixed(2)
                              : '0.00')}{' '}
                            /hr
                          </p>
                        </div>
                        <div>
                          <label className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide block mb-1">
                            Est. Hours
                          </label>
                          <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            {(requirement as any).estimatedHours || 0} hrs
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide block mb-1">
                          Project Budget
                        </label>
                        <p className="text-[14px] font-['Inter:Medium',sans-serif] text-[#111111]">
                          $
                          {((requirement as any).budget
                            ? Number((requirement as any).budget).toLocaleString()
                            : '0.00')}
                        </p>
                      </div>
                    )}

                    {(requirement as any).status === 'draft' &&
                      (requirement as any).rejectionReason && (
                        <div className="bg-[#FFF5F5] border border-[#ff3b3b]/20 p-4 rounded-lg mt-4">
                          <label className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#DC2626] uppercase tracking-wide block mb-1 flex items-center gap-1">
                            Rejection Reason
                          </label>
                          <p className="text-[13px] text-[#DC2626] font-['Inter:Medium',sans-serif]">
                            &quot;{(requirement as any).rejectionReason}&quot;
                          </p>
                        </div>
                      )}
                  </div>
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
            <div className="bg-white rounded-[16px] border border-[#EEEEEE] shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-[#EEEEEE] flex justify-between items-center shrink-0">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#ff3b3b]" />
                  Gantt Chart
                </h3>
                <div className="flex gap-2">
                  <Button size="small" className="h-8 text-[12px] bg-white border border-[#EEEEEE]">
                    Day
                  </Button>
                  <Button size="small" className="h-8 text-[12px] bg-[#F7F7F7] border border-[#EEEEEE]">
                    Week
                  </Button>
                  <Button size="small" className="h-8 text-[12px] bg-white border border-[#EEEEEE]">
                    Month
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-hidden">
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
                        <div
                          key={i}
                          className="border-r border-[#EEEEEE] p-2 text-center min-w-[60px]"
                        >
                          <div className="text-[10px] text-[#999999] font-['Inter:SemiBold',sans-serif] uppercase">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-[12px] text-[#111111] font-['Manrope:Bold',sans-serif]">
                            {date.getDate()}
                          </div>
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

                    const assignee = task.assignedTo || 'Unassigned';

                    return (
                      <div
                        key={task.id}
                        className="flex border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors group"
                      >
                        <div className="w-[250px] p-3 border-r border-[#EEEEEE] flex items-center gap-3 sticky left-0 bg-white group-hover:bg-[#FAFAFA] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              task.type === 'revision'
                                ? 'bg-[#FFF5F5] text-[#ff3b3b]'
                                : 'bg-[#F7F7F7] text-[#999999]'
                            }`}
                          >
                            #{task.taskId}
                          </span>
                          <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif] truncate">
                            {task.name}
                          </span>
                        </div>
                        <div className="flex-1 grid grid-cols-10 relative py-3">
                          {/* Grid Lines */}
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="border-r border-[#FAFAFA] absolute inset-y-0"
                              style={{ left: `${i * 10}%`, width: '1px' }}
                            />
                          ))}

                          {/* Bar */}
                          <div
                            className={`absolute h-6 rounded-[4px] top-1/2 -translate-y-1/2 flex items-center px-2 shadow-sm
                              ${
                                task.status === 'completed'
                                  ? 'bg-[#E8F5E9] border border-[#0F9D58] text-[#0F9D58]'
                                  : task.status === 'delayed'
                                  ? 'bg-[#FDEDEC] border border-[#EB5757] text-[#EB5757]'
                                  : task.type === 'revision'
                                  ? 'bg-[#FFF5F5] border border-[#ff3b3b] text-[#ff3b3b]'
                                  : 'bg-[#E3F2FD] border border-[#2F80ED] text-[#2F80ED]'
                              }
                            `}
                            style={{
                              left: `${startOffset * 10}%`,
                              width: `${duration * 10}%`,
                            }}
                          >
                            <span className="text-[10px] font-['Manrope:Bold',sans-serif] truncate w-full">
                              {assignee.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pnl' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
                <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ff3b3b]" />
                  Profit &amp; Loss Analysis
                </h3>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EEEEEE]">
                    <p className="text-[12px] text-[#666666] font-['Inter:Medium',sans-serif] mb-1">
                      Total Requirement Price
                    </p>
                    <p className="text-[24px] text-[#111111] font-['Manrope:Bold',sans-serif]">
                      $12,500
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EEEEEE]">
                    <p className="text-[12px] text-[#666666] font-['Inter:Medium',sans-serif] mb-1">
                      Resource Investment
                    </p>
                    <p className="text-[24px] text-[#111111] font-['Manrope:Bold',sans-serif]">
                      $8,200
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#D1FADF]">
                    <p className="text-[12px] text-[#027A48] font-['Inter:Medium',sans-serif] mb-1">
                      Net Profit
                    </p>
                    <p className="text-[24px] text-[#027A48] font-['Manrope:Bold',sans-serif]">
                      +$4,300
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Week 1', price: 2500, invested: 1200 },
                        { name: 'Week 2', price: 4000, invested: 2500 },
                        { name: 'Week 3', price: 6500, invested: 4000 },
                        { name: 'Week 4', price: 8500, invested: 5800 },
                        { name: 'Week 5', price: 10500, invested: 7200 },
                        { name: 'Week 6', price: 12500, invested: 8200 },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
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
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #EEEEEE',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
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
                        <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Allotted Hrs
                        </th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Engaged Hrs
                        </th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Extra Hrs
                        </th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Resource Invested
                          <span className="block text-[10px] normal-case text-[#999999] font-normal">
                            (Engaged × Rate)
                          </span>
                        </th>
                        <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">
                          Profit/Loss
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]">
                      {/* Item 1: Loss */}
                      <tr className="bg-white hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <span className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                            Backend API Integration
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm shrink-0">
                              <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                                SA
                              </span>
                            </div>
                            <div>
                              <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                                Sharifudeen
                              </p>
                              <p className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif]">
                                Developer ($40/hr)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#666666]">
                            40
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            55
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Bold',sans-serif] text-[#DC2626]">
                            +15
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            $2,200
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 text-[#DC2626]">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif]">
                              -$600
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Item 2: Loss */}
                      <tr className="bg-white hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <span className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                            UI Revision Round 2
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#666666] to-[#999999] flex items-center justify-center shadow-sm shrink-0">
                              <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                                AP
                              </span>
                            </div>
                            <div>
                              <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                                Appurva P.
                              </p>
                              <p className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif]">
                                Designer ($35/hr)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#666666]">
                            12
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            18
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Bold',sans-serif] text-[#DC2626]">
                            +6
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            $630
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 text-[#DC2626]">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif]">
                              -$210
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Item 3: Profit */}
                      <tr className="bg-white hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <span className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                            Frontend Architecture
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#666666] to-[#999999] flex items-center justify-center shadow-sm shrink-0">
                              <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                                YS
                              </span>
                            </div>
                            <div>
                              <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                                Yusuf Shaikh
                              </p>
                              <p className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif]">
                                Architect ($60/hr)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#666666]">
                            30
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            24
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Bold',sans-serif] text-[#16A34A]">
                            -6
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                            $1,440
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 text-[#16A34A]">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif]">
                              +$360
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="h-full overflow-x-auto">
              <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                {['todo', 'in-progress', 'impediment', 'completed'].map((status) => {
                  const columnTasks = [...tasks, ...revisions].filter((t) => {
                    if (status === 'impediment') return t.status === 'impediment' || t.status === 'delayed';
                    return t.status === status;
                  });

                  const getStatusStyle = (s: string) => {
                    switch (s) {
                      case 'todo':
                        return { color: 'text-[#555555]', bg: 'bg-[#F5F5F5]', label: 'To Do' };
                      case 'in-progress':
                        return { color: 'text-[#2F80ED]', bg: 'bg-[#E3F2FD]', label: 'In Progress' };
                      case 'impediment':
                        return {
                          color: 'text-[#EB5757]',
                          bg: 'bg-[#FDEDEC]',
                          label: 'Blocked / Delayed',
                        };
                      case 'completed':
                        return { color: 'text-[#0F9D58]', bg: 'bg-[#E8F5E9]', label: 'Completed' };
                      default:
                        return { color: 'text-[#555555]', bg: 'bg-[#F5F5F5]', label: 'Unknown' };
                    }
                  };

                  const style = getStatusStyle(status);

                  return (
                    <div
                      key={status}
                      className="flex-1 min-w-[280px] flex flex-col bg-[#F7F7F7] rounded-[16px] p-4 border border-[#EEEEEE]"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} w-fit`}
                        >
                          <div className={`w-2 h-2 rounded-full ${style.color.replace('text', 'bg')}`} />
                          <span
                            className={`text-[12px] font-['Manrope:Bold',sans-serif] ${style.color}`}
                          >
                            {style.label}
                          </span>
                        </div>
                        <span className="text-[12px] font-['Inter:SemiBold',sans-serif] text-[#999999]">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {columnTasks.map((task) => {
                          const assignee = task.assignedTo || 'Unassigned';
                          const initials = assignee
                            .split(' ')
                            .filter(Boolean)
                            .map((n: string) => n[0])
                            .join('');
                          const firstName = assignee.split(' ')[0];
                          const dueLabel =
                            task.dueDate && task.dueDate !== 'TBD'
                              ? task.dueDate.split('-').slice(0, 2).join('-')
                              : task.dueDate || 'TBD';

                          return (
                            <div
                              key={task.id}
                              className="bg-white p-4 rounded-[12px] border border-[#EEEEEE] shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                    task.type === 'revision'
                                      ? 'bg-[#FFF5F5] text-[#ff3b3b]'
                                      : 'bg-[#F7F7F7] text-[#999999]'
                                  }`}
                                >
                                  #{task.taskId}
                                </span>
                                {task.type === 'revision' && (
                                  <Tooltip title="Revision">
                                    <RotateCcw className="w-3.5 h-3.5 text-[#ff3b3b]" />
                                  </Tooltip>
                                )}
                              </div>
                              <h4 className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-3 leading-snug">
                                {task.name}
                              </h4>
                              <div className="flex items-center justify-between pt-3 border-t border-[#FAFAFA]">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#666666] to-[#999999] flex items-center justify-center">
                                    <span className="text-[9px] text-white font-['Manrope:Bold',sans-serif]">
                                      {initials || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#666666] truncate max-w-[80px]">
                                    {firstName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[#999999]">
                                  <Calendar className="w-3 h-3" />
                                  <span className="text-[10px]">{dueLabel}</span>
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
  const router = useRouter();
  
  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
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
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="red-checkbox"
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
  const config: Record<
    string,
    {
      icon: any;
      bgColor: string;
      iconColor: string;
      label: string;
      showCircle: boolean;
      animate?: boolean;
    }
  > = {
    completed: {
      icon: CheckCircle2,
      bgColor: 'bg-[#0F9D58]',
      iconColor: 'text-white',
      label: 'Completed',
      showCircle: true,
    },
    'in-progress': {
      icon: Loader2,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#2F80ED]',
      label: 'In Progress',
      showCircle: false,
      animate: true,
    },
    delayed: {
      icon: AlertCircle,
      bgColor: 'bg-[#EB5757]',
      iconColor: 'text-white',
      label: 'Delayed',
      showCircle: true,
    },
    review: {
      icon: Loader2,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#2F80ED]',
      label: 'Review',
      showCircle: false,
      animate: true,
    },
    todo: {
      icon: Clock,
      bgColor: 'bg-transparent',
      iconColor: 'text-[#555555]',
      label: 'Assigned',
      showCircle: false,
    },
  };

  const style = config[status] || config['todo'];
  const Icon = style.icon;

  if (style.showCircle) {
    return (
      <Tooltip title={style.label}>
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${style.bgColor} flex items-center justify-center`}>
            <Icon className={`w-3 h-3 ${style.iconColor}`} />
          </div>
          {showLabel && (
            <span className="text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide">
              {style.label}
            </span>
          )}
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={style.label}>
      <div className="flex items-center gap-1.5">
        <Icon
          className={`w-5 h-5 ${style.iconColor} ${style.animate ? 'animate-spin' : ''}`}
        />
        {showLabel && (
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide">
            {style.label}
          </span>
        )}
      </div>
    </Tooltip>
  );
}