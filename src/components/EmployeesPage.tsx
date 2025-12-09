import { PageLayout } from './PageLayout';
import { useState, useMemo } from 'react';
import { FilterBar, FilterOption } from './FilterBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { User, Briefcase, Mail, Trash2 } from 'lucide-react';
import { Checkbox } from "./ui/checkbox";
import { EmployeeForm, EmployeeFormData } from './forms/EmployeeForm';
import { EmployeeRow } from './rows/EmployeeRow';
import { useData } from '../context/DataContext';
import { Employee } from '../lib/types';

export function EmployeesPage() {
  const { employees, addEmployee, updateEmployee } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    role: 'All',
    department: 'All',
    access: 'All'
  });
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Note: User asked for "Status - active/inactive" in the strip. 
      // If the tabs are still Active/Deactivated (Inactive), this filter logic holds.
      // If "left" was "inactive", I'll map it.
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

      return matchesTab && matchesSearch && matchesRole && matchesDept && matchesAccess;
    });
  }, [employees, activeTab, searchQuery, filters]);

  // Get unique roles and departments
  const uniqueRoles = useMemo(() => ['All', ...Array.from(new Set(employees.map(emp => emp.role)))], [employees]);
  const uniqueDepts = useMemo(() => ['All', ...Array.from(new Set(employees.map(emp => emp.department)))], [employees]);
  
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
    }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({ role: 'All', department: 'All', access: 'All' });
    setSearchQuery('');
  };

  const handleOpenDialog = (employee?: Employee) => {
    setEditingEmployee(employee || null);
    setIsDialogOpen(true);
  };

  const handleSaveEmployee = (data: EmployeeFormData) => {
    if (!data.name) return;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        department: data.department,
        hourlyRate: data.hourlyRate || '0/Hr',
        dateOfJoining: data.dateOfJoining || new Date().toLocaleDateString(),
        experience: parseInt(data.experience) || 0,
        skillsets: data.skillsets,
        access: data.access,
        salary: parseFloat(data.salary) || 0,
        currency: data.currency,
        workingHours: parseFloat(data.workingHours) || 0,
        leaves: parseFloat(data.leaves) || 0
      });
    } else {
      addEmployee({
        id: Math.max(...employees.map(e => e.id), 0) + 1,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        department: data.department,
        hourlyRate: data.hourlyRate || '0/Hr',
        dateOfJoining: data.dateOfJoining || new Date().toLocaleDateString(),
        experience: parseInt(data.experience) || 0,
        skillsets: data.skillsets,
        status: 'active',
        access: data.access,
        salary: parseFloat(data.salary) || 0,
        currency: data.currency,
        workingHours: parseFloat(data.workingHours) || 0,
        leaves: parseFloat(data.leaves) || 0
      });
    }

    setIsDialogOpen(false);
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
            <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2.5fr_1.5fr_1fr_0.8fr_1fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
                <div className="flex justify-center">
                    <Checkbox 
                        checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                        onCheckedChange={toggleSelectAll}
                        className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
                    />
                </div>
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Employee Details</p>
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
                />
            ))}
            </div>

            {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
                <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
                No employees found
                </p>
            </div>
            )}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
          <div className="p-6 border-b border-[#EEEEEE]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                 <div className="p-2 rounded-full bg-[#F7F7F7]">
                    <User className="w-5 h-5 text-[#666666]" />
                 </div>
                 {editingEmployee ? 'Edit Employee Details' : 'Add Employee'}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                {editingEmployee ? 'Update employee profile, access, and HR details.' : 'Onboard a new employee to the organization.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <EmployeeForm 
            initialData={editingEmployee ? {
                name: editingEmployee.name,
                role: editingEmployee.role,
                email: editingEmployee.email,
                phone: editingEmployee.phone,
                department: editingEmployee.department,
                hourlyRate: editingEmployee.hourlyRate,
                dateOfJoining: new Date(editingEmployee.dateOfJoining).toISOString().split('T')[0],
                experience: editingEmployee.experience.toString(),
                skillsets: editingEmployee.skillsets,
                access: editingEmployee.access,
                salary: editingEmployee.salary.toString(),
                currency: editingEmployee.currency,
                workingHours: editingEmployee.workingHours.toString(),
                leaves: editingEmployee.leaves.toString()
            } : undefined}
            onSubmit={handleSaveEmployee}
            onCancel={() => setIsDialogOpen(false)}
            isEditing={!!editingEmployee}
          />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}