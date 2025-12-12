import { useState, useEffect } from "react";
import { Button, Input, Select, message } from "antd";

const { Option } = Select;

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
      <div className="p-6 flex-1 overflow-y-auto">
        {!isEditing ? (
          // Simplified Add Flow: Only Email
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
              >
                Client Email Address
              </label>
              <Input
                placeholder="email@company.com"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif]"
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
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Contact Person
                </label>
                <Input
                  placeholder="Enter contact person name"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif]"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Business Name
                </label>
                <Select
                  value={formData.company}
                  onChange={(v) => setFormData({ ...formData, company: String(v) })}
                  className="w-full h-11"
                  placeholder="Select company"
                >
                  <Option value="Triem Security">Triem Security</Option>
                  <Option value="Eventus Security">Eventus Security</Option>
                  <Option value="TechCorp Inc.">TechCorp Inc.</Option>
                  <Option value="Digibranders">Digibranders</Option>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Email
                </label>
                <Input
                  placeholder="email@company.com"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif]"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Contact (Phone)
                </label>
                <Input
                  placeholder="+1 234 567 890"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif]"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Country
                </label>
                <Select
                  value={formData.country}
                  onChange={(v) => setFormData({ ...formData, country: String(v) })}
                  className="w-full h-11"
                  placeholder="Select country"
                >
                  <Option value="USA">USA</Option>
                  <Option value="India">India</Option>
                  <Option value="UK">UK</Option>
                  <Option value="UAE">UAE</Option>
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Onboarding Date
                </label>
                <Input
                  placeholder="DD-MMM-YYYY"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif]"
                  value={formData.onboarding}
                  onChange={(e) =>
                    setFormData({ ...formData, onboarding: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="space-y-2 mb-6">
              <label
                className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
              >
                Requirements (Count)
              </label>
              <Input
                type="number"
                placeholder="Number of requirements"
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif]"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
              />
            </div>
          </>
        )}
      </div>

      <div className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white gap-3">
        <Button
          type="text"
          onClick={onCancel}
          className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-transparent hover:text-[#111111]"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000] text-white font-['Manrope:SemiBold',sans-serif] border-none"
        >
          {isEditing ? "Update Client" : "Send Invitation"}
        </Button>
      </div>
    </div>
  );
}
