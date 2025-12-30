
import { useState, useEffect } from 'react';
import {
  Download, Calendar, FileText,
  Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronDown
} from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { DateRangeSelector } from '../../common/DateRangeSelector';
import { Drawer, Tooltip, Button } from "antd";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useRouter, useSearchParams } from 'next/navigation';
import { useTabSync } from '@/hooks/useTabSync';

// Initialize dayjs plugins
dayjs.extend(isBetween);

// --- Types ---

type ReportType = 'requirement' | 'task' | 'member';

interface RequirementRow {
  id: string;
  requirement: string;
  partner: string;
  manager: string;
  startDate: string;
  endDate: string;
  completedDate: string;
  revision: number;
  allottedHrs: number;
  engagedHrs: number;
  extraHrs: number;
  status: 'Completed' | 'In Progress' | 'Delayed';
}

interface TaskRow {
  id: string;
  task: string;
  requirement: string;
  leader: string;
  assigned: string;
  allottedHrs: number;
  engagedHrs: number;
  extraHrs: number;
  status: 'Completed' | 'In Progress' | 'Delayed';
}

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
  engagedTime: string; // e.g. "4h 30m"
  details: string;
}

// --- Mock Data ---

const mockRequirements: RequirementRow[] = [
  { id: '1', requirement: 'Mobile App Redesign', partner: 'Triem Security', manager: 'Sarah J.', startDate: '2025-01-10', endDate: '2025-02-15', completedDate: '-', revision: 2, allottedHrs: 120, engagedHrs: 85, extraHrs: 0, status: 'In Progress' },
  { id: '2', requirement: 'Dashboard Analytics', partner: 'Eventus', manager: 'Mike T.', startDate: '2024-12-01', endDate: '2024-12-20', completedDate: '2024-12-22', revision: 0, allottedHrs: 80, engagedHrs: 82, extraHrs: 2, status: 'Completed' },
  { id: '3', requirement: 'API Integration', partner: 'DIST', manager: 'Sarah J.', startDate: '2025-01-05', endDate: '2025-01-25', completedDate: '-', revision: 1, allottedHrs: 40, engagedHrs: 45, extraHrs: 5, status: 'Delayed' },
  { id: '4', requirement: 'Marketing Website', partner: 'CreativeAgency', manager: 'Mike T.', startDate: '2025-01-15', endDate: '2025-02-28', completedDate: '-', revision: 0, allottedHrs: 200, engagedHrs: 50, extraHrs: 0, status: 'In Progress' },
  { id: '5', requirement: 'Internal CRM', partner: 'Alsonotify', manager: 'Sarah J.', startDate: '2024-10-01', endDate: '2025-03-01', completedDate: '-', revision: 3, allottedHrs: 600, engagedHrs: 450, extraHrs: 0, status: 'In Progress' },
  { id: '6', requirement: 'Legacy Migration', partner: 'OldCorp', manager: 'Mike T.', startDate: '2024-11-01', endDate: '2025-01-01', completedDate: '2025-01-05', revision: 5, allottedHrs: 150, engagedHrs: 180, extraHrs: 30, status: 'Completed' },
  { id: '7', requirement: 'E-commerce Platform', partner: 'ShopifyPlus', manager: 'Sarah J.', startDate: '2025-01-01', endDate: '2025-04-30', completedDate: '-', revision: 1, allottedHrs: 350, engagedHrs: 120, extraHrs: 0, status: 'In Progress' },
  { id: '8', requirement: 'Security Audit', partner: 'BankSecure', manager: 'Mike T.', startDate: '2025-02-01', endDate: '2025-02-14', completedDate: '-', revision: 0, allottedHrs: 60, engagedHrs: 10, extraHrs: 0, status: 'In Progress' },
  { id: '9', requirement: 'Cloud Migration', partner: 'TechGiant', manager: 'Sarah J.', startDate: '2024-09-15', endDate: '2024-12-31', completedDate: '2025-01-10', revision: 4, allottedHrs: 400, engagedHrs: 420, extraHrs: 20, status: 'Completed' },
  { id: '10', requirement: 'AI Chatbot', partner: 'InnovateAI', manager: 'Mike T.', startDate: '2025-01-20', endDate: '2025-03-20', completedDate: '-', revision: 2, allottedHrs: 180, engagedHrs: 60, extraHrs: 0, status: 'In Progress' },
  { id: '11', requirement: 'User Portal', partner: 'HealthCare Inc', manager: 'Sarah J.', startDate: '2024-11-15', endDate: '2025-01-15', completedDate: '-', revision: 3, allottedHrs: 160, engagedHrs: 170, extraHrs: 10, status: 'Delayed' },
  { id: '12', requirement: 'Mobile Wallet', partner: 'FinTech Co', manager: 'Mike T.', startDate: '2025-02-10', endDate: '2025-05-10', completedDate: '-', revision: 0, allottedHrs: 250, engagedHrs: 5, extraHrs: 0, status: 'In Progress' },
];

