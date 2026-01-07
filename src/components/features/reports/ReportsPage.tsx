import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Download, Calendar,
  Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronDown
} from 'lucide-react';
import BrandLogo from '@/assets/images/logo.png';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { DateRangeSelector } from '../../common/DateRangeSelector';
import { Drawer, Tooltip, Button } from "antd";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { format, parseISO, startOfDay } from "date-fns";
import { useTabSync } from '@/hooks/useTabSync';
import { useQuery } from '@tanstack/react-query';
import { getRequirementReports, getTaskReports, getEmployeeReports, EmployeeReport, EmployeeKPI } from '../../../services/report';

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

interface WorklogRow {
  id: string;
  date: string;
  member: string;
  task: string;
  requirement: string;
  startTime: string;
  endTime: string;
  engagedTime: string;
  details: string;
}

// Mock Data for Members (To be refactored later)
const mockMembers: MemberRow[] = [];
const mockWorklogs: WorklogRow[] = [];


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

function StatGroup({ stats }: { stats: { assigned: number; completed: number; inProgress: number; delayed: number } }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[100px]">
      <div className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-0.5">
        {stats.assigned} <span className="text-[#999999] font-['Inter:Regular',sans-serif] font-normal">Assigned</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" title="Completed">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0F9D58]"></div>
          <span className="text-[11px] text-[#666666] font-medium">{stats.completed}</span>
        </div>
        <div className="flex items-center gap-1" title="In Progress">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2196F3]"></div>
          <span className="text-[11px] text-[#666666] font-medium">{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-1" title="Delayed">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B]"></div>
          <span className="text-[11px] text-[#666666] font-medium">{stats.delayed}</span>
        </div>
      </div>
    </div>
  );
}

// --- Hidden PDF Template ---
// This template is rendered off-screen and used by html2canvas for PDF generation.
// It uses the same data as the main component but with specific styling for print.

// --- Main Component ---

