import { useState, useMemo } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Spin, Modal, Form, DatePicker, Select, Input, Button, App } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCompanyLeaves, useUpdateLeaveStatus, useApplyForLeave } from '../../../hooks/useLeave';
import { LeaveType } from '../../../services/leave';

const { TextArea } = Input;
const { Option } = Select;

// Helper function to get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('DD-MMM-YYYY');
};

// Helper function to normalize status
const normalizeStatus = (status: string): 'pending' | 'approved' | 'rejected' => {
  const upper = status.toUpperCase();
  if (upper === 'APPROVED') return 'approved';
  if (upper === 'REJECTED') return 'rejected';
  return 'pending';
};

// Helper function to normalize leave type
const normalizeLeaveType = (type: string): 'sick' | 'casual' | 'vacation' => {
  const lower = type.toLowerCase();
  if (lower.includes('sick')) return 'sick';
  if (lower.includes('casual')) return 'casual';
  if (lower.includes('vacation') || lower.includes('vacation')) return 'vacation';
  return 'casual'; // default
};

interface ApplyLeaveFormValues {
  start_date: Dayjs;
  end_date: Dayjs;
  day_type: string;
  leave_type: string;
  reason: string;
}

export function LeavesPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<'requests' | 'balance'>('requests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    leaveType: 'All',
    employee: 'All'
  });
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [form] = Form.useForm<ApplyLeaveFormValues>();

  const { data: leavesData, isLoading, error } = useCompanyLeaves();
  const updateStatusMutation = useUpdateLeaveStatus();
  const applyLeaveMutation = useApplyForLeave();

  // Process leaves data
  const processedLeaves = useMemo(() => {
    if (!leavesData?.result) return [];

    return leavesData.result.map((leave: LeaveType) => {
      const daysValue = typeof leave.days === 'number' 
        ? leave.days 
        : typeof leave.days === 'string' 
        ? parseFloat(leave.days) 
        : leave.days_count || 0;

      return {
        id: String(leave.id),
        employeeName: leave.user?.name || 'Unknown Employee',
        leaveType: normalizeLeaveType(leave.leave_type),
        startDate: formatDate(leave.start_date),
        endDate: formatDate(leave.end_date),
        days: Math.round(daysValue) || 1,
        reason: leave.reason || 'No reason provided',
        status: normalizeStatus(leave.status),
        appliedOn: leave.created_at ? formatDate(leave.created_at) : formatDate(leave.start_date),
        rawLeave: leave,
      };
    });
  }, [leavesData]);

  // Filter leaves
  const filteredRequests = useMemo(() => {
    return processedLeaves.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch = searchQuery === '' ||
        request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLeaveType = filters.leaveType === 'All' || request.leaveType === filters.leaveType.toLowerCase();
      const matchesEmployee = filters.employee === 'All' || request.employeeName === filters.employee;
      return matchesStatus && matchesSearch && matchesLeaveType && matchesEmployee;
    });
  }, [processedLeaves, statusFilter, searchQuery, filters]);

  // Get unique values for filters
  const leaveTypes = useMemo(() => {
    const types = new Set(processedLeaves.map(l => {
      const type = l.leaveType;
      return type.charAt(0).toUpperCase() + type.slice(1);
    }));
    return ['All', ...Array.from(types)];
  }, [processedLeaves]);

  // Get unique leave types for the apply leave form dropdown
  const availableLeaveTypes = useMemo(() => {
    if (!leavesData?.result) return ['Sick Leave', 'Casual Leave', 'Vacation'];
    const types = new Set(leavesData.result.map((leave: LeaveType) => leave.leave_type));
    return Array.from(types).filter(Boolean).length > 0 
      ? Array.from(types).filter(Boolean) as string[]
      : ['Sick Leave', 'Casual Leave', 'Vacation'];
  }, [leavesData]);

  const DAY_TYPES = ['Full Day', 'First Half', 'Second Half'];

  const employees = useMemo(() => {
    const names = new Set(processedLeaves.map(l => l.employeeName));
    return ['All', ...Array.from(names)];
  }, [processedLeaves]);

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

  const handleApprove = async (leaveId: number) => {
    try {
      await updateStatusMutation.mutateAsync({ id: leaveId, status: 'APPROVED' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = async (leaveId: number) => {
    try {
      await updateStatusMutation.mutateAsync({ id: leaveId, status: 'REJECTED' });
    } catch (error) {
      // Error handled by mutation
    }
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

  const handleApplyLeave = async (values: ApplyLeaveFormValues) => {
    try {
      await applyLeaveMutation.mutateAsync({
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        day_type: values.day_type,
        leave_type: values.leave_type,
        reason: values.reason,
      });
      form.resetFields();
      setIsApplyLeaveModalOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelApplyLeave = () => {
    form.resetFields();
    setIsApplyLeaveModalOpen(false);
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
        onClick: () => setIsApplyLeaveModalOpen(true)
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spin size="large" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-red-500">
                  Failed to load leave requests
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                  No leave requests found
                </p>
              </div>
            ) : (
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
                              {getInitials(request.employeeName)}
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
                            <button 
                              onClick={() => handleApprove(request.rawLeave.id)}
                              disabled={updateStatusMutation.isPending}
                              className="px-4 py-2 bg-[#4CAF50] text-white rounded-[8px] hover:bg-[#45a049] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="font-['Manrope:SemiBold',sans-serif] text-[12px]">
                                Approve
                              </span>
                            </button>
                            <button 
                              onClick={() => handleReject(request.rawLeave.id)}
                              disabled={updateStatusMutation.isPending}
                              className="px-4 py-2 bg-[#ff3b3b] text-white rounded-[8px] hover:bg-[#e63535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
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
            )}
          </div>
        </>
      ) : (
        /* Leave Balance View */
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-[16px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2">
                Leave Balance
              </p>
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#999999]">
                Company-wide leave balance feature coming soon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        title="Apply Leave"
        open={isApplyLeaveModalOpen}
        onCancel={handleCancelApplyLeave}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApplyLeave}
          className="mt-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="start_date"
              label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]"><span className="text-red-500">*</span> Start Date</span>}
              rules={[{ required: true, message: 'Please select start date' }]}
              required={false}
            >
              <DatePicker
                className="w-full h-10 rounded-lg font-['Manrope:Medium',sans-serif]"
                placeholder="Select date"
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              name="end_date"
              label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]"><span className="text-red-500">*</span> End Date</span>}
              rules={[{ required: true, message: 'Please select end date' }]}
              required={false}
            >
              <DatePicker
                className="w-full h-10 rounded-lg font-['Manrope:Medium',sans-serif]"
                placeholder="Select date"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="day_type"
            label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]"><span className="text-red-500">*</span> Day Type</span>}
            rules={[{ required: true, message: 'Please select day type' }]}
            required={false}
          >
            <Select
              className="w-full h-10 rounded-lg font-['Manrope:Medium',sans-serif]"
              placeholder="Select day type"
            >
              {DAY_TYPES.map((dayType) => (
                <Option key={dayType} value={dayType}>
                  {dayType}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="leave_type"
            label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]"><span className="text-red-500">*</span> Leave Type</span>}
            rules={[{ required: true, message: 'Please select leave type' }]}
            required={false}
          >
            <Select
              className="w-full h-10 rounded-lg font-['Manrope:Medium',sans-serif]"
              placeholder="Select leave type"
            >
              {availableLeaveTypes.map((leaveType) => (
                <Option key={leaveType} value={leaveType}>
                  {leaveType}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]"><span className="text-red-500">*</span> Reason</span>}
            rules={[{ required: true, message: 'Please enter reason' }]}
            required={false}
          >
            <TextArea
              rows={4}
              className="rounded-lg font-['Manrope:Medium',sans-serif]"
              placeholder="Type or select a reason"
            />
          </Form.Item>

          <div className="flex items-center justify-end gap-4 pt-4 mt-6 border-t border-[#EEEEEE]">
            <Button
              type="text"
              onClick={handleCancelApplyLeave}
              className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={applyLeaveMutation.isPending}
              className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
            >
              Save
            </Button>
          </div>
        </Form>
      </Modal>
    </PageLayout>
  );
}
