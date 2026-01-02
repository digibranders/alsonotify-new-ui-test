import { useState, useEffect } from "react";
import { Button, Input, Select, App } from "antd";
import { Briefcase } from "lucide-react";

const { Option } = Select;

export interface ClientFormData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  countryCode: string;
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
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  countryCode: "+91",
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
  const { message } = App.useApp();
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      const nameParts = ((initialData as any).name || "").split(" ");
      let phone = initialData.phone || "";
      let countryCode = initialData.countryCode || "+91";

      if (phone && phone.startsWith("+")) {
        // Try to match 
        const codes = ["+91", "+1", "+44", "+61", "+971"];
        const matched = codes.find(c => phone.startsWith(c));
        if (matched) {
          countryCode = matched;
          phone = phone.slice(matched.length).trim();
        }
      }

      setFormData({
        ...defaultFormData,
        ...initialData,
        firstName: initialData.firstName || nameParts[0] || "",
        lastName: initialData.lastName || nameParts.slice(1).join(" ") || "",
        phone,
        countryCode
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[17px] font-['Manrope:Bold',sans-serif] text-[#111111]">
            <div className="p-1.5 rounded-full bg-[#F7F7F7]">
              <Briefcase className="w-3.5 h-3.5 text-[#666666]" />
            </div>
            {isEditing ? 'Edit Client Details' : 'Invite Client'}
          </div>
        </div>
        <p className="text-[12px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-9">
          {isEditing ? 'Update client profile and contact information.' : 'An invitation link will be sent to this email for the client to complete their profile.'}
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!isEditing ? (
          // Simplified Add Flow: Only Email
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-[12px] font-bold text-[#111111] block"
              >
                Client Email Address
              </label>
              <Input
                placeholder="email@company.com"
                className="h-11 rounded-lg border border-[#EEEEEE]"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
        ) : (
          // Full Edit Flow
          <>
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#111111] block">
                    First Name <span className="text-[#ff3b3b]">*</span>
                  </label>
                  <Input
                    placeholder="John"
                    className="h-11 rounded-lg border border-[#EEEEEE]"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#111111] block">
                    Last Name
                  </label>
                  <Input
                    placeholder="Doe"
                    className="h-11 rounded-lg border border-[#EEEEEE]"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#111111] block"
                >
                  Business Name
                </label>
                <Select
                  value={formData.company}
                  onChange={(v) => setFormData({ ...formData, company: String(v) })}
                  className="w-full h-11"
                  placeholder="Select company"
                  suffixIcon={<div className="text-gray-400">⌄</div>}
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
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#111111] block"
                >
                  Email
                </label>
                <Input
                  placeholder="email@company.com"
                  className="h-11 rounded-lg border border-[#EEEEEE]"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#111111] block"
                >
                  Contact (Phone)
                </label>
                <div className="flex gap-2">
                  <Select
                    className="w-[85px] h-11"
                    value={formData.countryCode}
                    onChange={(v) => setFormData({ ...formData, countryCode: String(v) })}
                    suffixIcon={<div className="text-gray-400">⌄</div>}
                  >
                    <Option value="+91">+91 IN</Option>
                    <Option value="+1">+1 US</Option>
                    <Option value="+44">+44 UK</Option>
                    <Option value="+61">+61 AU</Option>
                    <Option value="+971">+971 AE</Option>
                  </Select>
                  <Input
                    placeholder="8698027152"
                    className="flex-1 h-11 rounded-lg border border-[#EEEEEE]"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#111111] block"
                >
                  Country
                </label>
                <Select
                  value={formData.country}
                  onChange={(v) => setFormData({ ...formData, country: String(v) })}
                  className="w-full h-11"
                  placeholder="Select country"
                  suffixIcon={<div className="text-gray-400">⌄</div>}
                >
                  <Option value="USA">USA</Option>
                  <Option value="India">India</Option>
                  <Option value="UK">UK</Option>
                  <Option value="UAE">UAE</Option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-[12px] font-bold text-[#111111] block"
                >
                  Onboarding Date
                </label>
                <Input
                  placeholder="DD-MMM-YYYY"
                  className="h-11 rounded-lg border border-[#EEEEEE]"
                  value={formData.onboarding}
                  onChange={(e) =>
                    setFormData({ ...formData, onboarding: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="space-y-1.5 mb-6">
              <label
                className="text-[12px] font-bold text-[#111111] block"
              >
                Requirements (Count)
              </label>
              <Input
                type="number"
                placeholder="Number of requirements"
                className="h-11 rounded-lg border border-[#EEEEEE]"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-4 flex items-center justify-end bg-white gap-4">
        <Button
          type="text"
          onClick={onCancel}
          className="h-[40px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          className="h-[40px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
        >
          {isEditing ? "Update Client" : "Send Invitation"}
        </Button>
      </div>
    </div>
  );
}
