import { useState } from 'react';
import {
  Download,
  Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronDown
} from 'lucide-react';
import BrandLogo from '@/assets/images/logo.png';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { DateRangeSelector } from '../../common/DateRangeSelector';
import { Drawer, Tooltip, Button } from "antd";
import dynamic from 'next/dynamic'; 

const ReportsPdfTemplate = dynamic(() => import('./ReportsPdfGeneration').then(m => m.ReportsPdfTemplate), { ssr: false });
const IndividualEmployeePdfTemplate = dynamic(() => import('./ReportsPdfGeneration').then(m => m.IndividualEmployeePdfTemplate), { ssr: false });
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useTabSync } from '@/hooks/useTabSync';
import { useQuery } from '@tanstack/react-query';
import { usePartners, useEmployees, useCompanyDepartments, useCurrentUserCompany } from '@/hooks/useUser';
import { getRequirementReports, getTaskReports, getEmployeeReports, getMemberWorklogs, EmployeeReport, EmployeeKPI } from '../../../services/report';

// Initialize dayjs plugins
dayjs.extend(isBetween);

// --- Types ---
interface MemberRow {
  id: string;
  member: string;
  department: string;
  taskStats: { assigned: number; completed: number; inProgress: number; delayed: number };
  totalWorkingHrs: number;
  actualEngagedHrs: number;
  costPerHour: number;
  billablePerHour: number;
}


// --- Helper Components ---

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any, color: string, label: string }> = {
    'Completed': { icon: CheckCircle2, color: 'text-[#0F9D58]', label: 'Completed' },
    'In Progress': { icon: Loader2, color: 'text-[#2196F3]', label: 'In Progress' },
    'Delayed': { icon: AlertCircle, color: 'text-[#FF3B3B]', label: 'Delayed' },
    'Paid': { icon: CheckCircle2, color: 'text-[#0F9D58]', label: 'Paid' },
    'Pending': { icon: Clock, color: 'text-[#F59E0B]', label: 'Pending' },
    'Overdue': { icon: AlertCircle, color: 'text-[#FF3B3B]', label: 'Overdue' },
  };

  const style = config[status] || { icon: Clock, color: 'text-[#999999]', label: status };
  const Icon = style.icon;

  return (
    <Tooltip title={style.label}>
      <div className="cursor-help inline-flex items-center justify-center p-1">
        <Icon className={`w-5 h-5 ${style.color} ${status === 'In Progress' ? 'animate-spin' : ''}`} />
      </div>
    </Tooltip>
  );
}

function TableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = 'left'
}: {
  label: string;
  sortKey?: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  align?: 'left' | 'right' | 'center';
}) {
  const isSorted = currentSort?.key === sortKey;

  return (
    <button
      className={`flex items-center gap-1 group outline-none ${sortKey ? 'cursor-pointer' : 'cursor-default'} ${align === 'right' ? 'ml-auto' : align === 'center' ? 'mx-auto' : ''}`}
      onClick={() => sortKey && onSort?.(sortKey)}
      disabled={!sortKey}
    >
      <span className={`text-[11px] font-['Manrope:Bold',sans-serif] uppercase tracking-wide transition-colors ${isSorted ? 'text-[#111111]' : 'text-[#999999] group-hover:text-[#666666]'}`}>
        {label}
      </span>
      {sortKey && (
        <span className={`flex flex-col items-center justify-center transition-all ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          <ChevronDown className={`w-3 h-3 transition-transform ${isSorted && currentSort?.direction === 'desc' ? 'rotate-180 text-[#111111]' : 'text-[#999999]'}`} />
        </span>
      )}
    </button>
  );
}


// --- Main Component ---

export function ReportsPage() {
  const [activeTab, setActiveTab] = useTabSync<'requirement' | 'task' | 'member'>({
    defaultTab: 'requirement',
    validTabs: ['requirement', 'task', 'member']
  });


  const { data: companyData } = useCurrentUserCompany();
  const companyName = companyData?.result?.name; // Correctly accessing 'name' nested in 'result' property of ApiResponse

  // Fetch Dropdown Data
  const { data: partnersData } = usePartners();
  const { data: employeesData } = useEmployees("is_active=true&limit=1000"); // Fetch all active for filters
  const { data: departmentsData } = useCompanyDepartments();

  const partnerOptions = [
      { label: 'All', value: 'All' }, 
      ...(partnersData?.result || []).map((p) => ({ label: p.name, value: String(p.id) }))
  ];
  const employeeOptions = [
      { label: 'All', value: 'All' }, 
      ...(employeesData?.result || []).map((e) => ({ label: e.name, value: String(e.id) }))
  ];
  const departmentOptions = [
      { label: 'All', value: 'All' },
      ...(departmentsData?.result || []).map((d) => ({ label: d.name, value: String(d.id) }))
  ];

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('All');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingIndividual, setIsDownloadingIndividual] = useState(false);


  // Filters State
  const [filters, setFilters] = useState<Record<string, string>>({
    partner: 'All',
    member: 'All',
    leader: 'All',
    assigned: 'All',
    status: 'All',
    type: 'All',
    priority: 'All',
    department: 'All'
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Date Picker State using dayjs for AntD
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  // Handle Filters
  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      partner: 'All',
      member: 'All',
      status: 'All',
      manager: 'All',
      leader: 'All',
      assigned: 'All',
      department: 'All',
      type: 'All',
      priority: 'All'
    });
    setSearchQuery('');
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const fileName = `alsonotify_${activeTab}_report_${dayjs().format('YYYY-MM-DD')}.pdf`;
      const { generatePdf } = await import('./ReportsPdfGeneration');
      await generatePdf(fileName, 'pdf-report-container');
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert("Failed to generate PDF. Please check console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadIndividualPDF = async () => {
    if(!selectedMember) return;
    setIsDownloadingIndividual(true);
    try {
      const fileName = `alsonotify_employee_${selectedMember.member.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.pdf`;
      const { generatePdf } = await import('./ReportsPdfGeneration');
      await generatePdf(fileName, 'pdf-individual-report-container');
    } catch (error) {
         console.error('PDF Generation failed:', error);
         alert("Failed to generate PDF");
    } finally {
        setIsDownloadingIndividual(false);
    }
  }

  const handleExport = () => {
      handleDownloadPDF();
  };

  // --- Queries ---

  // Requirements Query
  const { data: requirementData, isLoading: isLoadingRequirements } = useQuery({
    queryKey: ['requirement-reports', filters, searchQuery, dateRange],
    queryFn: () => getRequirementReports({
      search: searchQuery,
      partner_id: filters.partner,
      status: filters.status,
      type: filters.type,
      priority: filters.priority,
      department_id: filters.department,
      start_date: dateRange && dateRange[0] ? dateRange[0].toISOString() : undefined,
      end_date: dateRange && dateRange[1] ? dateRange[1].toISOString() : undefined,
    }),
    enabled: activeTab === 'requirement' || true
  });


  // Tasks Query
  const { data: taskData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['task-reports', filters, searchQuery, dateRange],
    queryFn: () => getTaskReports({
      search: searchQuery,
      leader_id: filters.leader,
      assigned_id: filters.assigned,
      status: filters.status,
      start_date: dateRange && dateRange[0] ? dateRange[0].toISOString() : undefined,
      end_date: dateRange && dateRange[1] ? dateRange[1].toISOString() : undefined,
    }),
    enabled: activeTab === 'task' || true
  });

  // Employees Query
  const { data: employeeData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employee-reports', filters, searchQuery, dateRange],
    queryFn: () => getEmployeeReports({
      search: searchQuery,
      department_id: filters.department,
      member_id: filters.member,
      start_date: dateRange && dateRange[0] ? dateRange[0].toISOString() : undefined,
      end_date: dateRange && dateRange[1] ? dateRange[1].toISOString() : undefined,
    }),
    enabled: activeTab === 'member' || true
  });

  console.log('Reports Debug:', { 
      requirementData, 
      taskData, 
      employeeData,
      reqLoading: isLoadingRequirements,
      taskLoading: isLoadingTasks 
  });


  // Process Data
  const requirements = requirementData?.data || [];
  const kpi = requirementData?.kpi || {
    totalRequirements: 0,
    onTimeCompleted: 0,
    delayedCompleted: 0,
    totalExtraHrs: 0,
    efficiency: 0
  };

  const tasks = taskData?.data || [];
  const taskKPI = taskData?.kpi || {
    totalTasks: 0,
    onTimeCompleted: 0,
    delayedCompleted: 0,
    totalExtraHrs: 0,
    efficiency: 0
  };

  const employees = employeeData?.data || [];
  const employeeKPI: EmployeeKPI = employeeData?.kpi || {
    totalInvestment: 0,
    totalRevenue: 0,
    netProfit: 0,
    avgRatePerHr: 0
  };


  // Client-side Sorting
  const sortData = <T,>(data: T[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      // Safe access using the key as keyof T
      // We assume sortConfig.key is a valid key of T based on usage
      const key = sortConfig.key as keyof T;
      const aVal = a[key] as string | number | undefined | null;
      const bVal = b[key] as string | number | undefined | null;

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      return sortConfig.direction === 'asc' ? 1 : -1;
    });
  };

  const filteredRequirements = sortData(requirements);
  const filteredTasks = sortData(tasks);
  const filteredEmployees = sortData(employees);

  // Debug Logs
  console.log('ReportsPage Render:', { 
    activeTab, 
    requirementsCount: requirements.length, 
    tasksCount: tasks.length,
    reqData: requirementData,
    taskData: taskData
  });


  // Filter Configuration
  const filterOptions: FilterOption[] = [];

  if (activeTab === 'requirement') {
    filterOptions.push(
      { id: 'partner', label: 'Partner', options: partnerOptions, defaultValue: 'All', placeholder: 'Select Partner' },
      { id: 'status', label: 'Status', options: ['All', 'Completed', 'In Progress', 'Delayed'], defaultValue: 'All' },
      { id: 'type', label: 'Type', options: ['All', 'Inhouse', 'Outsourced'], defaultValue: 'All', placeholder: 'Select Type' },
      { id: 'priority', label: 'Priority', options: ['All', 'High', 'Normal'], defaultValue: 'All', placeholder: 'Select Priority' },
      { id: 'department', label: 'Department', options: departmentOptions, defaultValue: 'All', placeholder: 'Select Department' }
    );
  } else if (activeTab === 'task') {
    filterOptions.push(
      { id: 'leader', label: 'Leader', options: employeeOptions, defaultValue: 'All', placeholder: 'Select Leader' },
      { id: 'assigned', label: 'Assigned', options: employeeOptions, defaultValue: 'All', placeholder: 'Select Member' },
      { id: 'status', label: 'Status', options: ['All', 'Completed', 'In Progress', 'Delayed'], defaultValue: 'All' }
    );
  } else if (activeTab === 'member') {
    filterOptions.push({ id: 'member', label: 'Member', options: employeeOptions, defaultValue: 'All', placeholder: 'Select Member' });
    filterOptions.push({ id: 'department', label: 'Department', options: departmentOptions, defaultValue: 'All', placeholder: 'Select Department' });
  }

  // Selected Member Logic
  // Find member in the fetched employees list
  const selectedMemberData = employees.find(m => String(m.id) === selectedMemberId) || null;
  
  // Adapt EmployeeReport to the shape expected by the drawer (MemberRow-like)
  const selectedMember = selectedMemberData ? {
      ...selectedMemberData,
      id: String(selectedMemberData.id), // Ensure ID is string
      totalWorkingHrs: selectedMemberData.utilization > 0 ? Math.round(selectedMemberData.engagedHrs / (selectedMemberData.utilization / 100)) : 0,
      actualEngagedHrs: selectedMemberData.engagedHrs,
      costPerHour: selectedMemberData.hourlyCost,
      billablePerHour: 0 // Not in API yet
  } : null;

  // Placeholder task filtering for member drawer - Mock worklogs as we don't have an endpoint for user worklogs yet
  // Query Member Worklogs
  const { data: memberWorklogs, isLoading: isLoadingWorklogs } = useQuery({
      queryKey: ['member-worklogs', selectedMemberId, dateRange],
      queryFn: () => getMemberWorklogs(
          selectedMemberId!, 
          dateRange && dateRange[0] ? dateRange[0].toISOString() : undefined,
          dateRange && dateRange[1] ? dateRange[1].toISOString() : undefined
      ),
      enabled: !!selectedMemberId
  });

  const selectedMemberWorklogs = memberWorklogs || [];


  return (
    <PageLayout
      title="Reports" 
      tabs={[
        { id: 'requirement', label: 'Requirement' },
        { id: 'task', label: 'Tasks' },
        { id: 'member', label: 'Employee' }

      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as 'requirement' | 'task' | 'member')}
      customFilters={
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
            className="font-['Manrope:SemiBold',sans-serif] text-[13px] rounded-full"
            disabled={isDownloading}
          >
            {isDownloading ? 'Generating...' : 'Download'}
          </Button>
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      }
    >
      <div className="flex flex-col h-full relative">
        {/* Filter Bar */}
        <div className="mb-6 space-y-4">
          <FilterBar
            filters={filterOptions}
            selectedFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            searchPlaceholder="Search reports..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            showClearButton={true}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {activeTab === 'requirement' && (
              <>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Requirements</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{kpi.totalRequirements}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">On Time Completed</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#0F9D58]">{kpi.onTimeCompleted}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Delayed but Completed</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{kpi.delayedCompleted}</span>
                    {kpi.totalExtraHrs > 0 && <span className="text-sm font-medium text-[#FF3B3B]">(+{kpi.totalExtraHrs}h)</span>}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Avg. Efficiency</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#2196F3]">
                    {kpi.efficiency}%
                  </span>
                </div>
              </>
            )}

            {activeTab === 'task' && (
              <>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Tasks</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{taskKPI.totalTasks}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">On Time Completed</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#0F9D58]">{taskKPI.onTimeCompleted}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Delayed but Completed</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{taskKPI.delayedCompleted}</span>
                    {taskKPI.totalExtraHrs > 0 && <span className="text-sm font-medium text-[#FF3B3B]">(+{taskKPI.totalExtraHrs}h)</span>}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Avg. Efficiency</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#2196F3]">
                    {taskKPI.efficiency}%
                  </span>
                </div>
              </>
            )}

            {activeTab === 'member' && (
              <>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Investment</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">${employeeKPI.totalInvestment.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Revenue</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#0F9D58]">${employeeKPI.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Net Profit</span>
                  <span className={`text-2xl font-['Manrope:Bold',sans-serif] ${employeeKPI.netProfit >= 0 ? 'text-[#0F9D58]' : 'text-[#FF3B3B]'}`}>
                    ${employeeKPI.netProfit.toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Avg. Rate/Hr</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#2196F3]">
                    ${employeeKPI.avgRatePerHr.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>


        {/* Table Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {isLoadingRequirements || (activeTab === 'task' && isLoadingTasks) || (activeTab === 'member' && isLoadingEmployees) ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-[#999999]" />
            </div>
          ) : activeTab === 'requirement' && (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#EEEEEE] h-10">
                   <th className="pl-6 pr-4 w-[50px]"><TableHeader label="No" /></th>
                   <th className="px-4 w-[250px]"><TableHeader label="Requirement" sortKey="requirement" currentSort={sortConfig} onSort={handleSort} /></th>
                   <th className="px-4"><TableHeader label="Manager" sortKey="manager" currentSort={sortConfig} onSort={handleSort} /></th>
                   <th className="px-4 w-[140px]"><TableHeader label="Timeline" /></th>
                   <th className="px-4 w-[150px]"><TableHeader label="Hours Utilization" sortKey="efficiency" currentSort={sortConfig} onSort={handleSort} /></th>
                   <th className="px-4"><TableHeader label="Revenue" sortKey="revenue" currentSort={sortConfig} onSort={handleSort} /></th>
                   <th className="px-4"><TableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map((row, idx) => {
                  const percentage = row.allottedHrs > 0 ? Math.min((row.engagedHrs / row.allottedHrs) * 100, 100) : 0;
                  const isOverBudget = row.engagedHrs > row.allottedHrs;

                  return (
                    <tr key={row.id} className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors h-16 group">
                      <td className="pl-6 pr-4 text-[13px] text-[#999999] font-['Inter:Medium',sans-serif]">{idx + 1}</td>
                      <td className="px-4">
                        <div className="flex flex-col justify-center h-full">
                          <span className="text-[14px] text-[#111111] font-['Manrope:Bold',sans-serif] mb-0.5">{row.requirement}</span>
                          <span className="text-[12px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.partner}</span>
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.manager || 'Unassigned'}</td>
                     <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[#111111] font-medium">{row.startDate ? dayjs(row.startDate).format('MMM DD') : '-'}</span>
                            <span className="text-[11px] text-[#999999]">to {row.endDate ? dayjs(row.endDate).format('MMM DD') : '-'}</span>
                        </div>
                     </td>
                     <td className="px-4">
                         <div className="flex flex-col gap-1.5 justify-center h-full">
                           <div className="flex justify-between text-[11px]">
                             <span className="font-medium text-[#111111]">{row.engagedHrs}h</span>
                             <span className="text-[#999999]">of {row.allottedHrs}h</span>
                           </div>
                           <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${row.engagedHrs > row.allottedHrs ? 'bg-[#FF3B3B]' : 'bg-[#111111]'}`}
                                style={{ width: `${Math.min((row.engagedHrs / (row.allottedHrs || 1)) * 100, 100)}%` }}
                             ></div>
                           </div>
                         </div>
                     </td>
                     <td className="px-4 text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">${row.revenue?.toLocaleString() || 0}</td>
                     <td className="px-4"><StatusBadge status={row.status} /></td>
                    </tr>
                  );
                })}
                {filteredRequirements.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-[#999999] text-[13px]">No requirements found matching your filters.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'task' && (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#EEEEEE] h-10">
                  <th className="pl-6 pr-4 w-[50px]"><TableHeader label="No" /></th>
                  <th className="px-4"><TableHeader label="Task" sortKey="task" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Requirement" sortKey="requirement" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Leader" sortKey="leader" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Assigned" sortKey="assigned" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Allotted" sortKey="allottedHrs" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Engaged" sortKey="engagedHrs" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Extra" sortKey="extraHrs" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((row, idx) => (
                  <tr key={row.id} className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors h-14">
                    <td className="pl-6 pr-4 text-[13px] text-[#999999] font-['Inter:Medium',sans-serif]">{idx + 1}</td>
                    <td className="px-4 text-[13px] text-[#111111] font-['Manrope:SemiBold',sans-serif]">{row.task}</td>
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.requirement}</td>
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.leader}</td>
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.assigned}</td>
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.dueDate ? dayjs(row.dueDate).format('MMM D, YYYY') : '-'}</td>
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.allottedHrs}h</td>
                    <td className="px-4 text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">{row.engagedHrs}h</td>
                    <td className="px-4 text-[13px] font-['Inter:Medium',sans-serif] text-[#FF3B3B]">{row.extraHrs > 0 ? `+${row.extraHrs}h` : '-'}</td>
                    <td className="px-4"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-[#999999] text-[13px]">No tasks found matching your filters.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'member' && (
             <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#EEEEEE] h-10">
                  <th className="pl-6 pr-4 w-[50px]"><TableHeader label="No" /></th>
                  <th className="px-4 w-[250px]"><TableHeader label="Employee" sortKey="member" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Tasks Performance" /></th>
                  <th className="px-4"><TableHeader label="Load" sortKey="utilization" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Investment" sortKey="hourlyCost" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Revenue" sortKey="revenue" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Net Profit" sortKey="profit" currentSort={sortConfig} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((row, idx) => (
                  <tr key={row.id} className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors h-16 cursor-pointer group" onClick={() => setSelectedMemberId(String(row.id))}>
                    <td className="pl-6 pr-4 text-[13px] text-[#999999] font-['Inter:Medium',sans-serif]">{idx + 1}</td>
                    <td className="px-4">
                        <div className="flex flex-col justify-center">
                            <span className="text-[14px] text-[#111111] font-['Manrope:Bold',sans-serif]">{row.member}</span>
                            <span className="text-[12px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.designation} <span className="text-[#E5E5E5] mx-1">|</span> {row.department}</span>
                        </div>
                    </td>
                    <td className="px-4">
                        <div className="flex flex-col">
                            <span className="text-[14px] text-[#111111] font-['Manrope:Bold',sans-serif]">
                                {row.taskStats.assigned} <span className="text-[#666666] font-['Inter:Regular',sans-serif] text-[13px]">Assigned</span>
                            </span>
                            <div className="flex gap-3 mt-1 text-[11px] font-medium text-[#666666]">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0F9D58]"></div>
                                    <span>{row.taskStats.completed}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]"></div>
                                    <span>{row.taskStats.inProgress}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B]"></div>
                                    <span>{row.taskStats.delayed}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="px-4 w-[150px]">
                        <div className="flex flex-col gap-1">
                             <div className="flex justify-between text-[11px]">
                                <span className="font-medium text-[#111111]">{row.utilization}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${row.utilization > 100 ? 'bg-[#FF3B3B]' : 'bg-[#111111]'}`}
                                  style={{ width: `${Math.min(row.utilization, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </td>
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Medium',sans-serif]">${row.hourlyCost.toLocaleString()}</td>
                    <td className="px-4 text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">${row.revenue.toLocaleString()}</td>
                    <td className={`px-4 text-[13px] font-['Manrope:Bold',sans-serif] ${row.profit >= 0 ? 'text-[#0F9D58]' : 'text-[#FF3B3B]'}`}>
                        ${row.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
                 {filteredEmployees.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-[#999999] text-[13px]">No employees found matching your filters.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <Drawer
          title={null}
          closable={false}
          width={850}
          onClose={() => setSelectedMemberId(null)}
          open={!!selectedMemberId}
          styles={{ body: { padding: 0 } }}
        >
          {selectedMember && (
            <div className="flex flex-col h-full bg-white">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#EEEEEE] sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#111111] flex items-center justify-center text-white text-lg font-['Manrope:Bold',sans-serif] shrink-0">
                      {selectedMember.member.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-['Manrope:Bold',sans-serif] text-[#111111] m-0">
                        {selectedMember.member}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-[#666666] font-['Inter:Medium',sans-serif]">
                          {selectedMember.designation} <span className="text-[#E5E5E5] mx-1">|</span> {selectedMember.department}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#999999]/30"></span>
                        <span className="px-2 py-0.5 rounded-full bg-[#7ccf00]/10 text-[#7ccf00] text-[11px] font-bold uppercase tracking-wide">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleDownloadIndividualPDF}
                    disabled={isDownloadingIndividual}
                    className="p-2 hover:bg-[#FAFAFA] rounded-full transition-colors text-[#666666]"
                    title="Download Report"
                  >
                    {isDownloadingIndividual ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] flex flex-col items-center text-center">
                        <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wide mb-1">Total Hours</span>
                        <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{selectedMember.totalWorkingHrs}h</span>
                    </div>
                    <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] flex flex-col items-center text-center">
                        <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wide mb-1">Engaged</span>
                        <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{selectedMember.actualEngagedHrs}h</span>
                    </div>
                    <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] flex flex-col items-center text-center">
                        <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wide mb-1">Efficiency</span>
                        <span className={`text-2xl font-['Manrope:Bold',sans-serif] ${
                          (selectedMember.taskStats.assigned > 0 && (selectedMember.taskStats.completed / selectedMember.taskStats.assigned * 100) >= 90) ? 'text-[#7ccf00]' : 
                          (selectedMember.taskStats.assigned > 0 && (selectedMember.taskStats.completed / selectedMember.taskStats.assigned * 100) >= 75) ? 'text-[#2196F3]' : 'text-[#FF3B3B]'
                        }`}>
                          {selectedMember.taskStats.assigned > 0 ? Math.round(selectedMember.taskStats.completed / selectedMember.taskStats.assigned * 100) : 0}%
                        </span>
                    </div>
                </div>

                {/* Work History */}
                <div>
                    <h3 className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] uppercase tracking-wide mb-3">Work History</h3>
                    <div className="border border-[#EEEEEE] rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-[#FAFAFA] border-b border-[#EEEEEE]">
                                <tr>
                                    <th className="py-2 px-3 text-[11px] font-bold text-[#666666] uppercase w-[100px]">Date</th>
                                    <th className="py-2 px-3 text-[11px] font-bold text-[#666666] uppercase w-[150px]">Task</th>
                                    <th className="py-2 px-3 text-[11px] font-bold text-[#666666] uppercase min-w-[200px]">Details</th>
                                    <th className="py-2 px-3 text-[11px] font-bold text-[#666666] uppercase w-[120px] text-right">Time</th>
                                    <th className="py-2 px-3 text-[11px] font-bold text-[#666666] uppercase w-[80px] text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedMemberWorklogs.map((log) => (
                                    <tr key={log.id} className="border-b border-[#EEEEEE] last:border-0 hover:bg-[#FAFAFA] transition-colors group h-9">
                                        <td className="px-3 text-[12px] font-medium text-[#111111] whitespace-nowrap">{log.date}</td>
                                        <td className="px-3 text-[12px] font-medium text-[#111111] truncate max-w-[150px]" title={log.task}>{log.task}</td>
                                        <td className="px-3 text-[12px] text-[#666666] truncate max-w-[250px]" title={log.details}>{log.details}</td>
                                        <td className="px-3 text-[11px] text-[#666666] text-right whitespace-nowrap">{log.startTime} - {log.endTime}</td>
                                        <td className="px-3 text-right">
                                            <span className="text-[11px] font-bold text-[#111111] bg-[#EEEEEE] px-1.5 py-0.5 rounded group-hover:bg-white group-hover:shadow-sm transition-all">{log.engagedTime}</span>
                                        </td>
                                    </tr>
                                ))}
                                {selectedMemberWorklogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-[13px] text-[#666666] italic">No work history found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

              </div>
            </div>
          )}
        </Drawer>
      </div>
      
      
      {/* Hidden PDF Template Component */}
      <ReportsPdfTemplate 
        activeTab={activeTab}
        data={activeTab === 'requirement' ? filteredRequirements : activeTab === 'task' ? filteredTasks : filteredEmployees}
        kpis={activeTab === 'requirement' ? kpi : activeTab === 'task' ? taskKPI : employeeKPI}
        dateRange={dateRange}
        companyName={companyName}
      />

      {/* Hidden Individual Employee PDF Template */}
      {selectedMember && (
          <IndividualEmployeePdfTemplate 
            member={selectedMember}
            worklogs={selectedMemberWorklogs}
            dateRange={dateRange}
            companyName={companyName}
          />
      )}


    </PageLayout>
  );
}
