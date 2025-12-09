import { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Calendar as CalendarIcon, Save, X, Check, Pencil } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  active: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

interface LeaveType {
  id: string;
  name: string;
  count: number;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'leaves' | 'working-hours' | 'integrations'>('company');
  const [isEditing, setIsEditing] = useState(false);

  // Company Details State
  const [companyName, setCompanyName] = useState('Digibranders Private Limited');
  const [taxId, setTaxId] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('USD');
  const [address, setAddress] = useState('');
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Design', active: true },
    { id: '2', name: 'Development', active: true },
    { id: '3', name: 'SEO', active: true },
  ]);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Leaves State
  const [leaves, setLeaves] = useState<LeaveType[]>([
    { id: '1', name: 'Sick Leave', count: 10 },
    { id: '2', name: 'Casual Leave', count: 5 }
  ]);
  const [publicHolidays, setPublicHolidays] = useState<Holiday[]>([
    { id: '1', name: 'New year', date: '2026-01-01' }
  ]);

  // Working Hours State
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [breakTime, setBreakTime] = useState('60');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Handlers
  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, { id: Date.now().toString(), name: newDeptName, active: true }]);
    setNewDeptName('');
    setIsAddingDept(false);
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
  };

  const toggleDepartmentStatus = (id: string) => {
    setDepartments(departments.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleUpdateLeaveCount = (id: string, count: string) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, count: parseInt(count) || 0 } : l));
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    toast.success('Settings saved successfully!');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset changes if needed
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative font-['Manrope',sans-serif]">
      {/* Header Section */}
      <div className="flex-none mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Global Settings</h1>
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              className="bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif] px-6 h-10 rounded-full text-[13px] flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCancelEdit}
                variant="ghost"
                className="text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] font-['Manrope:SemiBold',sans-serif] px-6 h-10 rounded-full text-[13px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white font-['Manrope:SemiBold',sans-serif] px-8 h-10 rounded-full shadow-lg shadow-[#ff3b3b]/20 text-[13px]"
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#EEEEEE]">
          <button
            onClick={() => setActiveTab('company')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'company' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Company Details
            {activeTab === 'company' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'leaves' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Leaves
            {activeTab === 'leaves' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
          <button
            onClick={() => setActiveTab('working-hours')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'working-hours' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Working Hours
            {activeTab === 'working-hours' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'integrations' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Integrations
            {activeTab === 'integrations' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">

        {/* Company Details Tab */}
        {activeTab === 'company' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="mb-10">
              <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">Company Information</h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Company Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!isEditing}
                    className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Tax ID</Label>
                  <Input
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Enter Tax ID"
                    disabled={!isEditing}
                    className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Time Zone</Label>
                  <Select value={timeZone} onValueChange={setTimeZone} disabled={!isEditing}>
                    <SelectTrigger className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}>
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata" className="text-[13px]">Asia/Kolkata</SelectItem>
                      <SelectItem value="America/New_York" className="text-[13px]">America/New_York</SelectItem>
                      <SelectItem value="Europe/London" className="text-[13px]">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency} disabled={!isEditing}>
                    <SelectTrigger className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD" className="text-[13px]">USD</SelectItem>
                      <SelectItem value="EUR" className="text-[13px]">EUR</SelectItem>
                      <SelectItem value="INR" className="text-[13px]">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-6 relative">
                <div className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Address</Label>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter company address"
                    disabled={!isEditing}
                    className={`min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Regular',sans-serif] text-[13px] resize-none p-3 pr-10 ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                  />
                </div>
                {isEditing && (
                  <button className="absolute bottom-3 right-3 p-1.5 bg-[#F7F7F7] hover:bg-[#eeeeee] rounded-md transition-colors border border-[#EEEEEE]">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-[14px]">📍</span>
                    </div>
                  </button>
                )}
              </div>
            </section>

            <Separator className="my-8 bg-[#EEEEEE]" />

            <section>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Departments</h2>
                {!isAddingDept && (
                  <button
                    onClick={() => setIsAddingDept(true)}
                    className="hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5 text-[#ff3b3b]" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-end gap-6 group">
                    <div className="space-y-2 flex-1">
                      <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Department Name</Label>
                      <Input
                        value={dept.name}
                        readOnly
                        className="h-11 rounded-lg border-[#EEEEEE] bg-[#FAFAFA] text-[#666666] font-['Inter:Medium',sans-serif] text-[13px]"
                      />
                    </div>
                    <div className="flex items-center gap-4 pb-3 h-11">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] text-[#666666] font-['Manrope:Bold',sans-serif]">Active</span>
                        <Switch
                          checked={dept.active}
                          onCheckedChange={() => toggleDepartmentStatus(dept.id)}
                          className="data-[state=checked]:bg-[#ff3b3b]"
                        />
                      </div>
                      <button className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#666666] hover:text-[#111111]">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#ff3b3b]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {isAddingDept && (
                  <div className="flex items-end gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2 flex-1">
                      <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">New Department Name</Label>
                      <Input
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g. Marketing"
                        autoFocus
                        className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px]"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                      />
                    </div>
                    <div className="flex items-center gap-2 pb-1 h-11">
                      <Button
                        onClick={handleAddDepartment}
                        className="h-9 px-4 bg-[#111111] hover:bg-[#000000]/90 text-white text-[12px] font-['Manrope:SemiBold',sans-serif] rounded-full"
                      >
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setIsAddingDept(false)}
                        className="h-9 px-4 text-[#666666] hover:text-[#111111] text-[12px] font-['Manrope:SemiBold',sans-serif] hover:bg-[#F7F7F7] rounded-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-2 gap-12">
            {/* Leaves Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Leaves</h2>
              </div>

              {leaves.map((leave) => (
                <div key={leave.id} className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{leave.name}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      value={leave.count}
                      onChange={(e) => handleUpdateLeaveCount(leave.id, e.target.value)}
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px]"
                    />
                    <button className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-full transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#666666]">Total Leaves</Label>
                  <div className="h-11 px-3 flex items-center rounded-lg border border-[#EEEEEE] bg-[#F7F7F7] text-[#666666] font-['Inter:Medium',sans-serif] text-[13px]">
                    {leaves.reduce((acc, curr) => acc + curr.count, 0)} days
                  </div>
                </div>
              </div>
            </div>

            {/* Public Holidays Column */}
            <div className="space-y-6 border-l border-[#EEEEEE] pl-12">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Public Holidays</h2>
                <button className="hover:scale-110 active:scale-95 transition-transform">
                  <Plus className="w-5 h-5 text-[#ff3b3b]" />
                </button>
              </div>

              <div className="space-y-4">
                {publicHolidays.map((holiday) => (
                  <div key={holiday.id} className="p-4 border border-[#EEEEEE] rounded-[12px] flex items-center justify-between bg-white hover:shadow-sm transition-shadow">
                    <div>
                      <p className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111]">{holiday.name}</p>
                      <p className="text-[12px] text-[#666666] font-['Inter:Medium',sans-serif]">{new Date(holiday.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-full transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#ff3b3b] hover:bg-[#FFF5F5] rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination placeholder */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#999999] hover:bg-[#F7F7F7] disabled:opacity-50" disabled>
                  &lt;
                </button>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ff3b3b] text-[#ff3b3b] font-bold text-[13px]">
                  1
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#999999] hover:bg-[#F7F7F7]">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours Tab */}
        {activeTab === 'working-hours' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
            <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">Working Hours</h2>

            <div className="space-y-8">
              {/* Working Days */}
              <div className="space-y-3">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Working Days</Label>
                <div className="min-h-[48px] p-2 rounded-lg border border-[#EEEEEE] flex flex-wrap gap-2">
                  {workingDays.map(day => (
                    <div key={day} className="h-8 px-3 bg-[#F0F0F0] rounded-md flex items-center gap-2 text-[13px] font-['Inter:Medium',sans-serif] text-[#111111]">
                      {day}
                      <button onClick={() => toggleWorkingDay(day)} className="hover:text-[#ff3b3b]">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="relative group">
                    <button className="h-8 w-8 flex items-center justify-center hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5 text-[#ff3b3b]" />
                    </button>
                    <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-40 bg-white border border-[#EEEEEE] shadow-lg rounded-lg p-1 z-10">
                      {daysOfWeek.filter(d => !workingDays.includes(d)).map(day => (
                        <button
                          key={day}
                          onClick={() => toggleWorkingDay(day)}
                          className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F7F7F7] rounded-md"
                        >
                          {day}
                        </button>
                      ))}
                      {daysOfWeek.filter(d => !workingDays.includes(d)).length === 0 && (
                        <div className="px-3 py-2 text-[12px] text-[#999999]">All days selected</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="space-y-3">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Working Hours</Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px]"
                    />
                  </div>
                  <span className="text-[13px] text-[#666666] font-['Inter:Medium',sans-serif]">to</span>
                  <div className="relative flex-1">
                    <Input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px]"
                    />
                  </div>
                </div>
              </div>

              {/* Break Time */}
              <div className="space-y-3">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Break Time (in minutes)</Label>
                <Input
                  type="number"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab Placeholder */}
        {activeTab === 'integrations' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-[#999999]" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Integrations</h3>
              <button className="hover:scale-110 active:scale-95 transition-transform">
                <Plus className="w-5 h-5 text-[#ff3b3b]" />
              </button>
            </div>
            <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] max-w-sm">
              Connect your favorite tools and services to streamline your workflow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}