const mockTasks: TaskRow[] = [
  { id: '1', task: 'Login Flow', requirement: 'Mobile App Redesign', leader: 'David', assigned: 'Alice', allottedHrs: 12, engagedHrs: 10, extraHrs: 0, status: 'Completed' },
  { id: '2', task: 'Chart Components', requirement: 'Dashboard Analytics', leader: 'David', assigned: 'Bob', allottedHrs: 20, engagedHrs: 22, extraHrs: 2, status: 'Delayed' },
  { id: '3', task: 'Database Schema', requirement: 'API Integration', leader: 'Elena', assigned: 'Charlie', allottedHrs: 8, engagedHrs: 8, extraHrs: 0, status: 'In Progress' },
  { id: '4', task: 'Profile Page', requirement: 'Mobile App Redesign', leader: 'David', assigned: 'Alice', allottedHrs: 15, engagedHrs: 8, extraHrs: 0, status: 'In Progress' },
  { id: '5', task: 'Settings Modal', requirement: 'Mobile App Redesign', leader: 'David', assigned: 'Alice', allottedHrs: 8, engagedHrs: 0, extraHrs: 0, status: 'Delayed' },
  { id: '6', task: 'Navigation Bar', requirement: 'Mobile App Redesign', leader: 'David', assigned: 'Alice', allottedHrs: 10, engagedHrs: 10, extraHrs: 0, status: 'Completed' },
  { id: '7', task: 'Footer Design', requirement: 'Mobile App Redesign', leader: 'David', assigned: 'Alice', allottedHrs: 4, engagedHrs: 3, extraHrs: 0, status: 'Completed' },
  { id: '8', task: 'Unit Testing', requirement: 'Mobile App Redesign', leader: 'David', assigned: 'Alice', allottedHrs: 20, engagedHrs: 5, extraHrs: 0, status: 'In Progress' },
  { id: '9', task: 'Payment Gateway', requirement: 'E-commerce Platform', leader: 'Elena', assigned: 'Bob', allottedHrs: 40, engagedHrs: 15, extraHrs: 0, status: 'In Progress' },
  { id: '10', task: 'Product Listing', requirement: 'E-commerce Platform', leader: 'Elena', assigned: 'Charlie', allottedHrs: 30, engagedHrs: 28, extraHrs: 0, status: 'In Progress' },
  { id: '11', task: 'Cart Logic', requirement: 'E-commerce Platform', leader: 'Elena', assigned: 'Diana', allottedHrs: 25, engagedHrs: 10, extraHrs: 0, status: 'In Progress' },
  { id: '12', task: 'Vulnerability Scan', requirement: 'Security Audit', leader: 'David', assigned: 'Evan', allottedHrs: 15, engagedHrs: 5, extraHrs: 0, status: 'In Progress' },
  { id: '13', task: 'Report Generation', requirement: 'Security Audit', leader: 'David', assigned: 'Evan', allottedHrs: 10, engagedHrs: 0, extraHrs: 0, status: 'Delayed' },
  { id: '14', task: 'Data Export', requirement: 'Cloud Migration', leader: 'Elena', assigned: 'Frank', allottedHrs: 50, engagedHrs: 55, extraHrs: 5, status: 'Completed' },
  { id: '15', task: 'Server Setup', requirement: 'Cloud Migration', leader: 'Elena', assigned: 'Frank', allottedHrs: 30, engagedHrs: 30, extraHrs: 0, status: 'Completed' },
  { id: '16', task: 'NLP Model Training', requirement: 'AI Chatbot', leader: 'David', assigned: 'Grace', allottedHrs: 80, engagedHrs: 20, extraHrs: 0, status: 'In Progress' },
  { id: '17', task: 'Chat UI', requirement: 'AI Chatbot', leader: 'David', assigned: 'Hannah', allottedHrs: 40, engagedHrs: 15, extraHrs: 0, status: 'In Progress' },
  { id: '18', task: 'Patient Dashboard', requirement: 'User Portal', leader: 'Elena', assigned: 'Ian', allottedHrs: 45, engagedHrs: 48, extraHrs: 3, status: 'Delayed' },
  { id: '19', task: 'Appointment Booking', requirement: 'User Portal', leader: 'Elena', assigned: 'Ian', allottedHrs: 30, engagedHrs: 25, extraHrs: 0, status: 'In Progress' },
  { id: '20', task: 'Transaction History', requirement: 'Mobile Wallet', leader: 'David', assigned: 'Jack', allottedHrs: 20, engagedHrs: 0, extraHrs: 0, status: 'Delayed' },
];

