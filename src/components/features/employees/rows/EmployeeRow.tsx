
import { Badge, Dropdown, MenuProps, Checkbox } from "antd";
import { Briefcase, CalendarDays, Edit, MoreVertical, Trash2 } from "lucide-react";
import { AccessBadge } from '../../../ui/AccessBadge';
import { Employee } from "@/types/genericTypes";

interface EmployeeRowProps {
  employee: Employee;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDeactivate?: () => void;
  onViewDetails?: () => void;
}

export function EmployeeRow({
  employee,
  selected,
  onSelect,
  onEdit,
  onDeactivate,
  onViewDetails
}: EmployeeRowProps) {

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit Details',
      icon: <Edit className="w-3.5 h-3.5" />,
      onClick: onEdit,
      className: "text-[13px] font-['Manrope:Medium',sans-serif]"
    },
    ...(onDeactivate ? [{
      key: 'deactivate',
      label: employee.status === 'active' ? 'Deactivate' : 'Activate',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: onDeactivate,
      danger: true,
      className: "text-[13px] font-['Manrope:Medium',sans-serif]"
    }] : [])
  ];

  return (
    <div
      onClick={() => onViewDetails?.()}
      className={`
        group bg-white border rounded-[12px] px-4 py-4 transition-all duration-300 cursor-pointer relative z-10
        ${selected
          ? 'border-[#ff3b3b] shadow-md bg-[#FFF5F5]'
          : 'border-[#E5E7EB] hover:border-[#ff3b3b] hover:shadow-md'
        }
      `}
    >
      <div className="grid grid-cols-[40px_2fr_1.8fr_1.2fr_1fr_1fr_1.2fr_40px] gap-4 items-center">
        {/* Checkbox */}
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="red-checkbox"
          />
        </div>

        {/* Employee Info - Name, Role & Dept */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors">
              {employee.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">
              {employee.role}
            </span>
            <span className="text-[#DDDDDD]">|</span>
            <span className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">
              {employee.department}
            </span>
          </div>
        </div>

        {/* Email */}
        <div>
          <span className="text-[13px] text-[#111111] font-['Manrope:Regular',sans-serif]">
            {employee.email}
          </span>
        </div>

        {/* Access */}
        <div className="flex flex-col items-start">
          <AccessBadge role={employee.access} />
        </div>

        {/* Employment Type */}
        <div>
          <span className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#111111]">
            {employee.employmentType || 'Unknown'}
          </span>
        </div>

        {/* Hourly Rate */}
        <div>
          <span className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#111111]">
            {employee.hourlyRate}
          </span>
        </div>

        {/* Joining Date */}
        <div>
          <span className="text-[13px] text-[#111111] font-['Manrope:Regular',sans-serif]">
            {employee.dateOfJoining}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4 text-[#999999]" />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
