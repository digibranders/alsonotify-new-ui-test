import { Checkbox } from "../ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Building, Calendar, Edit, Globe, Mail, MoreVertical, Phone, Trash2 } from "lucide-react";
import Link from "next/link";

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
  return (
    <div
      onClick={onSelect}
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
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
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
            <Link
              href={`/clients/${client.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-['Manrope:Bold',sans-serif] text-[13px] text-[#111111] hover:text-[#ff3b3b] transition-colors hover:underline"
            >
              {client.name}
            </Link>
          </div>
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] truncate">
              {client.email}
            </span>
          </div>
        </div>

        {/* Contact (Phone) */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">
              {client.phone}
            </span>
          </div>
        </div>

        {/* Onboarding */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">
              {client.onboarding}
            </span>
          </div>
        </div>

        {/* Country */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">
              {client.country}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors">
                <MoreVertical className="w-4 h-4 text-[#666666]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px] p-1">
              <DropdownMenuItem onClick={onEdit} className="text-[13px] font-['Inter:Medium',sans-serif]">
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px] font-['Inter:Medium',sans-serif] text-[#ff3b3b] focus:text-[#ff3b3b] focus:bg-[#FFF5F5]">
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
