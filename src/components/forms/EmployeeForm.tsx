import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

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
}

interface EmployeeFormProps {
  initialData?: EmployeeFormData;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
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
};

export function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
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
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
        {/* Section: Employee Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="access"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Access Level
              </Label>
              <Select
                value={formData.access}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    access: v as "Admin" | "Manager" | "Leader" | "Employee",
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                  <SelectValue placeholder="Select access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="Manager">Manager (Team Lead)</SelectItem>
                  <SelectItem value="Leader">Leader (Project Lead)</SelectItem>
                  <SelectItem value="Employee">Employee (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Designation
              </Label>
              <Input
                id="role"
                placeholder="e.g. Senior Developer"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="department"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Department
              </Label>
              <Select
                value={formData.department}
                onValueChange={(v) =>
                  setFormData({ ...formData, department: v })
                }
              >
                <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Email
              </Label>
              <Input
                id="email"
                placeholder="email@company.com"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Contact Number
              </Label>
              <Input
                id="phone"
                placeholder="+1 234 567 890"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="doj"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Date of Joining
              </Label>
              <Input
                id="doj"
                type="date"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.dateOfJoining}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfJoining: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="experience"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Experience (Years)
              </Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g. 5"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="workingHours"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Working Hours
              </Label>
              <Input
                id="workingHours"
                type="number"
                placeholder="e.g. 40"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.workingHours}
                onChange={(e) =>
                  setFormData({ ...formData, workingHours: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="salary"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Salary
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="Monthly"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="hourlyRate"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Hourly Cost
              </Label>
              <Input
                id="hourlyRate"
                placeholder="e.g. 25/Hr"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.hourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyRate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="leaves"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Leaves Balance
              </Label>
              <Input
                id="leaves"
                type="number"
                placeholder="Days"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.leaves}
                onChange={(e) =>
                  setFormData({ ...formData, leaves: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="skillsets"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              Skills Set
            </Label>
            <Textarea
              id="skillsets"
              placeholder="e.g. React, Node.js, Project Management..."
              className="min-h-[80px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] resize-none"
              value={formData.skillsets}
              onChange={(e) =>
                setFormData({ ...formData, skillsets: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]"
          >
            {isEditing ? "Update Profile" : "Create Employee"}
          </Button>
        </div>
      </div>
    </div>
  );
}
