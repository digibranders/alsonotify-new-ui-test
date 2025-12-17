'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { 
  Check, X, Calendar as CalendarIcon, Clock, CheckCircle, CheckSquare, Users, Trash2, 
  ChevronDown, ChevronLeft, ChevronRight, FilePlus, Edit, Receipt, MoreHorizontal, Play, XCircle, RotateCcw 
} from 'lucide-react';
import { Modal, Button, Input, Select, Tooltip, message, Popover, DatePicker, Checkbox } from 'antd';
import { useWorkspaces, useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useApproveRequirement } from '@/hooks/useWorkspace';
import { getRequirementsByWorkspaceId } from '@/services/workspace';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, isPast, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Helper functions for date presets (moved outside component to avoid dependency issues)
const getPresetDateRangeHelper = (preset: string, now: Date): [Date, Date] | null => {
  let from: Date, to: Date;
  
  switch (preset) {
    case "This week":
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      return [from, to];
    case "This month":
      from = startOfMonth(now);
      to = endOfMonth(now);
      return [from, to];
    case "Last Month":
      const lastMonth = subMonths(now, 1);
      from = startOfMonth(lastMonth);
      to = endOfMonth(lastMonth);
      return [from, to];
    case "This Year":
      from = startOfYear(now);
      to = endOfYear(now);
      return [from, to];
    default:
      return null;
  }
};

const datesMatchHelper = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

interface Requirement {
  id: number;
  title: string;
  description: string;
  company: string;
  client: string;
  assignedTo: string[];
  dueDate: string;
  createdDate: string;
  startDate?: string;
  priority: 'high' | 'medium' | 'low';
  type: 'inhouse' | 'outsourced' | 'client';
  status: 'in-progress' | 'completed' | 'delayed' | 'draft';
  category: string;
  departments?: string[];
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  workspaceId: number;
  workspace: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  invoiceStatus?: 'paid' | 'billed';
  estimatedCost?: number;
  budget?: number;
  hourlyRate?: number;
  estimatedHours?: number;
  pricingModel?: 'hourly' | 'project';
  contactPerson?: string;
  rejectionReason?: string;
}

// Quotation Dialog Component
function QuotationDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  pricingModel
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onConfirm: (data: { cost?: number, rate?: number, hours?: number }) => void;
  pricingModel?: 'hourly' | 'project';
}) {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [hours, setHours] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setRate('');
      setHours('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (pricingModel === 'hourly') {
      if (!rate || !hours) {
        message.error("Please enter rate and hours");
        return;
      }
      onConfirm({ 
        rate: parseFloat(rate), 
        hours: parseFloat(hours),
        cost: parseFloat(rate) * parseFloat(hours)
      });
    } else {
      if (!amount) {
        message.error("Please enter an amount");
        return;
      }
      onConfirm({ cost: parseFloat(amount) });
    }
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleConfirm}
      title="Submit Quotation"
      okText="Send Quotation"
      cancelText="Cancel"
      okButtonProps={{ className: 'bg-[#111111] hover:bg-[#000000]/90' }}
      width={400}
      centered
    >
      <div className="space-y-4 py-4">
        <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">
          Please provide the final quotation details for this {pricingModel === 'hourly' ? 'hourly' : 'project'} requirement.
        </p>
        {pricingModel === 'hourly' ? (
          <>
            <div className="space-y-2">
              <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Confirmed Hourly Rate ($)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="h-11 rounded-lg"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Estimated Hours</label>
              <Input 
                type="number" 
                placeholder="0" 
                className="h-11 rounded-lg"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="pt-2 border-t border-[#EEEEEE] flex justify-between items-center">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Total Estimated:</span>
              <span className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#ff3b3b]">
                ${((parseFloat(rate) || 0) * (parseFloat(hours) || 0)).toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Total Project Cost ($)</label>
            <Input 
              type="number" 
              placeholder="0.00" 
              className="h-11 rounded-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// Reject Dialog Component
function RejectDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason) {
      message.error("Please enter a reason");
      return;
    }
    onConfirm(reason);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleConfirm}
      title="Reject Requirement"
      okText="Reject"
      cancelText="Cancel"
      okButtonProps={{ className: 'bg-[#ff3b3b] hover:bg-[#d93232]' }}
      width={400}
      centered
    >
      <div className="space-y-4 py-4">
        <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">
          Please provide a reason for rejecting this requirement. It will be moved to drafts.
        </p>
        <div className="space-y-2">
          <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Reason</label>
          <TextArea 
            placeholder="e.g. Budget too low, Out of scope..." 
            className="min-h-[100px] rounded-lg resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </Modal>
  );
}

