import { Plus } from 'lucide-react';
import { Button } from "antd";

export function IntegrationsTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-6">
        <Plus className="w-8 h-8 text-[#999999]" />
      </div>
      <h2 className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">Integrations</h2>
      <p className="text-[14px] text-[#666666] max-w-md mb-8">
        Connect your favorite tools and services to streamline your workflow.
        Integrations are coming soon.
      </p>
      <Button
        disabled
        className="bg-[#111111] text-white font-['Manrope:SemiBold',sans-serif] px-8 h-11 rounded-full text-[13px] border-none opacity-50 cursor-not-allowed"
      >
        Add Integration
      </Button>
    </div>
  );
}
