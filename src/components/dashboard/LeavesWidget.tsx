import svgPaths from "../../constants/iconPaths";
import { Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Modal, Input, Button, Select, Spin, Form, DatePicker } from 'antd';
import Image from "next/image";
import dayjs from "dayjs";
import type { Dayjs } from 'dayjs';
import { useCompanyLeaves, useApplyForLeave } from "../../hooks/useLeave";
import { LeaveType } from "../../services/leave";

const { Option } = Select;
const { TextArea } = Input;

// Helper function to get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to format date range
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (start.isSame(end, "day")) {
    return start.format("MMM D, YYYY");
  }

  // Same month
  if (start.month() === end.month() && start.year() === end.year()) {
    return `${start.format("MMM D")} - ${end.format("D, YYYY")}`;
  }

  // Different months, same year
  if (start.year() === end.year()) {
    return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
  }

  // Different years
  return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
};

// Helper function to format duration
const formatDuration = (days: number): string => {
  if (days === 1) {
    return "1 Day";
  }
  return `${days} Days`;
};

interface ApplyLeaveFormValues {
  start_date: Dayjs;
  end_date: Dayjs;
  day_type: string;
  leave_type: string;
  reason: string;
}

export function LeavesWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [form] = Form.useForm<ApplyLeaveFormValues>();
  const { data, isLoading, error } = useCompanyLeaves();
  const applyLeaveMutation = useApplyForLeave();

  // Process and filter leaves
  const processedLeaves = useMemo(() => {
    if (!data?.result) return [];

    const today = dayjs().startOf("day");
    
    // Filter to show only approved or pending leaves that are upcoming or current
    const filtered = data.result
      .filter((leave: LeaveType) => {
        const endDate = dayjs(leave.end_date);
        // Show leaves that haven't ended yet
        return endDate.isAfter(today) || endDate.isSame(today, "day");
      })
      .sort((a: LeaveType, b: LeaveType) => {
        // Sort by start date, earliest first
        return dayjs(a.start_date).valueOf() - dayjs(b.start_date).valueOf();
      });

    return filtered.map((leave: LeaveType) => {
      // Handle days field - could be number, string, or Decimal
      const daysValue = typeof leave.days === 'number' 
        ? leave.days 
        : typeof leave.days === 'string' 
        ? parseFloat(leave.days) 
        : leave.days_count || 0;
      
      return {
        id: leave.id,
        name: leave.user?.name || "Unknown Employee",
        dateRange: formatDateRange(leave.start_date, leave.end_date),
        duration: formatDuration(Math.round(daysValue) || 1),
        avatar: leave.user?.avatar || null,
        initials: getInitials(leave.user?.name),
      };
    });
  }, [data]);

  // Get unique leave types for the form dropdown
  const availableLeaveTypes = useMemo(() => {
    if (!data?.result) return ['Sick Leave', 'Casual Leave', 'Vacation'];
    const types = new Set(data.result.map((leave: LeaveType) => leave.leave_type));
    return Array.from(types).filter(Boolean).length > 0 
      ? Array.from(types).filter(Boolean) as string[]
      : ['Sick Leave', 'Casual Leave', 'Vacation'];
  }, [data]);

  const DAY_TYPES = ['Full Day', 'First Half', 'Second Half'];

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
      setShowDialog(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setShowDialog(false);
  };

  return (
    <>
      <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Leaves</h3>
            <button onClick={() => setShowDialog(true)} className="hover:scale-110 active:scale-95 transition-transform">
              <Plus className="size-5 text-[#FF4500]" strokeWidth={2} />
            </button>
          </div>
          <button className="flex items-center gap-1 text-[#666666] text-[16px] font-['Manrope:Regular',sans-serif] hover:text-[#111111] transition-colors" onClick={() => onNavigate && onNavigate('leaves')}>
            <span>View All</span>
            <svg className="size-[14px]" fill="none" viewBox="0 0 17 17">
              <path d={svgPaths.p3ac7a560} stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Leaves List */}
        <div className="flex flex-col gap-3 flex-1 px-6 pb-5 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="small" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-red-500">
                Failed to load leaves
              </p>
            </div>
          ) : processedLeaves.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-dashed border-[#CCCCCC] py-4 flex items-center justify-center">
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#888888]">No more leaves</p>
            </div>
          ) : (
            <>
              {processedLeaves.map((leave) => (
                <LeaveItem key={leave.id} {...leave} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        title="Apply Leave"
        open={showDialog}
        onCancel={handleCancel}
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
            <Input
              className="rounded-lg h-10 font-['Manrope:Medium',sans-serif]"
              placeholder="Type or select a reason"
            />
          </Form.Item>

          <div className="flex items-center justify-end gap-4 pt-4 mt-6 border-t border-[#EEEEEE]">
            <Button
              type="text"
              onClick={handleCancel}
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
    </>
  );
}

function LeaveItem({ name, dateRange, duration, avatar, initials }: { name: string; dateRange: string; duration: string; avatar: string | null; initials: string }) {
  return (
    <div className="bg-white rounded-[10px] border border-gray-100 p-4 flex items-center gap-4 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer">
      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-[#F7F7F7] flex items-center justify-center">
        {avatar ? (
          <Image src={avatar} alt={name} width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">
            {initials}
          </span>
        )}
      </div>

      {/* Leave Details */}
      <div className="flex-1 min-w-0">
        <p className="font-['Manrope:Medium',sans-serif] text-[17px] text-[#333333] mb-1">{name}</p>
        <p className="font-['Manrope:Regular',sans-serif] text-[14px] text-[#888888]">{dateRange}</p>
      </div>

      {/* Duration Badge */}
      <div className="flex-shrink-0">
        <span className="inline-block px-3 py-1 rounded-full bg-[#EEEEEE] text-[14px] font-['Manrope:Regular',sans-serif] text-[#333333]">
          {duration}
        </span>
      </div>
    </div>
  );
}