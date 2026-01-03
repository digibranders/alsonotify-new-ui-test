'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, ChevronLeft, ChevronRight, Plus, UploadCloud, LayoutGrid, List, MoreVertical, Edit, Trash2, Archive, Users, RotateCcw } from 'lucide-react';
import { PaginationBar } from '../../ui/PaginationBar';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Modal, Button, Input, Select, Dropdown, MenuProps, Checkbox, App, DatePicker } from "antd";
import { WorkspaceForm } from '@/components/modals/WorkspaceForm';

import { useWorkspaces, useCreateWorkspace, useClients } from '@/hooks/useWorkspace';
import { useClients as useGetClients, useEmployees } from '@/hooks/useUser';
import { useQueries } from '@tanstack/react-query';
import { getRequirementsByWorkspaceId } from '@/services/workspace';

const { TextArea } = Input;
const { Option } = Select;

export function WorkspacePage() {
  const { message } = App.useApp();
  const { data: workspacesData, isLoading } = useWorkspaces();
  const { data: clientsData } = useGetClients();
  const { data: employeesData } = useEmployees(); // Fetch employees for project lead dropdown
  const createWorkspaceMutation = useCreateWorkspace();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    company: 'All'
  });
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<number[]>([]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [pageSize, setPageSize] = useState(10);

  // Get all workspace IDs
  const workspaceIds = useMemo(() => {
    return workspacesData?.result?.workspaces?.map((w: any) => w.id) || [];
  }, [workspacesData]);

  // Fetch requirements for all workspaces
  const requirementQueries = useQueries({
    queries: workspaceIds.map((id: number) => ({
      queryKey: ['requirements', id],
      queryFn: () => getRequirementsByWorkspaceId(id),
      enabled: !!id && workspaceIds.length > 0,
    })),
  });

  // Transform backend data to frontend format with requirements counts
  const workspaces = useMemo(() => {
    if (!workspacesData?.result?.workspaces) return [];
    return workspacesData.result.workspaces.map((w: any) => {
      // Find requirements for this workspace
      const reqQuery = requirementQueries.find((q, idx) => workspaceIds[idx] === w.id);
      const requirements = reqQuery?.data?.result || [];

      // Calculate requirement counts
      let totalRequirements = requirements.length;
      let inProgressRequirements = 0;
      let delayedRequirements = 0;

      requirements.forEach((req: any) => {
        const status = (req.status || '').toLowerCase();
        if (status.includes('completed') || status === 'done') {
          // Completed - don't count in progress or delayed
        } else if (status.includes('delayed') || status.includes('stuck') || status.includes('impediment')) {
          delayedRequirements++;
        } else {
          // In progress, assigned, etc.
          inProgressRequirements++;
        }
      });

      return {
        id: w.id,
        name: w.name,
        taskCount: w.total_task || 0,
        inProgressCount: w.total_task_in_progress || 0,
        delayedCount: w.total_task_delayed || 0,
        completedCount: w.total_task_completed || 0,
        // Requirements data
        totalRequirements,
        inProgressRequirements,
        delayedRequirements,
        status: 'active',
        description: w.description || '',
      };
    });
  }, [workspacesData, requirementQueries, workspaceIds]);

  useEffect(() => {
    // side-effects after workspaces change (currently none)
  }, [workspaces]);

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
    setSelectedWorkspaces([]);
  };

  const filterOptions: FilterOption[] = [];



  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesTab = workspace.status === activeTab;
    const matchesSearch = searchQuery === '' ||
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  useEffect(() => {
    // side-effects after filters, search, or pagination change (currently none)
  }, [workspaces.length, filteredWorkspaces.length, activeTab, searchQuery, filters, currentPage]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentWorkspaces = filteredWorkspaces.slice(startIndex, endIndex);

  const toggleSelectAllWorkspaces = () => {
    if (currentWorkspaces.length === 0) return;
    const currentIds = currentWorkspaces.map((w) => w.id);
    const allSelected = currentIds.every((id) => selectedWorkspaces.includes(id));

    if (allSelected) {
      // Deselect only the ones on this page
      setSelectedWorkspaces((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      // Add all current page ids
      setSelectedWorkspaces((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const toggleSelectWorkspaceRow = (id: number) => {
    setSelectedWorkspaces((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  const handleSelectWorkspace = (workspace: { id: number; name: string; taskCount: number; inProgressCount?: number; delayedCount?: number; completedCount?: number; totalRequirements?: number; inProgressRequirements?: number; delayedRequirements?: number; status: string }) => {
    router.push(`/dashboard/workspace/${workspace.id}/requirements`);
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Workspace</h2>
            <button onClick={() => setIsDialogOpen(true)} className="hover:scale-110 active:scale-95 transition-transform">
              <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
            </button>
            <WorkspaceForm
              open={isDialogOpen}
              onCancel={() => setIsDialogOpen(false)}
              onSuccess={() => setIsDialogOpen(false)}
            />
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
        <div className="flex items-center">
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
            {/* List header – aligned with rows, matches dashboard style */}
            <div className="grid grid-cols-[40px_2.8fr_3.2fr_0.7fr_0.3fr] gap-4 px-4 py-3 items-center bg-white">
              <div className="flex justify-center">
                <Checkbox
                  className="red-checkbox"
                  checked={
                    currentWorkspaces.length > 0 &&
                    currentWorkspaces.every((w) => selectedWorkspaces.includes(w.id))
                  }
                  indeterminate={
                    currentWorkspaces.some((w) => selectedWorkspaces.includes(w.id)) &&
                    !currentWorkspaces.every((w) => selectedWorkspaces.includes(w.id))
                  }
                  onChange={toggleSelectAllWorkspaces}
                />
              </div>
              <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
                Workspace Name
              </p>
              <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
                Requirements
              </p>
              <div className="flex justify-center">
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
                  Status
                </p>
              </div>
              <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide" />
            </div>

            {currentWorkspaces.map((workspace) => (
              <WorkspaceListItem
                key={workspace.id}
                workspace={workspace}
                selected={selectedWorkspaces.includes(workspace.id)}
                onToggleSelect={() => toggleSelectWorkspaceRow(workspace.id)}
                onClick={() => handleSelectWorkspace(workspace)}
              />
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">Loading workspaces...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-[#DDDDDD] mx-auto mb-3" />
            <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
              No workspaces found
            </p>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {filteredWorkspaces.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalItems={filteredWorkspaces.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemLabel="workspaces"
        />
      )}
    </div>
  );
}

function WorkspaceRequirementsSummary({
  total,
  inProgress,
  delayed
}: {
  total: number;
  inProgress: number;
  delayed: number;
}) {
  return (
    <div>
      <p className="text-[10px] text-[#999999] font-['Manrope:Bold',sans-serif] uppercase tracking-wider text-center mb-3">Requirements</p>
      <div className="grid grid-cols-3 divide-x divide-[#EEEEEE]">
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] text-[#999999] font-['Inter:Medium',sans-serif] uppercase tracking-wider mb-0.5">Total</span>
          <span className="text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">{total}</span>
        </div>
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] text-[#999999] font-['Inter:Medium',sans-serif] uppercase tracking-wider mb-0.5">Progress</span>
          <span className="text-[13px] text-[#0284C7] font-['Manrope:Bold',sans-serif]">{inProgress}</span>
        </div>
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] text-[#999999] font-['Inter:Medium',sans-serif] uppercase tracking-wider mb-0.5">Delayed</span>
          <span className="text-[13px] text-[#DC2626] font-['Manrope:Bold',sans-serif]">{delayed}</span>
        </div>
      </div>
    </div>
  );
}

function WorkspaceCard({ workspace, onClick }: { workspace: { id: number; name: string; taskCount: number; inProgressCount?: number; delayedCount?: number; completedCount?: number; totalRequirements?: number; inProgressRequirements?: number; delayedRequirements?: number; status: string }; onClick?: () => void }) {
  const items: MenuProps['items'] = [
    {
      key: 'manage',
      label: 'Manage Workspace',
      type: 'group',
      children: [
        { key: 'edit', label: 'Edit Details', icon: <Edit className="w-4 h-4" /> },
        { key: 'members', label: 'Manage Members', icon: <Users className="w-4 h-4" /> },
        workspace.status === 'active'
          ? { key: 'deactivate', label: 'Deactivate', icon: <Archive className="w-4 h-4" /> }
          : { key: 'reactivate', label: 'Reactivate', icon: <RotateCcw className="w-4 h-4" /> }
      ]
    },
    { type: 'divider' },
    { key: 'delete', label: 'Delete Workspace', icon: <Trash2 className="w-4 h-4" />, danger: true }
  ];

  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-[#EEEEEE] rounded-[16px] p-5 hover:border-[#ff3b3b] hover:shadow-lg hover:shadow-[#ff3b3b]/10 transition-all cursor-pointer overflow-hidden flex flex-col h-[180px]"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff3b3b] to-[#ff6b6b] opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Action Menu - Absolute Positioned */}
      <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-5 h-5 text-[#666666]" />
          </button>
        </Dropdown>
      </div>

      <div className="flex flex-col h-full">
        {/* Header: Icon + Details Side-by-Side */}
        <div className="flex items-start gap-3 mb-auto pr-8">
          {/* Folder Icon */}
          <div className="shrink-0 w-12 h-12 rounded-[12px] bg-[#FEF3F2] border border-[#ff3b3b]/20 flex items-center justify-center group-hover:bg-[#ff3b3b] transition-all">
            <FolderOpen className="w-6 h-6 text-[#ff3b3b] group-hover:text-white transition-colors" />
          </div>

          {/* Text Details */}
          <div className="flex flex-col pt-0.5 min-w-0">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[15px] text-[#111111] leading-tight mb-1 truncate w-full">
              {workspace.name}
            </h3>
          </div>
        </div>

        {/* Footer: Stats */}
        <div className="border-t border-[#EEEEEE] pt-3 mt-auto">
          <WorkspaceRequirementsSummary
            total={workspace.totalRequirements || 0}
            inProgress={workspace.inProgressRequirements || 0}
            delayed={workspace.delayedRequirements || 0}
          />
        </div>
      </div>
    </div>
  );
}

function WorkspaceListItem({
  workspace,
  selected,
  onToggleSelect,
  onClick,
}: {
  workspace: {
    id: number;
    name: string;
    taskCount: number;
    inProgressCount?: number;
    delayedCount?: number;
    completedCount?: number;
    totalRequirements?: number;
    inProgressRequirements?: number;
    delayedRequirements?: number;
    status: string;
  };
  selected: boolean;
  onToggleSelect: () => void;
  onClick?: () => void;
}) {
  const items: MenuProps['items'] = [
    {
      key: 'manage',
      label: 'Manage Workspace',
      type: 'group',
      children: [
        { key: 'edit', label: 'Edit Details', icon: <Edit className="w-4 h-4" /> },
        { key: 'members', label: 'Manage Members', icon: <Users className="w-4 h-4" /> },
        workspace.status === 'active'
          ? { key: 'deactivate', label: 'Deactivate', icon: <Archive className="w-4 h-4" /> }
          : { key: 'reactivate', label: 'Reactivate', icon: <RotateCcw className="w-4 h-4" /> }
      ]
    },
    { type: 'divider' },
    { key: 'delete', label: 'Delete Workspace', icon: <Trash2 className="w-4 h-4" />, danger: true }
  ];

  const isActive = workspace.status === 'active';

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-[#F3F4F6] rounded-[12px] px-4 py-3 hover:border-[#ff3b3b] hover:shadow-md transition-all cursor-pointer"
    >
      <div className="grid grid-cols-[40px_2.8fr_3.2fr_0.7fr_0.3fr] items-center gap-4">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            className="red-checkbox"
            checked={selected}
            onChange={onToggleSelect}
          />
        </div>

        {/* Workspace name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#FEF3F2] border border-[#ff3b3b]/20 flex items-center justify-center shrink-0 group-hover:bg-[#ff3b3b] transition-colors">
            <FolderOpen className="w-5 h-5 text-[#ff3b3b] group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] line-clamp-1">
              {workspace.name}
            </h3>
          </div>
        </div>

        {/* Requirements Stats */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mb-0.5">
              Total
            </span>
            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              {workspace.totalRequirements || 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mb-0.5">
              Progress
            </span>
            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#2F80ED]">
              {workspace.inProgressRequirements || 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mb-0.5">
              Delayed
            </span>
            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#ff3b3b]">
              {workspace.delayedRequirements || 0}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-['Manrope:SemiBold',sans-serif] ${isActive
              ? 'bg-[#ECFDF3] text-[#16A34A]'
              : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}
          >
            {isActive ? 'Active' : 'Deactivated'}
          </span>
        </div>

        {/* Action */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-5 h-5 text-[#666666]" />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}