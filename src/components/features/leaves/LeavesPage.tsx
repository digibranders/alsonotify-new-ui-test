import { useState } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: 'sick' | 'casual' | 'vacation';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

interface LeaveBalance {
  employeeName: string;
  sick: { used: number; total: number };
  casual: { used: number; total: number };
  vacation: { used: number; total: number };
}

const leaveRequestsData: LeaveRequest[] = [
  {
    id: '1',
    employeeName: 'Yusuf Shaikh',
    leaveType: 'sick',
    startDate: '26-Nov-2025',
    endDate: '27-Nov-2025',
    days: 2,
    reason: 'Fever and cold',
    status: 'pending',
    appliedOn: '19-Nov-2025'
  },
  {
    id: '2',
    employeeName: 'Appurva Panchabhai',
    leaveType: 'vacation',
    startDate: '02-Dec-2025',
    endDate: '06-Dec-2025',
    days: 5,
    reason: 'Family vacation',
    status: 'approved',
    appliedOn: '15-Nov-2025'
  },
  {
    id: '3',
    employeeName: 'Farheen',
    leaveType: 'casual',
    startDate: '22-Nov-2025',
    endDate: '22-Nov-2025',
    days: 1,
    reason: 'Personal work',
    status: 'approved',
    appliedOn: '18-Nov-2025'
  },
  {
    id: '4',
    employeeName: 'Sharifudeen',
    leaveType: 'vacation',
    startDate: '25-Dec-2025',
    endDate: '31-Dec-2025',
    days: 7,
    reason: 'Year-end break',
    status: 'pending',
    appliedOn: '19-Nov-2025'
  }
];

const leaveBalanceData: LeaveBalance[] = [
  {
    employeeName: 'Satyam Yadav',
    sick: { used: 2, total: 7 },
    casual: { used: 5, total: 10 },
    vacation: { used: 8, total: 20 }
  },
  {
    employeeName: 'Appurva Panchabhai',
    sick: { used: 1, total: 7 },
    casual: { used: 3, total: 10 },
    vacation: { used: 5, total: 20 }
  },
  {
    employeeName: 'Pranita Kadav',
    sick: { used: 0, total: 7 },
    casual: { used: 2, total: 10 },
    vacation: { used: 10, total: 20 }
  },
  {
    employeeName: 'Sharifudeen',
    sick: { used: 4, total: 7 },
    casual: { used: 6, total: 10 },
    vacation: { used: 15, total: 20 }
  },
  {
    employeeName: 'Farheen',
    sick: { used: 1, total: 7 },
    casual: { used: 3, total: 10 },
    vacation: { used: 12, total: 20 }
  }
];

