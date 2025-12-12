import { useState, useMemo, useEffect } from 'react';
import { PageLayout } from './PageLayout';
import { FilterBar, FilterOption } from './FilterBar';
import { TabBar } from './TabBar';
import { Clock24Regular, CheckmarkCircle24Regular, Tag24Regular, Checkmark24Filled, Dismiss24Filled, DocumentAdd24Regular, ArrowUpload24Regular } from '@fluentui/react-icons';
import { Modal, Button, Input, Select, Tooltip, message } from 'antd';
import { useWorkspaces, useCreateRequirement } from '@/hooks/useWorkspace';
import { getRequirementsByWorkspaceId } from '@/services/workspace';
import { useQueries } from '@tanstack/react-query';
import { format } from 'date-fns';

import { useRouter } from 'next/navigation';

const { TextArea } = Input;
const { Option } = Select;

interface Requirement {
  id: number;
  title: string;
  description: string;
  company: string;
  client: string;
  assignedTo: string[];
  dueDate: string;
  createdDate: string;
  priority: 'high' | 'medium' | 'low';
  type: 'inhouse' | 'outsourced';
  status: 'in-progress' | 'completed' | 'delayed';
  category: string;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  workspaceId: number;
  workspace: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export function RequirementsPage() {
  const router = useRouter();
  const createRequirementMutation = useCreateRequirement();

  // Fetch all workspaces first to get requirements for each
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useWorkspaces();

  // Get all workspace IDs
  const workspaceIds = useMemo(() => {
    return workspacesData?.result?.projects?.map((w: any) => w.id) || [];
  }, [workspacesData]);

  // Fetch requirements for all workspaces
  const requirementQueries = useQueries({
    queries: workspaceIds.map((id: number) => ({
      queryKey: ['requirements', id],
      queryFn: () => getRequirementsByWorkspaceId(id),
      enabled: !!id && workspaceIds.length > 0,
    })),
  });

  const isLoadingRequirements = requirementQueries.some(q => q.isLoading);
  const isLoading = isLoadingWorkspaces || isLoadingRequirements;

  // Helper function to strip HTML tags from text
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    if (typeof document !== 'undefined') {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const stripped = tmp.textContent || tmp.innerText || '';
      return stripped.trim();
    }
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed')) return 'delayed';
    return 'in-progress';
  };

  // Combine all requirements
  const allRequirements = useMemo(() => {
    const combined: any[] = [];
    requirementQueries.forEach((query) => {
      if (query.data?.result) {
        combined.push(...query.data.result);
      }
    });
    return combined;
  }, [requirementQueries]);

  // Transform backend data to UI format
  const requirements = useMemo(() => {
    return allRequirements.map((req: any) => ({
      id: req.id,
      title: req.name || req.title || '',
      description: stripHtmlTags(req.description || ''),
      company: 'Internal',
      client: req.project?.client?.name || req.client_company_name || 'N/A',
      assignedTo: req.manager ? [req.manager.name] : req.leader ? [req.leader.name] : [],
      dueDate: req.end_date ? format(new Date(req.end_date), 'dd-MMM-yyyy') : 'TBD',
      createdDate: req.start_date ? format(new Date(req.start_date), 'dd-MMM-yyyy') : 'TBD',
      priority: (req.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
      type: req.type || 'inhouse',
      status: mapRequirementStatus(req.status),
      category: req.department?.name || 'General',
      progress: req.progress || 0,
      tasksCompleted: req.total_tasks ? Math.floor(req.total_tasks * (req.progress || 0) / 100) : 0,
      tasksTotal: req.total_tasks || 0,
      workspaceId: req.project_id,
      workspace: req.project?.name || 'Unknown',
      approvalStatus: (req.approved_by ? 'approved' : 'pending') as 'pending' | 'approved' | 'rejected' | undefined,
    }));
  }, [allRequirements]);

  // Read status filter from URL searchParams on mount
  const [subTab, setSubTab] = useState<'all' | 'in-progress' | 'completed' | 'delayed'>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const status = searchParams.get('status') as 'all' | 'in-progress' | 'completed' | 'delayed' | null;
      return status || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (subTab === 'all') {
        url.searchParams.delete('status');
      } else {
        url.searchParams.set('status', subTab);
      }
      if (url.search !== window.location.search) {
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [subTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    type: 'All',
    category: 'All',
    priority: 'All',
    client: 'All'
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReq, setNewReq] = useState({
    title: '',
    description: '',
    client: '',
    company: '',
    category: 'Development',
    priority: 'medium' as 'high' | 'medium' | 'low',
    type: 'inhouse' as 'inhouse' | 'outsourced',
    dueDate: '',
    workspace: ''
  });

  // Extract unique values for filters
  const categories = ['All', ...Array.from(new Set(requirements.map(r => r.category)))];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const clients = ['All', ...Array.from(new Set(requirements.map(r => r.client)))];

  const filterOptions: FilterOption[] = [
    { id: 'type', label: 'Type', options: ['All', 'In-house', 'Outsourced'], placeholder: 'Type' },
    { id: 'category', label: 'Category', options: categories, placeholder: 'Category' },
    { id: 'priority', label: 'Priority', options: priorities, placeholder: 'Priority' },
    { id: 'client', label: 'Client', options: clients, placeholder: 'Client' }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'All',
      category: 'All',
      priority: 'All',
      client: 'All'
    });
    setSearchQuery('');
  };

