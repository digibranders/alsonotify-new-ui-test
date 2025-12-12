import { PageLayout } from '../../layout/PageLayout';
import { useState, useMemo } from 'react';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Modal, Checkbox } from "antd";
import { User, Briefcase, Mail, Trash2 } from 'lucide-react';
import { EmployeeForm, EmployeeFormData } from './forms/EmployeeForm';
import { EmployeeRow } from './rows/EmployeeRow';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useCompanyDepartments, useUpdateEmployeeStatus } from '@/hooks/useUser';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { Employee } from '@/lib/types';

export function EmployeesPage() {
  const router = useRouter();
  const { data: employeesData, isLoading } = useEmployees();
  const { data: departmentsData } = useCompanyDepartments();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const updateEmployeeStatusMutation = useUpdateEmployeeStatus();
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    role: 'All',
    department: 'All',
    access: 'All',
    employmentType: 'All'
  });
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Helper function to map role to access level - must be defined before useMemo
  const mapRoleToAccess = (roleId: any, roleName?: string): 'Admin' | 'Manager' | 'Leader' | 'Employee' => {
    // Map role name to access level if available
    if (roleName) {
      const roleLower = roleName.toLowerCase();
      if (roleLower.includes('admin')) return 'Admin';
      if (roleLower.includes('manager') || roleLower.includes('lead')) return 'Manager';
      if (roleLower.includes('leader')) return 'Leader';
    }
    // Default mapping
    return 'Employee';
  };

  // Transform backend data to UI format
  const employees = useMemo(() => {
    if (!employeesData?.result) return [];
    return employeesData.result.map((emp: any) => ({
      id: emp.user_id || emp.id,
      name: emp.name || '',
      role: emp.designation || 'Unassigned',
      email: emp.email || '',
      phone: emp.mobile_number || emp.phone || '',
      hourlyRate: emp.hourly_rates ? `$${emp.hourly_rates}` : 'N/A',
      dateOfJoining: emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      experience: emp.experience || 0,
      skillsets: emp.skills?.join(', ') || 'None',
      status: (emp.user_employee?.is_active !== false ? 'active' : 'inactive') as 'active' | 'inactive',
      department: emp.department?.name || 'Unassigned',
      access: mapRoleToAccess(emp.user_employee?.role_id, emp.user_employee?.role?.name) || 'Employee',
      roleId: emp.user_employee?.role_id,
      salary: emp.salary_yearly || emp.salary || 0,
      currency: 'USD',
      workingHours: emp.working_hours?.start_time && emp.working_hours?.end_time ? 8 : 0,
      leaves: emp.no_of_leaves || 0,
      // Mock Data for Employment Type (Randomly assigned for demo)
      employmentType: ['In-house', 'Freelancer', 'Agency'][Math.floor(Math.random() * 3)] as 'In-house' | 'Freelancer' | 'Agency',
    }));
  }, [employeesData]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesTab = emp.status === activeTab;
      const matchesSearch = searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.skillsets.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filters.role === 'All' || emp.role === filters.role;
      const matchesDept = filters.department === 'All' || emp.department === filters.department;

      // Handle "Employee" display mapping for "Member" role
      const matchesAccess = filters.access === 'All' ||
        (filters.access === 'Employee'
          ? (emp.access === 'Employee')
          : emp.access === filters.access);

      const matchesType = filters.employmentType === 'All' || emp.employmentType === filters.employmentType;

      return matchesTab && matchesSearch && matchesRole && matchesDept && matchesAccess && matchesType;
    });
  }, [employees, activeTab, searchQuery, filters]);

  // Get unique roles and departments
  const uniqueRoles = useMemo(() => ['All', ...Array.from(new Set(employees.map(emp => emp.role)))], [employees]);

  // Get departments from backend if available, otherwise from employees
  const uniqueDepts = useMemo(() => {
    if (departmentsData?.result && departmentsData.result.length > 0) {
      return ['All', ...departmentsData.result.filter((dept: any) => dept.is_active !== false).map((dept: any) => dept.name)];
    }
    return ['All', ...Array.from(new Set(employees.map(emp => emp.department)))];
  }, [departmentsData, employees]);

  // Defined access levels
  const accessOptions = ['All', 'Admin', 'Manager', 'Leader', 'Employee'];

  const filterOptions: FilterOption[] = [
    {
      id: 'role',
      label: 'Role',
      options: uniqueRoles,
      placeholder: 'Role/Designation',
      defaultValue: 'All'
    },
    {
      id: 'department',
      label: 'Department',
      options: uniqueDepts,
      placeholder: 'Department',
      defaultValue: 'All'
    },
    {
      id: 'access',
      label: 'Access Level',
      options: accessOptions,
      placeholder: 'Access Level',
      defaultValue: 'All'
    },
    {
      id: 'employmentType',
      label: 'Employment Type',
      options: ['All', 'In-house', 'Freelancer', 'Agency'],
      placeholder: 'Employment Type',
      defaultValue: 'All'
    }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({ role: 'All', department: 'All', access: 'All', employmentType: 'All' });
    setSearchQuery('');
  };

  const handleOpenDialog = (employee?: Employee) => {
    setEditingEmployee(employee || null);
    setIsDialogOpen(true);
  };

  const handleDeactivateEmployee = async (employeeId: number, isCurrentlyActive: boolean) => {
    updateEmployeeStatusMutation.mutate(
      {
        user_id: employeeId,
        is_active: !isCurrentlyActive,
      },
      {
        onSuccess: () => {
          message.success(`Employee ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully!`);
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to update employee status";
          message.error(errorMessage);
        },
      }
    );
  };

  const handleSaveEmployee = async (data: EmployeeFormData) => {
    if (!data.name) {
      message.error("Employee name is required");
      return;
    }

    // Find department ID from name
    const selectedDepartment = departmentsData?.result?.find(
      (dept: any) => dept.name === data.department
    );
    const departmentId = selectedDepartment?.id || null;

    // Parse hourly rate (remove $ if present)
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

    if (editingEmployee) {
      updateEmployeeMutation.mutate(
        {
          id: editingEmployee.id,
          name: data.name,
          email: data.email,
          mobile_number: data.phone,
          designation: data.role,
          department_id: departmentId,
          role_id: data.role_id || editingEmployee.roleId,
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
            setEditingEmployee(null);
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to update employee";
            message.error(errorMessage);
          },
        }
      );
    } else {
      createEmployeeMutation.mutate(
        // ... (data mapped above)
        {
          name: data.name,
          email: data.email,
          mobile_number: data.phone,
          designation: data.role,
          department_id: departmentId,
          experience: parseInt(data.experience) || 0,
          skills: data.skillsets.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
          date_of_joining: dateOfJoining,
          salary_yearly: parseFloat(data.salary) || 0,
          hourly_rates: hourlyRate,
          no_of_leaves: parseFloat(data.leaves) || 0,
        } as any,
        {
          onSuccess: () => {
            message.success("Employee created successfully!");
            setIsDialogOpen(false);
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to create employee";
            message.error(errorMessage);
          },
        }
      );
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  return (
    <PageLayout
      title="Employees"
      tabs={[
        { id: 'active', label: 'Active' },
        { id: 'inactive', label: 'Inactive' }
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as 'active' | 'inactive')}
      titleAction={{
        onClick: () => handleOpenDialog(),
        label: "Add Employee"
      }}
    >
      <div className="flex flex-col h-full relative">
        {/* Filters Bar */}
        <div className="mb-6">
          <FilterBar
            filters={filterOptions}
            selectedFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            searchPlaceholder="Search by name, role, or skills..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {/* Table Header */}
          <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2.5fr_1fr_1.5fr_1fr_0.8fr_1fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
            <div className="flex justify-center">
              <Checkbox
                checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                onChange={toggleSelectAll}
              />
            </div>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Employee Details</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Type</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Access</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Hourly Rate</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Date of Joining</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
          </div>

          <div className="space-y-2">
            {filteredEmployees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                selected={selectedEmployees.includes(employee.id)}
                onSelect={() => toggleSelect(employee.id)}
                onEdit={() => handleOpenDialog(employee)}
                onDeactivate={() => handleDeactivateEmployee(employee.id, employee.status === 'active')}
              />
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">Loading employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
                No employees found
              </p>
            </div>
          ) : null}
        </div>

        {/* Bulk Action Bar */}
        {selectedEmployees.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2 border-r border-white/20 pr-6">
              <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {selectedEmployees.length}
              </div>
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Send Email">
                <Mail className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Assign Department">
                <Briefcase className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]" title="Deactivate">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => setSelectedEmployees([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>

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
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <User className="w-5 h-5 text-[#666666]" />
                </div>
                {editingEmployee ? 'Edit Employee Details' : 'Add Employee'}
              </div>
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
              {editingEmployee ? 'Update employee profile, access, and HR details.' : 'Onboard a new employee to the organization.'}
            </p>
          </div>

          <EmployeeForm
            departments={departmentsData?.result?.filter((dept: any) => dept.is_active !== false).map((dept: any) => dept.name) || []}
            initialData={editingEmployee ? {
              name: editingEmployee.name,
              role: editingEmployee.role,
              email: editingEmployee.email,
              phone: editingEmployee.phone,
              department: editingEmployee.department,
              hourlyRate: editingEmployee.hourlyRate,
              dateOfJoining: editingEmployee.dateOfJoining && editingEmployee.dateOfJoining !== 'N/A'
                ? (() => {
                  try {
                    // Parse date string like "01 Jan 2024"
                    const dateParts = editingEmployee.dateOfJoining.split(' ');
                    if (dateParts.length === 3) {
                      const day = dateParts[0].padStart(2, '0');
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const month = String(monthNames.indexOf(dateParts[1]) + 1).padStart(2, '0');
                      const year = dateParts[2];
                      return `${year}-${month}-${day}`;
                    }
                    // Try parsing as ISO string
                    const date = new Date(editingEmployee.dateOfJoining);
                    if (!isNaN(date.getTime())) {
                      return date.toISOString().split('T')[0];
                    }
                  } catch (e) {
                    console.error("Error parsing date:", e);
                  }
                  return '';
                })()
                : '',
              experience: editingEmployee.experience.toString(),
              skillsets: editingEmployee.skillsets,
              access: editingEmployee.access,
              salary: editingEmployee.salary.toString(),
              currency: editingEmployee.currency,
              workingHours: editingEmployee.workingHours.toString(),
              leaves: editingEmployee.leaves.toString(),
              role_id: editingEmployee.roleId
            } : undefined}
            onSubmit={handleSaveEmployee}
            onCancel={() => setIsDialogOpen(false)}
            isEditing={!!editingEmployee}
          />
        </div>
      </Modal>
    </PageLayout>
  );
}