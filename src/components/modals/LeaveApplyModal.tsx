import { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Button, Select, Form, DatePicker, App } from 'antd';
import { X } from 'lucide-react';
import dayjs from "dayjs";
import type { Dayjs } from 'dayjs';
import { useApplyForLeave } from "../../hooks/useLeave";

const { Option } = Select;

interface ApplyLeaveFormValues {
  start_date: Dayjs;
  end_date: Dayjs;
  day_type: string;
  leave_type: string;
  reason: string;
}

interface LeaveApplyModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  availableLeaveTypes: string[];
  initialDate?: dayjs.Dayjs | null;
}

export function LeaveApplyModal({
  open,
  onCancel,
  onSuccess,
  availableLeaveTypes = ['Sick Leave', 'Casual Leave', 'Vacation'],
  initialDate = null
}: LeaveApplyModalProps) {
  const [form] = Form.useForm<ApplyLeaveFormValues>();
  const applyLeaveMutation = useApplyForLeave();
  const { message } = App.useApp();

  const DAY_TYPES = ['Full Day', 'First Half', 'Second Half'];

  // Update form when initialDate changes
  useEffect(() => {
    if (open && initialDate) {
      form.setFieldsValue({
        start_date: initialDate,
        end_date: initialDate
      });
    }
  }, [open, initialDate, form]);

  const handleApplyLeave = async (values: ApplyLeaveFormValues) => {
    try {
      await applyLeaveMutation.mutateAsync({
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        day_type: values.day_type,
        leave_type: values.leave_type,
        reason: values.reason,
      });
      message.success("Leave applied successfully!");
      form.resetFields();
      if (onSuccess) onSuccess();
      onCancel();
    } catch (error) {
      // Error handled by mutation usually, but we can add a fallback
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Apply Leave"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      className="rounded-[16px] overflow-hidden"
      destroyOnHidden
      closeIcon={<X className="w-5 h-5 text-[#666666]" />}
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
            label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">Start Date</span>}
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker
              className="w-full h-10 rounded-lg font-['Manrope:Medium',sans-serif]"
              placeholder="Select date"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="end_date"
            label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">End Date</span>}
            rules={[{ required: true, message: 'Please select end date' }]}
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
          label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">Day Type</span>}
          rules={[{ required: true, message: 'Please select day type' }]}
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
          label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">Leave Type</span>}
          rules={[{ required: true, message: 'Please select leave type' }]}
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
          label={<span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666]">Reason</span>}
          rules={[{ required: true, message: 'Please enter reason' }]}
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
  );
}
