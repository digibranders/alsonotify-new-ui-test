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

export interface TaskFormData {
  name: string;
  requirement: string;
  client: string;
  assignedTo: string;
  leader: string;
  startDate: string;
  dueDate: string;
  estTime: string;
  priority: "high" | "medium" | "low";
  description: string;
}

interface TaskFormProps {
  initialData?: TaskFormData;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultFormData: TaskFormData = {
  name: "",
  requirement: "",
  client: "",
  assignedTo: "",
  leader: "",
  startDate: "",
  dueDate: "",
  estTime: "",
  priority: "medium",
  description: "",
};

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);

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

  const handleReset = () => {
    setFormData(defaultFormData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="assignedTo"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              Assign to
            </Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(val) =>
                setFormData({ ...formData, assignedTo: val })
              }
            >
              <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Satyam Yadav">Satyam Yadav</SelectItem>
                <SelectItem value="Siddique Ahmed">Siddique Ahmed</SelectItem>
                <SelectItem value="Pranita Kadav">Pranita Kadav</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="requirement"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              Requirement
            </Label>
            <Select
              value={formData.requirement}
              onValueChange={(val) =>
                setFormData({ ...formData, requirement: val })
              }
            >
              <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                <SelectValue placeholder="Select requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website Redesign">Website Redesign</SelectItem>
                <SelectItem value="Mobile App">Mobile App</SelectItem>
                <SelectItem value="Marketing Campaign">
                  Marketing Campaign
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              Task Title
            </Label>
            <Input
              id="name"
              placeholder="Research payment flow"
              className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="priority"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(v: any) =>
                setFormData({ ...formData, priority: v })
              }
            >
              <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Dates */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="startDate"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="dueDate"
              className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
            >
              End Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
          >
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your task here!"
            className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Regular',sans-serif] resize-none p-3"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>

      <div className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]"
          >
            Reset Data
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]"
          >
            Save Task
          </Button>
        </div>
      </div>
    </div>
  );
}