const mockMembers: MemberRow[] = [
  { id: '1', member: 'Alice Williams', department: 'Design', taskStats: { assigned: 5, completed: 3, inProgress: 2, delayed: 0 }, totalWorkingHrs: 160, actualEngagedHrs: 145, costPerHour: 45, billablePerHour: 120 },
  { id: '2', member: 'Bob Miller', department: 'Engineering', taskStats: { assigned: 4, completed: 2, inProgress: 1, delayed: 1 }, totalWorkingHrs: 160, actualEngagedHrs: 150, costPerHour: 55, billablePerHour: 150 },
  { id: '3', member: 'Charlie Davis', department: 'Product', taskStats: { assigned: 6, completed: 4, inProgress: 2, delayed: 0 }, totalWorkingHrs: 160, actualEngagedHrs: 155, costPerHour: 50, billablePerHour: 135 },
  { id: '4', member: 'Diana Prince', department: 'Engineering', taskStats: { assigned: 3, completed: 1, inProgress: 2, delayed: 0 }, totalWorkingHrs: 160, actualEngagedHrs: 140, costPerHour: 60, billablePerHour: 160 },
  { id: '5', member: 'Evan Wright', department: 'Security', taskStats: { assigned: 2, completed: 0, inProgress: 1, delayed: 1 }, totalWorkingHrs: 160, actualEngagedHrs: 130, costPerHour: 70, billablePerHour: 180 },
  { id: '6', member: 'Frank Castle', department: 'DevOps', taskStats: { assigned: 4, completed: 4, inProgress: 0, delayed: 0 }, totalWorkingHrs: 160, actualEngagedHrs: 158, costPerHour: 65, billablePerHour: 170 },
  { id: '7', member: 'Grace Hopper', department: 'Data Science', taskStats: { assigned: 1, completed: 0, inProgress: 1, delayed: 0 }, totalWorkingHrs: 160, actualEngagedHrs: 120, costPerHour: 80, billablePerHour: 200 },
  { id: '8', member: 'Hannah Abbott', department: 'Design', taskStats: { assigned: 4, completed: 2, inProgress: 2, delayed: 0 }, totalWorkingHrs: 160, actualEngagedHrs: 148, costPerHour: 45, billablePerHour: 125 },
  { id: '9', member: 'Ian Malcolm', department: 'Engineering', taskStats: { assigned: 5, completed: 2, inProgress: 2, delayed: 1 }, totalWorkingHrs: 160, actualEngagedHrs: 152, costPerHour: 58, billablePerHour: 155 },
  { id: '10', member: 'Jack Ryan', department: 'Engineering', taskStats: { assigned: 2, completed: 0, inProgress: 0, delayed: 2 }, totalWorkingHrs: 160, actualEngagedHrs: 110, costPerHour: 55, billablePerHour: 150 },
];

