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
      // Calculate remaining days from today to end date
      const endDate = dayjs(leave.end_date).startOf("day");
      const today = dayjs().startOf("day");
      
      // Calculate remaining days: from today (inclusive) to end date (inclusive)
      // dayjs diff returns the difference, so we add 1 to include both today and end date
      const remainingDays = Math.max(1, endDate.diff(today, "day") + 1);
      
      return {
        id: leave.id,
        name: leave.user?.name || "Unknown Employee",
        dateRange: formatDateRange(leave.start_date, leave.end_date),
        duration: formatDuration(remainingDays),
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
      <div className="bg-white rounded-[24px] p-5 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Leaves</h3>
            <button onClick={() => setShowDialog(true)} className="hover:scale-110 active:scale-95 transition-transform">
              <Plus className="size-5 text-[#FF4500]" strokeWidth={2} />
            </button>
          </div>
          <button className="flex items-center gap-1 text-[#666666] text-[14px] font-['Manrope:SemiBold',sans-serif] hover:text-[#111111] transition-colors" onClick={() => onNavigate && onNavigate('leaves')}>
            <span>View All</span>
            <svg className="size-[17px]" fill="none" viewBox="0 0 17 17">
              <path d={svgPaths.p3ac7a560} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Leaves List */}
        <div className="flex flex-col gap-2.5 flex-1 mt-2 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="small" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                Unable to load leaves at the moment. Please try again later.
              </p>
            </div>
          ) : processedLeaves.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-dashed border-[#CCCCCC] py-4 flex items-center justify-center">
              <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">No leaves to display at the moment</p>
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
        destroyOnHidden
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
    <div className="group p-3 rounded-xl border border-[#EEEEEE] hover:border-[#ff3b3b]/20 transition-all duration-300 hover:shadow-lg cursor-pointer">
      <div className="flex items-center gap-2.5">
        {/* Avatar - Match meeting date badge size */}
        <div className="flex-shrink-0">
          <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-[#F7F7F7] flex items-center justify-center">
            {avatar ? (
              <Image src={avatar} alt={name} width={48} height={48} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Leave Details + Duration */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Name + Date stacked on the left */}
            <div className="flex flex-col min-w-0">
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] line-clamp-1">
                {name}
              </h4>
              <span className="text-[#666666] text-[11px] font-['Manrope:Regular',sans-serif] mt-0.5">
                {dateRange}
              </span>
            </div>

            {/* Duration Badge vertically centered on the right */}
            <div className="flex-shrink-0 self-center">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#EEEEEE] text-[11px] font-['Manrope:Regular',sans-serif] text-[#333333]">
                {duration}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}