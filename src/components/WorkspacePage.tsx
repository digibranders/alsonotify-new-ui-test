'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderOpen, ChevronLeft, ChevronRight, Plus, UploadCloud, LayoutGrid, List, MoreVertical, Edit, Trash2, Archive, Users, RotateCcw, Eye } from 'lucide-react';
import { FilterBar, FilterOption } from './FilterBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useData } from '../context/DataContext';
import { Workspace } from '../lib/types';

export function WorkspacePage() {
  const { workspaces, addWorkspace } = useData();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    company: 'All'
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    client: '',
    description: '',
    lead: ''
  });

  const itemsPerPage = 12;

  // Extract unique companies from workspace data
  const companies = ['All', ...Array.from(new Set(workspaces.map(w => w.client).filter(c => c !== 'N/A')))];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ company: 'All' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filterOptions: FilterOption[] = [
    {
      id: 'company',
      label: 'Company',
      options: companies,
      placeholder: 'Company',
      defaultValue: 'All'
    }
  ];

  const handleCreateWorkspace = () => {
    if (!newWorkspace.name) return;

    const workspace: Workspace = {
      id: Math.max(0, ...workspaces.map(w => w.id)) + 1,
      name: newWorkspace.name,
      client: newWorkspace.client || 'N/A',
      taskCount: 0,
      status: 'active'
    };

    addWorkspace(workspace);
    setIsDialogOpen(false);
    setNewWorkspace({
      name: '',
      client: '',
      description: '',
      lead: ''
    });
  };

  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesTab = workspace.status === activeTab;
    const matchesSearch = searchQuery === '' ||
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = filters.company === 'All' || workspace.client === filters.company;
    return matchesTab && matchesSearch && matchesCompany;
  });

  // Pagination
  const totalPages = Math.ceil(filteredWorkspaces.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWorkspaces = filteredWorkspaces.slice(startIndex, endIndex);

  const handleSelectWorkspace = (workspace: Workspace) => {
    router.push(`/workspaces/${workspace.id}`);
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Workspace</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="hover:scale-110 active:scale-95 transition-transform">
                  <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
                {/* Dialog Content */}
                <div className="p-6 border-b border-[#EEEEEE]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                      <div className="p-2 rounded-full bg-[#F7F7F7]">
                        <FolderOpen className="w-5 h-5 text-[#666666]" />
                      </div>
                      Create Workspace
                    </DialogTitle>
                    <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                      Create a new workspace to organize tasks and requirements.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace Name <span className="text-[#ff3b3b]">*</span></Label>
                      <Input
                        id="name"
                        placeholder="e.g. Website Redesign"
                        className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Client <span className="text-[#ff3b3b]">*</span></Label>
                      <Select
                        value={newWorkspace.client}
                        onValueChange={(val) => setNewWorkspace({ ...newWorkspace, client: val })}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Eventus Security">Eventus Security</SelectItem>
                          <SelectItem value="Triam Security">Triam Security</SelectItem>
                          <SelectItem value="DIST">DIST</SelectItem>
                          <SelectItem value="Digibranders Priv.">Digibranders Priv.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lead" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Project Lead</Label>
                      <Select
                        value={newWorkspace.lead}
                        onValueChange={(val) => setNewWorkspace({ ...newWorkspace, lead: val })}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="me">Me (Current User)</SelectItem>
                          <SelectItem value="sarah">Sarah Wilson</SelectItem>
                          <SelectItem value="mike">Mike Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your workspace..."
                      className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Regular',sans-serif] resize-none p-3"
                      value={newWorkspace.description}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setNewWorkspace({ name: '', client: '', description: '', lead: '' })}
                      className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]"
                    >
                      Reset Data
                    </Button>
                    <Button
                      onClick={handleCreateWorkspace}
                      className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]"
                    >
                      Create Workspace
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#F7F7F7] p-1 rounded-lg border border-[#EEEEEE]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-[#ff3b3b] shadow-sm' : 'text-[#999999] hover:text-[#111111]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-[#ff3b3b] shadow-sm' : 'text-[#999999] hover:text-[#111111]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#EEEEEE]">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'active'
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Active
            {activeTab === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'inactive'
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Deactivated
            {activeTab === 'inactive' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          searchPlaceholder="Search workspace..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {currentWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onClick={() => handleSelectWorkspace(workspace)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentWorkspaces.map((workspace) => (
              <WorkspaceListItem
                key={workspace.id}
                workspace={workspace}
                onClick={() => handleSelectWorkspace(workspace)}
              />
            ))}
          </div>
        )}

        {filteredWorkspaces.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-[#DDDDDD] mx-auto mb-3" />
            <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
              No workspaces found
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#EEEEEE]">
          <p className="text-[14px] font-['Inter:Regular',sans-serif] text-[#666666]">
            {startIndex + 1}-{Math.min(endIndex, filteredWorkspaces.length)} of {filteredWorkspaces.length} workspaces
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-[#666666]" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all font-['Manrope:SemiBold',sans-serif] text-[13px] ${currentPage === page
                    ? 'bg-[#ff3b3b] text-white'
                    : 'border border-[#EEEEEE] text-[#666666] hover:bg-[#F7F7F7]'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-[#666666]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceProgress({ taskCount }: { taskCount: number }) {
  if (taskCount === 0) {
    return (
      <div className="px-2.5 py-1 rounded-full bg-[#F7F7F7] border border-[#EEEEEE] flex items-center gap-1.5 self-start">
        <div className="w-1.5 h-1.5 rounded-full bg-[#999999]" />
        <span className="text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">
          No requirements
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* In Progress - Dummy Data Calculation */}
      <div className="px-2.5 py-1 rounded-full bg-[#F0F9FF] border border-[#B9E6FE] flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
        <span className="text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#0284C7]">
          {Math.ceil(taskCount * 0.7)} In Progress
        </span>
      </div>

      {/* Delayed - Dummy Data Calculation */}
      <div className="px-2.5 py-1 rounded-full bg-[#FEF3F2] border border-[#FECACA] flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b3b]" />
        <span className="text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#ff3b3b]">
          {Math.floor(taskCount * 0.3)} Delayed
        </span>
      </div>
    </div>
  );
}

function WorkspaceCard({ workspace, onClick }: { workspace: Workspace; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-[#EEEEEE] rounded-[16px] p-6 hover:border-[#ff3b3b] hover:shadow-lg hover:shadow-[#ff3b3b]/10 transition-all cursor-pointer overflow-hidden"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff3b3b] to-[#ff6b6b] opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Action Menu - Absolute Positioned */}
      <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-5 h-5 text-[#666666]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-[#EEEEEE] shadow-lg rounded-xl p-1.5">
            <DropdownMenuLabel className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] px-2 py-1.5 uppercase tracking-wider">
              Manage Workspace
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
              <Edit className="w-4 h-4 text-[#666666]" />
              Edit Details
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
              <Users className="w-4 h-4 text-[#666666]" />
              Manage Members
            </DropdownMenuItem>

            {workspace.status === 'active' ? (
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                <Archive className="w-4 h-4 text-[#666666]" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                <RotateCcw className="w-4 h-4 text-[#666666]" />
                Reactivate
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-[#EEEEEE] my-1.5" />

            <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#FEF2F2] text-[13px] font-['Inter:Medium',sans-serif] text-[#DC2626]">
              <Trash2 className="w-4 h-4" />
              Delete Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col h-full">
        {/* Folder Icon */}
        <div className="mb-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FEF3F2] border border-[#ff3b3b]/20 flex items-center justify-center group-hover:bg-[#ff3b3b] transition-all">
            <FolderOpen className="w-6 h-6 text-[#ff3b3b] group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Workspace Name */}
        <h3 className="font-['Manrope:Bold',sans-serif] text-[15px] text-[#111111] mb-3 line-clamp-2 flex-1 pr-6">
          {workspace.name}
        </h3>

        {/* Task Count / Progress */}
        <div className="mb-4 min-h-[26px]">
          <WorkspaceProgress taskCount={workspace.taskCount} />
        </div>

        {/* Footer: Client + Total */}
        <div className="pt-3 border-t border-[#EEEEEE] flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif] mb-0.5">Client</p>
            <p className="text-[13px] text-[#666666] font-['Inter:Medium',sans-serif] truncate max-w-[120px]">
              {workspace.client}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif] mb-0.5">Total</p>
            <p className="text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">
              {workspace.taskCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceListItem({ workspace, onClick }: { workspace: Workspace; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between bg-white border border-[#EEEEEE] rounded-[12px] p-4 hover:border-[#ff3b3b] hover:shadow-md hover:shadow-[#ff3b3b]/5 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Icon */}
        <div className="w-10 h-10 rounded-[10px] bg-[#FEF3F2] border border-[#ff3b3b]/20 flex items-center justify-center shrink-0 group-hover:bg-[#ff3b3b] transition-colors">
          <FolderOpen className="w-5 h-5 text-[#ff3b3b] group-hover:text-white transition-colors" />
        </div>

        {/* Name & Client */}
        <div className="flex flex-col">
          <h3 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] line-clamp-1">
            {workspace.name}
          </h3>
          <p className="text-[12px] text-[#666666] font-['Inter:Regular',sans-serif]">
            {workspace.client}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mr-8">
        <WorkspaceProgress taskCount={workspace.taskCount} />
      </div>

      {/* Total - Right */}
      <div className="flex flex-col items-end mr-4 min-w-[40px]">
        <span className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">Total</span>
        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{workspace.taskCount}</span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-5 h-5 text-[#666666]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-[#EEEEEE] shadow-lg rounded-xl p-1.5">
            <DropdownMenuLabel className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] px-2 py-1.5 uppercase tracking-wider">
              Manage Workspace
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
              <Edit className="w-4 h-4 text-[#666666]" />
              Edit Details
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
              <Users className="w-4 h-4 text-[#666666]" />
              Manage Members
            </DropdownMenuItem>

            {workspace.status === 'active' ? (
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                <Archive className="w-4 h-4 text-[#666666]" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#F7F7F7] text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                <RotateCcw className="w-4 h-4 text-[#666666]" />
                Reactivate
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-[#EEEEEE] my-1.5" />

            <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-[#FEF2F2] text-[13px] font-['Inter:Medium',sans-serif] text-[#DC2626]">
              <Trash2 className="w-4 h-4" />
              Delete Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}