const mockWorklogs: WorklogRow[] = [
  { id: '1', date: '2025-01-20', member: 'Alice Williams', task: 'Login Flow', requirement: 'Mobile App Redesign', startTime: '09:00', endTime: '13:00', engagedTime: '4h 0m', details: 'Implemented auth context and login form.' },
  { id: '2', date: '2025-01-20', member: 'Bob Miller', task: 'Chart Components', requirement: 'Dashboard Analytics', startTime: '14:00', endTime: '17:30', engagedTime: '3h 30m', details: 'Fixed responsive issues on bar chart.' },
  { id: '3', date: '2025-01-21', member: 'Charlie Davis', task: 'Database Schema', requirement: 'API Integration', startTime: '10:00', endTime: '12:00', engagedTime: '2h 0m', details: 'Designed initial schema for user table.' },
  { id: '4', date: '2025-01-19', member: 'Alice Williams', task: 'Navigation Bar', requirement: 'Mobile App Redesign', startTime: '09:00', endTime: '18:00', engagedTime: '8h 0m', details: 'Completed navigation structure and responsive styles.' },
  { id: '5', date: '2025-01-18', member: 'Alice Williams', task: 'Footer Design', requirement: 'Mobile App Redesign', startTime: '10:00', endTime: '13:00', engagedTime: '3h 0m', details: 'Designed and implemented footer.' },
  { id: '6', date: '2025-01-22', member: 'Alice Williams', task: 'Profile Page', requirement: 'Mobile App Redesign', startTime: '09:00', endTime: '12:00', engagedTime: '3h 0m', details: 'Building user profile layout.' },
  { id: '7', date: '2025-01-22', member: 'Alice Williams', task: 'Profile Page', requirement: 'Mobile App Redesign', startTime: '13:00', endTime: '16:00', engagedTime: '3h 0m', details: 'Connecting profile API endpoints.' },
  { id: '8', date: '2025-01-23', member: 'Alice Williams', task: 'Unit Testing', requirement: 'Mobile App Redesign', startTime: '09:00', endTime: '11:00', engagedTime: '2h 0m', details: 'Writing tests for auth flow.' },
  { id: '9', date: '2025-01-24', member: 'Bob Miller', task: 'Payment Gateway', requirement: 'E-commerce Platform', startTime: '09:00', endTime: '17:00', engagedTime: '7h 0m', details: 'Integrated Stripe API and handled webhooks.' },
  { id: '10', date: '2025-01-24', member: 'Charlie Davis', task: 'Product Listing', requirement: 'E-commerce Platform', startTime: '10:00', endTime: '16:00', engagedTime: '5h 0m', details: 'Created grid layout for products with filters.' },
  { id: '11', date: '2025-01-24', member: 'Diana Prince', task: 'Cart Logic', requirement: 'E-commerce Platform', startTime: '09:30', endTime: '15:30', engagedTime: '5h 0m', details: 'Implemented Redux state for shopping cart.' },
  { id: '12', date: '2025-01-23', member: 'Evan Wright', task: 'Vulnerability Scan', requirement: 'Security Audit', startTime: '08:00', endTime: '12:00', engagedTime: '4h 0m', details: 'Ran automated scans on staging environment.' },
  { id: '13', date: '2025-01-23', member: 'Frank Castle', task: 'Data Export', requirement: 'Cloud Migration', startTime: '09:00', endTime: '18:00', engagedTime: '8h 0m', details: 'Exported legacy database to CSV format.' },
  { id: '14', date: '2025-01-22', member: 'Grace Hopper', task: 'NLP Model Training', requirement: 'AI Chatbot', startTime: '11:00', endTime: '16:00', engagedTime: '5h 0m', details: 'Preprocessing dataset for intent recognition.' },
  { id: '15', date: '2025-01-24', member: 'Hannah Abbott', task: 'Chat UI', requirement: 'AI Chatbot', startTime: '10:00', endTime: '14:00', engagedTime: '4h 0m', details: 'Designed message bubbles and typing indicators.' },
  { id: '16', date: '2025-01-21', member: 'Ian Malcolm', task: 'Patient Dashboard', requirement: 'User Portal', startTime: '09:00', endTime: '17:00', engagedTime: '7h 0m', details: 'Implemented vital signs charts using Recharts.' },
  { id: '17', date: '2025-01-22', member: 'Alice Williams', task: 'Login Flow', requirement: 'Mobile App Redesign', startTime: '14:00', endTime: '16:00', engagedTime: '2h 0m', details: 'Added social login buttons.' },
  { id: '18', date: '2025-01-25', member: 'Bob Miller', task: 'Payment Gateway', requirement: 'E-commerce Platform', startTime: '09:00', endTime: '13:00', engagedTime: '4h 0m', details: 'Testing failed payment scenarios.' },
  { id: '19', date: '2025-01-25', member: 'Charlie Davis', task: 'Product Listing', requirement: 'E-commerce Platform', startTime: '14:00', endTime: '18:00', engagedTime: '4h 0m', details: 'Adding search functionality to product list.' },
  { id: '20', date: '2025-01-25', member: 'Diana Prince', task: 'Cart Logic', requirement: 'E-commerce Platform', startTime: '10:00', endTime: '12:00', engagedTime: '2h 0m', details: 'Fixed bug where cart total was not updating.' },
];

