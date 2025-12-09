import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Briefcase, CalendarDays, Edit, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "../ui/checkbox";
import { AccessBadge } from "../AccessBadge";
import { Employee } from "../../lib/types";

interface EmployeeRowProps {
  employee: Employee;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export function EmployeeRow({
  employee,
  selected,
  onSelect,
  onEdit
}: EmployeeRowProps) {
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
      <div className="grid grid-cols-[40px_2.5fr_1.5fr_1fr_0.8fr_1fr_0.3fr] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
          />
        </div>

        {/* Employee Info - Name, Role & Dept */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/employees/${employee.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] hover:text-[#ff3b3b] transition-colors hover:underline"
            >
              {employee.name}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#666666]">
              {employee.role}
            </span>
            <span className="text-[#DDDDDD]">|</span>
            <div className="inline-flex items-center gap-1">
              <p className="text-[11px] text-[#666666] font-['Inter:Medium',sans-serif]">
                {employee.department}
              </p>
            </div>
          </div>
        </div>

        {/* Email - Moved to separate column */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">
              {employee.email}
            </span>
          </div>
        </div>

        {/* Access - Status Removed */}
        <div className="flex flex-col items-start gap-2">
          <AccessBadge role={employee.access} />
        </div>

        {/* Hourly Rate */}
        <div>
          <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
            {employee.hourlyRate}
          </span>
        </div>

        {/* Joining Date */}
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-[#999999]" />
            <span className="text-[13px] text-[#111111] font-['Inter:Medium',sans-serif]">
              {employee.dateOfJoining}
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
            <DropdownMenuContent align="end" className="w-[180px] p-1">
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
