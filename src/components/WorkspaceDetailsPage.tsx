import { useState } from 'react';
import {
  ChevronLeft, FolderOpen, Calendar as CalendarIcon, Clock, CheckCircle2,
  Loader2, AlertCircle, MoreVertical, RotateCcw,
  FileText, ListTodo, History, BarChart2, Columns,
  User, Edit, Trash2, ArrowRight, Flag, Plus, UploadCloud, CheckSquare, Users as UsersIcon
} from 'lucide-react';
import { FilterBar, FilterOption } from './FilterBar';
import { TabBar } from './TabBar';
import { Checkbox } from "./ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

import { useParams, useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';
import { Requirement, Workspace } from '../lib/types';
import { format } from "date-fns";

export function WorkspaceDetailsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId;
  const router = useRouter();
  const { getWorkspace, requirements: allRequirements, addRequirement, updateRequirement } = useData();

  const workspace = getWorkspace(Number(workspaceId));
  const requirements = allRequirements.filter(r => r.workspaceId === Number(workspaceId));

  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed' | 'delayed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReqId, setExpandedReqId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    priority: 'All'
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReq, setNewReq] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    startDate: '',
    dueDate: '',
    assignedTo: ''
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });

  const [selectedReqs, setSelectedReqs] = useState<number[]>([]);

  const filterOptions: FilterOption[] = [
    { id: 'priority', label: 'Priority', options: ['All', 'High', 'Medium', 'Low'], placeholder: 'Priority' }
  ];

  if (!workspace) {
    return <div className="p-8">Workspace not found</div>;
  }

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({ priority: 'All' });
    setSearchQuery('');
    setSortConfig({ key: '', direction: null });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedReqs.length === sortedRequirements.length) {
      setSelectedReqs([]);
    } else {
      setSelectedReqs(sortedRequirements.map(r => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedReqs.includes(id)) {
      setSelectedReqs(selectedReqs.filter(reqId => reqId !== id));
    } else {
      setSelectedReqs([...selectedReqs, id]);
    }
  };

  // Apply local filters
  const filteredRequirements = requirements.filter(req => {
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    const matchesSearch = searchQuery === '' ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filters.priority === 'All' || req.priority.toLowerCase() === filters.priority.toLowerCase();

    return matchesTab && matchesSearch && matchesPriority;
  });

  // Apply sorting
  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    switch (sortConfig.key) {
      case 'priority':
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return (priorityWeight[a.priority] - priorityWeight[b.priority]) * direction;

      case 'startDate':
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return (dateA - dateB) * direction;

      case 'dueDate':
        return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * direction;

      case 'progress':
        return (a.progress - b.progress) * direction;

      case 'status':
        return a.status.localeCompare(b.status) * direction;

      case 'title':
        return a.title.localeCompare(b.title) * direction;

      default:
        return 0;
    }
  });

  const statusCounts = {
    all: requirements.length,
    inProgress: requirements.filter(r => r.status === 'in-progress').length,
    completed: requirements.filter(r => r.status === 'completed').length,
    delayed: requirements.filter(r => r.status === 'delayed').length
  };

  const handleCreateRequirement = () => {
    if (!newReq.title) return;

    const newRequirement: Requirement = {
      id: Date.now(), // Simple ID generation
      title: newReq.title,
      description: newReq.description,
      client: workspace.client,
      assignedTo: newReq.assignedTo ? newReq.assignedTo.split(',').map(s => s.trim()) : ['Unassigned'],
      startDate: newReq.startDate ? new Date(newReq.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      dueDate: newReq.dueDate ? new Date(newReq.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      priority: newReq.priority,
      status: 'in-progress',
      progress: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
      workspaceId: workspace.id,
      subTasks: []
    };

    addRequirement(newRequirement);
    setIsDialogOpen(false);
    setNewReq({
      title: '',
      description: '',
      priority: 'medium',
      startDate: '',
      dueDate: '',
      assignedTo: ''
    });
  };

  const handleNavigateToRequirement = (req: Requirement) => {
    router.push(`/workspaces/${workspace.id}/requirements/${req.id}`);
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
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
                  <BreadcrumbPage className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">
                    {workspace.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="hover:scale-110 active:scale-95 transition-transform"
                >
                  <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
                <div className="p-6 border-b border-[#EEEEEE]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                      <div className="p-2 rounded-full bg-[#F7F7F7]">
                        <FileText className="w-5 h-5 text-[#666666]" />
                      </div>
                      New Requirement
                    </DialogTitle>
                    <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                      Define a new requirement for the team
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Row 1 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Title</Label>
                      <Input
                        id="title"
                        placeholder="Requirement title"
                        className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                        value={newReq.title}
                        onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</Label>
                      <Select
                        value={newReq.priority}
                        onValueChange={(v: any) => setNewReq({ ...newReq, priority: v })}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Assigned Team</Label>
                      <Input
                        id="assignedTo"
                        placeholder="e.g. John Doe"
                        className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                        value={newReq.assignedTo}
                        onChange={(e) => setNewReq({ ...newReq, assignedTo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Timeline</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="startDate"
                          type="date"
                          placeholder="Start Date"
                          className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                          value={newReq.startDate}
                          onChange={(e) => setNewReq({ ...newReq, startDate: e.target.value })}
                        />
                        <Input
                          id="dueDate"
                          type="date"
                          placeholder="End Date"
                          className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                          value={newReq.dueDate}
                          onChange={(e) => setNewReq({ ...newReq, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Upload Documents</Label>
                    <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#ff3b3b]/30 hover:bg-[#FFFAFA] transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-[#999999]" />
                      </div>
                      <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-1">Choose a file or drag & drop it here</p>
                      <p className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">txt, docx, pdf, jpeg, xlsx - Up to 50MB</p>
                      <Button variant="outline" className="mt-4 h-8 text-[12px] font-['Manrope:SemiBold',sans-serif]">Browse files</Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Requirement details..."
                      className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Regular',sans-serif] resize-none p-3"
                      value={newReq.description}
                      onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setNewReq({ title: '', description: '', priority: 'medium', startDate: '', dueDate: '', assignedTo: '' })}
                      className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]"
                    >
                      Reset Data
                    </Button>
                    <Button
                      onClick={handleCreateRequirement}
                      className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]"
                    >
                      Save Requirement
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F7F7F7] text-[#666666] text-[12px] font-['Inter:Medium',sans-serif]">
            {workspace.client}
          </span>
        </div>

        {/* Tabs */}
        <div className="-mt-2">
          <TabBar
            tabs={[
              { id: 'all', label: 'All Requirements', count: statusCounts.all },
              { id: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
              { id: 'delayed', label: 'Delayed', count: statusCounts.delayed }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
          />
        </div>
      </div>

      {/* Filters Bar */}
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

      {/* Table Header */}
      <div className="grid grid-cols-[40px_3fr_1fr_0.8fr_0.8fr_1.4fr_0.6fr_0.3fr] gap-6 px-4 pb-3 mb-2 border-b border-[#EEEEEE] items-center">
        <div className="flex justify-center">
          <Checkbox
            checked={sortedRequirements.length > 0 && selectedReqs.length === sortedRequirements.length}
            onCheckedChange={toggleSelectAll}
            className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
          />
        </div>
        <SortableHeader label="Requirement" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Assigned Team</p>
        <SortableHeader label="Start Date" sortKey="startDate" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="End Date" sortKey="dueDate" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Progress" sortKey="progress" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto relative">
        {sortedRequirements.length > 0 ? (
          <div className="space-y-3 pb-24">
            {sortedRequirements.map((req) => (
              <RequirementRow
                key={req.id}
                requirement={req}
                selected={selectedReqs.includes(req.id)}
                onSelect={() => toggleSelect(req.id)}
                onClick={() => handleNavigateToRequirement(req)}
                onUpdate={(updates) => updateRequirement(req.id, updates)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-[#DDDDDD] mx-auto mb-3" />
            <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
              No requirements found
            </p>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedReqs.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2 border-r border-white/20 pr-6">
              <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {selectedReqs.length}
              </div>
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors tooltip-trigger" title="Mark as Completed">
                <CheckSquare className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Assign To">
                <UsersIcon className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => setSelectedReqs([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequirementRow({
  requirement,
  selected,
  onSelect,
  onClick,
  onUpdate
}: {
  requirement: Requirement;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onUpdate: (updates: Partial<Requirement>) => void;
}) {

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'medium': return 'bg-[#FEF3C7] text-[#D97706]';
      case 'low': return 'bg-[#DBEAFE] text-[#2563EB]';
      default: return 'bg-[#F3F4F6] text-[#6B7280]';
    }
  };

  return (
    <div className="group relative transition-all duration-300">
      <div
        onClick={onClick}
        className={`
          grid grid-cols-[40px_3fr_1fr_0.8fr_0.8fr_1.4fr_0.6fr_0.3fr] gap-6 items-center p-4 
          bg-white border rounded-[16px] transition-all cursor-pointer relative z-10
          ${selected
            ? 'border-[#ff3b3b] shadow-[0_0_0_1px_#ff3b3b] bg-[#FFF5F5]'
            : 'border-[#EEEEEE] hover:border-[#ff3b3b]/20 hover:shadow-lg'
          }
        `}
      >
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
          />
        </div>

        {/* Title & Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] line-clamp-1 group-hover:text-[#ff3b3b] transition-colors">
              {requirement.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">
              #{requirement.id}
            </span>
            <span className="text-[11px] text-[#666666] font-['Inter:Medium',sans-serif]">
              • {requirement.client}
            </span>
            {requirement.departments?.map((dept, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-[#F7F7F7] text-[10px] text-[#666666] font-['Inter:Medium',sans-serif]">
                {dept}
              </span>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="flex items-center">
          <div className="flex -space-x-3">
            {requirement.assignedTo.slice(0, 3).map((person, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm" title={person}>
                <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                  {person.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            ))}
            {requirement.assignedTo.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#F7F7F7] flex items-center justify-center shadow-sm">
                <span className="text-[10px] text-[#666666] font-['Manrope:Bold',sans-serif]">
                  +{requirement.assignedTo.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline - Start Date */}
        <div className="pr-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <TimelineVisual
              date={requirement.startDate}
              onUpdate={(date) => onUpdate({ startDate: date ? format(date, 'dd-MMM-yyyy') : requirement.startDate })}
            />
          </div>
        </div>

        {/* Timeline - End Date */}
        <div className="pr-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <TimelineVisual
              date={requirement.dueDate}
              onUpdate={(date) => onUpdate({ dueDate: date ? format(date, 'dd-MMM-yyyy') : requirement.dueDate })}
              isDueDate
            />
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#666666] font-['Inter:Medium',sans-serif]">
              {requirement.tasksCompleted}/{requirement.tasksTotal} Tasks
            </span>
            <span className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">
              {requirement.progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${requirement.progress >= 100 ? 'bg-[#2E7D32]' :
                requirement.progress >= 75 ? 'bg-[#FF9800]' :
                  'bg-[#3B82F6]'
                }`}
              style={{ width: `${requirement.progress}%` }}
            />
          </div>
        </div>

        {/* Status - Inline Edit */}
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={requirement.status}
            onValueChange={(val: any) => onUpdate({ status: val })}
          >
            <SelectTrigger className="w-auto h-auto border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
              <StatusBadge status={requirement.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Menu */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] text-[#999999] hover:text-[#111111] transition-colors outline-none">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClick}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Flag className="w-4 h-4 mr-2" />
                  Set Priority
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onUpdate({ priority: 'high' })}>
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    High
                    {requirement.priority === 'high' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdate({ priority: 'medium' })}>
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                    Medium
                    {requirement.priority === 'medium' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdate({ priority: 'low' })}>
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                    Low
                    {requirement.priority === 'low' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    'completed': {
      icon: CheckCircle2,
      color: 'text-[#0F9D58]',
      label: 'Completed'
    },
    'in-progress': {
      icon: Loader2,
      color: 'text-[#2F80ED]',
      label: 'In Progress'
    },
    'delayed': {
      icon: AlertCircle,
      color: 'text-[#EB5757]',
      label: 'Delayed'
    },
    // Fallback
    'default': {
      icon: Clock,
      color: 'text-[#555555]',
      label: 'Pending'
    }
  };

  const style = config[status as keyof typeof config] || config['default'];
  const Icon = style.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help p-1">
            <Icon className={`w-5 h-5 ${style.color} ${status === 'in-progress' ? 'animate-spin' : ''}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-[12px] font-['Manrope:Medium',sans-serif]">{style.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TimelineVisual({ date, onUpdate, isDueDate }: { date?: string, onUpdate: (date: Date | undefined) => void, isDueDate?: boolean }) {
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-');
    return new Date(`${month} ${day}, ${year}`);
  };

  const dateObj = parseDate(date);
  // Mock today
  const mockToday = new Date('2025-12-06');

  if (!dateObj && !isDueDate) return <span className="text-[13px] text-[#999999] font-['Manrope:Medium',sans-serif]">-</span>;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const isOverdue = isDueDate && dateObj && mockToday > dateObj;

  return (
    <div className="flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <button className={`text-[13px] font-['Manrope:SemiBold',sans-serif] hover:underline transition-colors ${isOverdue ? 'text-[#DC2626]' : 'text-[#111111]'}`}>
            {dateObj ? formatDate(dateObj) : 'Set Date'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateObj || undefined}
            onSelect={onUpdate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort }: { label: string, sortKey: string, currentSort: { key: string, direction: 'asc' | 'desc' | null }, onSort: (key: string) => void }) {
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors group"
    >
      {label}
      <div className="flex flex-col">
        <ArrowRight className={`w-3 h-3 -rotate-90 transition-colors ${currentSort.key === sortKey && currentSort.direction === 'asc' ? 'text-[#ff3b3b]' : 'text-[#DDDDDD] group-hover:text-[#999999]'}`} />
      </div>
    </button>
  );
}