  const handleCreateRequirement = async () => {
    if (!newReq.title) {
      message.error("Requirement title is required");
      return;
    }

    const selectedWorkspace = workspacesData?.result?.projects?.find(
      (w: any) => w.name === newReq.workspace
    );

    if (!selectedWorkspace && newReq.workspace) {
      message.error("Selected workspace not found");
      return;
    }

    if (!selectedWorkspace && workspaceIds.length === 0) {
      message.error("No workspace available");
      return;
    }

    createRequirementMutation.mutate(
      {
        project_id: selectedWorkspace?.id || workspaceIds[0],
        name: newReq.title,
        description: newReq.description || '',
        start_date: new Date().toISOString(),
        end_date: newReq.dueDate ? new Date(newReq.dueDate).toISOString() : undefined,
        status: 'Assigned',
        priority: newReq.priority?.toUpperCase() || 'MEDIUM',
        high_priority: newReq.priority === 'high',
      } as any,
      {
        onSuccess: () => {
          message.success("Requirement created successfully!");
          setIsDialogOpen(false);
          setNewReq({
            title: '',
            description: '',
            client: '',
            company: '',
            category: 'Development',
            priority: 'medium',
            type: 'inhouse',
            dueDate: '',
            workspace: ''
          });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to create requirement";
          message.error(errorMessage);
        },
      }
    );
  };

  const filteredRequirements = requirements.filter(requirement => {
    const matchesType = filters.type === 'All' ||
      (filters.type === 'In-house' && requirement.type === 'inhouse') ||
      (filters.type === 'Outsourced' && requirement.type === 'outsourced');
    const matchesSubTab = subTab === 'all' || requirement.status === subTab;
    const matchesSearch = searchQuery === '' ||
      requirement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filters.category === 'All' || requirement.category === filters.category;
    const matchesPriority = filters.priority === 'All' || requirement.priority === filters.priority.toLowerCase();
    const matchesClient = filters.client === 'All' || requirement.client === filters.client;

    return matchesType && matchesSubTab && matchesSearch && matchesCategory && matchesPriority && matchesClient;
  });

  const getCurrentTypeRequirements = () => {
    if (filters.type === 'In-house') {
      return requirements.filter(r => r.type === 'inhouse');
    } else if (filters.type === 'Outsourced') {
      return requirements.filter(r => r.type === 'outsourced');
    }
    return requirements;
  };

  const currentTypeRequirements = getCurrentTypeRequirements();
  const statusCounts = {
    all: currentTypeRequirements.length,
    inProgress: currentTypeRequirements.filter(r => r.status === 'in-progress').length,
    completed: currentTypeRequirements.filter(r => r.status === 'completed').length,
    delayed: currentTypeRequirements.filter(r => r.status === 'delayed').length
  };

