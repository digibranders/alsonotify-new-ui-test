import { useState, useEffect } from "react";
import { Button, Input, Select, App } from "antd";
import { Briefcase } from "lucide-react";

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
  const { message } = App.useApp();
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
    <div className="flex flex-col h-full bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
            <div className="p-2 rounded-full bg-[#F7F7F7]">
              <Briefcase className="w-5 h-5 text-[#666666]" />
            </div>
            {isEditing ? 'Edit Client Details' : 'Invite Client'}
          </div>
        </div>
        <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
          {isEditing ? 'Update client profile and contact information.' : 'An invitation link will be sent to this email for the client to complete their profile.'}
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
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
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.email ? 'bg-white' : 'bg-[#F9FAFB]'}`}
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
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Contact Person
                </label>
                <Input
                  placeholder="Enter contact person name"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.name ? 'bg-white' : 'bg-[#F9FAFB]'}`}
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
                  className={`w-full h-11 employee-form-select ${formData.company ? 'employee-form-select-filled' : ''}`}
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
              <div className="space-y-2">
                <label
                  className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] block mb-2"
                >
                  Email
                </label>
                <Input
                  placeholder="email@company.com"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.email ? 'bg-white' : 'bg-[#F9FAFB]'}`}
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
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.phone ? 'bg-white' : 'bg-[#F9FAFB]'}`}
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
                  className={`w-full h-11 employee-form-select ${formData.country ? 'employee-form-select-filled' : ''}`}
                  placeholder="Select country"
                  suffixIcon={<div className="text-gray-400">⌄</div>}
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
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.onboarding ? 'bg-white' : 'bg-[#F9FAFB]'}`}
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
                className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${formData.requirements ? 'bg-white' : 'bg-[#F9FAFB]'}`}
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
          {isEditing ? "Update Client" : "Send Invitation"}
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
        
        /* Remove extra borders on Input focus */
        .ant-input:focus {
          border-color: #EEEEEE !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
