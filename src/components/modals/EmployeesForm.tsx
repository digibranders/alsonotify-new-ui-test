import { useState, useEffect } from "react";
import { Button, Input, Select, DatePicker } from "antd";
import { ShieldCheck, Briefcase, User, Users, Calendar, Check } from "lucide-react";
import { User as UserIcon } from "lucide-react";
import dayjs from "dayjs";

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
  employmentType?: 'Full-time' | 'Contract' | 'Part-time';
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
  employmentType: undefined,
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

  // Helper function to get access level icon and color
  const getAccessLevelConfig = (access: string) => {
    switch (access) {
      case "Admin":
        return { icon: ShieldCheck, color: "#7F56D9", bgColor: "#F9F5FF" };
      case "Manager":
        return { icon: Briefcase, color: "#2E90FA", bgColor: "#EFF8FF" };
      case "Leader":
        return { icon: Users, color: "#7F56D9", bgColor: "#F9F5FF" };
      case "Employee":
      default:
        return { icon: User, color: "#12B76A", bgColor: "#ECFDF3" };
    }
  };

  const accessConfig = getAccessLevelConfig(formData.access);
  const AccessIcon = accessConfig.icon;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
            <div className="p-2 rounded-full bg-[#F7F7F7]">
              <UserIcon className="w-5 h-5 text-[#666666]" />
            </div>
            {isEditing ? 'Edit Employee Details' : 'Add Employee'}
          </div>
        </div>
        <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
          {isEditing ? 'Update employee profile, access, and HR details.' : 'Onboard a new employee to the organization.'}
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Section: Employee Details */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Full Name</span>
              <Input
                placeholder="Enter full name"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.name ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Designation</span>
              <Input
                placeholder="e.g. Senior Developer"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.role ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Email</span>
              <Input
                placeholder="email@company.com"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.email ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Employment Type</span>
              <Select
                className={`w-full h-11 employee-form-select ${formData.employmentType ? 'employee-form-select-filled' : ''}`}
                placeholder="Select type"
                value={formData.employmentType}
                onChange={(v) => setFormData({ ...formData, employmentType: v as 'Full-time' | 'Contract' | 'Part-time' })}
                suffixIcon={<div className="text-gray-400">⌄</div>}
              >
                <Option value="Full-time">Full-time</Option>
                <Option value="Contract">Contract</Option>
                <Option value="Part-time">Part-time</Option>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Experience (Years)</span>
              <Input
                type="number"
                placeholder="e.g. 5"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.experience ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Salary</span>
              <Select
                className={`w-full h-11 employee-form-select ${formData.currency ? 'employee-form-select-filled' : ''}`}
                placeholder="Monthly"
                value={formData.currency}
                onChange={(v) => setFormData({ ...formData, currency: String(v) })}
                suffixIcon={<div className="text-gray-400">⌄</div>}
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
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.leaves ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.leaves}
                onChange={(e) => setFormData({ ...formData, leaves: e.target.value })}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Access Level</span>
              <Select
                className={`w-full h-11 access-level-select employee-form-select ${formData.access ? 'employee-form-select-filled' : ''}`}
                placeholder="Select access"
                value={formData.access}
                onChange={(v) => setFormData({ ...formData, access: v as "Admin" | "Manager" | "Leader" | "Employee" })}
                suffixIcon={<div className="text-gray-400">⌄</div>}
                dropdownRender={(menu) => (
                  <div className="bg-white overflow-hidden access-level-dropdown">
                    {menu}
                  </div>
                )}
              >
                  <Option value="Employee">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: "#12B76A" }} />
                      <span style={{ color: "#12B76A" }}>Employee</span>
                    </div>
                  </Option>
                  <Option value="Admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" style={{ color: "#7F56D9" }} />
                      <span style={{ color: "#7F56D9" }}>Admin</span>
                    </div>
                  </Option>
                  <Option value="Manager">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" style={{ color: "#2E90FA" }} />
                      <span style={{ color: "#2E90FA" }}>Manager</span>
                    </div>
                  </Option>
                  <Option value="Leader">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" style={{ color: "#7F56D9" }} />
                      <span style={{ color: "#7F56D9" }}>Leader</span>
                    </div>
                  </Option>
                </Select>
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
                
                /* Access Level dropdown styling - remove extra background */
                .access-level-dropdown {
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                }
                .access-level-dropdown .ant-select-dropdown {
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                }
                .access-level-dropdown .ant-select-item {
                  background: white !important;
                  padding: 10px 16px !important;
                }
                .access-level-dropdown .ant-select-item:hover {
                  background: #F7F7F7 !important;
                }
                .access-level-dropdown .ant-select-item-option-selected {
                  background: white !important;
                }
                .access-level-dropdown .ant-select-item-option-active {
                  background: #F7F7F7 !important;
                }
                .access-level-dropdown .ant-select-item-option-selected .ant-select-item-option-content {
                  background: white !important;
                }
                .access-level-dropdown .ant-select-item-option-selected::after {
                  display: none !important;
                }
                .access-level-dropdown .ant-select-item-option-selected .anticon-check {
                  display: none !important;
                }
              `}</style>
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Department</span>
              <Select
                className={`w-full h-11 employee-form-select ${formData.department ? 'employee-form-select-filled' : ''}`}
                placeholder="Select department"
                value={formData.department || undefined}
                onChange={(v) => setFormData({ ...formData, department: String(v) })}
                suffixIcon={<div className="text-gray-400">⌄</div>}
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
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.phone ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Date of Joining</span>
              <DatePicker
                className={`w-full h-11 employee-form-datepicker ${formData.dateOfJoining ? 'employee-form-datepicker-filled' : ''}`}
                placeholder="dd/mm/yyyy"
                format="DD/MM/YYYY"
                value={formData.dateOfJoining ? dayjs(formData.dateOfJoining) : null}
                onChange={(date) => setFormData({ ...formData, dateOfJoining: date ? date.format('YYYY-MM-DD') : '' })}
                suffixIcon={<Calendar className="w-4 h-4 text-[#999999]" />}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Working Hours</span>
              <Input
                type="number"
                placeholder="e.g. 40"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.workingHours ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Hourly Cost</span>
              <Input
                placeholder="e.g. 25/Hr"
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.hourlyRate ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-6 flex items-center justify-end bg-white gap-4">
        <Button
          type="text"
          onClick={onCancel}
          className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
        >
          {isEditing ? "Update Profile" : "Create Employee"}
        </Button>
      </div>
    </div>
  );
}