  return (
    <PageLayout
      title="Requirements"
      titleAction={{
        onClick: () => setIsDialogOpen(true)
      }}
    >
      <div className="flex flex-col h-full">
        <div className="mb-6 -mt-2">
          <TabBar
            tabs={[
              { id: 'all', label: 'All', count: statusCounts.all },
              { id: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
              { id: 'delayed', label: 'Delayed', count: statusCounts.delayed }
            ]}
            activeTab={subTab}
            onTabChange={(tab) => setSubTab(tab as 'all' | 'in-progress' | 'completed' | 'delayed')}
          />
        </div>

        <div className="mb-6">
          <FilterBar
            filters={filterOptions}
            selectedFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            searchPlaceholder="Search requirements..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-6">
            {filteredRequirements.map((requirement) => (
              <RequirementCard key={requirement.id} requirement={requirement} />
            ))}
          </div>

          {filteredRequirements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
                {isLoading ? "Loading requirements..." : "No requirements found"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
      >
        <div className="p-0">
          <div className="border-b border-[#EEEEEE] mb-6 pb-4">
            <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              <div className="p-2 rounded-full bg-[#F7F7F7]">
                <DocumentAdd24Regular className="w-5 h-5 text-[#666666]" />
              </div>
              New Requirement
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
              Add a new requirement to the workspace.
            </p>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Title</span>
                <Input
                  placeholder="Enter requirement title"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                  value={newReq.title}
                  onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace</span>
                <Select
                  className="w-full h-11"
                  placeholder="Select workspace"
                  value={newReq.workspace || undefined}
                  onChange={(v) => setNewReq({ ...newReq, workspace: String(v) })}
                >
                  <Option value="Website Redesign">Website Redesign</Option>
                  <Option value="Mobile App">Mobile App</Option>
                  <Option value="Marketing Campaign">Marketing Campaign</Option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Type</span>
                <Select
                  className="w-full h-11"
                  placeholder="Select type"
                  value={newReq.type || undefined}
                  onChange={(v) => setNewReq({ ...newReq, type: String(v) as 'inhouse' | 'outsourced' })}
                >
                  <Option value="inhouse">In-house</Option>
                  <Option value="outsourced">Outsourced</Option>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</span>
                <Select
                  className="w-full h-11"
                  placeholder="Select priority"
                  value={newReq.priority || undefined}
                  onChange={(v) => setNewReq({ ...newReq, priority: String(v) as 'high' | 'medium' | 'low' })}
                >
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Category</span>
                <Input
                  placeholder="e.g. Development"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                  value={newReq.category}
                  onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</span>
                <Input
                  type="date"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                  value={newReq.dueDate}
                  onChange={(e) => setNewReq({ ...newReq, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Client</span>
                <Input
                  placeholder="Client name"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                  value={newReq.client}
                  onChange={(e) => setNewReq({ ...newReq, client: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Company</span>
                <Input
                  placeholder="Company name"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                  value={newReq.company}
                  onChange={(e) => setNewReq({ ...newReq, company: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Upload Documents</span>
              <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#ff3b3b]/30 hover:bg-[#FFFAFA] transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-3">
                  <ArrowUpload24Regular className="w-6 h-6 text-[#999999]" />
                </div>
                <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-1">Choose a file or drag & drop it here</p>
                <p className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">txt, docx, pdf, jpeg, xlsx - Up to 50MB</p>
                <Button className="mt-4 h-8 text-[12px] font-['Manrope:SemiBold',sans-serif]">Browse files</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
              <TextArea
                placeholder="Describe the requirement..."
                className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Regular',sans-serif] resize-none p-3"
                rows={3}
                value={newReq.description}
                onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEEEE] mt-6">
            <Button
              type="text"
              onClick={() => setIsDialogOpen(false)}
              className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666]"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleCreateRequirement}
              className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000] text-white font-['Manrope:SemiBold',sans-serif] border-none"
            >
              Create Requirement
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}

function RequirementCard({ requirement }: { requirement: Requirement }) {
  const [approvalStatus, setApprovalStatus] = useState(requirement.approvalStatus);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]' };
      case 'medium': return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]' };
      case 'low': return { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
      default: return { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#D1D5DB]' };
    }
  };

  const getStatusBadge = (status: string) => {
    let icon;
    let color;
    let bgColor;
    let label;

    switch (status) {
      case 'in-progress':
        icon = <Clock24Regular className="w-3.5 h-3.5 animate-spin" />;
        color = 'text-[#2F80ED]';
        bgColor = 'bg-[#DBEAFE]';
        label = 'In Progress';
        break;
      case 'completed':
        icon = <CheckmarkCircle24Regular className="w-3.5 h-3.5 animate-[bounce_2s_ease-in-out_infinite]" />;
        color = 'text-[#0F9D58]';
        bgColor = 'bg-[#E8F5E9]';
        label = 'Completed';
        break;
      case 'delayed':
        icon = <Clock24Regular className="w-3.5 h-3.5 animate-pulse" />;
        color = 'text-[#EB5757]';
        bgColor = 'bg-[#FEE2E2]';
        label = 'Delayed';
        break;
      default:
        icon = <Clock24Regular className="w-3.5 h-3.5" />;
        color = 'text-[#6B7280]';
        bgColor = 'bg-[#F3F4F6]';
        label = 'To Do';
    }

    return (
      <Tooltip title={label}>
        <div className={`flex items-center justify-center w-7 h-7 rounded-full ${bgColor} ${color} border border-current/10 cursor-help transition-transform hover:scale-110`}>
          {icon}
        </div>
      </Tooltip>
    );
  };

  const priorityColors = getPriorityColor(requirement.priority);

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovalStatus('approved');
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovalStatus('rejected');
  };

  return (
    <div className="group bg-white border border-[#EEEEEE] rounded-[24px] p-6 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[16px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors line-clamp-1">
              {requirement.title}
            </h3>
          </div>
          <p className="text-[12px] text-[#999999] font-['Manrope:Regular',sans-serif]">
            {requirement.company} • {requirement.client}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full border ${priorityColors.bg} ${priorityColors.border}`}>
            <p className={`text-[11px] font-['Manrope:SemiBold',sans-serif] ${priorityColors.text} uppercase`}>
              {requirement.priority}
            </p>
          </div>
          {getStatusBadge(requirement.status)}
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] mb-4 line-clamp-2">
        {requirement.description || 'No description'}
      </p>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif]">
            Progress: {requirement.tasksCompleted}/{requirement.tasksTotal} tasks
          </span>
          <span className="text-[11px] text-[#111111] font-['Manrope:Bold',sans-serif]">
            {requirement.progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${requirement.status === 'completed'
              ? 'bg-gradient-to-r from-[#4CAF50] to-[#81C784]'
              : requirement.status === 'delayed'
                ? 'bg-gradient-to-r from-[#EF5350] to-[#E57373]'
                : 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]'
              }`}
            style={{ width: `${requirement.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[#EEEEEE] flex items-center justify-between">
        <div className="flex -space-x-2">
          {requirement.assignedTo.slice(0, 3).map((person, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-[#F7F7F7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#666666] relative z-[3] hover:z-10 hover:scale-110 transition-all"
              title={person}
            >
              {person.charAt(0)}
            </div>
          ))}
          {requirement.assignedTo.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-[#F7F7F7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#666666] relative z-[1]">
              +{requirement.assignedTo.length - 3}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {requirement.type === 'outsourced' && approvalStatus === 'pending' ? (
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="p-1.5 rounded-full hover:bg-[#FFEBEE] text-[#D32F2F] transition-colors"
                title="Reject"
              >
                <Dismiss24Filled className="w-4 h-4" />
              </button>
              <button
                onClick={handleApprove}
                className="p-1.5 rounded-full hover:bg-[#E8F5E9] text-[#388E3C] transition-colors"
                title="Approve"
              >
                <Checkmark24Filled className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#999999]">
              <Tag24Regular className="w-4 h-4" />
              <span className="text-[11px] font-['Manrope:Medium',sans-serif]">
                {requirement.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}