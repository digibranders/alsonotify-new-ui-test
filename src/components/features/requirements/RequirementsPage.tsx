'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { DateRangeSelector } from '../../common/DateRangeSelector';
import {
  Check, X, Calendar as CalendarIcon, Clock, CheckCircle, CheckSquare, Users, Trash2,
  FilePlus, Edit, Receipt, MoreHorizontal, Play, XCircle, RotateCcw, Upload
} from 'lucide-react';
import { PaginationBar } from '../../ui/PaginationBar';
import { Modal, Button, Input, Select, Tooltip, Popover, Checkbox, App } from 'antd';
import { useWorkspaces, useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useApproveRequirement } from '@/hooks/useWorkspace';
import { getRequirementsByWorkspaceId } from '@/services/workspace';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';


const { TextArea } = Input;
const { Option } = Select;

import { useEmployees } from '@/hooks/useUser';
import { RequirementsForm, RequirementFormData } from '../../modals/RequirementsForm';



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
  headerContact?: string;
  headerCompany?: string;
  quotedPrice?: number;
  rawStatus?: string;
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
  const { message: messageApi } = App.useApp();
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
        messageApi.error("Please enter rate and hours");
        return;
      }
      onConfirm({
        rate: parseFloat(rate),
        hours: parseFloat(hours),
        cost: parseFloat(rate) * parseFloat(hours)
      });
    } else {
      if (!amount) {
        messageApi.error("Please enter an amount");
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
  const { message: messageApi } = App.useApp();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason) {
      messageApi.error("Please enter a reason");
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
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createRequirementMutation = useCreateRequirement();
  const updateRequirementMutation = useUpdateRequirement();
  const deleteRequirementMutation = useDeleteRequirement();
  const approveRequirementMutation = useApproveRequirement();

  // Fetch all workspaces first to get requirements for each
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { data: employeesData } = useEmployees();

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

  // Combine all requirements and ensure each record is tagged with its workspace/project ID.
  // The backend `getRequirementsByWorkspaceId` endpoint may not always include `project_id`
  // in the requirement payload, so we fall back to the workspace ID used for the query.
  const allRequirements = useMemo(() => {
    const combined: any[] = [];

    requirementQueries.forEach((query, index) => {
      const workspaceIdFromQuery = workspaceIds[index];

      if (query.data?.result && workspaceIdFromQuery) {
        const requirementsWithWorkspace = query.data.result.map((req: any) => ({
          ...req,
          project_id: req.project_id ?? workspaceIdFromQuery,
        }));

        combined.push(...requirementsWithWorkspace);
      }
    });

    return combined;
  }, [requirementQueries, workspaceIds]);

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
        // Map 'Waiting' and 'Review' to 'pending' for UI logic
        approvalStatus: (req.approved_by ? 'approved' :
          (req.status === 'Waiting' || req.status === 'Review' || req.status?.toLowerCase().includes('pending')) ? 'pending' :
            (req.status === 'Rejected' ? 'rejected' : undefined)
        ) as 'pending' | 'approved' | 'rejected' | undefined,
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
        headerContact: clientName || 'Unknown Contact',
        headerCompany: (workspace?.client_company_name || (!workspace?.client ? workspace?.company_name : undefined)) || undefined,
        rawStatus: req.status
      };
    });
  }, [allRequirements, workspaceMap]);

  // Read tab from URL params
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = (tabFromUrl === 'draft' || tabFromUrl === 'pending' || tabFromUrl === 'active' || tabFromUrl === 'completed')
    ? tabFromUrl
    : 'active';
  const [activeStatusTab, setActiveStatusTab] = useState<string>(initialTab);

  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'draft' || tabFromUrl === 'pending' || tabFromUrl === 'active' || tabFromUrl === 'completed') {
      setActiveStatusTab(tabFromUrl);
    } else if (tabFromUrl === null) {
      setActiveStatusTab('active');
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReqs, setSelectedReqs] = useState<number[]>([]);

  // Date Picker State
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | undefined>(undefined);

  const handleOpenCreate = () => {
    setEditingReq(undefined);
    setIsDialogOpen(true);
  };

  const handleEditDraft = (req: Requirement) => {
    setEditingReq(req);

    setIsDialogOpen(true);
  };

  const handleQuotationConfirm = (data: { cost?: number; rate?: number; hours?: number }) => {
    const amount = data.cost || 0;
    const hours = data.hours || 0;
    // Determine the ID: editingReq for basic edits, or pendingReqId for workflow actions
    const reqId = pendingReqId;
    if (!reqId) {
      return;
    }

    // Call mutation to update requirement with quote
    updateRequirementMutation.mutate({
      id: reqId,
      project_id: requirements.find(r => r.id === reqId)?.workspaceId || 0,
      // We only update specific fields for quotation
      quoted_price: amount,
      estimated_hours: hours,
      status: 'Review' // Or PENDING_CLIENT_APPROVAL as per design, using Review as proxy
    } as any, {
      onSuccess: () => {
        messageApi.success("Quotation submitted successfully");
        setIsQuotationOpen(false);
        setPendingReqId(null);
      },
      onError: (err: any) => {
        messageApi.error(err?.message || "Failed to submit quotation");
      }
    });
  };

  const handleRejectConfirm = (reason: string) => {
    const reqId = pendingReqId;
    if (!reqId) return;

    updateRequirementMutation.mutate({
      id: reqId,
      project_id: requirements.find(r => r.id === reqId)?.workspaceId || 0,
      status: 'Rejected',
      rejection_reason: reason
    } as any, {
      onSuccess: () => {
        messageApi.success("Requirement rejected");
        setIsRejectOpen(false);
        setPendingReqId(null);
      }
    });
  };

  const handleCreateRequirement = (data: RequirementFormData) => {
    if (!data.title) {
      messageApi.error("Requirement title is required");
      return;
    }
    if (!data.workspace) {
      messageApi.error("Please select a workspace");
      return;
    }

    createRequirementMutation.mutate({
      project_id: Number(data.workspace),
      name: data.title,
      description: data.description || '',
      start_date: new Date().toISOString(),
      end_date: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      status: 'Assigned',
      priority: data.priority?.toUpperCase() || 'MEDIUM',
      high_priority: data.priority === 'high',
      type: data.type,
      contact_person: data.contactPerson,
      budget: Number(data.budget) || 0,
    } as any, {
      onSuccess: () => {
        messageApi.success("Requirement created successfully");
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        messageApi.error(error?.response?.data?.message || "Failed to create requirement");
      }
    });
  };

  const handleUpdateRequirement = (data: RequirementFormData) => {
    if (!editingReq) return;

    updateRequirementMutation.mutate({
      requirement_id: editingReq.id,
      name: data.title,
      description: data.description || '',
      project_id: Number(data.workspace),
      priority: data.priority?.toUpperCase() || 'MEDIUM',
      start_date: editingReq.startDate,
      end_date: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      type: data.type,
      budget: Number(data.budget) || 0,
      contact_person: data.contactPerson
    } as any, {
      onSuccess: () => {
        messageApi.success("Requirement updated successfully");
        setIsDialogOpen(false);
        setEditingReq(undefined);
      },
      onError: (error: any) => {
        messageApi.error(error?.response?.data?.message || "Failed to update requirement");
      }
    });
  };



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
    { id: 'priority', label: 'Priority', options: priorities, placeholder: 'Priority' },
    { id: 'client', label: 'Client', options: allClients, placeholder: 'Client' },
    { id: 'category', label: 'Department', options: allCategories, placeholder: 'Department' },
    { id: 'assignee', label: 'Assigned To', options: allAssignees, placeholder: 'Assignee' },
    // Only show Billing filter when on Completed tab - moved to last position to prevent layout shift
    ...(activeStatusTab === 'completed' ? [{ id: 'billing', label: 'Billing', options: ['All', 'Ready to Bill', 'Invoiced', 'Paid'], placeholder: 'Billing Status' }] : [])
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
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
    setCurrentPage(1);
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
      messageApi.success(`Deleted ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to delete requirements");
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
      messageApi.success(`Marked ${selectedReqs.length} requirement(s) as completed`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to update requirements");
    }
  };

  const handleBulkApprove = async () => {
    try {
      const approvePromises = selectedReqs.map(id =>
        approveRequirementMutation.mutateAsync({ requirement_id: id, status: "Assigned" })
      );
      await Promise.all(approvePromises);
      messageApi.success(`Approved ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to approve requirements");
    }
  };

  const handleBulkReject = async () => {
    try {
      const rejectPromises = selectedReqs.map(id =>
        approveRequirementMutation.mutateAsync({ requirement_id: id, status: "Rejected" })
      );
      await Promise.all(rejectPromises);
      messageApi.success(`Rejected ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to reject requirements");
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
      messageApi.success(`Submitted ${selectedReqs.length} requirement(s) for approval`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to submit requirements");
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
      messageApi.success(`Reopened ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to reopen requirements");
    }
  };

  const handleBulkAssign = async (employee: any) => {
    try {
      const updatePromises = selectedReqs.map(id => {
        const req = requirements.find(r => r.id === id);
        if (!req) return Promise.resolve();

        const leaderId = employee?.user_id || employee?.id;
        if (!leaderId) return Promise.resolve();

        return updateRequirementMutation.mutateAsync({
          id,
          project_id: req.workspaceId,
          leader_id: leaderId,
        } as any);
      });
      await Promise.all(updatePromises);
      messageApi.success(`Assigned ${employee?.name || 'selected user'} to ${selectedReqs.length} requirement(s)`);
      setSelectedReqs([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Failed to assign requirements");
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



  // Tabs Configuration
  const tabs = [
    { id: 'draft', label: 'Drafts', count: baseFilteredReqs.filter(r => r.status === 'draft').length },
    { id: 'pending', label: 'Pending', count: baseFilteredReqs.filter(r => r.approvalStatus === 'pending').length },
    { id: 'active', label: 'Active', count: baseFilteredReqs.filter(r => (r.status === 'in-progress' || r.status === 'delayed') && r.approvalStatus !== 'pending').length },
    { id: 'completed', label: 'Completed', count: baseFilteredReqs.filter(r => r.status === 'completed').length },
  ];



  return (
    <PageLayout
      title="Requirements"
      titleAction={{
        onClick: handleOpenCreate
      }}
      tabs={tabs}
      activeTab={activeStatusTab}
      onTabChange={setActiveStatusTab}
      customFilters={
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          availablePresets={['this_week', 'this_month', 'last_month', 'this_year', 'all_time', 'custom']}
        />
      }
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

      <div className="flex-1 min-h-0 relative flex flex-col">
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {finalFilteredReqs.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize).map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                selected={selectedReqs.includes(requirement.id)}
                onSelect={() => toggleSelect(requirement.id)}
                onAccept={() => {
                  const req = requirement;
                  if (req.type === 'outsourced' && req.status !== 'in-progress' && req.status !== 'completed') {
                    // Check status using rawStatus
                    if (req.rawStatus === 'Waiting' || (!(req as any).quotedPrice && !req.budget)) {
                      // Needs Quote
                      setPendingReqId(requirement.id);
                      setIsQuotationOpen(true);
                    } else if (req.rawStatus === 'Review' || (req as any).quotedPrice) {
                      // Quote Submitted, Client accepts
                      approveRequirementMutation.mutate({
                        requirement_id: requirement.id,
                        status: 'Assigned'
                      });
                    } else {
                      // Fallback (e.g. negotiation)
                      if ((req as any).quotedPrice) {
                        approveRequirementMutation.mutate({
                          requirement_id: requirement.id,
                          status: 'Assigned'
                        });
                      } else {
                        setPendingReqId(requirement.id);
                        setIsQuotationOpen(true);
                      }
                    }
                  } else {
                    handleReqAccept(requirement.id)
                  }
                }}
                onReject={() => handleReqReject(requirement.id)}
                onEdit={() => handleEditDraft(requirement)}
                onNavigate={() =>
                  router.push(`/dashboard/workspace/${requirement.workspaceId}/requirements/${requirement.id}`)
                }
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

        {finalFilteredReqs.length > 0 && (
          <div className="bg-white">
            <PaginationBar
              currentPage={currentPage}
              totalItems={finalFilteredReqs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="requirements"
            />
          </div>
        )}

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
                    {employeesData?.result && employeesData.result.length > 0 ? (
                      employeesData.result.map((emp: any) => (
                        <button
                          key={String(emp.user_id || emp.id || '')}
                          onClick={() => handleBulkAssign(emp)}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded"
                        >
                          {emp.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-[13px] text-[#999999]">
                        No employees available
                      </div>
                    )}
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
        width={700}
        centered={false}
        className="rounded-[16px] overflow-hidden"
        style={{
          top: '10px',
          paddingBottom: '10px',
        }}
        styles={{
          body: {
            padding: 0,
            height: 'calc(100vh - 20px)',
          },
        }}
      >
        <RequirementsForm
          isEditing={!!editingReq}
          initialData={editingReq ? {
            title: editingReq.title,
            workspace: String(editingReq.workspaceId),
            type: editingReq.type === 'client' ? 'inhouse' : (editingReq.type || 'inhouse') as 'inhouse' | 'outsourced',
            description: editingReq.description,
            dueDate: editingReq.dueDate,
            priority: editingReq.priority,
            contactPerson: editingReq.contactPerson,
            budget: String(editingReq.budget || ''),
          } : undefined}
          onSubmit={editingReq ? handleUpdateRequirement : handleCreateRequirement}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditingReq(undefined);
          }}
          workspaces={workspacesData?.result?.projects?.map((w: any) => ({ id: w.id, name: w.name })) || []}
          isLoading={createRequirementMutation.isPending || updateRequirementMutation.isPending}
        />
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
      return `Client Request.Awaiting review...`;
    }
    return 'Waiting for approval...';
  };

  const getApproveButtonText = () => {
    if (requirement.type === 'outsourced') {
      if (requirement.rawStatus === 'Waiting' || !requirement.quotedPrice) return 'Submit Quote';
      if (requirement.rawStatus === 'Review' || requirement.quotedPrice) return 'Accept Quote';
      return 'Submit Quote';
    }
    if (requirement.type === 'client') return 'Accept Job';
    return 'Approve';
  };

  const getCostDisplay = () => {
    if (requirement.estimatedCost) {
      return `$${requirement.estimatedCost.toLocaleString()} `;
    }
    if (requirement.budget) {
      return `$${requirement.budget.toLocaleString()} `;
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
        <div className={`transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} `} onClick={(e) => e.stopPropagation()}>
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
          <button className={`h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] text-[#999999] hover:text-[#111111] transition-all ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} `}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </Popover>
      </div>

      {/* Header */}
      <div className="mb-3">
        {/* Context Row: Badge | Contact | Company */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          {/* Badge */}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-['Inter:Medium',sans-serif] bg-[#F5F5F5] text-[#666666] uppercase border border-[#EEEEEE]">
            {requirement.type === 'outsourced' ? 'OUTSOURCED' : 'INHOUSE'}
          </span>

          {/* Separator */}
          <span className="text-[#EEEEEE]">|</span>

          {/* Contact Person */}
          <span className="text-[10px] font-['Manrope:Medium',sans-serif] text-[#111111]">
            {requirement.headerContact}
          </span>

          {/* Company Name (only if exists) */}
          {requirement.headerCompany && (
            <>
              {/* Separator */}
              <span className="text-[#EEEEEE]">|</span>

              <span className="text-[10px] font-['Manrope:Medium',sans-serif] text-[#999999] uppercase">
                {requirement.headerCompany}
              </span>
            </>
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
              <span className={`pl-1 border-l border-[#E5E5E5] ${timelineStatus.color} `}>
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
              className={`h-full rounded-full transition-all duration-500 ${requirement.status === 'completed'
                ? 'bg-[#0F9D58]'
                : requirement.status === 'delayed'
                  ? 'bg-[#ff3b3b]'
                  : 'bg-[#2F80ED]'
                } `}
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
          <div className={`w-2 h-2 rounded-full ${requirement.priority === 'high' ? 'bg-[#ff3b3b]' :
            requirement.priority === 'medium' ? 'bg-[#F59E0B]' :
              'bg-[#3B82F6]'
            } `} title={`Priority: ${requirement.priority}`} />

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

        {/* Right: Cost & Status/Action */}
        <div className="flex items-center gap-3">
          {/* Cost Display */}
          {(costDisplay || (!isPending && !requirement.estimatedCost && !requirement.budget)) && (
            <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#0F9D58]">
              {costDisplay || '$12,500'}
            </span>
          )}
          {costDisplay && !isPending && requirement.status !== 'draft' && (
            <span className={`text-[12px] font-['Manrope:Bold',sans-serif] ${requirement.type === 'outsourced' ? 'text-[#ff3b3b]' : 'text-[#0F9D58]'} `}>
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