export function ReportsPage() {
  const [activeTab, setActiveTab] = useTabSync<'requirement' | 'task' | 'member'>({
    defaultTab: 'requirement',
    validTabs: ['requirement', 'task', 'member']
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('All');
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [filters, setFilters] = useState<Record<string, string>>({
    partner: 'All',
    member: 'All',
    leader: 'All',
    assigned: 'All',
    status: 'All'
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
      department: 'All'
    });
    setSearchQuery('');
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-report-container');
    if (!element) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First Page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Footer for First Page
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text('Alsonotify Inc.', 10, pdfHeight - 10);
      pdf.text('Page 1 of 1', pdfWidth - 25, pdfHeight - 10); // Simplified for MVP 1 page usually

      // Multi-page capability (basic)
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        // Footer for subsequent pages
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('Alsonotify Inc.', 10, pdfHeight - 10);
      }

      pdf.save('employee_performance_report.pdf');
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

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
  const sortData = <T extends any>(data: T[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];

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


  // Filter Configuration
  const filterOptions: FilterOption[] = [];

  if (activeTab === 'requirement') {
    filterOptions.push(
      { id: 'partner', label: 'Partner', options: ['All', 'Triem Security', 'Eventus', 'DIST'], defaultValue: 'All' },
      { id: 'status', label: 'Status', options: ['All', 'Completed', 'In Progress', 'Delayed'], defaultValue: 'All' }
    );
  } else if (activeTab === 'task') {
    filterOptions.push(
      { id: 'leader', label: 'Leader', options: ['All', 'David', 'Elena'], defaultValue: 'All' },
      { id: 'assigned', label: 'Assigned', options: ['All', 'Alice', 'Bob', 'Charlie'], defaultValue: 'All' },
      { id: 'status', label: 'Status', options: ['All', 'Completed', 'In Progress', 'Delayed'], defaultValue: 'All' }
    );
  } else if (activeTab === 'member') {
    filterOptions.push({ id: 'member', label: 'Member', options: ['All', 'Alice Williams', 'Bob Miller', 'Charlie Davis'], defaultValue: 'All' });
    filterOptions.push({ id: 'department', label: 'Department', options: ['All', 'Design', 'Engineering', 'Product'], defaultValue: 'All' });
  }

  // Selected Member Logic (Mock for now)
  const selectedMember = mockMembers.find(m => m.id === selectedMemberId) || null;
  // Placeholder task filtering for member drawer
  const selectedMemberTasks = [];
  const selectedMemberWorklogs = mockWorklogs.filter(w => w.member === selectedMember?.member);


  return (
    <PageLayout
      title="Reports"
      tabs={[
        { id: 'requirement', label: 'Requirement' },
        { id: 'task', label: 'Tasks' },
        { id: 'member', label: 'Employee' }

      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as any)}
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

        {/* Hidden PDF Template - Dynamic based on Tab */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white p-[40px] font-['Inter'] text-[#111111]">
            <div className="flex justify-between items-center border-b-2 border-[#EEEEEE] pb-5 mb-8">
                <div className="flex flex-col">
                    <h1 className="font-['Manrope'] font-extrabold text-[24px] m-0 text-[#111111]">Alsonotify<span className="text-[#F59E0B]">.</span></h1>
                </div>
                <div className="text-right text-[12px] text-[#666666] font-['Manrope']">
                    <span className="block font-bold text-[16px] text-[#111111] mb-1">
                        {activeTab === 'requirement' ? 'Requirements Report' : activeTab === 'task' ? 'Tasks Report' : 'Employee Performance Report'}
                    </span>
                    <span>Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span><br />
                    <span>Period: {dateRange?.[0] ? dateRange[0].format('MMM DD') : 'Jan 01'} - {dateRange?.[1] ? dateRange[1].format('MMM DD, YYYY') : 'Jan 31, 2026'}</span>
                </div>
            </div>

            {/* KPI Section - Dynamic */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {activeTab === 'requirement' && (
                    <>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Total Requirements</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#111111]">{kpi.totalRequirements}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">On-Time Completion</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#0F9D58]">{kpi.onTimeCompleted}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Delayed</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#FF3B3B]">{kpi.delayedCompleted} <span className="text-[12px] text-[#666666] font-medium">({kpi.totalExtraHrs > 0 ? `+${kpi.totalExtraHrs}h` : '0h'})</span></p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Avg. Efficiency</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#2196F3]">{kpi.efficiency}%</p>
                        </div>
                    </>
                )}
                {activeTab === 'task' && (
                     <>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Total Tasks</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#111111]">{taskKPI.totalTasks}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">On-Time Done</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#0F9D58]">{taskKPI.onTimeCompleted}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Delayed</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#FF3B3B]">{taskKPI.delayedCompleted} <span className="text-[12px] text-[#666666] font-medium">({taskKPI.totalExtraHrs > 0 ? `+${taskKPI.totalExtraHrs}h` : '0h'})</span></p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Efficiency</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#2196F3]">{taskKPI.efficiency}%</p>
                        </div>
                    </>
                )}
                {activeTab === 'member' && (
                     <>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Total Investment</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#111111]">${employeeKPI.totalInvestment.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Total Revenue</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#0F9D58]">${employeeKPI.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Net Profit</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#0F9D58]">${employeeKPI.netProfit.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-4">
                            <span className="block text-[11px] font-medium text-[#666666] uppercase tracking-wide mb-1">Avg. Rate / Hr</span>
                            <p className="font-['Manrope'] font-bold text-[20px] m-0 text-[#2196F3]">${employeeKPI.avgRatePerHr}/h</p>
                        </div>
                    </>
                )}
            </div>

            {/* Table - Dynamic */}
            <table className="w-full border-collapse text-[12px]">
                <thead>
                    <tr>
                        {activeTab === 'requirement' && (
                            <>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide rounded-tl-lg w-[25%]">Requirement</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[15%]">Manager</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[15%]">Timeline</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[20%]">Hours Utilization</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[10%]">Revenue</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide rounded-tr-lg">Status</th>
                            </>
                        )}
                        {activeTab === 'task' && (
                            <>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide rounded-tl-lg w-[30%]">Task</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[20%]">Requirement</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[10%]">Leader</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[10%]">Assigned</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[8%]">Allotted</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[8%]">Engaged</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[8%]">Extra</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide rounded-tr-lg">Status</th>
                            </>
                        )}
                        {activeTab === 'member' && (
                            <>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide rounded-tl-lg w-[25%]">Member</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[20%]">Tasks Performance</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide w-[15%]">Load</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide">Investment</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide">Revenue</th>
                                <th className="bg-[#111111] text-white font-['Manrope'] font-semibold text-left p-3 text-[11px] uppercase tracking-wide rounded-tr-lg">Net Profit</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {activeTab === 'requirement' && filteredRequirements.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                             <td className="p-3 border-b border-[#EEEEEE]">
                                <div className="font-['Manrope'] font-bold text-[#111111] text-[13px]">{row.requirement}</div>
                                <div className="text-[11px] text-[#666666]">Partner: {row.partner}</div>
                            </td>
                            <td className="p-3 border-b border-[#EEEEEE] font-medium">{row.manager || 'Unassigned'}</td>
                            <td className="p-3 border-b border-[#EEEEEE]">
                                <div className="text-[12px] font-bold text-[#111111]">{row.startDate ? dayjs(row.startDate).format('MMM DD') : '-'}</div>
                                <div className="text-[10px] text-[#666666]">to {row.endDate ? dayjs(row.endDate).format('MMM DD') : '-'}</div>
                            </td>
                            <td className="p-3 border-b border-[#EEEEEE]">
                                 <div className="flex justify-between text-[11px] mb-1">
                                    <span className={`font-bold ${row.engagedHrs > row.allottedHrs ? 'text-[#FF3B3B]' : 'text-[#111111]'}`}>{row.engagedHrs}h</span>
                                    <span className="text-[#999999]">/ {row.allottedHrs}h</span>
                                 </div>
                                 <div className="w-[100px] h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full rounded-full ${row.engagedHrs > row.allottedHrs ? 'bg-[#FF3B3B]' : 'bg-[#111111]'}`}
                                        style={{ width: `${Math.min((row.engagedHrs / (row.allottedHrs || 1)) * 100, 100)}%` }}
                                     ></div>
                                 </div>
                            </td>
                            <td className="p-3 border-b border-[#EEEEEE] font-bold text-[#0F9D58]">${row.revenue?.toLocaleString() || 0}</td>
                            <td className="p-3 border-b border-[#EEEEEE]">
                                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                    row.status === 'Completed' ? 'bg-[#E6F4EA] text-[#1E8E3E]' :
                                    row.status === 'In_Progress' ? 'bg-[#E8F0FE] text-[#1967D2]' :
                                    'bg-[#FCE8E6] text-[#C5221F]'
                                }`}>
                                    {row.status.replace('_', ' ')}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {activeTab === 'task' && filteredTasks.map((row, idx) => (
                         <tr key={idx} className={idx % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                            <td className="p-3 border-b border-[#EEEEEE] font-['Manrope'] font-bold text-[#111111] text-[13px]">{row.task}</td>
                            <td className="p-3 border-b border-[#EEEEEE] text-[11px] text-[#666666]">{row.requirement}</td>
                            <td className="p-3 border-b border-[#EEEEEE] font-medium">{row.leader}</td>
                            <td className="p-3 border-b border-[#EEEEEE] font-medium">{row.assigned}</td>
                            <td className="p-3 border-b border-[#EEEEEE] font-medium">{row.allottedHrs}h</td>
                            <td className={`p-3 border-b border-[#EEEEEE] font-bold ${row.engagedHrs > row.allottedHrs ? 'text-[#FF3B3B]' : 'text-[#111111]'}`}>{row.engagedHrs}h</td>
                            <td className={`p-3 border-b border-[#EEEEEE] font-bold ${row.extraHrs > 0 ? 'text-[#FF3B3B]' : 'text-[#999]'}`}>{row.extraHrs > 0 ? `+${row.extraHrs}h` : '-'}</td>
                             <td className="p-3 border-b border-[#EEEEEE]">
                                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                    row.status === 'Completed' ? 'bg-[#E6F4EA] text-[#1E8E3E]' :
                                    row.status === 'In_Progress' ? 'bg-[#E8F0FE] text-[#1967D2]' :
                                    'bg-[#FDE7F3] text-[#D61F69]'
                                }`}>
                                    {row.status.replace('_', ' ')}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {activeTab === 'member' && filteredEmployees.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                            <td className="p-3 border-b border-[#EEEEEE]">
                                <div className="font-['Manrope'] font-bold text-[#111111] text-[13px]">{row.member}</div>
                                <div className="text-[11px] text-[#666666]">{row.designation} | {row.department}</div>
                            </td>
                            <td className="p-3 border-b border-[#EEEEEE]">
                                <div className="font-bold text-[#111111] text-[14px]">{row.taskStats.assigned} <span className="font-normal text-[#666666] text-[13px]">Assigned</span></div>
                                <div className="flex gap-2.5 mt-1 text-[11px] text-[#666666]">
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#0F9D58]"></span> {row.taskStats.completed}</div>
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]"></span> {row.taskStats.inProgress}</div>
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B]"></span> {row.taskStats.delayed}</div>
                                </div>
                            </td>
                             <td className="p-3 border-b border-[#EEEEEE]">
                                <div className="text-[11px] font-bold mb-1">{row.utilization}%</div>
                                 <div className="w-[100px] h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${row.utilization > 100 ? 'bg-[#FF3B3B]' : 'bg-[#111111]'}`} style={{ width: `${Math.min(row.utilization, 100)}%` }}></div>
                                </div>
                            </td>
                            <td className="p-3 border-b border-[#EEEEEE] font-medium text-[#111111]">${row.hourlyCost.toLocaleString()}</td>
                             <td className="p-3 border-b border-[#EEEEEE] font-bold text-[#0F9D58]">${row.revenue.toLocaleString()}</td>
                            <td className={`p-3 border-b border-[#EEEEEE] font-bold ${row.profit >= 0 ? 'text-[#0F9D58]' : 'text-[#FF3B3B]'}`}>
                                {row.profit >= 0 ? '+' : ''}${row.profit.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
                    <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.allottedHrs}h</td>
                    <td className="px-4 text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">{row.engagedHrs}h</td>
                    <td className="px-4 text-[13px] font-['Inter:Medium',sans-serif] text-[#FF3B3B]">{row.extraHrs > 0 ? `+${row.extraHrs}h` : '-'}</td>
                    <td className="px-4"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-[#999999] text-[13px]">No tasks found matching your filters.</td></tr>
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
          title={
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white text-lg font-['Manrope:Bold',sans-serif]">
                {selectedMember?.member.charAt(0)}
              </div>
              <div>
                <div className="text-lg font-['Manrope:Bold',sans-serif] text-[#111111]">{selectedMember?.member}</div>
                <div className="text-sm text-[#666666]">{selectedMember?.department}</div>
              </div>
            </div>
          }
          size={600}
          onClose={() => setSelectedMemberId(null)}
          open={!!selectedMemberId}
          extra={
            <Button icon={<Download className="w-4 h-4" />} type="text">Download Report</Button>
          }
        >
          {/* Drawer content placeholder */}
           <div>Drawer Content</div>
        </Drawer>
      </div>
      
      {/* Hidden PDF Container */}
      <div id="pdf-report-container" style={{ position: 'fixed', left: '-9999px', top: 0, width: '1200px', padding: '40px', background: 'white' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
           <div>
             {/* Logo */}
             <img src={BrandLogo.src} alt="Alsonotify" className="h-8 object-contain" />
           </div>
           <div className="text-right">
             <h1 className="text-2xl font-bold text-[#111111] mb-2 capitalize">
               {activeTab === 'requirement' ? 'Requirements Report' :
                activeTab === 'task' ? 'Tasks Report' : 'Employees Report'}
             </h1>
             <div className="space-y-1">
               <p className="text-sm text-[#666666]">
                 <span className="font-medium text-[#111111]">Generated:</span> {dayjs().format('MMM DD, YYYY')}
               </p>
               <p className="text-sm text-[#666666]">
                 <span className="font-medium text-[#111111]">Period:</span> {dateRange && dateRange[0] ? dayjs(dateRange[0]).format('MMM DD, YYYY') : 'Start'} - {dateRange && dateRange[1] ? dayjs(dateRange[1]).format('MMM DD, YYYY') : 'End'}
               </p>
             </div>
           </div>
        </div>

        {/* Content Table */}
        <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-gray-200">
                  {activeTab === 'requirement' && (
                    <>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Requirement</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Manager</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Timeline</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Hours</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Revenue</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    </>
                  )}
                  {activeTab === 'task' && (
                    <>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Task</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Requirement</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Leader</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Assigned</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Allotted</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Engaged</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    </>
                  )}
                  {activeTab === 'member' && (
                    <>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Member</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Tasks</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Load</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Investment</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Revenue</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Profit</th>
                    </>
                  )}
               </tr>
            </thead>
            <tbody>
               {activeTab === 'requirement' && filteredRequirements.map((row, idx) => (
                 <tr key={idx} className="border-b border-gray-100">
                    <td className="p-3 text-sm font-bold text-gray-900">
                        {row.requirement}
                        <div className="text-xs font-normal text-gray-500">{row.partner}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{row.manager || 'Unassigned'}</td>
                    <td className="p-3 text-sm text-gray-600">
                        {row.startDate ? dayjs(row.startDate).format('MMM DD') : '-'} - {row.endDate ? dayjs(row.endDate).format('MMM DD') : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">{row.engagedHrs} / {row.allottedHrs}h</td>
                    <td className="p-3 text-sm font-bold text-green-600">${row.revenue?.toLocaleString() || 0}</td>
                    <td className="p-3 text-sm">{row.status}</td>
                 </tr>
               ))}
               {activeTab === 'task' && filteredTasks.map((row, idx) => (
                 <tr key={idx} className="border-b border-gray-100">
                    <td className="p-3 text-sm font-bold text-gray-900">{row.task}</td>
                    <td className="p-3 text-sm text-gray-600">{row.requirement}</td>
                    <td className="p-3 text-sm text-gray-600">{row.leader}</td>
                    <td className="p-3 text-sm text-gray-600">{row.assigned}</td>
                    <td className="p-3 text-sm text-gray-600">{row.allottedHrs}h</td>
                    <td className="p-3 text-sm font-bold text-gray-900">{row.engagedHrs}h</td>
                    <td className="p-3 text-sm">{row.status}</td>
                 </tr>
               ))}
               {activeTab === 'member' && filteredEmployees.map((row, idx) => (
                 <tr key={idx} className="border-b border-gray-100">
                    <td className="p-3 text-sm font-bold text-gray-900">
                        {row.member}
                        <div className="text-xs font-normal text-gray-500">{row.designation}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                        {row.taskStats.completed} / {row.taskStats.assigned}
                    </td>
                    <td className="p-3 text-sm text-gray-600">{row.utilization}%</td>
                    <td className="p-3 text-sm font-bold text-gray-900">${row.hourlyCost.toLocaleString()}</td>
                    <td className="p-3 text-sm font-bold text-green-600">${row.revenue.toLocaleString()}</td>
                    <td className="p-3 text-sm font-bold text-green-600">${row.profit.toLocaleString()}</td>
                 </tr>
               ))}
            </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
