'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEmployee, useUpdateEmployee, useCompanyDepartments } from '@/hooks/useUser';
import { PageLayout } from '../../layout/PageLayout';
import { AccessBadge } from '../../ui/AccessBadge';
import { Button, Tag, Divider, Modal, message } from 'antd';
import { Mail, Phone, Calendar, Briefcase, DollarSign, ArrowLeft, Edit, FileText } from 'lucide-react';
import { EmployeeForm, EmployeeFormData } from '../../modals/EmployeesForm';
import { DocumentCard } from '@/components/ui/DocumentCard';
import { DocumentPreviewModal } from '@/components/ui/DocumentPreviewModal';
import { UserDocument } from '@/types/genericTypes';

export function EmployeeDetailsPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const router = useRouter();
  const { data: employeeData, isLoading } = useEmployee(parseInt(employeeId || '0'));
  const { data: departmentsData } = useCompanyDepartments();
  const updateEmployeeMutation = useUpdateEmployee();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const backendEmp = employeeData?.result;

  // Mock documents data - TODO: Replace with actual API call when available
  const documents = useMemo(() => {
    // Check if employee data has documents
    const employeeDocs = backendEmp?.documents || [];
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
        fileName: 'Identity_Proof.webp',
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
  }, [backendEmp]);

  const handleUpdateEmployee = (data: EmployeeFormData) => {
    // Find department ID from name
    const selectedDepartment = departmentsData?.result?.find(
      (dept: any) => dept.name === data.department
    );
    const departmentId = selectedDepartment?.id || null;

    // Parse hourly rate
    const hourlyRate = parseFloat(data.hourlyRate.replace(/[^0-9.]/g, '')) || 0;

    // Parse date of joining
    let dateOfJoining = new Date().toISOString();
    if (data.dateOfJoining) {
      try {
        const date = new Date(data.dateOfJoining);
        if (!isNaN(date.getTime())) {
          dateOfJoining = date.toISOString();
        }
      } catch (e) {
        console.error("Invalid date format:", e);
      }
    }

    updateEmployeeMutation.mutate(
      {
        id: parseInt(employeeId),
        name: data.name,
        email: data.email,
        mobile_number: data.phone, // Map frontend phone to backend mobile_number
        designation: data.role,
        department_id: departmentId,
        role_id: data.role_id, // Keep existing role_id if valid
        experience: parseInt(data.experience) || 0,
        skills: data.skillsets.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
        date_of_joining: dateOfJoining,
        salary_yearly: parseFloat(data.salary) || 0,
        hourly_rates: hourlyRate,
        no_of_leaves: parseFloat(data.leaves) || 0,
      } as any,
      {
        onSuccess: () => {
          message.success("Employee updated successfully!");
          setIsDialogOpen(false);
          // Optionally refetch or rely on React Query cache update
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to update employee";
          message.error(errorMessage);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-[#999999]">Loading employee...</p>
      </div>
    );
  }

  if (!backendEmp) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-2">Employee not found</h2>
        <Button onClick={() => router.push('/dashboard/employees')}>Back to Employees</Button>
      </div>
    );
  }

  // Transform backend data to UI format
  const employee = {
    id: backendEmp.user_id || backendEmp.id,
    name: backendEmp.name || '',
    role: backendEmp.designation || 'Unassigned',
    email: backendEmp.email || '',
    phone: backendEmp.mobile_number || backendEmp.phone || '', // Map backend mobile_number to frontend phone
    hourlyRate: backendEmp.hourly_rates ? `$${backendEmp.hourly_rates}` : 'N/A',
    dateOfJoining: backendEmp.date_of_joining ? new Date(backendEmp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    experience: backendEmp.experience || 0,
    skillsets: backendEmp.skills?.join(', ') || 'None',
    status: backendEmp.user_employee?.is_active !== false ? 'active' : 'inactive',
    department: backendEmp.department?.name || 'Unassigned',
    access: 'Employee' as 'Admin' | 'Manager' | 'Leader' | 'Employee', // This might need mapping logic if available
    salary: backendEmp.salary_yearly || backendEmp.salary || 0,
    currency: 'USD',
    workingHours: backendEmp.working_hours?.start_time && backendEmp.working_hours?.end_time ? 8 : 0,
    leaves: backendEmp.no_of_leaves || 0,
    roleId: backendEmp.user_employee?.role_id,
    employmentType: 'In-house' as 'In-house' | 'Freelancer' | 'Agency', // Mock data default
  };

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
    <PageLayout
      title="Employee Details"
      titleAction={{
        label: "Back",
        icon: <ArrowLeft className="w-5 h-5" />,
        onClick: () => router.push('/dashboard/employees'),
        variant: "outline"
      }}
      action={
        <Button
          type="primary"
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-[#111111] text-white hover:bg-[#000000] border-0 h-10 px-5 rounded-full font-['Manrope:SemiBold',sans-serif]"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      }
    >
      <div className="bg-white rounded-[24px] border border-[#EEEEEE] p-8 max-w-4xl mx-auto mt-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">{employee.name}</h1>
            <div className="flex items-center gap-2 text-[#666666]">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-['Manrope:Medium',sans-serif]">{employee.role} • {employee.department}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AccessBadge role={employee.access} />
            <Tag className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${employee.status === 'active'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
              }`}>
              {employee.status === 'active' ? 'Active' : 'Inactive'}
            </Tag>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999] m-0">Email Address</p>
                  <p className="text-sm font-medium text-[#111111] m-0">{employee.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999] m-0">Phone Number</p>
                  <p className="text-sm font-medium text-[#111111] m-0">{employee.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-6">
            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Employment Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999] m-0">Date of Joining</p>
                  <p className="text-sm font-medium text-[#111111] m-0">{employee.dateOfJoining}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999] m-0">Hourly Rate</p>
                  <p className="text-sm font-medium text-[#111111] m-0">{employee.hourlyRate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-8" />

        {/* Skills & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-[#F7F7F7] rounded-xl">
            <p className="text-xs text-[#999999] mb-1">Experience</p>
            <p className="text-xl font-bold text-[#111111]">{employee.experience} Years</p>
          </div>
          <div className="p-4 bg-[#F7F7F7] rounded-xl">
            <p className="text-xs text-[#999999] mb-1">Working Hours</p>
            <p className="text-xl font-bold text-[#111111]">{employee.workingHours}h / week</p>
          </div>
          <div className="p-4 bg-[#F7F7F7] rounded-xl">
            <p className="text-xs text-[#999999] mb-1">Leaves Taken</p>
            <p className="text-xl font-bold text-[#111111]">{employee.leaves} Days</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Skillsets</h3>
          <div className="flex flex-wrap gap-2">
            {employee.skillsets.split(',').map((skill: string, index: number) => (
              <Tag key={index} className="bg-[#F7F7F7] text-[#111111] hover:bg-[#EEEEEE] border-0 rounded-full px-3 py-1">
                {skill.trim()}
              </Tag>
            ))}
          </div>
        </div>

        <Divider className="my-8" />

        {/* Documents Section */}
        <div>
          <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Attached Documents</h3>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="border border-[#EEEEEE] border-dashed rounded-lg p-8 bg-[#FAFAFA] text-center">
              <FileText className="w-12 h-12 text-[#CCCCCC] mx-auto mb-3" />
              <p className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-1">
                No documents uploaded
              </p>
              <p className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                Documents will appear here once uploaded
              </p>
            </div>
          )}
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

      <Modal
        open={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        footer={null}
        width={700}
        centered
        className="rounded-[16px] overflow-hidden"
      >
        <div className="p-0">
          <div className="border-b border-[#EEEEEE] mb-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                {/* User icon could be added here similar to EmployeesPage */}
                Edit Employee Details
              </div>
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif]">
              Update employee profile, access, and HR details.
            </p>
          </div>

          <EmployeeForm
            departments={departmentsData?.result?.filter((dept: any) => dept.is_active !== false).map((dept: any) => dept.name) || []}
            initialData={{
              name: employee.name,
              role: employee.role,
              email: employee.email,
              phone: employee.phone,
              department: employee.department,
              hourlyRate: employee.hourlyRate,
              dateOfJoining: backendEmp?.date_of_joining ? new Date(backendEmp.date_of_joining).toISOString().split('T')[0] : '',
              experience: employee.experience.toString(),
              skillsets: employee.skillsets,
              access: employee.access,
              salary: employee.salary.toString(),
              currency: employee.currency,
              workingHours: employee.workingHours.toString(),
              leaves: employee.leaves.toString(),
              role_id: employee.roleId,
              employmentType: (() => {
                const type = employee.employmentType;
                if (type === 'In-house') return 'Full-time';
                if (type === 'Freelancer' || type === 'Agency') return 'Contract';
                if (type === 'Full-time' || type === 'Contract' || type === 'Part-time') return type;
                return 'Full-time' as 'Full-time' | 'Contract' | 'Part-time';
              })()
            }}
            onSubmit={handleUpdateEmployee}
            onCancel={() => setIsDialogOpen(false)}
            isEditing={true}
          />
        </div>
      </Modal>
    </PageLayout>
  );
}