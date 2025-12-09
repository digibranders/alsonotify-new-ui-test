import { useState, useMemo } from 'react';
import { Plus, CheckSquare, Trash2, Users } from 'lucide-react';
import { FilterBar, FilterOption } from './FilterBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { TaskForm, TaskFormData } from './forms/TaskForm';
import { TaskRow } from './rows/TaskRow';
import { useData } from '../context/DataContext';
import { Task } from '../lib/types';

type StatusTab = 'all' | 'in-progress' | 'completed' | 'impediment';

export function TasksPage() {
  const { tasks, addTask } = useData();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    user: 'Satyam Yadav',
    company: 'All',
    project: 'All',
    status: 'All'
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extract unique values for filters
  const users = useMemo(() => Array.from(new Set(tasks.map(t => t.assignedTo))), [tasks]);
  const companies = useMemo(() => ['All', ...Array.from(new Set(tasks.map(t => t.client)))], [tasks]);
  const projects = useMemo(() => ['All', ...Array.from(new Set(tasks.map(t => t.project)))], [tasks]);
  const statuses = useMemo(() => ['All', 'In Progress', 'Completed', 'Impediment'], []);

  const filterOptions: FilterOption[] = [
    { id: 'user', label: 'User', options: users, defaultValue: 'Satyam Yadav' },
    { id: 'company', label: 'Company', options: companies, placeholder: 'Company' },
    { id: 'project', label: 'Project', options: projects, placeholder: 'Project' },
    { id: 'status', label: 'Status', options: statuses, placeholder: 'Status' }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      user: 'Satyam Yadav',
      company: 'All',
      project: 'All',
      status: 'All'
    });
    setSearchQuery('');
  };

  const handleCreateTask = (data: TaskFormData) => {
    if (!data.name) return;

    const task: Task = {
      id: (Math.max(...tasks.map(t => parseInt(t.id)), 0) + 1).toString(),
      name: data.name,
      taskId: (Math.max(...tasks.map(t => parseInt(t.taskId)), 0) + 1).toString(),
      client: data.client || 'In-House',
      project: data.requirement || 'General',
      leader: data.leader || 'Satyam Yadav',
      assignedTo: data.assignedTo || 'Unassigned',
      startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      estTime: parseInt(data.estTime) || 0,
      timeSpent: 0,
      activities: 0,
      status: 'in-progress',
      priority: data.priority
    };

    addTask(task);
    setIsDialogOpen(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesTab = activeTab === 'all' || task.status === activeTab;
      const matchesSearch = searchQuery === '' || 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskId.includes(searchQuery) ||
        task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = task.assignedTo === filters.user;
      const matchesCompany = filters.company === 'All' || task.client === filters.company;
      const matchesProject = filters.project === 'All' || task.project === filters.project;
      const matchesStatus = filters.status === 'All' || 
        (filters.status === 'In Progress' && task.status === 'in-progress') ||
        (filters.status === 'Completed' && task.status === 'completed') ||
        (filters.status === 'Impediment' && task.status === 'impediment');
      return matchesTab && matchesSearch && matchesUser && matchesCompany && matchesProject && matchesStatus;
    });
  }, [tasks, activeTab, searchQuery, filters]);

  const stats = useMemo(() => ({
    all: tasks.length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    impediment: tasks.filter(t => t.status === 'impediment').length,
  }), [tasks]);

  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
        setSelectedTasks([]);
    } else {
        setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedTasks.includes(id)) {
        setSelectedTasks(selectedTasks.filter(taskId => taskId !== id));
    } else {
        setSelectedTasks([...selectedTasks, id]);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Tasks</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="hover:scale-110 active:scale-95 transition-transform"
              >
                <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
               <div className="p-6 border-b border-[#EEEEEE]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                       <div className="p-2 rounded-full bg-[#F7F7F7]">
                          <CheckSquare className="w-5 h-5 text-[#666666]" />
                       </div>
                       Assign Task
                    </DialogTitle>
                    <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                       Assign task for people join to team
                    </DialogDescription>
                  </DialogHeader>
               </div>
               
               <TaskForm 
                  onSubmit={handleCreateTask}
                  onCancel={() => setIsDialogOpen(false)}
               />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Status Tabs */}
        <div className="flex items-center gap-6 border-b border-[#EEEEEE]">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            All Tasks
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeTab === 'all' 
                ? 'bg-[#ff3b3b] text-white' 
                : 'bg-[#F7F7F7] text-[#666666]'
            }`}>
              {stats.all}
            </span>
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${
              activeTab === 'in-progress'
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            In Progress
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeTab === 'in-progress' 
                ? 'bg-[#ff3b3b] text-white' 
                : 'bg-[#F7F7F7] text-[#666666]'
            }`}>
              {stats['in-progress']}
            </span>
            {activeTab === 'in-progress' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Completed
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeTab === 'completed' 
                ? 'bg-[#ff3b3b] text-white' 
                : 'bg-[#F7F7F7] text-[#666666]'
            }`}>
              {stats.completed}
            </span>
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('impediment')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${
              activeTab === 'impediment'
                ? 'text-[#ff3b3b]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Blocked
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeTab === 'impediment' 
                ? 'bg-[#ff3b3b] text-white' 
                : 'bg-[#F7F7F7] text-[#666666]'
            }`}>
              {stats.impediment}
            </span>
            {activeTab === 'impediment' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          searchPlaceholder="Search"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto pb-24 relative">
        {/* Table Header */}
        <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2.5fr_1.2fr_1fr_1fr_1.4fr_0.6fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
            <div className="flex justify-center">
                <Checkbox 
                    checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
                    onCheckedChange={toggleSelectAll}
                    className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
                />
            </div>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Task</p>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Requirements</p>
            <div className="flex justify-center">
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Assigned</p>
            </div>
            <div className="flex justify-center">
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Duration</p>
            </div>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Progress</p>
            <div className="flex justify-center">
                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Status</p>
            </div>
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
        </div>

        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow 
              key={task.id} 
              task={task} 
              selected={selectedTasks.includes(task.id)}
              onSelect={() => toggleSelect(task.id)}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
              No tasks found
            </p>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedTasks.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center gap-2 border-r border-white/20 pr-6">
                    <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                        {selectedTasks.length}
                    </div>
                    <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors tooltip-trigger" title="Mark as Completed">
                        <CheckSquare className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Assign To">
                        <Users className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <button onClick={() => setSelectedTasks([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
                    Cancel
                </button>
            </div>
        )}
      </div>
    </div>
  );
}