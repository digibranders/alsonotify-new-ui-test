'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployee } from '@/hooks/useUser';
import { PageLayout } from '../PageLayout';
import { AccessBadge } from '../AccessBadge';
import { Button, Tag, Divider } from 'antd';
import { Mail, Phone, Calendar, Briefcase, DollarSign, ArrowLeft } from 'lucide-react';

export function EmployeeDetailsPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const router = useRouter();
  const { data: employeeData, isLoading } = useEmployee(parseInt(employeeId || '0'));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-[#999999]">Loading employee...</p>
      </div>
    );
  }

  const backendEmp = employeeData?.result;
  if (!backendEmp) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-2">Employee not found</h2>
        <Button onClick={() => router.push('/employees')}>Back to Employees</Button>
      </div>
    );
  }

  // Transform backend data to UI format
  const employee = {
    id: backendEmp.user_id || backendEmp.id,
    name: backendEmp.name || '',
    role: backendEmp.designation || 'Unassigned',
    email: backendEmp.email || '',
    phone: backendEmp.phone || '',
    hourlyRate: backendEmp.hourly_rates ? `$${backendEmp.hourly_rates}` : 'N/A',
    dateOfJoining: backendEmp.date_of_joining ? new Date(backendEmp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    experience: backendEmp.experience || 0,
    skillsets: backendEmp.skills?.join(', ') || 'None',
    status: backendEmp.user_employee?.is_active !== false ? 'active' : 'inactive',
    department: backendEmp.department?.name || 'Unassigned',
    access: 'Employee' as 'Admin' | 'Manager' | 'Leader' | 'Employee',
    salary: backendEmp.salary_yearly || backendEmp.salary || 0,
    currency: 'USD',
    workingHours: backendEmp.working_hours?.start_time && backendEmp.working_hours?.end_time ? 8 : 0,
    leaves: backendEmp.no_of_leaves || 0,
  };

  return (
    <PageLayout
      title="Employee Details"
      titleAction={{
        label: "Back",
        icon: <ArrowLeft className="w-5 h-5" />,
        onClick: () => router.push('/employees'),
        variant: "outline"
      }}
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

      </div>
    </PageLayout>
  );
}