export function LeavesPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'balance'>('requests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    leaveType: 'All',
    employee: 'All'
  });

  const filteredRequests = leaveRequestsData.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLeaveType = filters.leaveType === 'All' || request.leaveType === filters.leaveType.toLowerCase();
    const matchesEmployee = filters.employee === 'All' || request.employeeName === filters.employee;
    return matchesStatus && matchesSearch && matchesLeaveType && matchesEmployee;
  });

  const filteredBalances = leaveBalanceData.filter(balance =>
    searchQuery === '' ||
    balance.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique values for filters
  const leaveTypes = ['All', 'Sick', 'Casual', 'Vacation'];
  const employees = ['All', ...Array.from(new Set(leaveRequestsData.map(r => r.employeeName)))];

  const filterOptions: FilterOption[] = [
    {
      id: 'leaveType',
      label: 'Leave Type',
      options: leaveTypes,
      placeholder: 'Leave Type',
      defaultValue: 'All'
    },
    {
      id: 'employee',
      label: 'Employee',
      options: employees,
      placeholder: 'Employee',
      defaultValue: 'All'
    }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({ leaveType: 'All', employee: 'All' });
    setSearchQuery('');
    setStatusFilter('all');
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-[#FFEBEE] text-[#ff3b3b]';
      case 'casual':
        return 'bg-[#FFF3E0] text-[#FF9800]';
      case 'vacation':
        return 'bg-[#E3F2FD] text-[#2196F3]';
      default:
        return 'bg-[#F7F7F7] text-[#666666]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-[#4CAF50]" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-[#ff3b3b]" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-[#FF9800]" />;
      default:
        return null;
    }
  };

  return (
    <PageLayout
      title="Leaves"
      tabs={[
        { id: 'requests', label: 'Leave Requests' },
        { id: 'balance', label: 'Leave Balance' }
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as 'requests' | 'balance')}
      searchPlaceholder="Search leave requests..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      titleAction={{
        onClick: () => console.log('Apply leave')
      }}
    >
      {activeTab === 'requests' ? (
        <>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-4 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-[8px] font-['Manrope:SemiBold',sans-serif] text-[13px] transition-all ${statusFilter === status
                  ? 'bg-[#ff3b3b] text-white'
                  : 'bg-[#F7F7F7] text-[#666666] hover:bg-[#EEEEEE]'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="mb-6">
            <FilterBar
              filters={filterOptions}
              selectedFilters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Leave Requests List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white border border-[#EEEEEE] rounded-[16px] p-6 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
                          <span className="text-[14px] text-white font-['Manrope:Bold',sans-serif]">
                            {request.employeeName.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-['Manrope:SemiBold',sans-serif] text-[15px] text-[#111111] mb-1">
                            {request.employeeName}
                          </h4>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] ${getLeaveTypeColor(
                              request.leaveType
                            )}`}
                          >
                            {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                            Duration
                          </p>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#666666]" />
                            <p className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                              {request.startDate} - {request.endDate}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                            Days
                          </p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#666666]" />
                            <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                              {request.days} {request.days === 1 ? 'day' : 'days'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                            Applied On
                          </p>
                          <p className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                            {request.appliedOn}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[12px] p-3">
                        <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                          Reason
                        </p>
                        <p className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                          {request.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-[8px] ${request.status === 'approved'
                          ? 'bg-[#E8F5E9]'
                          : request.status === 'rejected'
                            ? 'bg-[#FFEBEE]'
                            : 'bg-[#FFF3E0]'
                          }`}
                      >
                        {getStatusIcon(request.status)}
                        <span
                          className={`font-['Manrope:SemiBold',sans-serif] text-[13px] ${request.status === 'approved'
                            ? 'text-[#4CAF50]'
                            : request.status === 'rejected'
                              ? 'text-[#ff3b3b]'
                              : 'text-[#FF9800]'
                            }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 bg-[#4CAF50] text-white rounded-[8px] hover:bg-[#45a049] transition-colors">
                            <span className="font-['Manrope:SemiBold',sans-serif] text-[12px]">
                              Approve
                            </span>
                          </button>
                          <button className="px-4 py-2 bg-[#ff3b3b] text-white rounded-[8px] hover:bg-[#e63535] transition-colors">
                            <span className="font-['Manrope:SemiBold',sans-serif] text-[12px]">
                              Reject
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Leave Balance View */
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {filteredBalances.map((balance) => (
              <div
                key={balance.employeeName}
                className="bg-[#F7F7F7] rounded-[16px] p-6 hover:bg-[#EEEEEE] transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center">
                    <span className="text-[14px] text-white font-['Manrope:Bold',sans-serif]">
                      {balance.employeeName.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <h4 className="font-['Manrope:SemiBold',sans-serif] text-[15px] text-[#111111]">
                    {balance.employeeName}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Sick Leave */}
                  <div className="bg-white rounded-[12px] p-4">
                    <p className="text-[12px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2">
                      Sick Leave
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-['Manrope:Bold',sans-serif] text-[20px] text-[#ff3b3b]">
                        {balance.sick.total - balance.sick.used}
                      </span>
                      <span className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#999999]">
                        / {balance.sick.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff3b3b] rounded-full"
                        style={{ width: `${(balance.sick.used / balance.sick.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Casual Leave */}
                  <div className="bg-white rounded-[12px] p-4">
                    <p className="text-[12px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2">
                      Casual Leave
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-['Manrope:Bold',sans-serif] text-[20px] text-[#FF9800]">
                        {balance.casual.total - balance.casual.used}
                      </span>
                      <span className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#999999]">
                        / {balance.casual.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF9800] rounded-full"
                        style={{ width: `${(balance.casual.used / balance.casual.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Vacation Leave */}
                  <div className="bg-white rounded-[12px] p-4">
                    <p className="text-[12px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2">
                      Vacation Leave
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-['Manrope:Bold',sans-serif] text-[20px] text-[#2196F3]">
                        {balance.vacation.total - balance.vacation.used}
                      </span>
                      <span className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#999999]">
                        / {balance.vacation.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2196F3] rounded-full"
                        style={{ width: `${(balance.vacation.used / balance.vacation.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}