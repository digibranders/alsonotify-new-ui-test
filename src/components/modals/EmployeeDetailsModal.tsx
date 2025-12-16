import { Modal, Button } from 'antd';
import { Briefcase, Mail, Phone, Calendar, DollarSign, Clock, CalendarDays, X } from 'lucide-react';
import { AccessBadge } from '../ui/AccessBadge';
import { Employee } from '@/types/genericTypes';

interface EmployeeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit: () => void;
}

export function EmployeeDetailsModal({
  open,
  onClose,
  employee,
  onEdit,
}: EmployeeDetailsModalProps) {
  if (!employee) return null;

  // Format date of joining
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      // Handle formats like "01-Jan-2024" or "30-Jun-2025"
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return dateString; // Already in correct format
      }
      // Try parsing as ISO string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return dateString;
  };

  // Parse skillsets
  const skills = employee.skillsets && employee.skillsets !== 'None' 
    ? employee.skillsets.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];

  // Format hourly rate
  const hourlyRate = employee.hourlyRate && employee.hourlyRate !== 'N/A' 
    ? employee.hourlyRate 
    : 'N/A';

  // Format experience
  const experience = employee.experience ? `${employee.experience} Years` : 'N/A';

  // Format working hours
  const workingHours = employee.workingHours ? `${employee.workingHours}h / week` : 'N/A';

  // Format leaves
  const leavesTaken = employee.leaves ? `${employee.leaves} Days` : '0 Days';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="rounded-[16px] overflow-hidden"
      closeIcon={<X className="w-5 h-5 text-[#666666]" />}
      bodyStyle={{
        padding: 0,
      }}
    >
      <div className="bg-white">
        {/* Top Section - Employee Identity */}
        <div className="px-6 pt-6 pb-4 border-b border-[#EEEEEE]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-[24px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">
                {employee.name}
              </h2>
              <div className="flex items-center gap-2 text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                <Briefcase className="w-4 h-4" />
                <span>{employee.role}</span>
                <span className="text-[#DDDDDD]">•</span>
                <span>{employee.department}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AccessBadge role={employee.access} />
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] ${
                  employee.status === 'active'
                    ? 'bg-[#ECFDF3] text-[#12B76A]'
                    : 'bg-[#FEF3F2] text-[#F04438]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {employee.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section - Contact & Employment Details */}
        <div className="px-6 py-6 border-b border-[#EEEEEE]">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Contact Information */}
            <div>
              <h3 className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider mb-4">
                Contact Information
              </h3>
              <div className="space-y-5">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#666666] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                      Email Address
                    </p>
                    <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111]">
                      {employee.email || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#666666] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                      Phone Number
                    </p>
                    <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111]">
                      {employee.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Employment Details */}
            <div>
              <h3 className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider mb-4">
                Employment Details
              </h3>
              <div className="space-y-5">
                {/* Date of Joining */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#666666] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                      Date of Joining
                    </p>
                    <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111]">
                      {formatDate(employee.dateOfJoining)}
                    </p>
                  </div>
                </div>

                {/* Hourly Rate */}
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-[#666666] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                      Hourly Rate
                    </p>
                    <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111]">
                      {hourlyRate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Cards */}
        <div className="px-6 py-6 border-b border-[#EEEEEE]">
          <div className="grid grid-cols-3 gap-4">
            {/* Experience */}
            <div className="bg-[#F9FAFB] rounded-lg px-4 py-4">
              <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                Experience
              </p>
              <p className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                {experience}
              </p>
            </div>

            {/* Working Hours */}
            <div className="bg-[#F9FAFB] rounded-lg px-4 py-4">
              <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                Working Hours
              </p>
              <p className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                {workingHours}
              </p>
            </div>

            {/* Leaves Taken */}
            <div className="bg-[#F9FAFB] rounded-lg px-4 py-4">
              <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#6B7280] mb-1">
                Leaves Taken
              </p>
              <p className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                {leavesTaken}
              </p>
            </div>
          </div>
        </div>

        {/* Skillsets Section */}
        {skills.length > 0 && (
          <div className="px-6 py-6 border-b border-[#EEEEEE]">
            <h3 className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider mb-4">
              Skillsets
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-[#F9FAFB] text-[#111111] text-[12px] font-['Manrope:Medium',sans-serif] rounded-lg border border-[#EEEEEE]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Section - Action Buttons */}
        <div className="px-6 py-6 flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] border border-[#EEEEEE] hover:bg-[#F9FAFB]"
          >
            Close
          </Button>
          <Button
            type="primary"
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000] text-white font-['Manrope:SemiBold',sans-serif] border-none"
          >
            Edit Details
          </Button>
        </div>
      </div>
    </Modal>
  );
}
