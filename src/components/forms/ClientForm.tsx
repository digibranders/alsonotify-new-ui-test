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

export interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  requirements: string;
  onboarding: string;
}

interface ClientFormProps {
  initialData?: ClientFormData;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultFormData: ClientFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  requirements: "0",
  onboarding: new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-"),
};

export function ClientForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);

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
        {!isEditing ? (
          // Simplified Add Flow: Only Email
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Client Email Address
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
              <p className="text-[12px] text-[#666666] mt-2">
                An invitation link will be sent to this email for the client to complete their profile.
              </p>
            </div>
          </div>
        ) : (
          // Full Edit Flow
          <>
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
                >
                  Contact Person
                </Label>
                <Input
                  id="name"
                  placeholder="Enter contact person name"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="company"
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
                >
                  Business Name
                </Label>
                <Select
                  value={formData.company}
                  onValueChange={(v) => setFormData({ ...formData, company: v })}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Triem Security">Triem Security</SelectItem>
                    <SelectItem value="Eventus Security">
                      Eventus Security
                    </SelectItem>
                    <SelectItem value="TechCorp Inc.">TechCorp Inc.</SelectItem>
                    <SelectItem value="Digibranders">Digibranders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
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
                  Contact (Phone)
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

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
                >
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(v) => setFormData({ ...formData, country: v })}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="onboarding"
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
                >
                  Onboarding Date
                </Label>
                <Input
                  id="onboarding"
                  placeholder="DD-MMM-YYYY"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={formData.onboarding}
                  onChange={(e) =>
                    setFormData({ ...formData, onboarding: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="space-y-2">
              <Label
                htmlFor="requirements"
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]"
              >
                Requirements (Count)
              </Label>
              <Input
                id="requirements"
                type="number"
                placeholder="Number of requirements"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
              />
            </div>
          </>
        )}
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
            {isEditing ? "Update Client" : "Send Invitation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
