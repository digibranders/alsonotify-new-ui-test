'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, ArrowUp, ArrowDown, Search, MoreVertical, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Breadcrumb, Button, Checkbox, Dropdown, MenuProps, Progress, Tooltip } from 'antd';
import { TabBar } from '../../layout/TabBar';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { useWorkspace, useRequirements } from '@/hooks/useWorkspace';
import { format } from 'date-fns';

export function WorkspaceRequirementsPage() {
  const params = useParams();
  const workspaceId = Number(params.workspaceId);
  const router = useRouter();

  const { data: workspaceData, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { data: requirementsData, isLoading: isLoadingRequirements } = useRequirements(workspaceId);

  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed' | 'delayed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    priority: 'All'
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper function to map requirement status
  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed') || statusLower.includes('stuck') || statusLower.includes('impediment')) return 'delayed';
    return 'in-progress';
  };

  // Transform workspace
  const workspace = useMemo(() => {
    if (!workspaceData?.result) return null;
    return {
      id: workspaceData.result.id,
      name: workspaceData.result.name || '',
      client: workspaceData.result.client?.name || workspaceData.result.client_company_name || 'N/A',
    };
  }, [workspaceData]);

  // Transform requirements
  const requirements = useMemo(() => {
    if (!requirementsData?.result) return [];
    return requirementsData.result.map((req: any) => {
      // Get assigned team members - combine manager, leader, and any assigned users
      const assignedTeam: string[] = [];
      if (req.manager?.name) assignedTeam.push(req.manager.name);
      if (req.leader?.name && !assignedTeam.includes(req.leader.name)) assignedTeam.push(req.leader.name);
      
      return {
        id: req.id,
        title: req.name || req.title || '',
        description: req.description || '',
        assignedTo: assignedTeam,
        startDate: req.start_date ? format(new Date(req.start_date), 'dd MMM') : 'TBD',
        endDate: req.end_date ? format(new Date(req.end_date), 'dd MMM') : 'TBD',
        progress: req.progress || 0,
        tasksCompleted: req.total_tasks ? Math.floor(req.total_tasks * (req.progress || 0) / 100) : 0,
        tasksTotal: req.total_tasks || 0,
        status: mapRequirementStatus(req.status || ''),
        priority: (req.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
        department: req.department?.name || null,
        client: req.project?.client?.name || req.client_company_name || workspace?.client || 'N/A',
      };
    });
  }, [requirementsData, workspace]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    return {
      all: requirements.length,
      inProgress: requirements.filter(r => r.status === 'in-progress').length,
      completed: requirements.filter(r => r.status === 'completed').length,
      delayed: requirements.filter(r => r.status === 'delayed').length,
    };
  }, [requirements]);

  // Filter and sort requirements
  const filteredAndSortedRequirements = useMemo(() => {
    let filtered = requirements.filter(req => {
      const matchesTab = activeTab === 'all' || req.status === activeTab;
      const matchesSearch = searchQuery === '' ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filters.priority === 'All' || req.priority === filters.priority.toLowerCase();
      return matchesTab && matchesSearch && matchesPriority;
    });

    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortColumn as keyof typeof a];
        let bVal: any = b[sortColumn as keyof typeof b];

        if (sortColumn === 'startDate' || sortColumn === 'endDate') {
          // Parse dates for comparison
          aVal = aVal === 'TBD' ? 0 : new Date(aVal).getTime();
          bVal = bVal === 'TBD' ? 0 : new Date(bVal).getTime();
        } else if (sortColumn === 'progress') {
          aVal = a.progress || 0;
          bVal = b.progress || 0;
        } else if (sortColumn === 'title') {
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [requirements, activeTab, searchQuery, filters, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-[#0F9D58]" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4 text-[#EB5757]" />;
      default:
        return <Clock className="w-4 h-4 text-[#2F80ED] animate-spin" />;
    }
  };

  const filterOptions: FilterOption[] = [
    { id: 'priority', label: 'Priority', options: ['All', 'High', 'Medium', 'Low'], placeholder: 'Priority' }
  ];

  if (isLoadingWorkspace || isLoadingRequirements) {
    return <div className="p-8">Loading requirements...</div>;
  }

  if (!workspace) {
    return <div className="p-8">Workspace not found</div>;
  }

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-0 border-b border-[#EEEEEE]">
        {/* Breadcrumb and Add Button */}
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb
            separator={<span className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">/</span>}
            items={[
              {
                title: <span className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors" onClick={() => router.push('/dashboard/workspace')}>Workspaces</span>
              },
              {
                title: <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">{workspace.name}</span>
              }
            ]}
          />
          <button className="w-6 h-6 rounded-full bg-[#ff3b3b] flex items-center justify-center hover:bg-[#ff5252] transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 -mt-2">
          <TabBar
            tabs={[
              { id: 'all', label: 'All Requirements', count: statusCounts.all },
              { id: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
              { id: 'delayed', label: 'Delayed', count: statusCounts.delayed }
            ]}
            activeTab={activeTab}
            onTabChange={(tabId: string) => setActiveTab(tabId as 'all' | 'in-progress' | 'completed' | 'delayed')}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <FilterBar
                filters={filterOptions}
                selectedFilters={filters}
                onFilterChange={(id, val) => setFilters(prev => ({ ...prev, [id]: val }))}
                onClearFilters={() => setFilters({ priority: 'All' })}
                searchPlaceholder="Search requirements..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            {workspace.client && (
              <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F7] border border-[#EEEEEE]">
                <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#666666]">{workspace.client}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-[16px] border border-[#EEEEEE] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_2fr_180px_120px_120px_200px_100px_40px] gap-4 px-6 py-3 bg-[#FAFAFA] border-b border-[#EEEEEE] items-center">
            <div className="flex justify-center">
              <Checkbox />
            </div>
            <button
              onClick={() => handleSort('title')}
              className="text-left text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center"
            >
              Requirement {getSortIcon('title')}
            </button>
            <div className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
              Assigned Team
            </div>
            <button
              onClick={() => handleSort('startDate')}
              className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center justify-center"
            >
              Start Date {getSortIcon('startDate')}
            </button>
            <button
              onClick={() => handleSort('endDate')}
              className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center justify-center"
            >
              End Date {getSortIcon('endDate')}
            </button>
            <button
              onClick={() => handleSort('progress')}
              className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center justify-center"
            >
              Progress {getSortIcon('progress')}
            </button>
            <button
              onClick={() => handleSort('status')}
              className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center justify-center"
            >
              Status {getSortIcon('status')}
            </button>
            <div></div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#EEEEEE]">
            {filteredAndSortedRequirements.length === 0 ? (
              <div className="text-center py-12 text-[#999999] text-[13px]">
                No requirements found
              </div>
            ) : (
              filteredAndSortedRequirements.map((req) => (
                <div
                  key={req.id}
                  onClick={() => router.push(`/dashboard/workspace/${workspaceId}/requirements/${req.id}`)}
                  className="grid grid-cols-[40px_2fr_180px_120px_120px_200px_100px_40px] gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer items-center group"
                >
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox />
                  </div>

                  {/* Requirement Name & Details */}
                  <div>
                    {/* Requirement Name (Bold) */}
                    <h3 className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors mb-1.5">
                      {req.title}
                    </h3>
                    
                    {/* Details Below Name: # number, Client, Department */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Requirement Number */}
                      <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                        #{req.id}
                      </span>
                      
                      {/* Separator dot if client exists */}
                      {req.client && req.client !== 'N/A' && (
                        <>
                          <span className="text-[11px] text-[#999999]">•</span>
                          <span className="text-[11px] text-[#666666] font-['Manrope:Regular',sans-serif]">
                            {req.client}
                          </span>
                        </>
                      )}
                      
                      {/* Department Tags */}
                      {req.department && (
                        <>
                          <span className="text-[11px] text-[#999999]">•</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#F7F7F7] text-[10px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                            {req.department}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Assigned Team - Circular Avatars with Initials */}
                  <div className="flex items-center justify-center">
                    {req.assignedTo.length > 0 ? (
                      <div className="flex items-center -space-x-2">
                        {req.assignedTo.slice(0, 4).map((person: string, i: number) => {
                          const initials = person
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                          
                          return (
                            <Tooltip key={i} title={person}>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center border-2 border-white shadow-sm relative z-[5] hover:z-10 transition-all">
                                <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
                                  {initials}
                                </span>
                              </div>
                            </Tooltip>
                          );
                        })}
                        {req.assignedTo.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center border-2 border-white shadow-sm relative z-[1]">
                            <span className="text-[11px] text-white font-['Manrope:Bold',sans-serif]">
                              +{req.assignedTo.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#999999] font-['Manrope:Regular',sans-serif]">N/A</span>
                    )}
                  </div>

                  {/* Start Date */}
                  <div className="text-center">
                    <span className="text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">{req.startDate}</span>
                  </div>

                  {/* End Date */}
                  <div className="text-center">
                    <span className={`text-[13px] font-['Manrope:Medium',sans-serif] ${
                      req.status === 'delayed' ? 'text-[#ff3b3b]' : 'text-[#666666]'
                    }`}>
                      {req.endDate}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-[80px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#666666] font-['Manrope:Medium',sans-serif]">
                          {req.tasksCompleted}/{req.tasksTotal} Tasks
                        </span>
                        <span className="text-[11px] text-[#111111] font-['Manrope:Bold',sans-serif]">
                          {req.progress}%
                        </span>
                      </div>
                      <Progress
                        percent={req.progress}
                        showInfo={false}
                        strokeColor={req.status === 'completed' ? '#0F9D58' : req.status === 'delayed' ? '#EB5757' : '#2F80ED'}
                        trailColor="#F7F7F7"
                        size="small"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center">
                    {getStatusIcon(req.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'edit', label: 'Edit' },
                          { key: 'delete', label: 'Delete', danger: true }
                        ]
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4 text-[#666666]" />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