// --- Components ---

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

export function ReportsPage() {
  /* Manual router/params removed */
  const [activeTab, setActiveTab] = useTabSync<'requirement' | 'task' | 'member'>({
    defaultTab: 'requirement',
    validTabs: ['requirement', 'task', 'member']
  });

  // Sync activeTab with URL - handled by useTabSync
  /* useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requirement' || tab === 'task' || tab === 'member') {
      setActiveTab(tab);
    }
  }, [searchParams]); */
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Selected Member Data
  const selectedMember = mockMembers.find(m => m.id === selectedMemberId) || null;
  const selectedMemberTasks = selectedMember
    ? mockTasks.filter(t => selectedMember.member.startsWith(t.assigned))
    : [];
  const selectedMemberWorklogs = selectedMember
    ? mockWorklogs.filter(w => w.member === selectedMember.member)
    : [];

  // Filters State
  const [filters, setFilters] = useState<Record<string, string>>({
    partner: 'All',
    member: 'All'
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

  // Filter Configuration
  const filterOptions: FilterOption[] = [];

  if (activeTab === 'requirement') {
    filterOptions.push(
      { id: 'partner', label: 'Partner', options: ['All', 'Triem Security', 'Eventus', 'DIST'], defaultValue: 'All' },
      { id: 'manager', label: 'Manager', options: ['All', 'Sarah J.', 'Mike T.'], defaultValue: 'All' },
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

  // Filter Logic
  const filterData = <T extends any>(data: T[], searchFields: (keyof T)[]) => {
    return data.filter(item => {
      // Search Filter
      const matchesSearch = searchQuery === '' || searchFields.some(field => {
        const val = item[field];
        return typeof val === 'string' && val.toLowerCase().includes(searchQuery.toLowerCase());
      });

      // Dropdown Filters
      let matchesFilters = true;
      if (activeTab === 'requirement') {
        const reqItem = item as unknown as RequirementRow;
        if (filters.partner && filters.partner !== 'All' && reqItem.partner !== filters.partner) matchesFilters = false;
        if (filters.manager && filters.manager !== 'All' && reqItem.manager !== filters.manager) matchesFilters = false;
        if (filters.status && filters.status !== 'All' && reqItem.status !== filters.status) matchesFilters = false;
      } else if (activeTab === 'task') {
        const taskItem = item as unknown as TaskRow;
        if (filters.leader && filters.leader !== 'All' && taskItem.leader !== filters.leader) matchesFilters = false;
        if (filters.assigned && filters.assigned !== 'All' && taskItem.assigned !== filters.assigned) matchesFilters = false;
        if (filters.status && filters.status !== 'All' && taskItem.status !== filters.status) matchesFilters = false;
      } else if (activeTab === 'member') {
        const memberItem = item as unknown as MemberRow;
        if (filters.member && filters.member !== 'All' && memberItem.member !== filters.member) matchesFilters = false;
        if (filters.department && filters.department !== 'All' && memberItem.department !== filters.department) matchesFilters = false;
      }

      // Date Filter
      if (dateRange && dateRange[0] && dateRange[1] && matchesFilters && matchesSearch) {
        let dateToCheck: Date | null = null;

        if (activeTab === 'requirement') {
          const r = item as unknown as RequirementRow;
          if (r.startDate) dateToCheck = parseISO(r.startDate);
        } else if (activeTab === 'task') {
          const t = item as unknown as TaskRow;
          const req = mockRequirements.find(r => r.requirement === t.requirement);
          if (req?.startDate) dateToCheck = parseISO(req.startDate);
        }

        if (dateToCheck) {
          const from = dateRange[0].toDate();
          const to = dateRange[1].toDate();
          if (!isWithinInterval(dateToCheck, { start: startOfDay(from), end: endOfDay(to) })) {
            return false;
          }
        }
      }

      return matchesSearch && matchesFilters;
    });
  };

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

  const filteredRequirements = sortData(filterData(mockRequirements, ['requirement', 'partner', 'manager']));
  const filteredTasks = sortData(filterData(mockTasks, ['task', 'requirement', 'leader', 'assigned']));
  const filteredMembers = sortData(filterData(mockMembers, ['member']));

  return (
    <PageLayout
      title="Reports"
      tabs={[
        { id: 'requirement', label: 'Requirement', count: mockRequirements.length },
        { id: 'task', label: 'Tasks', count: mockTasks.length },
        { id: 'member', label: 'Employee', count: mockMembers.length }
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as any)}
      customFilters={
        <div className="flex items-center gap-3">
          <Button
            onClick={() => { }}
            icon={<Download className="w-4 h-4" />}
            className="font-['Manrope:SemiBold',sans-serif] text-[13px] rounded-full"
          >
            Download
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
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{filteredRequirements.length}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Allotted Hours</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{filteredRequirements.reduce((acc, r) => acc + r.allottedHrs, 0)}h</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Engaged Hours</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{filteredRequirements.reduce((acc, r) => acc + r.engagedHrs, 0)}h</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Avg. Efficiency</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#2196F3]">
                    {filteredRequirements.length > 0
                      ? Math.round((filteredRequirements.reduce((acc, r) => acc + (r.allottedHrs > 0 ? (r.engagedHrs / r.allottedHrs) : 0), 0) / filteredRequirements.length) * 100)
                      : 0}%
                  </span>
                </div>
              </>
            )}

            {activeTab === 'task' && (
              <>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Tasks</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{filteredTasks.length}</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Allotted Hours</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{filteredTasks.reduce((acc, t) => acc + t.allottedHrs, 0)}h</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Engaged Hours</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{filteredTasks.reduce((acc, t) => acc + t.engagedHrs, 0)}h</span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Extra Hours</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#FF3B3B]">
                    +{filteredTasks.reduce((acc, t) => acc + t.extraHrs, 0)}h
                  </span>
                </div>
              </>
            )}

            {activeTab === 'member' && (
              <>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Investment</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">
                    ${filteredMembers.reduce((acc, m) => acc + (m.totalWorkingHrs * m.costPerHour), 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Total Revenue</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#0F9D58]">
                    ${filteredMembers.reduce((acc, m) => acc + (m.actualEngagedHrs * m.billablePerHour), 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Net Profit</span>
                  <span className={`text-2xl font-['Manrope:Bold',sans-serif] ${filteredMembers.reduce((acc, m) => acc + ((m.actualEngagedHrs * m.billablePerHour) - (m.totalWorkingHrs * m.costPerHour)), 0) >= 0
                    ? 'text-[#111111]'
                    : 'text-[#FF3B3B]'
                    }`}>
                    ${filteredMembers.reduce((acc, m) => acc + ((m.actualEngagedHrs * m.billablePerHour) - (m.totalWorkingHrs * m.costPerHour)), 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#666666]">Avg. Efficiency</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#2196F3]">
                    {filteredMembers.length > 0
                      ? Math.round((filteredMembers.reduce((acc, m) => acc + (m.totalWorkingHrs > 0 ? (m.actualEngagedHrs / m.totalWorkingHrs) : 0), 0) / filteredMembers.length) * 100)
                      : 0}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {activeTab === 'requirement' && (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#EEEEEE] h-10">
                  <th className="pl-6 pr-4 w-[50px]"><TableHeader label="No" /></th>
                  <th className="px-4 w-[300px]"><TableHeader label="Requirement" sortKey="requirement" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Manager" sortKey="manager" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Timeline" sortKey="startDate" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Hours Utilization" sortKey="engagedHrs" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4 w-[80px] text-center"><TableHeader label="Rev" sortKey="revision" currentSort={sortConfig} onSort={handleSort} /></th>
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
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[10px] font-bold text-[#666666]">
                            {row.manager.charAt(0)}
                          </div>
                          <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">{row.manager}</span>
                        </div>
                      </td>
                      <td className="px-4">
                        {(() => {
                          const startDate = row.startDate !== '-' ? parseISO(row.startDate) : null;
                          const endDate = row.endDate !== '-' ? parseISO(row.endDate) : null;

                          let statusText = null;
                          let statusColor = '';

                          if (endDate) {
                            const today = startOfDay(new Date());
                            const end = startOfDay(endDate);
                            const diffTime = end.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays < 0) {
                              statusText = `Overdue by ${Math.abs(diffDays)} days`;
                              statusColor = 'text-[#DC2626]';
                            } else if (diffDays === 0) {
                              statusText = 'Deadline today';
                              statusColor = 'text-[#F59E0B]';
                            } else {
                              statusText = `${diffDays} days to deadline`;
                              statusColor = 'text-[#666666]';
                            }
                          }

                          return (
                            <div className="flex items-center gap-2 text-[11px] text-[#666666] font-['Inter:Medium',sans-serif] bg-[#F9FAFB] p-1.5 rounded-md w-fit whitespace-nowrap">
                              <Calendar className="w-3 h-3 text-[#999999]" />
                              <span>
                                {startDate ? format(startDate, 'MMM d') : ''}
                                {startDate && endDate ? ' - ' : ''}
                                {endDate ? format(endDate, 'MMM d') : ''}
                              </span>
                              {statusText && row.status !== 'Completed' && (
                                <span className={`pl-1 border-l border-[#E5E5E5] ${statusColor}`}>
                                  {statusText}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 w-[200px]">
                        <div className="flex flex-col gap-1.5 justify-center h-full">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium text-[#111111]">{row.engagedHrs}h</span>
                            <span className="text-[#999999]">of {row.allottedHrs}h</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOverBudget ? 'bg-[#FF3B3B]' : 'bg-[#111111]'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] text-center">{row.revision}</td>
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
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#EEEEEE] h-10">
                  <th className="pl-6 pr-4"><TableHeader label="Member" sortKey="member" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Department" sortKey="department" currentSort={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4"><TableHeader label="Task Stats" /></th>
                  <th className="px-4 text-right"><TableHeader label="Revenue" align="right" /></th>
                  <th className="px-4 text-right"><TableHeader label="Investment" align="right" /></th>
                  <th className="px-4 w-[200px]"><TableHeader label="Utilization" sortKey="actualEngagedHrs" currentSort={sortConfig} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((row) => {
                  const percentage = row.totalWorkingHrs > 0 ? Math.min((row.actualEngagedHrs / row.totalWorkingHrs) * 100, 100) : 0;
                  const isOverLimit = row.actualEngagedHrs > row.totalWorkingHrs;
                  const revenue = row.actualEngagedHrs * row.billablePerHour;
                  const investment = row.totalWorkingHrs * row.costPerHour;

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors h-16 cursor-pointer"
                      onClick={() => setSelectedMemberId(row.id)}
                    >
                      <td className="pl-6 pr-4 text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">{row.member}</td>
                      <td className="px-4 text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">{row.department}</td>
                      <td className="px-4">
                        <StatGroup stats={row.taskStats} />
                      </td>
                      <td className="px-4 text-[13px] text-[#0F9D58] font-['Manrope:Bold',sans-serif] text-right">
                        ${revenue.toLocaleString()}
                      </td>
                      <td className="px-4 text-[13px] text-[#666666] font-['Manrope:Bold',sans-serif] text-right">
                        ${investment.toLocaleString()}
                      </td>
                      <td className="px-4 w-[200px]">
                        <div className="flex flex-col gap-1.5 justify-center h-full">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium text-[#111111]">{row.actualEngagedHrs}h</span>
                            <span className="text-[#999999]">of {row.totalWorkingHrs}h</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOverLimit ? 'bg-[#FF3B3B]' : 'bg-[#111111]'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[#999999] text-[13px]">No employees found matching your filters.</td></tr>
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
          width={600}
          onClose={() => setSelectedMemberId(null)}
          open={!!selectedMemberId}
          extra={
            <Button icon={<Download className="w-4 h-4" />} type="text">Download Report</Button>
          }
        >
          {/* Member Stats and Tables (using Tailwind grid) */}
          {selectedMember && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] flex flex-col items-center text-center">
                  <span className="text-[11px] font-bold text-[#999999] uppercase tracking-wide mb-1">Total Hours</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{selectedMember.totalWorkingHrs}h</span>
                </div>
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] flex flex-col items-center text-center">
                  <span className="text-[11px] font-bold text-[#999999] uppercase tracking-wide mb-1">Engaged</span>
                  <span className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111]">{selectedMember.actualEngagedHrs}h</span>
                </div>
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] flex flex-col items-center text-center">
                  <span className="text-[11px] font-bold text-[#999999] uppercase tracking-wide mb-1">Efficiency</span>
                  <span className={`text-2xl font-['Manrope:Bold',sans-serif] ${(selectedMember.totalWorkingHrs > 0 ? Math.round((selectedMember.actualEngagedHrs / selectedMember.totalWorkingHrs) * 100) : 0) >= 90 ? 'text-[#0F9D58]' : 'text-[#2196F3]'}`}>
                    {selectedMember.totalWorkingHrs > 0 ? Math.round((selectedMember.actualEngagedHrs / selectedMember.totalWorkingHrs) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] uppercase tracking-wide">Assigned Tasks</h3>
                  <span className="text-[11px] font-medium text-[#999999] bg-[#F5F5F5] px-2 py-1 rounded-full">{selectedMemberTasks.length} Active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedMemberTasks.map(task => (
                    <div key={task.id} className="p-3 border border-[#EEEEEE] rounded-lg flex justify-between items-center bg-white hover:border-[#111111] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-[#0F9D58]' : task.status === 'In Progress' ? 'bg-[#2196F3]' : 'bg-[#FF3B3B]'}`}></div>
                        <div>
                          <p className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] mb-0.5 group-hover:text-[#111111] transition-colors">{task.task}</p>
                          <p className="text-[11px] text-[#999999]">{task.requirement}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-[11px] font-medium text-[#666666]">{task.engagedHrs} / {task.allottedHrs} hrs</div>
                          <div className="w-16 h-1 bg-[#F0F0F0] rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[#111111]" style={{ width: `${task.allottedHrs > 0 ? Math.min((task.engagedHrs / task.allottedHrs) * 100, 100) : 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work History Section */}
              <div>
                <h3 className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] uppercase tracking-wide mb-3">Work History</h3>
                <div className="border border-[#EEEEEE] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#FAFAFA] border-b border-[#EEEEEE]">
                      <tr>
                        <th className="py-2 px-3 text-[11px] font-bold text-[#999999] uppercase w-[100px]">Date</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-[#999999] uppercase w-[150px]">Task</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-[#999999] uppercase">Details</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-[#999999] uppercase w-[120px] text-right">Time</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-[#999999] uppercase w-[80px] text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMemberWorklogs.map((log) => (
                        <tr key={log.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors group h-9">
                          <td className="px-3 text-[12px] font-medium text-[#111111] whitespace-nowrap">{log.date}</td>
                          <td className="px-3 text-[12px] font-medium text-[#111111] truncate max-w-[150px]" title={log.task}>{log.task}</td>
                          <td className="px-3 text-[12px] text-[#666666] truncate max-w-[200px]" title={log.details}>{log.details}</td>
                          <td className="px-3 text-[11px] text-[#999999] text-right whitespace-nowrap">{log.startTime} - {log.endTime}</td>
                          <td className="px-3 text-right">
                            <span className="text-[11px] font-bold text-[#111111] bg-[#F5F5F5] px-1.5 py-0.5 rounded group-hover:bg-white group-hover:shadow-sm transition-all">{log.engagedTime}</span>
                          </td>
                        </tr>
                      ))}
                      {selectedMemberWorklogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[13px] text-[#999999] italic">No work history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </PageLayout>
  );
}
