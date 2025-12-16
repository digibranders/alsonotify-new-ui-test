'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, ChevronLeft, ChevronRight, Plus, UploadCloud, LayoutGrid, List, MoreVertical, Edit, Trash2, Archive, Users, RotateCcw } from 'lucide-react';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Modal, Button, Input, Select, Dropdown, MenuProps } from "antd";
import { useWorkspaces, useCreateWorkspace, useClients } from '@/hooks/useWorkspace';
import { useClients as useGetClients, useEmployees } from '@/hooks/useUser';
import { message } from 'antd';
import { useQueries } from '@tanstack/react-query';
import { getRequirementsByWorkspaceId } from '@/services/workspace';

const { TextArea } = Input;
const { Option } = Select;

export function WorkspacePage() {
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

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    client: '',
    description: '',
    lead: ''
  });

  const itemsPerPage = 12;

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

  // Transform backend data to frontend format with requirements counts
  const workspaces = useMemo(() => {
    if (!workspacesData?.result?.projects) return [];
    return workspacesData.result.projects.map((w: any) => {
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
        client: w.client?.name || w.client_company_name || 'N/A',
        taskCount: w.total_task || 0,
        inProgressCount: w.total_task_in_progress || 0,
        delayedCount: w.total_task_delayed || 0,
        completedCount: w.total_task_completed || 0,
        // Requirements data
        totalRequirements,
        inProgressRequirements,
        delayedRequirements,
        status: ['active', 'in_progress', 'assigned'].includes((w.status || '').toLowerCase()) ? 'active' : 'inactive',
        description: w.description || '',
      };
    });
  }, [workspacesData, requirementQueries, workspaceIds]);

  // Extract unique companies from workspace data
  const companies = useMemo(() => {
    const clientNames = workspaces.map(w => w.client).filter(c => c !== 'N/A');
    return ['All', ...Array.from(new Set(clientNames))];
  }, [workspaces]);

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

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name) {
      message.error("Workspace name is required");
      return;
    }

    // Find client ID from client name
    const selectedClient = clientsData?.result?.find((c: any) => c.name === newWorkspace.client);

    // Find selected employee/lead ID
    const selectedLead = employeesData?.result?.find((emp: any) =>
      String(emp.user_id || emp.id) === newWorkspace.lead
    );

    createWorkspaceMutation.mutate(
      {
        name: newWorkspace.name,
        description: newWorkspace.description || '',
        client_id: selectedClient?.id || null,
        manager_id: selectedLead?.user_id || selectedLead?.id || null,
        leader_id: selectedLead?.user_id || selectedLead?.id || null,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        document_link: '',
        high_priority: false,
        in_house: true,
      } as any,
      {
        onSuccess: () => {
          message.success("Workspace created successfully!");
          setIsDialogOpen(false);
          setNewWorkspace({
            name: '',
            client: '',
            description: '',
            lead: '',
          });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to create workspace";
          message.error(errorMessage);
        },
      }
    );
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

  const handleSelectWorkspace = (workspace: { id: number; name: string; client: string; taskCount: number; inProgressCount?: number; delayedCount?: number; completedCount?: number; totalRequirements?: number; inProgressRequirements?: number; delayedRequirements?: number; status: string }) => {
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
            <Modal
              title={
                <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <div className="p-2 rounded-full bg-[#F7F7F7]">
                    <FolderOpen className="w-5 h-5 text-[#666666]" />
                  </div>
                  Create Workspace
                </div>
              }
              open={isDialogOpen}
              onCancel={() => setIsDialogOpen(false)}
              footer={null}
              width={600}
              centered
              className="rounded-[16px] overflow-hidden"
            >
              <div className="p-0">
                <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11 mb-6">
                  Create a new workspace to organize tasks and requirements.
                </p>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto mb-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace Name <span className="text-[#ff3b3b]">*</span></label>
                      <Input
                        placeholder="e.g. Website Redesign"
                        className="h-11 rounded-lg font-['Manrope:Medium',sans-serif]"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Client <span className="text-[#ff3b3b]">*</span></label>
                      <Select
                        className="w-full h-11"
                        placeholder="Select client"
                        value={newWorkspace.client || undefined}
                        onChange={(val) => setNewWorkspace({ ...newWorkspace, client: String(val) })}
                      >
                        {clientsData?.result?.map((client: any) => (
                          <Option key={client.id || client.association_id} value={client.name || client.company}>
                            {client.name || client.company}
                          </Option>
                        )) || (
                            <Option value="none" disabled>No clients available</Option>
                          )}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Project Lead</label>
                      <Select
                        className="w-full h-11"
                        placeholder="Select lead"
                        value={newWorkspace.lead || undefined}
                        onChange={(val) => setNewWorkspace({ ...newWorkspace, lead: String(val) })}
                      >
                        {employeesData?.result?.map((emp: any) => (
                          <Option key={emp.user_id || emp.id} value={String(emp.user_id || emp.id)}>
                            {emp.name}
                          </Option>
                        )) || (
                            <Option value="none" disabled>No employees available</Option>
                          )}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Upload Documents</label>
                    <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#ff3b3b]/30 hover:bg-[#FFFAFA] transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-[#999999]" />
                      </div>
                      <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-1">Choose a file or drag & drop it here</p>
                      <p className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">txt, docx, pdf, jpeg, xlsx - Up to 50MB</p>
                      <Button className="mt-4 h-8 text-[12px] font-['Manrope:SemiBold',sans-serif]">Browse files</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</label>
                    <TextArea
                      placeholder="Describe your workspace..."
                      className="min-h-[100px] rounded-lg font-['Manrope:Regular',sans-serif] resize-none p-3"
                      value={newWorkspace.description}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#EEEEEE]">
                  <Button
                    type="text"
                    onClick={() => setNewWorkspace({ name: '', client: '', description: '', lead: '' })}
                    className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
                  >
                    Reset Data
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleCreateWorkspace}
                    disabled={createWorkspaceMutation.isPending}
                    className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
                  >
                    {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
                  </Button>
                </div>
              </div>
            </Modal>
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
            {currentWorkspaces.map((workspace) => (
              <WorkspaceListItem
                key={workspace.id}
                workspace={workspace}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#EEEEEE]">
          <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
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
    <div className="space-y-3">
      {/* REQUIREMENTS Label - Centered */}
      <p className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#999999] uppercase tracking-wide text-center">
        REQUIREMENTS
      </p>
      
      {/* Three Columns with Vertical Separators */}
      <div className="flex items-center justify-center">
        {/* TOTAL Column */}
        <div className="flex-1 flex flex-col items-center border-r border-[#EEEEEE]">
          <span className="text-[12px] text-[#999999] font-['Manrope:Regular',sans-serif] uppercase mb-1">
            TOTAL
          </span>
          <span className="text-[18px] text-[#111111] font-['Manrope:Bold',sans-serif]">
            {total}
          </span>
        </div>
        
        {/* PROGRESS Column */}
        <div className="flex-1 flex flex-col items-center border-r border-[#EEEEEE]">
          <span className="text-[12px] text-[#999999] font-['Manrope:Regular',sans-serif] uppercase mb-1">
            PROGRESS
          </span>
          <span className="text-[18px] text-[#2F80ED] font-['Manrope:Bold',sans-serif]">
            {inProgress}
          </span>
        </div>
        
        {/* DELAYED Column */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[12px] text-[#999999] font-['Manrope:Regular',sans-serif] uppercase mb-1">
            DELAYED
          </span>
          <span className="text-[18px] text-[#ff3b3b] font-['Manrope:Bold',sans-serif]">
            {delayed}
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkspaceCard({ workspace, onClick }: { workspace: { id: number; name: string; client: string; taskCount: number; inProgressCount?: number; delayedCount?: number; completedCount?: number; totalRequirements?: number; inProgressRequirements?: number; delayedRequirements?: number; status: string }; onClick?: () => void }) {
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
      className="group relative bg-white border-2 border-transparent rounded-[16px] p-6 hover:border-[#ff3b3b] focus-within:border-[#ff3b3b] transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
    >
      {/* Action Menu - Absolute Positioned */}
      <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-5 h-5 text-[#666666]" />
          </button>
        </Dropdown>
      </div>

      <div className="flex flex-col h-full">
        {/* Header Section - Icon and Text */}
        <div className="flex items-start gap-4 mb-4">
          {/* Folder Icon - Light pink background with red outline */}
          <div className="w-12 h-12 rounded-[10px] bg-[#FEF3F2] border border-[#ff3b3b]/30 flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6 text-[#ff3b3b]" strokeWidth={2} />
          </div>

          {/* Title and Subtitle */}
          <div className="flex-1 min-w-0">
            {/* Workspace Name - 16-18px, bold, black, truncated */}
            <h3 className="font-['Manrope:Bold',sans-serif] text-[17px] text-[#111111] mb-1 line-clamp-1">
              {workspace.name}
            </h3>
            {/* Client Name - 14px, regular, dark grey */}
            <p className="text-[14px] text-[#666666] font-['Manrope:Regular',sans-serif]">
              {workspace.client}
            </p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-[#EEEEEE] my-4"></div>

        {/* Requirements Summary - At the bottom */}
        <div className="mt-auto">
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

function WorkspaceListItem({ workspace, onClick }: { workspace: { id: number; name: string; client: string; taskCount: number; inProgressCount?: number; delayedCount?: number; completedCount?: number; totalRequirements?: number; inProgressRequirements?: number; delayedRequirements?: number; status: string }; onClick?: () => void }) {
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
      className="group flex items-center justify-between bg-white border-2 border-transparent rounded-[12px] p-4 hover:border-[#ff3b3b] shadow-sm hover:shadow-md transition-all cursor-pointer"
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
          <p className="text-[12px] text-[#666666] font-['Manrope:Regular',sans-serif]">
            {workspace.client}
          </p>
        </div>
      </div>

      {/* Requirements Stats */}
      <div className="flex items-center gap-6 mr-8">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mb-0.5">Total</span>
          <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{workspace.totalRequirements || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mb-0.5">Progress</span>
          <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#2F80ED]">{workspace.inProgressRequirements || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mb-0.5">Delayed</span>
          <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#ff3b3b]">{workspace.delayedRequirements || 0}</span>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-5 h-5 text-[#666666]" />
          </button>
        </Dropdown>
      </div>
    </div>
  );
}