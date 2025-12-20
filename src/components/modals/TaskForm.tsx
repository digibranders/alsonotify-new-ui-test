import { useState, useEffect } from "react";
import { Button, Input, Select, Checkbox, DatePicker, App, Modal } from 'antd';
import { CheckSquare, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

// Backend fields based on TaskCreateSchema
export interface TaskFormData {
  name: string;
  project_id: string; // Workspace
  requirement_id: string; // Requirement
  member_id: string; // Assign to / Member
  leader_id: string; // Leader
  start_date: string; // Start Date
  estimated_time: string; // Estimated Time (in hours)
  high_priority: boolean; // High Priority checkbox
  description: string; // Description
}

interface TaskFormProps {
  initialData?: TaskFormData;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
  users?: Array<{ id: number; name: string }>;
  requirements?: Array<{ id: number; name: string }>;
  workspaces?: Array<{ id: number; name: string }>;
}

const defaultFormData: TaskFormData = {
  name: "",
  project_id: "",
  requirement_id: "",
  member_id: "",
  leader_id: "",
  start_date: "",
  estimated_time: "",
  high_priority: false,
  description: "",
};

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  users = [],
  requirements = [],
  workspaces = [],
}: TaskFormProps) {
  const { message } = App.useApp();
  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleSubmit = () => {
    // Validate required fields
    const missingFields: string[] = [];
    if (!formData.name) missingFields.push('Task Title');
    if (!formData.project_id) missingFields.push('Workspace');
    if (!formData.start_date) missingFields.push('Start Date');
    if (!formData.estimated_time || parseFloat(formData.estimated_time) <= 0) missingFields.push('Estimated Time');

    if (missingFields.length > 0) {
      message.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    let formattedStartDate = '';
    if (formData.start_date) {
      formattedStartDate = formData.start_date; // Assumed ISO string from state
    } else {
      message.error("Start Date is required");
      return;
    }

    // Transform form data to backend format
    const backendData = {
      name: formData.name,
      project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
      requirement_id: formData.requirement_id ? parseInt(formData.requirement_id) : null,
      member_id: formData.member_id ? parseInt(formData.member_id) : null,
      leader_id: formData.leader_id ? parseInt(formData.leader_id) : null,
      start_date: formattedStartDate,
      estimated_time: formData.estimated_time ? parseFloat(formData.estimated_time) : 0,
      high_priority: formData.high_priority || false,
      description: formData.description || "",
    };

    onSubmit(backendData);
  };

  const handleReset = () => {
    setFormData(defaultFormData);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
            <div className="p-2 rounded-full bg-[#F7F7F7]">
              <CheckSquare className="w-5 h-5 text-[#666666]" />
            </div>
            {isEditing ? 'Edit Task' : 'Assign Task'}
          </div>
        </div>
        <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
          {isEditing ? 'Update task details and assignments.' : 'Assign task for people join to team'}
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Workspace (project_id) - Required */}
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Workspace <span className="text-red-500">*</span>
              </span>
              <Select
                className={`w-full h-11 employee-form-select ${formData.project_id ? 'employee-form-select-filled' : ''}`}
                placeholder="Select workspace"
                value={formData.project_id || undefined}
                onChange={(val) => {
                  setFormData({ ...formData, project_id: String(val) });
                }}
                suffixIcon={<div className="text-gray-400">⌄</div>}
              >
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => (
                    <Option key={workspace.id} value={workspace.id.toString()}>
                      {workspace.name}
                    </Option>
                  ))
                ) : (
                  <Option value="none" disabled>No workspaces available</Option>
                )}
              </Select>
            </div>

            {/* Task Title (name) - Required */}
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Task Title <span className="text-red-500">*</span>
              </span>
              <Input
                placeholder="Research payment flow"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                }}
              />
            </div>

            {/* Start Date (start_date) - Required */}
            <div className="space-y-2 flex flex-col">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Start Date <span className="text-red-500">*</span>
              </span>
              <DatePicker
                className={`w-full h-11 employee-form-datepicker ${formData.start_date ? 'employee-form-datepicker-filled' : ''}`}
                value={formData.start_date ? dayjs(formData.start_date) : null}
                onChange={(date) => {
                  setFormData({ ...formData, start_date: date ? date.toISOString() : '' });
                }}
                suffixIcon={<Calendar className="w-4 h-4 text-[#999999]" />}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Requirement (requirement_id) - Optional */}
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Requirement
              </span>
              <Select
                className={`w-full h-11 employee-form-select ${formData.requirement_id ? 'employee-form-select-filled' : ''}`}
                placeholder="Select requirement"
                value={formData.requirement_id || undefined}
                onChange={(val) => {
                  setFormData({ ...formData, requirement_id: String(val) });
                }}
                suffixIcon={<div className="text-gray-400">⌄</div>}
              >
                {requirements.length > 0 ? (
                  requirements.map((req) => (
                    <Option key={req.id} value={req.id.toString()}>
                      {req.name}
                    </Option>
                  ))
                ) : (
                  <Option value="none" disabled>No requirements available</Option>
                )}
              </Select>
            </div>

            {/* High Priority (high_priority) - Checkbox */}
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Priority
              </span>
              <div className="flex items-center space-x-2 h-11">
                <Checkbox
                  checked={formData.high_priority}
                  onChange={(e) => {
                    setFormData({ ...formData, high_priority: e.target.checked });
                  }}
                >
                  <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                    High Priority
                  </span>
                </Checkbox>
              </div>
            </div>

            {/* Estimated Time (estimated_time) - Required */}
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Estimated Time (hours) <span className="text-red-500">*</span>
              </span>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.estimated_time ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.estimated_time}
                onChange={(e) => {
                  setFormData({ ...formData, estimated_time: e.target.value });
                }}
              />
            </div>
          </div>
        </div>

        {/* Leader and Member - Two columns below */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Leader</span>
            <Select
              className={`w-full h-11 employee-form-select ${formData.leader_id ? 'employee-form-select-filled' : ''}`}
              placeholder="Select leader"
              value={formData.leader_id || undefined}
              onChange={(val) => {
                setFormData({ ...formData, leader_id: String(val) });
              }}
              suffixIcon={<div className="text-gray-400">⌄</div>}
            >
              {users.length > 0 ? (
                users.map((user) => (
                  <Option key={user.id} value={user.id.toString()}>
                    {user.name}
                  </Option>
                ))
              ) : (
                <Option value="none" disabled>No users available</Option>
              )}
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Member</span>
            <Select
              className={`w-full h-11 employee-form-select ${formData.member_id ? 'employee-form-select-filled' : ''}`}
              placeholder="Select member"
              value={formData.member_id || undefined}
              onChange={(val) => {
                setFormData({ ...formData, member_id: String(val) });
              }}
              suffixIcon={<div className="text-gray-400">⌄</div>}
            >
              {users.length > 0 ? (
                users.map((user) => (
                  <Option key={user.id} value={user.id.toString()}>
                    {user.name}
                  </Option>
                ))
              ) : (
                <Option value="none" disabled>No users available</Option>
              )}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
          <TextArea
            placeholder="Describe your task here!"
            className={`font-['Manrope:Regular',sans-serif] rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${formData.description ? 'bg-white' : 'bg-[#F9FAFB]'}`}
            rows={4}
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
            }}
          />
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-6 flex items-center justify-end bg-white gap-4">
        <Button
          type="text"
          onClick={handleReset}
          className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
        >
          Reset Data
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
        >
          Save Task
        </Button>
      </div>
      <style jsx global>{`
        /* Gray background for all Select dropdowns (default) */
        .employee-form-select .ant-select-selector {
          background-color: #F9FAFB !important;
          border-color: #EEEEEE !important;
        }
        .employee-form-select .ant-select-selector:hover {
          border-color: #EEEEEE !important;
        }
        .employee-form-select.ant-select-focused .ant-select-selector {
          border-color: #EEEEEE !important;
          box-shadow: none !important;
        }
        
        /* White background for filled Select dropdowns */
        .employee-form-select-filled .ant-select-selector {
          background-color: white !important;
        }
        
        /* Gray background for DatePicker (default) */
        .employee-form-datepicker .ant-picker {
          background-color: #F9FAFB !important;
          border-color: #EEEEEE !important;
        }
        .employee-form-datepicker .ant-picker:hover {
          border-color: #EEEEEE !important;
        }
        .employee-form-datepicker .ant-picker-focused {
          border-color: #EEEEEE !important;
          box-shadow: none !important;
        }
        
        /* White background for filled DatePicker */
        .employee-form-datepicker-filled .ant-picker {
          background-color: white !important;
        }
        
        /* Remove extra borders on Input focus */
        .ant-input:focus {
          border-color: #EEEEEE !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
