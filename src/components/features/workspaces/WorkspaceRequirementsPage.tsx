'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowUp,
  ArrowDown,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Breadcrumb, Checkbox, Dropdown, MenuProps, Progress, Tooltip } from 'antd';
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
    priority: 'All',
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Map backend status to UI buckets
  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (
      statusLower.includes('delayed') ||
      statusLower.includes('stuck') ||
      statusLower.includes('impediment')
    ) {
      return 'delayed';
    }
    return 'in-progress';
  };

  const workspace = useMemo(() => {
    if (!workspaceData?.result) return null;
    return {
      id: workspaceData.result.id,
      name: workspaceData.result.name || '',
      client:
        workspaceData.result.client?.name ||
        workspaceData.result.client_company_name ||
        'N/A',
    };
  }, [workspaceData]);

  const requirements = useMemo(() => {
    if (!requirementsData?.result) return [];

    return requirementsData.result.map((req: any) => {
      const assigned: string[] = [];
      if (req.manager?.name) assigned.push(req.manager.name);
      if (req.leader?.name && !assigned.includes(req.leader.name)) assigned.push(req.leader.name);

      const start = req.start_date ? new Date(req.start_date) : null;
      const end = req.end_date ? new Date(req.end_date) : null;

      let timeline = 'No date';
      if (start && end) {
        timeline = `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
      } else if (start) {
        timeline = `From ${format(start, 'MMM d')}`;
      } else if (end) {
        timeline = `Until ${format(end, 'MMM d')}`;
      }

      const progress = req.progress || 0;
      const totalTasks = req.total_tasks || 0;
      const completedTasks = totalTasks ? Math.floor((totalTasks * progress) / 100) : 0;

      const status = mapRequirementStatus(req.status || '');
      const priority = (req.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium';
      const department = req.department?.name || null;
      const client =
        req.project?.client?.name || req.client_company_name || workspace?.client || 'In-House';

      // Use real budget/estimate data from backend when available instead of mock values
      const rawBudget = req.estimated_cost ?? req.budget ?? null;
      const budgetValue =
        rawBudget !== null && rawBudget !== undefined ? Number(rawBudget) || 0 : 0;
      const budgetFormatted =
        rawBudget !== null && rawBudget !== undefined
          ? `$${budgetValue.toLocaleString('en-US')}`
          : 'N/A';

      return {
        id: req.id,
        title: req.name || req.title || '',
        description: req.description || '',
        assignedTo: assigned,
        // for sorting
        startDateValue: start ? start.getTime() : 0,
        // displayed
        timeline,
        progress,
        tasksCompleted: completedTasks,
        tasksTotal: totalTasks,
        status,
        priority,
        department,
        client,
        budgetValue,
        budgetFormatted,
      };
    });
  }, [requirementsData, workspace]);

  const statusCounts = useMemo(
    () => ({
      all: requirements.length,
      inProgress: requirements.filter((r) => r.status === 'in-progress').length,
      completed: requirements.filter((r) => r.status === 'completed').length,
      delayed: requirements.filter((r) => r.status === 'delayed').length,
    }),
    [requirements],
  );

  const filteredAndSortedRequirements = useMemo(() => {
    let filtered = requirements.filter((req) => {
      const matchesTab = activeTab === 'all' || req.status === activeTab;
      const matchesSearch =
        searchQuery === '' ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        filters.priority === 'All' || req.priority === filters.priority.toLowerCase();

      return matchesTab && matchesSearch && matchesPriority;
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
          case 'timeline':
            aVal = a.startDateValue;
            bVal = b.startDateValue;
            break;
          case 'budget':
            aVal = a.budgetValue;
            bVal = b.budgetValue;
            break;
          case 'progress':
            aVal = a.progress || 0;
            bVal = b.progress || 0;
            break;
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            aVal = (a as any)[sortColumn];
            bVal = (b as any)[sortColumn];
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
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-5 h-5 rounded-full bg-[#0F9D58] flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        );
      case 'delayed':
        return (
          <div className="w-5 h-5 rounded-full bg-[#EB5757] flex items-center justify-center">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        );
      default:
        return <Loader2 className="w-5 h-5 text-[#2F80ED] animate-spin" />;
    }
  };

  const filterOptions: FilterOption[] = [
    {
      id: 'priority',
      label: 'Priority',
      options: ['All', 'High', 'Medium', 'Low'],
      placeholder: 'Priority',
    },
  ];

  if (isLoadingWorkspace || isLoadingRequirements) {
    return <div className="p-8">Loading requirements...</div>;
  }

  if (!workspace) {
    return <div className="p-8">Workspace not found</div>;
  }

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb
            separator={
              <span className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">/
              </span>
            }
            items={[
              {
                title: (
                  <span
                    className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                    onClick={() => router.push('/dashboard/workspace')}
                  >
                    Workspaces
                  </span>
                ),
              },
              {
                title: (
                  <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">
                    {workspace.name}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div className="mb-2 -mt-2">
          <TabBar
            tabs={[
              { id: 'all', label: 'All Requirements', count: statusCounts.all },
              { id: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
              { id: 'delayed', label: 'Delayed', count: statusCounts.delayed },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId: string) =>
              setActiveTab(tabId as 'all' | 'in-progress' | 'completed' | 'delayed')
            }
          />
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={(id, val) => setFilters((prev) => ({ ...prev, [id]: val }))}
          onClearFilters={() => setFilters({ priority: 'All' })}
          searchPlaceholder="Search requirements..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          showClearButton
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* Header row */}
        <div className="sticky top-0 z-10 bg-white grid grid-cols-[40px_2.6fr_1.6fr_1.2fr_1.4fr_1.4fr_0.7fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
          <div className="flex justify-center">
            <Checkbox />
          </div>
          <button
            onClick={() => handleSort('title')}
            className="text-left text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center"
          >
            Requirement {getSortIcon('title')}
          </button>
          <button
            onClick={() => handleSort('timeline')}
            className="text-left text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center justify-start"
          >
            Timeline {getSortIcon('timeline')}
          </button>
          <button
            onClick={() => handleSort('budget')}
            className="text-left text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide hover:text-[#111111] transition-colors flex items-center justify-start"
          >
            Budget {getSortIcon('budget')}
          </button>
          <div className="text-center text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">
            Team
          </div>
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
          <div />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {filteredAndSortedRequirements.length === 0 ? (
            <div className="text-center py-12 text-[#999999] text-[13px]">No requirements found</div>
          ) : (
            filteredAndSortedRequirements.map((req) => (
              <div
                key={req.id}
                onClick={() =>
                  router.push(`/dashboard/workspace/${workspaceId}/requirements/${req.id}`)
                }
                className="group bg-white border border-[#EEEEEE] rounded-[16px] p-4 transition-all duration-300 cursor-pointer relative z-10 hover:border-[#ff3b3b]/20 hover:shadow-lg"
              >
                <div className="grid grid-cols-[40px_2.6fr_1.6fr_1.2fr_1.4fr_1.4fr_0.7fr_0.3fr] gap-4 items-center">
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox />
                  </div>

                  {/* Requirement + client */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 w-2.5 h-2.5 rounded-full ${
                        req.priority === 'high'
                          ? 'bg-[#ff3b3b]'
                          : req.priority === 'low'
                          ? 'bg-[#FACC15]'
                          : 'bg-[#F59E0B]'
                      }`}
                    />
                    <div>
                      <h3 className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors mb-1.5">
                        {req.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                          {req.client}
                        </span>
                        {req.department && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F7F7F7] text-[10px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                            {req.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-2 text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">
                    <CalendarIcon className="w-4 h-4 text-[#999999]" />
                    <span>{req.timeline}</span>
                  </div>

                  {/* Budget */}
                  <div className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#16A34A]">
                    {req.budgetFormatted}
                  </div>

                  {/* Team */}
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
                      <span className="text-[13px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                        N/A
                      </span>
                    )}
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
                        strokeColor={
                          req.status === 'completed'
                            ? '#0F9D58'
                            : req.status === 'delayed'
                            ? '#EB5757'
                            : '#2F80ED'
                        }
                        railColor="#F7F7F7"
                        size="small"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center">{getStatusIcon(req.status)}</div>

                  {/* Actions */}
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'edit', label: 'Edit Details' },
                          { key: 'priority', label: 'Set Priority' },
                          { type: 'divider' as const },
                          { key: 'delete', label: 'Delete', danger: true },
                        ] as MenuProps['items'],
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
