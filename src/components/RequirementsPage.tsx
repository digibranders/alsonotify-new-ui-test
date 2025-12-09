import { useState } from 'react';
import { PageLayout } from './PageLayout';
import { FilterBar, FilterOption } from './FilterBar';
import { TabBar } from './TabBar';
import { Calendar24Regular, Person24Regular, CheckmarkCircle24Regular, Clock24Regular, Tag24Regular, Checkmark24Filled, Dismiss24Filled, DocumentAdd24Regular, ArrowUpload24Regular } from '@fluentui/react-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

interface Requirement {
  id: number;
  title: string;
  description: string;
  company: string;
  client: string;
  assignedTo: string[];
  dueDate: string;
  createdDate: string;
  priority: 'high' | 'medium' | 'low';
  type: 'inhouse' | 'outsourced';
  status: 'in-progress' | 'completed' | 'delayed';
  category: string;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  workspace?: string;
}

const initialRequirementsData: Requirement[] = [
  // In-house In Progress
  {
    id: 1,
    title: "Website Redesign Phase 2",
    description: "Complete redesign of the client portal with modern UI/UX, including dashboard, user management, and reporting modules.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Siddique Ahmed", "Appurva Panchabhai"],
    dueDate: "30-Nov-2025",
    createdDate: "15-Nov-2025",
    priority: 'high',
    type: 'inhouse',
    status: 'in-progress',
    category: 'Development',
    progress: 65,
    tasksCompleted: 13,
    tasksTotal: 20,
    workspace: "Website Redesign"
  },
  {
    id: 2,
    title: "Mobile App Authentication System",
    description: "Implement secure authentication with biometric support, OAuth integration, and session management.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Appurva Panchabhai"],
    dueDate: "25-Nov-2025",
    createdDate: "10-Nov-2025",
    priority: 'high',
    type: 'inhouse',
    status: 'in-progress',
    category: 'Development',
    progress: 45,
    tasksCompleted: 9,
    tasksTotal: 20,
    workspace: "Mobile App"
  },
  {
    id: 3,
    title: "Brand Guidelines Documentation",
    description: "Create comprehensive brand guidelines including logo usage, color palette, typography, and design principles.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Pranita Kadav"],
    dueDate: "28-Nov-2025",
    createdDate: "12-Nov-2025",
    priority: 'medium',
    type: 'inhouse',
    status: 'in-progress',
    category: 'Design',
    progress: 80,
    tasksCompleted: 8,
    tasksTotal: 10,
    workspace: "Branding"
  },
  {
    id: 4,
    title: "Marketing Campaign Assets",
    description: "Design complete set of marketing materials for Q1 campaign including social media, email templates, and landing pages.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Pranita Kadav", "Siddique Ahmed"],
    dueDate: "05-Dec-2025",
    createdDate: "08-Nov-2025",
    priority: 'medium',
    type: 'inhouse',
    status: 'in-progress',
    category: 'Design',
    progress: 30,
    tasksCompleted: 3,
    tasksTotal: 10,
    workspace: "Marketing"
  },
  // In-house Completed
  {
    id: 5,
    title: "Q3 Analytics Dashboard",
    description: "Built comprehensive analytics dashboard with real-time data visualization and custom reporting features.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Siddique Ahmed"],
    dueDate: "15-Oct-2025",
    createdDate: "01-Sep-2025",
    priority: 'high',
    type: 'inhouse',
    status: 'completed',
    category: 'Development',
    progress: 100,
    tasksCompleted: 20,
    tasksTotal: 20,
    workspace: "Analytics"
  },
  {
    id: 12,
    title: "Employee Onboarding System",
    description: "Completed internal system for streamlined employee onboarding with automated workflows.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Appurva Panchabhai", "Yusuf Sheikh"],
    dueDate: "20-Oct-2025",
    createdDate: "15-Sep-2025",
    priority: 'medium',
    type: 'inhouse',
    status: 'completed',
    category: 'Development',
    progress: 100,
    tasksCompleted: 15,
    tasksTotal: 15,
    workspace: "HR System"
  },
  // In-house Delayed
  {
    id: 13,
    title: "Legacy System Migration",
    description: "Migrate data from old CRM system to new platform. Project delayed due to technical complexities.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Sharifudeen"],
    dueDate: "15-Nov-2025",
    createdDate: "01-Oct-2025",
    priority: 'high',
    type: 'inhouse',
    status: 'delayed',
    category: 'Development',
    progress: 35,
    tasksCompleted: 7,
    tasksTotal: 20,
    workspace: "Legacy Migration"
  },
  {
    id: 14,
    title: "Security Audit Implementation",
    description: "Implement security recommendations from recent audit. Behind schedule due to dependency issues.",
    company: "Internal",
    client: "Digibranders",
    assignedTo: ["Rahul Verma"],
    dueDate: "18-Nov-2025",
    createdDate: "05-Oct-2025",
    priority: 'high',
    type: 'inhouse',
    status: 'delayed',
    category: 'Infrastructure',
    progress: 40,
    tasksCompleted: 6,
    tasksTotal: 15,
    workspace: "Security"
  },
  // Outsourced In Progress
  {
    id: 6,
    title: "E-commerce Platform Development",
    description: "Build complete e-commerce solution with payment gateway integration, inventory management, and analytics dashboard.",
    company: "Yusuf's Company",
    client: "RetailPro Inc",
    assignedTo: ["Yusuf Sheikh"],
    dueDate: "15-Dec-2025",
    createdDate: "01-Nov-2025",
    priority: 'high',
    type: 'outsourced',
    status: 'in-progress',
    category: 'Development',
    progress: 55,
    tasksCompleted: 22,
    tasksTotal: 40,
    approvalStatus: 'pending',
    workspace: "E-commerce"
  },
  {
    id: 7,
    title: "Corporate Website UI/UX",
    description: "Design modern corporate website with focus on user experience, accessibility, and mobile responsiveness.",
    company: "Design Studio Pro",
    client: "TechCorp Solutions",
    assignedTo: ["Jennifer Lopez"],
    dueDate: "10-Dec-2025",
    createdDate: "05-Nov-2025",
    priority: 'high',
    type: 'outsourced',
    status: 'in-progress',
    category: 'Design',
    progress: 70,
    tasksCompleted: 14,
    tasksTotal: 20,
    approvalStatus: 'approved',
    workspace: "Corporate Site"
  },
  {
    id: 8,
    title: "API Integration & Documentation",
    description: "Integrate third-party APIs for payment, shipping, and CRM. Create comprehensive API documentation.",
    company: "Dev Solutions Ltd",
    client: "LogisticsPro",
    assignedTo: ["Marcus Thompson"],
    dueDate: "20-Dec-2025",
    createdDate: "08-Nov-2025",
    priority: 'medium',
    type: 'outsourced',
    status: 'in-progress',
    category: 'Development',
    progress: 40,
    tasksCompleted: 8,
    tasksTotal: 20,
    approvalStatus: 'pending',
    workspace: "API"
  },
  {
    id: 9,
    title: "Social Media Campaign Design",
    description: "Create engaging social media content for 3-month campaign including graphics, videos, and copy.",
    company: "Creative Minds Agency",
    client: "FashionHub",
    assignedTo: ["Priya Patel"],
    dueDate: "30-Nov-2025",
    createdDate: "15-Nov-2025",
    priority: 'medium',
    type: 'outsourced',
    status: 'in-progress',
    category: 'Design',
    progress: 60,
    tasksCompleted: 18,
    tasksTotal: 30,
    approvalStatus: 'approved',
    workspace: "Social Media"
  },
  {
    id: 10,
    title: "Cloud Infrastructure Setup",
    description: "Set up scalable cloud infrastructure with auto-scaling, load balancing, and disaster recovery.",
    company: "Tech Consultants Inc",
    client: "StartupXYZ",
    assignedTo: ["Alex Rivera"],
    dueDate: "08-Dec-2025",
    createdDate: "03-Nov-2025",
    priority: 'high',
    type: 'outsourced',
    status: 'in-progress',
    category: 'Infrastructure',
    progress: 85,
    tasksCompleted: 17,
    tasksTotal: 20,
    approvalStatus: 'pending',
    workspace: "Cloud Setup"
  },
  // Outsourced Completed
  {
    id: 11,
    title: "Mobile App Prototype",
    description: "Successfully designed and prototyped mobile app for restaurant booking with client approval.",
    company: "Design Masters LLC",
    client: "FoodieApp",
    assignedTo: ["John Smith"],
    dueDate: "30-Oct-2025",
    createdDate: "15-Sep-2025",
    priority: 'medium',
    type: 'outsourced',
    status: 'completed',
    category: 'Design',
    progress: 100,
    tasksCompleted: 20,
    tasksTotal: 20,
    approvalStatus: 'approved',
    workspace: "Mobile Prototype"
  },
  {
    id: 15,
    title: "CRM Integration Project",
    description: "Completed full CRM integration with email automation and customer data synchronization.",
    company: "Integration Experts",
    client: "SalesForce Pro",
    assignedTo: ["Mike Johnson"],
    dueDate: "25-Oct-2025",
    createdDate: "10-Sep-2025",
    priority: 'high',
    type: 'outsourced',
    status: 'completed',
    category: 'Development',
    progress: 100,
    tasksCompleted: 25,
    tasksTotal: 25,
    approvalStatus: 'approved',
    workspace: "CRM"
  },
  // Outsourced Delayed
  {
    id: 16,
    title: "Video Production Campaign",
    description: "Multi-video campaign for product launch. Delayed due to client feedback iterations.",
    company: "Video Creators Co",
    client: "TechGadgets Inc",
    assignedTo: ["Sarah Wilson"],
    dueDate: "15-Nov-2025",
    createdDate: "01-Oct-2025",
    priority: 'high',
    type: 'outsourced',
    status: 'delayed',
    category: 'Design',
    progress: 50,
    tasksCompleted: 10,
    tasksTotal: 20,
    approvalStatus: 'pending',
    workspace: "Video Campaign"
  },
  {
    id: 17,
    title: "Custom ERP Module Development",
    description: "Custom ERP module for inventory management. Behind schedule due to scope changes.",
    company: "ERP Solutions Inc",
    client: "Manufacturing Co",
    assignedTo: ["David Brown"],
    dueDate: "10-Nov-2025",
    createdDate: "15-Sep-2025",
    priority: 'high',
    type: 'outsourced',
    status: 'delayed',
    category: 'Development',
    progress: 45,
    tasksCompleted: 18,
    tasksTotal: 40,
    approvalStatus: 'approved',
    workspace: "ERP"
  }
];

