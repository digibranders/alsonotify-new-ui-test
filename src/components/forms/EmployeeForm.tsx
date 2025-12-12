import { useState, useEffect } from "react";
import { Button, Input, Select } from "antd";

const { TextArea } = Input;
const { Option } = Select;

export interface EmployeeFormData {
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  hourlyRate: string;
  dateOfJoining: string;
  experience: string;
  skillsets: string;
  access: "Admin" | "Manager" | "Leader" | "Employee";
  salary: string;
  currency: string;
  workingHours: string;
  leaves: string;
  role_id?: number;
}

interface EmployeeFormProps {
  initialData?: EmployeeFormData;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  departments?: string[];
  roles?: { id: number; name: string }[];
}

const defaultFormData: EmployeeFormData = {
  name: "",
  role: "",
  email: "",
  phone: "",
  department: "",
  hourlyRate: "",
  dateOfJoining: "",
  experience: "",
  skillsets: "",
  access: "Employee",
  salary: "",
  currency: "INR",
  workingHours: "",
  leaves: "",
  role_id: undefined,
};

export function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  departments = [],
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Section: Employee Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Full Name</span>
              <Input
                placeholder="Enter full name"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Designation</span>
              <Input
                placeholder="e.g. Senior Developer"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Email</span>
              <Input
                placeholder="email@company.com"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Date of Joining</span>
              <Input
                type="date"
                placeholder="dd/mm/yyyy"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Working Hours</span>
              <Input
                type="number"
                placeholder="e.g. 40"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Hourly Cost</span>
              <Input
                placeholder="e.g. 25/Hr"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Skills Set</span>
              <TextArea
                placeholder="e.g. React, Node.js, Project Management..."
                className="min-h-[80px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] resize-none"
                value={formData.skillsets}
                onChange={(e) => setFormData({ ...formData, skillsets: e.target.value })}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Access Level</span>
              <Select
                className="w-full h-11"
                placeholder="Select access"
                value={formData.access}
                onChange={(v) => setFormData({ ...formData, access: v as "Admin" | "Manager" | "Leader" | "Employee" })}
              >
                <Option value="Admin">Admin (Full Access)</Option>
                <Option value="Manager">Manager (Team Lead)</Option>
                <Option value="Leader">Leader (Project Lead)</Option>
                <Option value="Employee">Employee (Standard)</Option>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Department</span>
              <Select
                className="w-full h-11"
                placeholder="Select department"
                value={formData.department || undefined}
                onChange={(v) => setFormData({ ...formData, department: String(v) })}
              >
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))
                ) : (
                  <>
                    <Option value="Development">Development</Option>
                    <Option value="Design">Design</Option>
                    <Option value="Marketing">Marketing</Option>
                    <Option value="Operations">Operations</Option>
                    <Option value="Management">Management</Option>
                  </>
                )}
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Contact Number</span>
              <Input
                placeholder="+1 234 567 890"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Experience (Years)</span>
              <Input
                type="number"
                placeholder="e.g. 5"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Salary</span>
              <Select
                className="w-full h-11"
                placeholder="Monthly"
                value={formData.currency}
                onChange={(v) => setFormData({ ...formData, currency: String(v) })}
              >
                <Option value="Monthly">Monthly</Option>
                <Option value="Yearly">Yearly</Option>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Leaves Balance</span>
              <Input
                type="number"
                placeholder="Days"
                className="h-11 rounded-lg border border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif]"
                value={formData.leaves}
                onChange={(e) => setFormData({ ...formData, leaves: e.target.value })}
              />
            </div>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white gap-3">
        <Button
          type="text"
          onClick={onCancel}
          className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666]"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000] text-white font-['Manrope:SemiBold',sans-serif] border-none"
        >
          {isEditing ? "Update Profile" : "Create Employee"}
        </Button>
      </div>
    </div>
  );
}