export function RequirementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createRequirementMutation = useCreateRequirement();
  const updateRequirementMutation = useUpdateRequirement();
  const deleteRequirementMutation = useDeleteRequirement();
  const approveRequirementMutation = useApproveRequirement();

  // Fetch all workspaces first to get requirements for each
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useWorkspaces();

  // Get all workspace IDs
  const workspaceIds = useMemo(() => {
    return workspacesData?.result?.projects?.map((w: any) => w.id) || [];
  }, [workspacesData]);

  // Fetch requirements for all workspaces
  const requirementQueries = useQueries({
    queries: workspaceIds.map((id: number) => ({
      queryKey: ['requirements', id],
      queryFn: () => getRequirementsByWorkspaceId(id),
      enabled: !!id && workspaceIds.length > 0,
    })),
  });

  const isLoadingRequirements = requirementQueries.some(q => q.isLoading);
  const isLoading = isLoadingWorkspaces || isLoadingRequirements;

  // Helper function to strip HTML tags from text
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    if (typeof document !== 'undefined') {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const stripped = tmp.textContent || tmp.innerText || '';
      return stripped.trim();
    }
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' | 'draft' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed')) return 'delayed';
    if (statusLower.includes('draft')) return 'draft';
    return 'in-progress';
  };

  // Combine all requirements
  const allRequirements = useMemo(() => {
    const combined: any[] = [];
    requirementQueries.forEach((query) => {
      if (query.data?.result) {
        combined.push(...query.data.result);
      }
    });
    return combined;
  }, [requirementQueries]);

  // Create a map of workspace ID to workspace data for client/company lookup
  // Workspace API returns: { client: {id, name}, client_company_name, company_name }
  const workspaceMap = useMemo(() => {
    const map = new Map<number, any>();
    workspacesData?.result?.projects?.forEach((w: any) => {
      map.set(w.id, w);
    });
    return map;
  }, [workspacesData]);

  // Transform backend data to UI format with placeholder/mock data where API data is not available
  const requirements = useMemo(() => {
    return allRequirements.map((req: any) => {
      // Get workspace data for this requirement to access client/company information
      // NOTE: The requirement API (getRequirements.sql) doesn't include project/client data
      // It only returns: requirement fields, department, manager, leader, created_user, approved_by
      // So we must get client/company from the workspace data we already fetched
      const workspace = workspaceMap.get(req.project_id);
      
      // PLACEHOLDER DATA: Invoice status - not directly available in requirement API
      // In real implementation, this would come from a separate invoice API or join query
      const mockInvoiceStatus = req.invoice_id 
        ? (req.invoice?.status === 'paid' ? 'paid' : req.invoice?.status === 'open' ? 'billed' : undefined)
        : undefined;
      
      // PLACEHOLDER DATA: Contact person for outsourced requirements (if not in API)
      const mockContactPerson = req.type === 'outsourced' && !req.contact_person
        ? 'External Vendor' // Placeholder - would need separate API call to get vendor contacts
        : req.contact_person;

      // PLACEHOLDER DATA: Pricing model - infer from available data if not explicitly set
      const mockPricingModel = req.pricing_model || (req.hourly_rate ? 'hourly' : 'project');

      // PLACEHOLDER DATA: Rejection reason - may not be stored in requirement table
      const mockRejectionReason = req.status?.toLowerCase().includes('rejected') && !req.rejection_reason
        ? 'Requirement was rejected during review process' // Placeholder - would need separate field or table
        : req.rejection_reason;

      // Get client name from workspace data
      // Workspace API structure: { client: {id, name}, client_company_name: string, company_name: string }
      // Match the pattern used in WorkspacePage.tsx line 85
      const clientName = workspace?.client?.name || workspace?.client_company_name || null;
      
      // Get company name from workspace data (agency/company name)
      const companyName = workspace?.company_name || 'Internal';
      
      // Department: Only use actual department name if it exists, don't default to 'General'
      // The old frontend (Requirements.tsx line 772) only shows department tag if record.department?.name exists
      // API returns department as JSON {id, name} or NULL (see getRequirements.sql line 13-20)
      const departmentName = req.department?.name || null;

      return {
        id: req.id,
        title: req.name || req.title || 'Untitled Requirement',
        description: stripHtmlTags(req.description || 'No description provided'),
        company: companyName,
        // Client: Get from workspace data, not from req.project (which doesn't exist in API response)
        // Only show 'N/A' if workspace exists but has no client (in-house project)
        client: clientName || (workspace ? 'N/A' : 'N/A'),
        assignedTo: req.manager ? [req.manager.name] : req.leader ? [req.leader.name] : [],
        dueDate: req.end_date ? format(new Date(req.end_date), 'dd-MMM-yyyy') : 'TBD',
        startDate: req.start_date ? format(new Date(req.start_date), 'dd-MMM-yyyy') : undefined,
        createdDate: req.start_date ? format(new Date(req.start_date), 'dd-MMM-yyyy') : 'TBD',
        priority: (req.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
        type: (req.type || 'inhouse') as 'inhouse' | 'outsourced' | 'client',
        status: mapRequirementStatus(req.status),
        // Department: Only show if it exists, don't default to 'General'
        // Use null for category if no department - this prevents 'General' from appearing
        category: departmentName || null,
        departments: departmentName ? [departmentName] : [], // Empty array if no department (don't show 'General' tag)
        progress: req.progress || 0,
        tasksCompleted: req.total_tasks ? Math.floor(req.total_tasks * (req.progress || 0) / 100) : 0,
        tasksTotal: req.total_tasks || 0,
        workspaceId: req.project_id,
        workspace: workspace?.name || 'Unknown Workspace',
        approvalStatus: (req.approved_by ? 'approved' : (req.status?.toLowerCase().includes('pending') ? 'pending' : undefined)) as 'pending' | 'approved' | 'rejected' | undefined,
        // Invoice status - placeholder if not available from API
        invoiceStatus: mockInvoiceStatus as 'paid' | 'billed' | undefined,
        // Pricing and cost information - use placeholder values if not available
        estimatedCost: req.estimated_cost || (req.budget || undefined),
        budget: req.budget || undefined,
        hourlyRate: req.hourly_rate || undefined,
        estimatedHours: req.estimated_hours || undefined,
        pricingModel: mockPricingModel as 'hourly' | 'project' | undefined,
        // Contact person for outsourced requirements - placeholder if not available
        contactPerson: mockContactPerson,
        // Rejection reason - placeholder if not available
        rejectionReason: mockRejectionReason,
      };
    });
  }, [allRequirements, workspaceMap]);

  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReqs, setSelectedReqs] = useState<number[]>([]);
  
  // Date Picker State
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [dateLabel, setDateLabel] = useState<string>("All time");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [dateView, setDateView] = useState<'presets' | 'calendar'>('presets');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  // Quotation Dialog State
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [pendingReqId, setPendingReqId] = useState<number | null>(null);

  const [filters, setFilters] = useState<Record<string, string>>({
    type: 'All',
    billing: 'All',
    category: 'All',
    priority: 'All',
    client: 'All',
    assignee: 'All'
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | undefined>(undefined);
  const [newReq, setNewReq] = useState({
    title: '',
    description: '',
    workspace: undefined as string | undefined,
    priority: undefined as 'high' | 'medium' | 'low' | undefined,
    dueDate: '',
  });

  const handleEditDraft = (req: Requirement) => {
    setEditingReq(req);
    setNewReq({
      title: req.title,
      description: req.description,
      workspace: req.workspaceId.toString(),
      priority: req.priority,
      dueDate: req.dueDate !== 'TBD' ? req.dueDate : '',
    });
    setIsDialogOpen(true);
  };
  
  const handleOpenCreate = () => {
    setEditingReq(undefined);
    setNewReq({
      title: '',
      description: '',
      workspace: undefined,
      priority: undefined,
      dueDate: '',
    });
    setIsDialogOpen(true);
  };

  const handleCreateRequirement = async () => {
    if (!newReq.title) {
      message.error("Requirement title is required");
      return;
    }

    const selectedWorkspace = workspacesData?.result?.projects?.find(
      (w: any) => w.id.toString() === newReq.workspace
    );

    if (!selectedWorkspace && newReq.workspace) {
      message.error("Selected workspace not found");
      return;
    }

    if (!selectedWorkspace && workspaceIds.length === 0) {
      message.error("No workspace available");
      return;
    }

    const workspaceId = selectedWorkspace?.id || workspaceIds[0];

    if (editingReq) {
      // Update existing requirement
      updateRequirementMutation.mutate(
        {
          id: editingReq.id,
          project_id: workspaceId,
          name: newReq.title,
          description: newReq.description || '',
          end_date: newReq.dueDate ? new Date(newReq.dueDate).toISOString() : undefined,
          priority: newReq.priority?.toUpperCase() || 'MEDIUM',
          high_priority: newReq.priority === 'high',
        } as any,
        {
          onSuccess: () => {
            message.success("Requirement updated successfully!");
            setIsDialogOpen(false);
            setEditingReq(undefined);
            setNewReq({
              title: '',
              description: '',
              workspace: undefined,
              priority: undefined,
              dueDate: '',
            });
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to update requirement";
            message.error(errorMessage);
          },
        }
      );
    } else {
      // Create new requirement
      createRequirementMutation.mutate(
        {
          project_id: workspaceId,
          name: newReq.title,
          description: newReq.description || '',
          start_date: new Date().toISOString(),
          end_date: newReq.dueDate ? new Date(newReq.dueDate).toISOString() : undefined,
          status: 'Assigned',
          priority: newReq.priority?.toUpperCase() || 'MEDIUM',
          high_priority: newReq.priority === 'high',
        } as any,
        {
          onSuccess: () => {
            message.success("Requirement created successfully!");
            setIsDialogOpen(false);
            setNewReq({
              title: '',
              description: '',
              workspace: undefined,
              priority: undefined,
              dueDate: '',
            });
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to create requirement";
            message.error(errorMessage);
          },
        }
      );
    }
  };

  // Date Presets
  const datePresets = [
    "This week",
    "This month",
    "Last Month",
    "This Year",
    "All time",
    "Custom"
  ];

  // Helper function to get date range for a preset
  const getPresetDateRange = (preset: string): [Date, Date] | null => {
    return getPresetDateRangeHelper(preset, new Date());
  };

  // Update label when dateRange changes or dropdown opens
  const updateDateLabel = useCallback((range: [Dayjs | null, Dayjs | null] | null) => {
    // Detect which preset matches the current dateRange
    let detectedPreset: string | null = null;
    if (range && range[0] && range[1]) {
      const from = range[0].toDate();
      const to = range[1].toDate();

      // Check each preset
      for (const preset of ["This week", "This month", "Last Month", "This Year"]) {
        const presetRange = getPresetDateRangeHelper(preset, new Date());
        if (presetRange && datesMatchHelper(from, presetRange[0]) && datesMatchHelper(to, presetRange[1])) {
          detectedPreset = preset;
          break;
        }
      }
    } else {
      detectedPreset = "All time";
    }

    if (detectedPreset) {
      setDateLabel(detectedPreset);
    } else if (range && range[0] && range[1]) {
      // Custom range - show formatted dates
      setDateLabel(`${format(range[0].toDate(), "MMM d")} - ${format(range[1].toDate(), "MMM d")}`);
    } else {
      setDateLabel("All time");
    }
  }, []);

  const handleSelectDatePreset = (preset: string) => {
    if (preset === "Custom") {
      // Switch to calendar view
      setDateView('calendar');
      // If we already have a custom range, use it; otherwise reset
      if (dateRange && dateRange[0] && dateRange[1]) {
        setStartDate(dateRange[0]);
        setEndDate(dateRange[1]);
        setCurrentMonth(dateRange[0]);
      } else {
        setStartDate(null);
        setEndDate(null);
        setCurrentMonth(dayjs());
      }
      // Don't close the popover - let user select custom range
    } else {
      setDateView('presets');
      if (preset === "All time") {
        setDateRange(null);
        setDateLabel("All time");
        setStartDate(null);
        setEndDate(null);
      } else {
        const presetRange = getPresetDateRange(preset);
        if (presetRange) {
          const newRange: [Dayjs, Dayjs] = [dayjs(presetRange[0]), dayjs(presetRange[1])];
          setDateRange(newRange);
          setDateLabel(preset);
          setStartDate(newRange[0]);
          setEndDate(newRange[1]);
        }
      }
      setIsDateOpen(false);
    }
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const days: Dayjs[] = [];
    let current = start;
    while (current.isSameOrBefore(end, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }
    return days;
  };

  // Check if date is in selected range (for highlighting)
  const isDateInRange = (date: Dayjs) => {
    if (!startDate || !endDate) {
      // If only start date is selected, don't highlight range yet
      return false;
    }
    const start = startDate.isBefore(endDate) ? startDate : endDate;
    const end = startDate.isBefore(endDate) ? endDate : startDate;
    return date.isAfter(start.startOf('day')) && date.isBefore(end.endOf('day'));
  };

  // Check if date is start or end of range
  const isDateStartOrEnd = (date: Dayjs) => {
    if (!startDate || !endDate) {
      // If only start date is selected, highlight it
      if (startDate) {
        return date.isSame(startDate, 'day');
      }
      return false;
    }
    return date.isSame(startDate, 'day') || date.isSame(endDate, 'day');
  };

  // Handle Manual Date Selection (custom calendar)
  const handleDateClick = (date: Dayjs) => {
    if (!startDate || (startDate && endDate)) {
      // First click or reset: set start date
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Second click: set end date
      let finalStart = startDate;
      let finalEnd = date;
      
      if (date.isBefore(startDate)) {
        // If clicked date is before start, swap them
        finalStart = date;
        finalEnd = startDate;
      }
      
      // Set the range and close calendar
      setStartDate(finalStart);
      setEndDate(finalEnd);
      const newRange: [Dayjs, Dayjs] = [finalStart, finalEnd];
      setDateRange(newRange);
      updateDateLabel(newRange);
      setIsDateOpen(false);
      setDateView('presets');
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    updateDateLabel(dates);
    setIsDateOpen(false);
    setDateView('presets'); // Reset to presets view after selection
  };

  // Reset date view when popover closes and update label when opening
  useEffect(() => {
    if (!isDateOpen) {
      // Small delay to allow animations
      const timer = setTimeout(() => {
        setDateView('presets');
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // When opening, update label to reflect current selection
      updateDateLabel(dateRange);
      // Sync startDate and endDate with dateRange when opening
      if (dateRange && dateRange[0] && dateRange[1]) {
        setStartDate(dateRange[0]);
        setEndDate(dateRange[1]);
        setCurrentMonth(dateRange[0]);
      }
    }
  }, [isDateOpen, dateRange, updateDateLabel]);

  // Filter Logic:
  // 1. First apply all filters EXCEPT the Status Tab
  const baseFilteredReqs = requirements.filter(req => {
    // Type
    const typeMatch = filters.type === 'All' || 
                      (filters.type === 'In-house' && req.type === 'inhouse') ||
                      (filters.type === 'Outsourced' && req.type === 'outsourced') ||
                      (filters.type === 'Client Work' && req.type === 'client');
    
    // Billing Status
    let billingMatch = true;
    if (filters.billing !== 'All') {
        if (filters.billing === 'Paid') {
            billingMatch = req.invoiceStatus === 'paid';
        } else if (filters.billing === 'Invoiced') {
            billingMatch = req.invoiceStatus === 'billed';
        } else if (filters.billing === 'Ready to Bill') {
            billingMatch = req.status === 'completed' && !req.invoiceStatus;
        }
    }

    // Priority
    const priorityMatch = filters.priority === 'All' || req.priority === filters.priority.toLowerCase();

    // Client
    const clientMatch = filters.client === 'All' || req.client === filters.client;

    // Search
    const searchMatch = searchQuery === '' || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.client.toLowerCase().includes(searchQuery.toLowerCase());

    // Category - match if filter is 'All' or if requirement has the selected department
    const categoryMatch = filters.category === 'All' || 
      (filters.category && req.departments && req.departments.length > 0 && req.departments.includes(filters.category));

    // Assignee
    const assigneeMatch = filters.assignee === 'All' || (req.assignedTo && req.assignedTo.includes(filters.assignee));

    // Date Range Filter
    let dateMatch = true;
    if (dateRange && dateRange[0] && dateRange[1] && req.dueDate && req.dueDate !== 'TBD') {
        try {
            const due = new Date(req.dueDate);
            const from = dateRange[0].toDate();
            const to = dateRange[1].toDate();
            dateMatch = due >= from && due <= to;
        } catch {
            dateMatch = true;
        }
    }

    return typeMatch && billingMatch && priorityMatch && clientMatch && searchMatch && dateMatch && categoryMatch && assigneeMatch;
  });

  // 2. Apply Status Tab filter
  const finalFilteredReqs = baseFilteredReqs.filter(req => {
    if (activeStatusTab === 'draft') return req.status === 'draft';
    
    // Pending Tab: Includes both Incoming (Needs Approval) and Outgoing (Sent/Waiting)
    if (activeStatusTab === 'pending') return req.approvalStatus === 'pending';
    
    // Active Tab: Includes In Progress and Delayed
    if (activeStatusTab === 'active') return (req.status === 'in-progress' || req.status === 'delayed') && req.approvalStatus !== 'pending';
    
    // Completed Tab
    if (activeStatusTab === 'completed') return req.status === 'completed';
    
    // Fallback/All
    return true;
  });

  // Get unique clients for filter options
  const allClients = ['All', ...Array.from(new Set(requirements.map(r => r.client).filter(Boolean)))];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  
  // Get unique departments/categories - only include actual department names from requirements
  const allCategories = useMemo(() => {
    const depts = Array.from(new Set(requirements.flatMap(r => r.departments || []).filter(Boolean)));
    // Return 'All' plus actual department names (no 'General' placeholder)
    return ['All', ...depts];
  }, [requirements]);

  // Get unique assignees - add placeholder if no assignees available
  // PLACEHOLDER DATA: If no assignees exist, show "Unassigned" option
  const allAssignees = useMemo(() => {
    const assignees = Array.from(new Set(requirements.flatMap(r => r.assignedTo || [])));
    // Add placeholder if no assignees found
    if (assignees.length === 0) {
      return ['All', 'Unassigned'];
    }
    return ['All', ...assignees];
  }, [requirements]);
  
  const filterOptions: FilterOption[] = [
    { id: 'type', label: 'Type', options: ['All', 'In-house', 'Outsourced', 'Client Work'], placeholder: 'Type' },
    // Only show Billing filter when on Completed tab
    ...(activeStatusTab === 'completed' ? [{ id: 'billing', label: 'Billing', options: ['All', 'Ready to Bill', 'Invoiced', 'Paid'], placeholder: 'Billing Status' }] : []),
    { id: 'priority', label: 'Priority', options: priorities, placeholder: 'Priority' },
    { id: 'client', label: 'Client', options: allClients, placeholder: 'Client' },
    { id: 'category', label: 'Department', options: allCategories, placeholder: 'Department' },
    { id: 'assignee', label: 'Assigned To', options: allAssignees, placeholder: 'Assignee' }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'All',
      billing: 'All',
      priority: 'All',
      client: 'All',
      category: 'All',
      assignee: 'All'
    });
    setSearchQuery('');
    setDateRange(null);
    setDateLabel('All time');
    setDateView('presets');
  };

  const toggleSelect = (id: number) => {
    if (selectedReqs.includes(id)) {
        setSelectedReqs(selectedReqs.filter(reqId => reqId !== id));
    } else {
        setSelectedReqs([...selectedReqs, id]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedReqs.map(id => {
        const req = requirements.find(r => r.id === id);
        if (!req) return Promise.resolve();
        return deleteRequirementMutation.mutateAsync({ id, project_id: req.workspaceId });
      });
      await Promise.all(deletePromises);
      message.success(`Deleted ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete requirements");
    }
  };

  const handleBulkComplete = async () => {
    try {
      const updatePromises = selectedReqs.map(id => {
        const req = requirements.find(r => r.id === id);
        if (!req) return Promise.resolve();
        return updateRequirementMutation.mutateAsync({
          id,
          project_id: req.workspaceId,
          status: 'Completed',
        } as any);
      });
      await Promise.all(updatePromises);
      message.success(`Marked ${selectedReqs.length} requirement(s) as completed`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to update requirements");
    }
  };

  const handleBulkApprove = async () => {
    try {
      const approvePromises = selectedReqs.map(id => 
        approveRequirementMutation.mutateAsync({ requirement_id: id, status: "Assigned" })
      );
      await Promise.all(approvePromises);
      message.success(`Approved ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to approve requirements");
    }
  };

  const handleBulkReject = async () => {
    try {
      const rejectPromises = selectedReqs.map(id => 
        approveRequirementMutation.mutateAsync({ requirement_id: id, status: "Rejected" })
      );
      await Promise.all(rejectPromises);
      message.success(`Rejected ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to reject requirements");
    }
  };

  const handleBulkSubmit = async () => {
    try {
      // Submit for approval by updating status to pending
      const updatePromises = selectedReqs.map(id => {
        const req = requirements.find(r => r.id === id);
        if (!req) return Promise.resolve();
        return updateRequirementMutation.mutateAsync({
          id,
          project_id: req.workspaceId,
          status: 'Assigned', // This will trigger pending approval
        } as any);
      });
      await Promise.all(updatePromises);
      message.success(`Submitted ${selectedReqs.length} requirement(s) for approval`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to submit requirements");
    }
  };

  const handleBulkReopen = async () => {
    try {
      const updatePromises = selectedReqs.map(id => {
        const req = requirements.find(r => r.id === id);
        if (!req) return Promise.resolve();
        return updateRequirementMutation.mutateAsync({
          id,
          project_id: req.workspaceId,
          status: 'Assigned', // Reopen by setting back to assigned/in-progress
        } as any);
      });
      await Promise.all(updatePromises);
      message.success(`Reopened ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to reopen requirements");
    }
  };

  const handleBulkAssign = async (person: string) => {
    try {
      // PLACEHOLDER DATA: Bulk assignment requires mapping person name to user ID
      // In real implementation, you'd fetch user list from API and map names to IDs
      // For now, using placeholder logic - would need manager_id or leader_id from person name
      const updatePromises = selectedReqs.map(id => {
        const req = requirements.find(r => r.id === id);
        if (!req) return Promise.resolve();
        // TODO: Map person name to actual user ID (manager_id or leader_id)
        // This would require a separate API call to get user list
        return updateRequirementMutation.mutateAsync({
          id,
          project_id: req.workspaceId,
          // manager_id or leader_id would be set here based on person selection
        } as any);
      });
      await Promise.all(updatePromises);
      message.success(`Assigned ${person} to ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to assign requirements");
    }
  };

  const handleReqAccept = (id: number) => {
    setPendingReqId(id);
    setIsQuotationOpen(true);
  };

  const handleReqReject = (id: number) => {
    setPendingReqId(id);
    setIsRejectOpen(true);
  };

  const handleQuotationConfirm = async (data: { cost?: number, rate?: number, hours?: number }) => {
    if (!pendingReqId) return;
    
    try {
      const req = requirements.find(r => r.id === pendingReqId);
      if (!req) {
        message.error("Requirement not found");
        return;
      }

      // Update requirement with quotation details and approve it
      await updateRequirementMutation.mutateAsync({
        id: pendingReqId,
        project_id: req.workspaceId,
        estimated_cost: data.cost,
        hourly_rate: data.rate,
        estimated_hours: data.hours,
      } as any);

      // Approve the requirement
      await approveRequirementMutation.mutateAsync({
        requirement_id: pendingReqId,
        status: "Assigned"
      });

      message.success("Requirement accepted and quotation sent");
      setPendingReqId(null);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to accept requirement");
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!pendingReqId) return;
    
    try {
      await approveRequirementMutation.mutateAsync({
        requirement_id: pendingReqId,
        status: "Rejected"
      });
      
      message.success("Requirement rejected and moved to drafts");
      setPendingReqId(null);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to reject requirement");
    }
  };

  // Tabs Configuration
  const tabs = [
    { id: 'draft', label: 'Drafts', count: baseFilteredReqs.filter(r => r.status === 'draft').length },
    { id: 'pending', label: 'Pending', count: baseFilteredReqs.filter(r => r.approvalStatus === 'pending').length },
    { id: 'active', label: 'Active', count: baseFilteredReqs.filter(r => (r.status === 'in-progress' || r.status === 'delayed') && r.approvalStatus !== 'pending').length },
    { id: 'completed', label: 'Completed', count: baseFilteredReqs.filter(r => r.status === 'completed').length },
  ];

  // Date Filter Component
  const DateFilter = (
    <Popover
      open={isDateOpen}
      onOpenChange={setIsDateOpen}
      trigger="click"
      placement="bottomRight"
      overlayClassName={dateView === 'calendar' ? 'date-range-popover-calendar' : 'date-range-popover-presets'}
      overlayInnerStyle={dateView === 'calendar' ? {
        padding: 0,
        backgroundColor: 'transparent',
        boxShadow: 'none',
      } : undefined}
      overlayStyle={dateView === 'calendar' ? {
        padding: 0,
      } : undefined}
      content={
        <div className="w-auto">
          {dateView === 'calendar' ? (
            <div className="bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg w-[280px] p-3">
              {/* Select Range Header */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setDateView('presets');
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-[#F7F7F7] rounded transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#666666]" />
                </button>
                <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                  Select Range
                </h4>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                  className="w-7 h-7 rounded-lg bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#111111]" />
                </button>
                <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">
                  {currentMonth.format('MMMM YYYY')}
                </h4>
                <button
                  onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                  className="w-7 h-7 rounded-lg bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#111111]" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center text-[11px] font-['Manrope:Regular',sans-serif] text-[#999999] py-0.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = date.month() === currentMonth.month();
                  const isInRange = isDateInRange(date);
                  const isStartOrEnd = isDateStartOrEnd(date);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        w-8 h-8 rounded-lg text-[12px] font-['Manrope:Regular',sans-serif] transition-colors
                        ${!isCurrentMonth ? 'text-[#CCCCCC]' : 'text-[#111111]'}
                        ${isStartOrEnd 
                          ? 'bg-[#111111] text-white' 
                          : isInRange 
                            ? 'bg-[#F7F7F7]' 
                            : 'hover:bg-[#F7F7F7]'
                        }
                      `}
                    >
                      {date.date()}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-1 min-w-[140px]">
              {datePresets.map((preset) => {
                // Highlight the active preset
                const isActive = 
                  (preset === "All time" && !dateRange) ||
                  (preset !== "All time" && preset !== "Custom" && dateLabel === preset);
                
                return (
                  <button
                    key={preset}
                    onClick={() => handleSelectDatePreset(preset)}
                    className={`text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${
                      isActive 
                        ? 'text-[#ff3b3b] font-medium bg-gray-50' 
                        : 'text-[#111111]'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    >
      <button className="h-9 px-3 text-[12px] font-medium rounded-lg bg-white border border-[#EEEEEE] hover:border-[#ff3b3b] hover:text-[#ff3b3b] transition-all flex items-center gap-2 outline-none min-w-[140px] justify-between">
        <span className="truncate">{dateLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
    </Popover>
  );

  return (
    <PageLayout
      title="Requirements"
      titleAction={{
        onClick: handleOpenCreate
      }}
      tabs={tabs}
      activeTab={activeStatusTab}
      onTabChange={setActiveStatusTab}
      customFilters={DateFilter}
    >
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

      {/* Requirements Content */}
      <div className="flex-1 min-h-0 relative">
        <div className="h-full overflow-y-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {finalFilteredReqs.map((requirement) => (
              <RequirementCard 
                key={requirement.id} 
                requirement={requirement} 
                selected={selectedReqs.includes(requirement.id)}
                onSelect={() => toggleSelect(requirement.id)}
                onAccept={() => handleReqAccept(requirement.id)}
                onReject={() => handleReqReject(requirement.id)}
                onEdit={() => handleEditDraft(requirement)}
                onNavigate={() => router.push(`/dashboard/workspace/${requirement.workspaceId}/requirements/${requirement.id}`)}
              />
            ))}
          </div>

          {finalFilteredReqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
                {isLoading ? "Loading requirements..." : "No requirements found"}
              </p>
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        {selectedReqs.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2 border-r border-white/20 pr-6">
              <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {selectedReqs.length}
              </div>
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Context Aware Actions */}
              {activeStatusTab === 'draft' && (
                <Tooltip title="Submit for Approval">
                  <button onClick={handleBulkSubmit} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#4CAF50]">
                    <Play className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              {activeStatusTab === 'pending' && (
                <>
                  <Tooltip title="Approve">
                    <button onClick={handleBulkApprove} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#4CAF50]">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <button onClick={handleBulkReject} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </>
              )}

              {activeStatusTab === 'active' && (
                <Tooltip title="Mark as Completed">
                  <button onClick={handleBulkComplete} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#4CAF50]">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              {activeStatusTab === 'completed' && (
                <Tooltip title="Reopen">
                  <button onClick={handleBulkReopen} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              {/* Common Actions */}
              <Popover
                content={
                  <div className="w-48">
                    {/* PLACEHOLDER DATA: Assignee list - in real app, fetch from users/employees API */}
                    {/* This would typically come from useEmployees or useUsers hook */}
                    {['Satyam Yadav', 'Siddique Ahmed', 'Pranita Kadav', 'Vikrant Sontakke'].map(person => (
                      <button
                        key={person}
                        onClick={() => handleBulkAssign(person)}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded"
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                }
                trigger="click"
                placement="top"
              >
                <Tooltip title="Assign To">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Users className="w-4 h-4" />
                  </button>
                </Tooltip>
              </Popover>

              <Tooltip title="Delete Requirements">
                <button onClick={handleBulkDelete} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            
            <button onClick={() => setSelectedReqs([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Requirement Modal - Using existing modal structure */}
      <Modal
        open={isDialogOpen}
        onCancel={() => {
          setIsDialogOpen(false);
          setEditingReq(undefined);
        }}
        footer={null}
        width={650}
        centered
        className="rounded-[16px] overflow-hidden"
      >
        <div className="p-0">
          <div className="mb-6 pb-2">
            <div className="flex items-center gap-3 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              <div className="p-2.5 rounded-full bg-[#F7F7F7]">
                <FilePlus className="w-5 h-5 text-[#666666]" />
              </div>
              {editingReq ? 'Edit Requirement' : 'Create New Requirement'}
            </div>
            <p className="text-[14px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-[52px] mt-1">
              {editingReq ? 'Update and resubmit the requirement.' : 'Define a new requirement for the team'}
            </p>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Row 1: Title & Workspace */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Title</span>
                <Input
                  placeholder="Requirement title"
                  className="h-[46px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Medium',sans-serif]"
                  value={newReq.title}
                  onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Workspace</span>
                <Select
                  className="w-full h-[46px] custom-modal-select"
                  placeholder="Select workspace"
                  variant="borderless"
                  value={newReq.workspace || undefined}
                  onChange={(v) => setNewReq({ ...newReq, workspace: String(v) })}
                  style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                >
                  {workspacesData?.result?.projects?.map((w: any) => (
                    <Option key={w.id} value={w.id.toString()}>{w.name}</Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Row 2: Priority & Due Date */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Priority</span>
                <Select
                  className="w-full h-[46px] custom-modal-select"
                  placeholder="Select priority"
                  variant="borderless"
                  value={newReq.priority || undefined}
                  onChange={(v) => setNewReq({ ...newReq, priority: String(v) as 'high' | 'medium' | 'low' })}
                  style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                >
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Due Date</span>
                <Input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  onFocus={(e) => e.target.type = 'date'}
                  onBlur={(e) => e.target.type = 'text'}
                  className="h-[46px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Medium',sans-serif]"
                  value={newReq.dueDate}
                  onChange={(e) => setNewReq({ ...newReq, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="space-y-2">
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Description</span>
              <TextArea
                placeholder="Requirement details..."
                className="min-h-[120px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Regular',sans-serif] resize-none p-4"
                rows={4}
                value={newReq.description}
                onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 mt-8">
            <button
              onClick={() => {
                setIsDialogOpen(false);
                setEditingReq(undefined);
                setNewReq({
                  title: '',
                  description: '',
                  workspace: undefined,
                  priority: undefined,
                  dueDate: '',
                });
              }}
              className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRequirement}
              disabled={createRequirementMutation.isPending || updateRequirementMutation.isPending}
              className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingReq ? 'Update & Resubmit' : 'Save Requirement'}
            </button>
          </div>
        </div>
      </Modal>

      <QuotationDialog 
        open={isQuotationOpen} 
        onOpenChange={setIsQuotationOpen} 
        onConfirm={handleQuotationConfirm}
        pricingModel={requirements.find(r => r.id === pendingReqId)?.pricingModel}
      />
      <RejectDialog 
        open={isRejectOpen} 
        onOpenChange={setIsRejectOpen} 
        onConfirm={handleRejectConfirm}
      />
    </PageLayout>
  );
}

function RequirementCard({ 
  requirement, 
  selected, 
  onSelect, 
  onAccept, 
  onReject,
  onEdit,
  onNavigate
}: { 
  requirement: Requirement, 
  selected: boolean, 
  onSelect: () => void,
  onAccept?: () => void,
  onReject?: () => void,
  onEdit?: () => void,
  onNavigate?: () => void
}) {
  const isPending = requirement.approvalStatus === 'pending';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]' };
      case 'medium': return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]' };
      case 'low': return { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
      default: return { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#D1D5DB]' };
    }
  };

  const priorityColors = getPriorityColor(requirement.priority);

  const getUnifiedStatusConfig = () => {
    // 1. Billing / Financial Status (Highest Priority)
    if (requirement.invoiceStatus === 'paid') {
      return { 
        label: requirement.type === 'outsourced' ? 'Payment Cleared' : 'Payment Received', 
        icon: <CheckCircle className="w-3 h-3" />,
        className: 'bg-[#E8F5E9] text-[#0F9D58] border-[#A5D6A7]',
        onClick: null
      };
    }
    if (requirement.invoiceStatus === 'billed') {
      return { 
        label: requirement.type === 'outsourced' ? 'Invoice Received' : 'Invoice Sent', 
        icon: <CheckCircle className="w-3 h-3" />,
        className: 'bg-[#E3F2FD] text-[#2196F3] border-[#90CAF9]',
        onClick: null
      };
    }
    
    // 2. Project Status
    switch (requirement.status) {
      case 'completed':
        if (requirement.type === 'outsourced') {
          return { 
            label: 'Invoice Received', 
            icon: <Receipt className="w-3 h-3" />,
            className: 'bg-[#F3E5F5] text-[#9C27B0] border-[#E1BEE7]',
            onClick: null
          };
        }
        return { 
          label: 'Ready to Bill', 
          icon: <Receipt className="w-3 h-3" />,
          className: 'bg-[#FFF3E0] text-[#EF6C00] border-[#FFE0B2] cursor-pointer hover:bg-[#FFE0B2]',
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            // Navigate to invoices
          }
        };
      case 'in-progress':
        return { 
          label: 'In Progress', 
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-[#E3F2FD] text-[#2F80ED] border-[#90CAF9]',
          onClick: null
        };
      case 'delayed':
        return { 
          label: 'Delayed', 
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-[#FEE2E2] text-[#EB5757] border-[#FCA5A5]',
          onClick: null
        };
      case 'draft':
        return { 
          label: 'Draft', 
          icon: <FilePlus className="w-3 h-3" />,
          className: 'bg-[#F3F4F6] text-[#666666] border-[#D1D5DB]',
          onClick: null
        };
      default:
        return { 
          label: 'To Do', 
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]',
          onClick: null
        };
    }
  };

  const statusConfig = getUnifiedStatusConfig();

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept?.();
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReject?.();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const getTimelineStatus = (dueDate?: string) => {
    if (!dueDate || dueDate === 'TBD') return null;
    try {
      const due = new Date(dueDate);
      if (isPast(due) && !isToday(due)) {
        const daysOverdue = differenceInDays(new Date(), due);
        return { text: `Overdue by ${daysOverdue} days`, color: 'text-[#DC2626]' };
      }
      if (isToday(due)) return { text: 'Deadline today', color: 'text-[#F59E0B]' };
      const daysLeft = differenceInDays(due, new Date());
      return { text: `${daysLeft} days to deadline`, color: 'text-[#666666]' };
    } catch {
      return null;
    }
  };

  const timelineStatus = getTimelineStatus(requirement.dueDate);

  const getPendingStatusText = () => {
    if (requirement.type === 'outsourced') {
      // Use placeholder contact person if not available from API
      const contactName = requirement.contactPerson || 'External Vendor';
      return `Sent to ${contactName}. Awaiting quote...`;
    }
    if (requirement.type === 'client') {
      return `Client Request. Awaiting review...`;
    }
    return 'Waiting for approval...';
  };

  const getApproveButtonText = () => {
    if (requirement.type === 'outsourced') return 'Accept Quote';
    if (requirement.type === 'client') return 'Accept Job';
    return 'Approve';
  };

  const getCostDisplay = () => {
    if (requirement.estimatedCost) {
      return `$${requirement.estimatedCost.toLocaleString()}`;
    }
    if (requirement.budget) {
      return `$${requirement.budget.toLocaleString()}`;
    }
    return null;
  };
  
  const costDisplay = getCostDisplay();

  return (
    <div 
      onClick={onNavigate}
      className={`
        group border rounded-[20px] p-5 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col relative
        ${selected 
          ? 'border-[#ff3b3b] shadow-[0_0_0_1px_#ff3b3b] bg-[#FFF5F5]' 
          : isPending 
            ? 'border-dashed border-[#E5E7EB] bg-[#F9FAFB]' 
            : 'border-[#EEEEEE] bg-white'
        }
      `}
    >
      {/* Top Right Controls: Checkbox & More Options */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Checkbox (Visible on hover or selected) */}
        <div className={`transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
            className="red-checkbox"
          />
        </div>

        {/* More Options Menu */}
        <Popover
          content={
            <div className="w-40">
              <button onClick={handleEditClick} className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded">
                Edit Details
              </button>
              <button className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded">
                Duplicate
              </button>
              <button className="w-full text-left px-3 py-2 text-[13px] text-[#ff3b3b] hover:bg-gray-50 rounded">
                Delete
              </button>
            </div>
          }
          trigger="click"
          placement="bottomRight"
        >
          <button className={`h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] text-[#999999] hover:text-[#111111] transition-all ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </Popover>
      </div>
      
      {/* Header */}
      <div className="mb-3">
        {/* Context Row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-['Manrope:Bold',sans-serif] uppercase tracking-wider text-[#999999]">
            {requirement.client}
          </span>
          {requirement.type && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-['Inter:Medium',sans-serif] bg-[#F5F5F5] text-[#666666] uppercase border border-[#EEEEEE]">
              {requirement.type === 'inhouse' && requirement.client !== 'Internal' ? 'Client' : requirement.type}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex justify-between items-start gap-2 pr-16">
          <h3 className="font-['Manrope:Bold',sans-serif] text-[15px] leading-snug text-[#111111] group-hover:text-[#ff3b3b] transition-colors line-clamp-2">
            {requirement.title}
          </h3>
        </div>
      </div>

      {/* Tags - Only show if department exists (not empty array) */}
      {requirement.departments && requirement.departments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {requirement.departments.slice(0, 3).map((dept, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded-md bg-white border border-[#E5E5E5] text-[10px] text-[#666666] font-['Inter:Medium',sans-serif]">
              {dept}
            </span>
          ))}
          {requirement.departments.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-[#999999]">+{requirement.departments.length - 3}</span>
          )}
        </div>
      )}

      {/* Date & Description */}
      <div className="mb-4">
        {(requirement.startDate || requirement.dueDate) && requirement.dueDate !== 'TBD' && (
          <div className="flex items-center gap-2 text-[11px] text-[#666666] font-['Inter:Medium',sans-serif] mb-2 bg-[#F9FAFB] p-1.5 rounded-md w-fit">
            <CalendarIcon className="w-3 h-3 text-[#999999]" />
            <span>
              {requirement.startDate ? format(new Date(requirement.startDate), 'MMM d') : ''} 
              {requirement.startDate && requirement.dueDate ? ' - ' : ''}
              {requirement.dueDate && requirement.dueDate !== 'TBD' ? format(new Date(requirement.dueDate), 'MMM d') : ''}
            </span>
            {timelineStatus && (
              <span className={`pl-1 border-l border-[#E5E5E5] ${timelineStatus.color}`}>
                {timelineStatus.text}
              </span>
            )}
          </div>
        )}
        <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] line-clamp-3 leading-relaxed">
          {requirement.description}
        </p>
      </div>

      {/* Progress Section */}
      {!isPending && (
        <div className="mb-4 mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#999999] font-['Inter:Medium',sans-serif]">
              Progress
            </span>
            <span className="text-[10px] text-[#111111] font-['Inter:Bold',sans-serif]">
              {requirement.progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                requirement.status === 'completed' 
                  ? 'bg-[#0F9D58]'
                  : requirement.status === 'delayed'
                  ? 'bg-[#ff3b3b]'
                  : 'bg-[#2F80ED]'
              }`}
              style={{ width: `${requirement.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pending Message */}
      {isPending && (
        <div className="mt-auto mb-4 min-h-[40px] flex items-center justify-center text-[12px] text-[#999999] italic bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB] mx-1">
          {getPendingStatusText()}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[#EEEEEE] flex items-center justify-between mt-auto">
        
        {/* Left: Priority & Assignees */}
        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          <div className={`w-2 h-2 rounded-full ${
            requirement.priority === 'high' ? 'bg-[#ff3b3b]' :
            requirement.priority === 'medium' ? 'bg-[#F59E0B]' :
            'bg-[#3B82F6]'
          }`} title={`Priority: ${requirement.priority}`} />

          {/* Assignees */}
          <div className="flex -space-x-1.5">
            {(requirement.assignedTo && requirement.assignedTo.length > 0 ? requirement.assignedTo : ['Unassigned']).slice(0, 3).map((person, i) => (
              <div 
                key={i} 
                className="w-5 h-5 rounded-full bg-[#F7F7F7] border border-white flex items-center justify-center text-[8px] font-bold text-[#666666] relative z-[3] hover:z-10 hover:scale-110 transition-all shadow-sm"
                title={person}
              >
                {person.charAt(0)}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Status or Action */}
        <div className="flex items-center gap-3">
          {costDisplay && !isPending && requirement.status !== 'draft' && (
            <span className={`text-[12px] font-['Manrope:Bold',sans-serif] ${requirement.type === 'outsourced' ? 'text-[#ff3b3b]' : 'text-[#0F9D58]'}`}>
              {costDisplay}
            </span>
          )}

          {isPending ? (
            <div className="flex gap-2">
              <button 
                onClick={handleRejectClick}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#ff3b3b] text-[#ff3b3b] hover:bg-[#ff3b3b] hover:text-white transition-all shadow-sm"
                title="Reject"
              >
                <X className="w-3 h-3" />
              </button>
              <button 
                onClick={handleApproveClick}
                className="px-2 h-6 flex items-center justify-center rounded-full bg-[#0F9D58] text-white hover:bg-[#0B8043] transition-all shadow-sm text-[10px] font-bold whitespace-nowrap"
                title="Approve"
              >
                {getApproveButtonText()}
              </button>
            </div>
          ) : (
            <div 
              onClick={statusConfig.onClick || undefined}
              className={`
                flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-['Manrope:Bold',sans-serif] border transition-all
                ${statusConfig.className}
              `}
            >
              <span className="capitalize">{statusConfig.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