export function RequirementsPage() {
  // Updated Requirements page with status-based tabs (All, In Progress, Completed, Delayed)
  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirementsData);
  const [subTab, setSubTab] = useState<'all' | 'in-progress' | 'completed' | 'delayed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    type: 'All',
    category: 'All',
    priority: 'All',
    client: 'All'
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReq, setNewReq] = useState({
    title: '',
    description: '',
    client: '',
    company: '',
    category: 'Development',
    priority: 'medium' as 'high' | 'medium' | 'low',
    type: 'inhouse' as 'inhouse' | 'outsourced',
    dueDate: '',
    workspace: ''
  });

  // Extract unique values for filters
  const categories = ['All', ...Array.from(new Set(requirements.map(r => r.category)))];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const clients = ['All', ...Array.from(new Set(requirements.map(r => r.client)))];

  const filterOptions: FilterOption[] = [
    { id: 'type', label: 'Type', options: ['All', 'In-house', 'Outsourced'], placeholder: 'Type' },
    { id: 'category', label: 'Category', options: categories, placeholder: 'Category' },
    { id: 'priority', label: 'Priority', options: priorities, placeholder: 'Priority' },
    { id: 'client', label: 'Client', options: clients, placeholder: 'Client' }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'All',
      category: 'All',
      priority: 'All',
      client: 'All'
    });
    setSearchQuery('');
  };

  const handleCreateRequirement = () => {
    if (!newReq.title) return;

    const requirement: Requirement = {
      id: Math.max(...requirements.map(r => r.id)) + 1,
      title: newReq.title,
      description: newReq.description || 'No description provided',
      company: newReq.company || (newReq.type === 'inhouse' ? 'Internal' : 'External Agency'),
      client: newReq.client || 'TBD',
      assignedTo: [],
      dueDate: newReq.dueDate ? new Date(newReq.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      priority: newReq.priority,
      type: newReq.type,
      status: 'in-progress',
      category: newReq.category,
      progress: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
      approvalStatus: newReq.type === 'outsourced' ? 'pending' : undefined,
      workspace: newReq.workspace
    };

    setRequirements([requirement, ...requirements]);
    setIsDialogOpen(false);
    setNewReq({
      title: '',
      description: '',
      client: '',
      company: '',
      category: 'Development',
      priority: 'medium',
      type: 'inhouse',
      dueDate: '',
      workspace: ''
    });
  };

  const filteredRequirements = requirements.filter(requirement => {
    // Filter by type using the dropdown filter
    const matchesType = filters.type === 'All' || 
                       (filters.type === 'In-house' && requirement.type === 'inhouse') ||
                       (filters.type === 'Outsourced' && requirement.type === 'outsourced');
    
    const matchesSubTab = subTab === 'all' || requirement.status === subTab;
    const matchesSearch = searchQuery === '' || 
      requirement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filters.category === 'All' || requirement.category === filters.category;
    const matchesPriority = filters.priority === 'All' || requirement.priority === filters.priority.toLowerCase();
    const matchesClient = filters.client === 'All' || requirement.client === filters.client;
    
    return matchesType && matchesSubTab && matchesSearch && matchesCategory && matchesPriority && matchesClient;
  });

  // Count totals for tabs based on current type filter
  const getCurrentTypeRequirements = () => {
    if (filters.type === 'In-house') {
      return requirements.filter(r => r.type === 'inhouse');
    } else if (filters.type === 'Outsourced') {
      return requirements.filter(r => r.type === 'outsourced');
    }
    return requirements; // All
  };

  const currentTypeRequirements = getCurrentTypeRequirements();
  const statusCounts = {
    all: currentTypeRequirements.length,
    inProgress: currentTypeRequirements.filter(r => r.status === 'in-progress').length,
    completed: currentTypeRequirements.filter(r => r.status === 'completed').length,
    delayed: currentTypeRequirements.filter(r => r.status === 'delayed').length
  };

  return (
    <PageLayout
      title="Requirements"
      titleAction={{
        onClick: () => setIsDialogOpen(true)
      }}
    >
      {/* Status Tabs - Pulled up to match title spacing on other pages */}
      <div className="mb-6 -mt-2">
        <TabBar
          tabs={[
            { id: 'all', label: 'All', count: statusCounts.all },
            { id: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
            { id: 'completed', label: 'Completed', count: statusCounts.completed },
            { id: 'delayed', label: 'Delayed', count: statusCounts.delayed }
          ]}
          activeTab={subTab}
          onTabChange={(tab) => setSubTab(tab as 'all' | 'in-progress' | 'completed' | 'delayed')}
        />
      </div>

      {/* Filters Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          searchPlaceholder="Search requirements..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Requirements Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredRequirements.map((requirement) => (
            <RequirementCard key={requirement.id} requirement={requirement} />
          ))}
        </div>

        {filteredRequirements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
              No requirements found
            </p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
          <div className="p-6 border-b border-[#EEEEEE]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                 <div className="p-2 rounded-full bg-[#F7F7F7]">
                    <DocumentAdd24Regular className="w-5 h-5 text-[#666666]" />
                 </div>
                 New Requirement
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                Add a new requirement to the workspace.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter requirement title"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={newReq.title}
                  onChange={(e) => setNewReq({...newReq, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace</Label>
                <Select 
                  value={newReq.workspace} 
                  onValueChange={(v: any) => setNewReq({...newReq, workspace: v})}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website Redesign">Website Redesign</SelectItem>
                    <SelectItem value="Mobile App">Mobile App</SelectItem>
                    <SelectItem value="Marketing Campaign">Marketing Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Type</Label>
                <Select 
                  value={newReq.type} 
                  onValueChange={(v: any) => setNewReq({...newReq, type: v})}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inhouse">In-house</SelectItem>
                    <SelectItem value="outsourced">Outsourced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</Label>
                <Select 
                  value={newReq.priority} 
                  onValueChange={(v: any) => setNewReq({...newReq, priority: v})}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Category</Label>
                <Input 
                  id="category" 
                  placeholder="e.g. Development"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={newReq.category}
                  onChange={(e) => setNewReq({...newReq, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={newReq.dueDate}
                  onChange={(e) => setNewReq({...newReq, dueDate: e.target.value})}
                />
              </div>
            </div>

            {/* Row 4: Client Info (Optional) */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Client</Label>
                <Input 
                  id="client" 
                  placeholder="Client name"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={newReq.client}
                  onChange={(e) => setNewReq({...newReq, client: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Company</Label>
                <Input 
                  id="company" 
                  placeholder="Company name"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif]"
                  value={newReq.company}
                  onChange={(e) => setNewReq({...newReq, company: e.target.value})}
                />
              </div>
            </div>

             {/* Upload */}
            <div className="space-y-2">
               <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Upload Documents</Label>
               <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#ff3b3b]/30 hover:bg-[#FFFAFA] transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-3">
                     <ArrowUpload24Regular className="w-6 h-6 text-[#999999]" />
                  </div>
                  <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-1">Choose a file or drag & drop it here</p>
                  <p className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">txt, docx, pdf, jpeg, xlsx - Up to 50MB</p>
                  <Button variant="outline" className="mt-4 h-8 text-[12px] font-['Manrope:SemiBold',sans-serif]">Browse files</Button>
               </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the requirement..."
                className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Regular',sans-serif] resize-none p-3"
                rows={3}
                value={newReq.description}
                onChange={(e) => setNewReq({...newReq, description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
             <div className="flex items-center gap-3">
                 <Button 
                    variant="ghost" 
                    onClick={() => setIsDialogOpen(false)}
                    className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRequirement}
                    className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]"
                  >
                    Create Requirement
                  </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function RequirementCard({ requirement }: { requirement: Requirement }) {
  const [approvalStatus, setApprovalStatus] = useState(requirement.approvalStatus);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]' };
      case 'medium': return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]' };
      case 'low': return { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
      default: return { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#D1D5DB]' };
    }
  };

  const getStatusBadge = (status: string) => {
    let icon;
    let color;
    let bgColor;
    let label;

    switch (status) {
      case 'in-progress':
        icon = <Clock24Regular className="w-3.5 h-3.5 animate-spin" />;
        color = 'text-[#2F80ED]';
        bgColor = 'bg-[#DBEAFE]';
        label = 'In Progress';
        break;
      case 'completed':
        icon = <CheckmarkCircle24Regular className="w-3.5 h-3.5 animate-[bounce_2s_ease-in-out_infinite]" />;
        color = 'text-[#0F9D58]';
        bgColor = 'bg-[#E8F5E9]';
        label = 'Completed';
        break;
      case 'delayed':
        icon = <Clock24Regular className="w-3.5 h-3.5 animate-pulse" />;
        color = 'text-[#EB5757]';
        bgColor = 'bg-[#FEE2E2]';
        label = 'Delayed';
        break;
      default:
        icon = <Clock24Regular className="w-3.5 h-3.5" />;
        color = 'text-[#6B7280]';
        bgColor = 'bg-[#F3F4F6]';
        label = 'To Do';
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center justify-center w-7 h-7 rounded-full ${bgColor} ${color} border border-current/10 cursor-help transition-transform hover:scale-110`}>
              {icon}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const priorityColors = getPriorityColor(requirement.priority);

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovalStatus('approved');
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovalStatus('rejected');
  };

  return (
    <div className="group bg-white border border-[#EEEEEE] rounded-[24px] p-6 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[16px] text-[#111111] group-hover:text-[#ff3b3b] transition-colors line-clamp-1">
              {requirement.title}
            </h3>
          </div>
          <p className="text-[12px] text-[#999999] font-['Inter:Regular',sans-serif]">
            {requirement.company} • {requirement.client}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full border ${priorityColors.bg} ${priorityColors.border}`}>
            <p className={`text-[11px] font-['Manrope:SemiBold',sans-serif] ${priorityColors.text} uppercase`}>
              {requirement.priority}
            </p>
          </div>
          {getStatusBadge(requirement.status)}
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] mb-4 line-clamp-2">
        {requirement.description}
      </p>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[#666666] font-['Inter:Medium',sans-serif]">
            Progress: {requirement.tasksCompleted}/{requirement.tasksTotal} tasks
          </span>
          <span className="text-[11px] text-[#111111] font-['Inter:Bold',sans-serif]">
            {requirement.progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              requirement.status === 'completed' 
                ? 'bg-gradient-to-r from-[#4CAF50] to-[#81C784]' 
                : requirement.status === 'delayed'
                ? 'bg-gradient-to-r from-[#EF5350] to-[#E57373]'
                : 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]'
            }`}
            style={{ width: `${requirement.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[#EEEEEE] flex items-center justify-between">
        <div className="flex -space-x-2">
          {requirement.assignedTo.slice(0, 3).map((person, i) => (
            <div 
              key={i} 
              className="w-7 h-7 rounded-full bg-[#F7F7F7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#666666] relative z-[3] hover:z-10 hover:scale-110 transition-all"
              title={person}
            >
              {person.charAt(0)}
            </div>
          ))}
          {requirement.assignedTo.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-[#F7F7F7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#666666] relative z-[1]">
              +{requirement.assignedTo.length - 3}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {requirement.type === 'outsourced' && approvalStatus === 'pending' ? (
            <div className="flex gap-2">
              <button 
                onClick={handleReject}
                className="p-1.5 rounded-full hover:bg-[#FFEBEE] text-[#D32F2F] transition-colors"
                title="Reject"
              >
                <Dismiss24Filled className="w-4 h-4" />
              </button>
              <button 
                onClick={handleApprove}
                className="p-1.5 rounded-full hover:bg-[#E8F5E9] text-[#388E3C] transition-colors"
                title="Approve"
              >
                <Checkmark24Filled className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#999999]">
              <Tag24Regular className="w-4 h-4" />
              <span className="text-[11px] font-['Inter:Medium',sans-serif]">
                {requirement.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}