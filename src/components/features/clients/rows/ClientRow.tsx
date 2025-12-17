import { Checkbox, Dropdown, MenuProps } from "antd";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { MouseEvent } from "react";
import { useRouter } from "next/navigation";

export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  status: 'active' | 'inactive';
  requirements: number;
  onboarding: string;
}

interface ClientRowProps {
  client: Client;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export function ClientRow({
  client,
  selected,
  onSelect,
  onEdit
}: ClientRowProps) {
  const router = useRouter();

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: <span className="text-[13px] font-['Manrope:Medium',sans-serif]">Edit Details</span>,
      icon: <Edit className="w-3.5 h-3.5" />,
      onClick: (e) => { e.domEvent.stopPropagation(); onEdit(); }
    },
    {
      key: 'delete',
      label: <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#ff3b3b]">Deactivate</span>,
      icon: <Trash2 className="w-3.5 h-3.5 text-[#ff3b3b]" />,
      danger: true,
      onClick: (e) => { e.domEvent.stopPropagation(); }
    },
  ];

  return (
    <div
      onClick={() => router.push(`/clients/${client.id}`)}
      className={`
        group bg-white border rounded-[16px] p-4 transition-all duration-300 cursor-pointer relative z-10
        ${selected
          ? 'border-[#ff3b3b] shadow-[0_0_0_1px_#ff3b3b] bg-[#FFF5F5]'
          : 'border-[#EEEEEE] hover:border-[#ff3b3b]/20 hover:shadow-lg'
        }
      `}
    >
      <div className="grid grid-cols-[40px_1.5fr_1.2fr_1.5fr_1fr_1fr_0.8fr_0.3fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e: MouseEvent) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={onSelect}
            className="red-checkbox"
          />
        </div>

        {/* Business Name */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Manrope:Bold',sans-serif]">
              {client.company}
            </span>
          </div>
        </div>

        {/* Contact Person */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Manrope:Bold',sans-serif] text-[13px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors">
              {client.name}
            </span>
          </div>
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] truncate">
              {client.email}
            </span>
          </div>
        </div>

        {/* Contact (Phone) */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif]">
              {client.phone}
            </span>
          </div>
        </div>

        {/* Onboarding */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif]">
              {client.onboarding}
            </span>
          </div>
        </div>

        {/* Country */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Manrope:Medium',sans-serif]">
              {client.country}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end" onClick={(e: MouseEvent) => e.stopPropagation()}>
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors">
              <MoreVertical className="w-4 h-4 text-[#666666]" />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
