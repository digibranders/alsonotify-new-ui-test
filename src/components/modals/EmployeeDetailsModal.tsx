import { useState, useMemo } from 'react';
import { Modal, Button, App } from 'antd';
import { Briefcase, Mail, Phone, Calendar, DollarSign, Clock, CalendarDays, X, FileText } from 'lucide-react';
import { AccessBadge } from '../ui/AccessBadge';
import { Employee, UserDocument } from '@/types/genericTypes';
import { DocumentCard } from '@/components/ui/DocumentCard';
import { DocumentPreviewModal } from '@/components/ui/DocumentPreviewModal';

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
  const { message } = App.useApp();
  // Documents state
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Mock documents data - TODO: Replace with actual API call when available
  const documents = useMemo(() => {
    // Check if employee data has documents
    const employeeDocs = (employee as any)?.documents || [];
    if (Array.isArray(employeeDocs) && employeeDocs.length > 0) {
      return employeeDocs;
    }
    // Mock documents from docs folder - all 4 types
    const mockDocuments: UserDocument[] = [
      {
        id: '1',
        documentTypeId: '1',
        documentTypeName: 'Resume',
        fileName: 'Resume_Updated.pdf',
        fileSize: 2400000, // 2.4 MB
        fileUrl: '/documents/Jayendra_Jadhav_Resume.pdf',
        uploadedDate: '2024-10-24T00:00:00Z',
        fileType: 'pdf',
        isRequired: true,
      },
      {
        id: '2',
        documentTypeId: '2',
        documentTypeName: 'ID Proof',
        fileName: 'Identity_Proof.jpeg',
        fileSize: 1000000, // 1 MB
        fileUrl: '/documents/profile.jpeg',
        uploadedDate: '2024-01-15T00:00:00Z',
        fileType: 'image',
        isRequired: true,
      },
      {
        id: '3',
        documentTypeId: '3',
        documentTypeName: 'Contract',
        fileName: 'Employment_Contract.docx',
        fileSize: 206000, // 206 KB
        fileUrl: '/documents/AI Agent Documentation.docx',
        uploadedDate: '2024-01-20T00:00:00Z',
        fileType: 'docx',
        isRequired: true,
      },
      {
        id: '4',
        documentTypeId: '4',
        documentTypeName: 'Supporting Docs',
        fileName: 'ollama_data.csv',
        fileSize: 50000, // 50 KB
        fileUrl: '/documents/ollama_filtered_json_support.csv',
        uploadedDate: '2024-12-17T00:00:00Z',
        fileType: 'csv',
        isRequired: false,
      },
    ];
    return mockDocuments;
  }, [employee]);

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
      // Error formatting date
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
  const workingHours = (() => {
    if (employee.rawWorkingHours?.start_time && employee.rawWorkingHours?.end_time) {
      return `${employee.rawWorkingHours.start_time} - ${employee.rawWorkingHours.end_time}`;
    }
    return employee.workingHours ? `${employee.workingHours}h / week` : 'N/A';
  })();

  // Format leaves
  const leavesTaken = employee.leaves ? `${employee.leaves} Days` : '0 Days';

  const handleDocumentPreview = (document: UserDocument) => {
    setSelectedDocument(document);
    setIsPreviewModalOpen(true);
  };

  const handleDocumentDownload = (document: UserDocument) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    } else {
      message.warning('Document URL not available');
    }
  };

  const handleDocumentUpload = (documentTypeId: string) => {
    message.info(`Upload functionality for document type ${documentTypeId} - To be implemented`);
    // TODO: Implement upload functionality
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="rounded-[16px] overflow-hidden"
      closeIcon={<X className="w-5 h-5 text-[#666666]" />}
      styles={{
        body: {
          padding: 0,
        }
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
              <AccessBadge role={employee.access} color={employee.roleColor} />
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] ${employee.status === 'active'
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

        {/* Documents Section */}
        <div className="px-6 py-6 border-b border-[#EEEEEE]">
          <h3 className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider mb-4">
            Attached Documents
          </h3>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {documents.map((doc: UserDocument) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onPreview={handleDocumentPreview}
                  onDownload={handleDocumentDownload}
                  showUpload={!doc.fileUrl}
                  onUpload={handleDocumentUpload}
                />
              ))}
            </div>
          ) : (
            <div className="border border-[#EEEEEE] border-dashed rounded-lg p-6 bg-[#FAFAFA] text-center">
              <FileText className="w-10 h-10 text-[#CCCCCC] mx-auto mb-2" />
              <p className="text-[12px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-1">
                No documents uploaded
              </p>
              <p className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                Documents will appear here once uploaded
              </p>
            </div>
          )}
        </div>

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

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </Modal>
  );
}
