'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { DateRangeSelector } from '../../common/DateRangeSelector';
import {
  X, Calendar as CalendarIcon, Clock, CheckCircle, CheckSquare, Users, Trash2,
  FilePlus, Receipt, MoreHorizontal, Play, XCircle, RotateCcw, ChevronDown, AlertCircle
} from 'lucide-react';

import { PaginationBar } from '../../ui/PaginationBar';
import { Modal, Button, Input, Select, Tooltip, Popover, Checkbox, App } from 'antd';
import { useWorkspaces, useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useApproveRequirement, useCollaborativeRequirements } from '@/hooks/useWorkspace';
import { useEmployees, useUserDetails } from '@/hooks/useUser';
import { getRequirementsByWorkspaceId } from '@/services/workspace';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';


const { TextArea } = Input;
const { Option } = Select;

import { RequirementsForm, RequirementFormData } from '../../modals/RequirementsForm';
import { WorkspaceForm } from '../../modals/WorkspaceForm';



import { Requirement, Workspace } from '@/types/domain';
import { RequirementDto } from '@/types/dto/requirement.dto';

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

// Internal Mapping Dialog Component
function InternalMappingModal({
  open,
  onOpenChange,
  onConfirm,
  workspaces
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (workspaceId: number) => void;
  workspaces: { id: number | string; name: string }[];
}) {
  const { message: messageApi } = App.useApp();
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | undefined>(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleConfirm = () => {
    if (!selectedWorkspace) {
      messageApi.error("Please select an internal workspace");
      return;
    }
    onConfirm(selectedWorkspace);
    setSelectedWorkspace(undefined);
    onOpenChange(false);
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        onOk={handleConfirm}
        title="Map to Internal Workspace"
        okText="Activate Requirement"
        cancelText="Cancel"
        okButtonProps={{ className: 'bg-[#111111] hover:bg-[#000000]/90 text-white border-none' }}
        width={400}
        centered
      >
        <div className="space-y-4 py-4">
          <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">
            Select one of your internal workspaces to map this requirement to.
          </p>
          <div className="space-y-2">
            <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Internal Workspace</label>
            <Select
              className="w-full h-11"
              placeholder="Select workspace"
              value={selectedWorkspace}
              onChange={(v: string | number) => {
                if (v === 'create_new') {
                  setIsCreateOpen(true);
                  // Reset selection until created
                  setSelectedWorkspace(undefined);
                } else {
                  setSelectedWorkspace(v as number);
                }
              }}
              suffixIcon={<ChevronDown className="w-4 h-4 text-gray-400" />}
            >
              <Option key="create_new" value="create_new" className="text-[#ff3b3b] font-medium border-b border-gray-100 pb-2 mb-2">
                + Create New Workspace
              </Option>
              {workspaces.map((w: { id: number | string; name: string }) => (
                <Option key={String(w.id)} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>

      <WorkspaceForm
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onSuccess={(data: { result?: { id: number }; id?: number }) => {
           // data needs to be inspected. Usually creation returns result object.
           // Assuming standard hook return { result: { id, name, ... } } or just result.
           // We will try to extract ID.
           const newId = data?.result?.id || data?.id;
           if (newId) {
             setSelectedWorkspace(newId);
           }
           setIsCreateOpen(false);
        }}
      />
    </>
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
    return workspacesData?.result?.workspaces?.map((w: { id: number }) => w.id) || [];
  }, [workspacesData]);

  // Fetch requirements for all workspaces
  const requirementQueries = useQueries({
    queries: workspaceIds.map((id: number) => ({
      queryKey: ['requirements', id],
      queryFn: () => getRequirementsByWorkspaceId(id),
      enabled: !!id && workspaceIds.length > 0,
    })),
  });

  // Fetch collaborative requirements (where my company is receiver)
  const { data: collaborativeData, isLoading: isLoadingCollaborative } = useCollaborativeRequirements();
  const { data: userData } = useUserDetails();
  // userData.result = { user, access, token }
  // We need user.company_id for role detection
  const currentUser = userData?.result?.user;
  
  console.log('CurrentUser DEBUG:', {
    rawUserData: userData,
    resultUser: userData?.result?.user,
    companyId: userData?.result?.user?.company_id,
  });


  const isLoadingRequirements = requirementQueries.some(q => q.isLoading);
  const isLoading = isLoadingWorkspaces || isLoadingRequirements;

  // Helper function to strip HTML tags from text
  const stripHtmlTags = useMemo(() => {
    // Return a function that uses a single cached div for performance
    if (typeof document === 'undefined') return (html: string) => html.replace(/<[^>]*>/g, '').trim();
    const tmp = document.createElement('div');
    return (html: string): string => {
      if (!html) return '';
      tmp.innerHTML = html;
      return (tmp.textContent || tmp.innerText || '').trim();
    };
  }, []);

  const mapRequirementStatus = (status: string): 'in-progress' | 'completed' | 'delayed' | 'draft' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('delayed')) return 'delayed';
    if (statusLower.includes('draft')) return 'draft';
    return 'in-progress';
  };

  const allRequirements = useMemo(() => {
    const combined: Requirement[] = [];

    requirementQueries.forEach((query, index) => {
      const workspaceIdFromQuery = workspaceIds[index];
      if (query.data?.result && workspaceIdFromQuery) {
        const requirementsWithWorkspace = query.data.result.map((req: any) => ({
          ...req,
          workspace_id: req.workspace_id ?? workspaceIdFromQuery,
        }));
        combined.push(...requirementsWithWorkspace);
      }
    });

    // Add collaborative requirements (avoid duplicates if possible)
    if (collaborativeData?.result) {
      collaborativeData.result.forEach((collab: any) => {
        if (!combined.some(req => req.id === collab.id)) {
          combined.push(collab as Requirement);
        }
      });
    }

    return combined;
  }, [requirementQueries.map(q => q.data), workspaceIds, collaborativeData]);

  // Create a map of workspace ID to workspace data for client/company lookup
  // Workspace API returns: { client: {id, name}, client_company_name, company_name }
  const workspaceMap = useMemo(() => {
    const map = new Map<number, Workspace>(); // using simplified type for now
    workspacesData?.result?.workspaces?.forEach((w: any) => {
      map.set(w.id, w);
    });
    return map;
  }, [workspacesData]);

  // Transform backend data to UI format with placeholder/mock data where API data is not available
  const requirements = useMemo(() => {
    const mappedData = allRequirements.map((req: Requirement) => {
      // Get workspace data for this requirement to access client/company information
      // NOTE: The requirement API (getRequirements.sql) doesn't include project/client data
      // It only returns: requirement fields, department, manager, leader, created_user, approved_by
      // So we must get client/company from the workspace data we already fetched
      // Determine which workspace to show
      // If I am the receiver (Vendor) and I have mapped this to an internal project (receiver_project_id),
      // I should see MY internal workspace, not the client's source workspace.
      const myCompanyId = currentUser?.company_id ? Number(currentUser.company_id) : null;
      const reqReceiverCompanyId = req.receiver_company_id ? Number(req.receiver_company_id) : null;
      const reqSenderCompanyId = req.sender_company_id ? Number(req.sender_company_id) : null;
      const isReceiver = myCompanyId !== null && reqReceiverCompanyId === myCompanyId;
      const isSender = myCompanyId !== null && reqSenderCompanyId === myCompanyId;
      
      const effectiveWorkspaceId = (isReceiver && req.receiver_workspace_id) 
        ? req.receiver_workspace_id 
        : req.workspace_id;
        
      const workspace = workspaceMap.get(effectiveWorkspaceId || 0);

      // PLACEHOLDER DATA: Invoice status - not directly available in requirement API
      // In real implementation, this would come from a separate invoice API or join query
      const mockInvoiceStatus = req.invoice_id
        ? (req.invoice?.status === 'paid' ? 'paid' : req.invoice?.status === 'open' ? 'billed' : undefined)
        : undefined;

      // Contact Person: Use the name from the joined user record (or placeholder if missing)
      const contactPersonName = req.contact_person?.name || null;
      const mockContactPerson = req.type === 'outsourced' && !contactPersonName
        ? 'External Vendor' 
        : contactPersonName;

      // PLACEHOLDER DATA: Pricing model - infer from available data if not explicitly set
      const mockPricingModel = req.pricingModel || (req.hourlyRate ? 'hourly' : 'project');

      // PLACEHOLDER DATA: Rejection reason - may not be stored in requirement table
      const mockRejectionReason = req.status?.toLowerCase().includes('rejected') && !req.rejectionReason
        ? 'Requirement was rejected during review process' // Placeholder - would need separate field or table
        : req.rejectionReason;

      // Get client name from workspace data
      // Workspace API structure: { client: {id, name}, client_company_name: string, company_name: string }
      // Match the pattern used in WorkspacePage.tsx line 85
      const clientName = workspace?.client?.name || workspace?.client_company_name || null;

      // Get company name from workspace data (agency/company name)
      const companyName = workspace?.company_name || 'Internal';

      // Department: Only use actual department name if it exists, don't default to 'General'
      // The old frontend (Requirements.tsx line 772) only shows department tag if record.department?.name exists
      const departmentName = req.department?.name || null;

      // Determine roles - STRICT checks with type coercion for safety
      // A is Sender: sender_company_id matches current user's company
      // B is Receiver: receiver_company_id matches current user's company

      
      // For outsourced requirements:
      // - Sender sees: OUTSOURCED badge, shows Receiver's name/company
      // - Receiver sees: INHOUSE badge, shows Sender's name/company
      
      // Header Contact: Who is on the OTHER end of this requirement?
      // - If I'm Sender (A): Show Receiver's contact (contact_person / receiver)
      // - If I'm Receiver (B): Show Sender's name (created_user_data / created_user / sender)
      let headerContact: string;
      let headerCompany: string | undefined;
      
      if (req.type === 'outsourced') {
        if (isSender) {
          // Sender views: Show receiver info
          headerContact = req.contact_person?.name || 'Unknown Vendor';
          headerCompany = req.receiver_company?.name || 'Unknown Vendor Company';
        } else if (isReceiver) {
          // Receiver views: Show sender info
          headerContact = req.created_user_data?.name || req.created_user?.name || 'Unknown Client';
          headerCompany = req.sender_company?.name || 'Unknown Client Company';
        } else {
          // Not directly involved (shouldn't happen for outsourced)
          headerContact = 'Unknown';
          headerCompany = undefined;
        }
      } else {
        // Inhouse requirements - use client/default
        headerContact = clientName || 'Unknown Contact';
        headerCompany = undefined;
      }

      const mappedReq = {
        id: req.id,
        title: req.title || (req as any).name || 'Untitled Requirement',
        description: stripHtmlTags(req.description || 'No description provided'),
        company: companyName,
        client: clientName || (workspace ? 'N/A' : 'N/A'),
        assignedTo: req.manager ? [req.manager.name] : req.leader ? [req.leader.name] : [],
        dueDate: req.end_date ? format(new Date(req.end_date), 'dd-MMM-yyyy') : 'TBD',
        startDate: req.start_date ? format(new Date(req.start_date), 'dd-MMM-yyyy') : undefined,
        createdDate: req.start_date ? format(new Date(req.start_date), 'dd-MMM-yyyy') : 'TBD',
        is_high_priority: req.is_high_priority ?? false,
        type: (req.type || 'inhouse') as 'inhouse' | 'outsourced' | 'client',
        status: mapRequirementStatus(req.status),
        category: departmentName || null,
        departments: departmentName ? [departmentName] : [],
        progress: req.progress || 0,
        tasksCompleted: req.total_tasks ? Math.floor(req.total_tasks * (req.progress || 0) / 100) : 0,
        tasksTotal: req.total_tasks || 0,
        workspaceId: req.workspace_id,
        workspace: workspace?.name || 'Unknown Workspace',
        approvalStatus: (req.approved_by?.id ? 'approved' :
          ((req.status as any) === 'Waiting' || (req.status as any) === 'Review' || (req.status as any) === 'Rejected' || req.status?.toLowerCase() === 'review' || req.status?.toLowerCase() === 'waiting' || req.status?.toLowerCase() === 'rejected' || req.status?.toLowerCase().includes('pending')) ? 'pending' :
            undefined
        ) as 'pending' | 'approved' | 'rejected' | undefined,
        invoiceStatus: mockInvoiceStatus as 'paid' | 'billed' | undefined,
        estimatedCost: req.estimatedCost || (req.budget || undefined),
        budget: req.budget || undefined,
        quotedPrice: req.quotedPrice || undefined, // Add quoted_price for vendor quotes
        hourlyRate: req.hourlyRate || undefined,
        estimatedHours: req.estimatedHours || undefined,
        pricingModel: mockPricingModel as 'hourly' | 'project' | undefined,
        contactPerson: mockContactPerson,
        rejectionReason: mockRejectionReason,
        headerContact,
        headerCompany,
        isReceiver,
        isSender,
        rawStatus: req.status,
        sender_company_id: req.sender_company_id,
        receiver_company_id: req.receiver_company_id,
        receiver_workspace_id: req.receiver_workspace_id,
        receiver_project_id: req.receiver_workspace_id, // Backward compat if needed, but safer to rely on new field
        negotiation_reason: req.negotiation_reason,
      };


      console.log('RequirementDebug:', {
        reqId: req.id,
        rawType: req.type,
        rawStatus: req.status,
        myCompanyId,

        reqSenderCompanyId,
        reqReceiverCompanyId,
        isSender,
        isReceiver,
        headerContact,
        headerCompany,
        // Raw data from backend
        rawContactPerson: req.contact_person,
        rawCreatedUser: req.created_user,
        rawCreatedUserData: req.created_user_data,
        rawSenderCompany: req.sender_company,
        rawReceiverCompany: req.receiver_company,
      });

      return mappedReq;

    });
    return mappedData;

  }, [allRequirements, workspaceMap, currentUser]);

  // Read tab from URL params
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = (tabFromUrl === 'draft' || tabFromUrl === 'pending' || tabFromUrl === 'active' || tabFromUrl === 'completed' || tabFromUrl === 'delayed')
    ? tabFromUrl
    : 'active';
  const [activeStatusTab, setActiveStatusTab] = useState<string>(initialTab);

  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'draft' || tabFromUrl === 'pending' || tabFromUrl === 'active' || tabFromUrl === 'completed' || tabFromUrl === 'delayed') {
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
  const [isMappingOpen, setIsMappingOpen] = useState(false);
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
      quote_workspace_id: requirements.find(r => r.id === reqId)?.workspaceId || 0,
      // We only update specific fields for quotation
      quoted_price: amount,
      estimated_hours: hours,
      status: 'Review' // Or PENDING_CLIENT_APPROVAL as per design, using Review as proxy
    } as unknown as any, {
      onSuccess: () => {
        messageApi.success("Quotation submitted successfully");
        setIsQuotationOpen(false);
        setPendingReqId(null);
      },
      onError: (err: Error) => {
        messageApi.error(err?.message || "Failed to submit quotation");
      }
    });
  };

  const handleRejectConfirm = (reason: string) => {
    const reqId = pendingReqId;
    if (!reqId) return;

    updateRequirementMutation.mutate({
      id: reqId,
      workspace_id: requirements.find(r => r.id === reqId)?.workspaceId || 0,
      status: 'Rejected',
      rejection_reason: reason
    } as unknown as any, {
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

    console.log('handleCreateRequirement DEBUG:', {
      type: data.type,
      contact_person_id: data.contact_person_id,
      receiver_company_id: data.receiver_company_id,
      // priority: data.priority, // removed
      // project_id: data.project_id, // removed
    });

    createRequirementMutation.mutate({
      workspace_id: Number(data.workspace),
      project_id: Number(data.workspace),
      name: data.title,
      description: data.description || '',
      start_date: new Date().toISOString(),
      end_date: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      // Status is determined by backend based on type (outsourced=Waiting, etc.)
      is_high_priority: data.is_high_priority,

      type: data.type,
      budget: Number(data.budget) || 0,
      contact_person_id: data.contact_person_id,
      contact_person: data.contactPerson,
      receiver_company_id: data.receiver_company_id, // Pass the receiver company ID
    } as unknown as any, {
      onSuccess: () => {
        messageApi.success("Requirement created successfully");
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        // Keeping error as any for now as AxiosError typing can be verbose to import
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
      workspace_id: Number(data.workspace),
      project_id: Number(data.workspace),
      is_high_priority: data.is_high_priority,
      start_date: editingReq.startDate,
      end_date: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      type: data.type,
      budget: Number(data.budget) || 0,
      contact_person_id: data.contact_person_id,
      contact_person: data.contactPerson,
      receiver_company_id: data.receiver_company_id, // Pass the receiver company ID
    } as unknown as any, {
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
    const priorityMatch = filters.priority === 'All' || 
      (filters.priority === 'High Priority' && req.is_high_priority) ||
      (filters.priority === 'Normal Priority' && !req.is_high_priority);

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
    // Draft Tab: Normal drafts
    if (activeStatusTab === 'draft') {
      if (req.status === 'draft') return true;
      return false;
    }

    // Pending Tab: Waiting/Review status for either side
    if (activeStatusTab === 'pending') {
      const isPendingWorkflow = req.rawStatus === 'Waiting' || (req.rawStatus as any) === 'Review';
      return isPendingWorkflow || req.approvalStatus === 'pending';
    }

    // Active Tab: Assigned status (and not review/waiting), excluding delayed
    if (activeStatusTab === 'active') {
      const isActiveState = ((req.rawStatus as any) === 'Assigned' || req.status === 'in-progress') && req.status !== 'delayed';
      const isPendingWorkflow = req.rawStatus === 'Waiting' || (req.rawStatus as any) === 'Review';
      return isActiveState && !isPendingWorkflow && req.approvalStatus !== 'pending';
    }

    // Delayed Tab
    if (activeStatusTab === 'delayed') {
      return req.status === 'delayed';
    }

    // Completed Tab
    if (activeStatusTab === 'completed') return req.status === 'completed';

    return true;
  });

  // Get unique clients for filter options
  const allClients = ['All', ...Array.from(new Set(requirements.map(r => r.client).filter(Boolean)))];
  const priorities = ['All', 'High Priority', 'Normal Priority'];

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
        return deleteRequirementMutation.mutateAsync({ id, workspace_id: req.workspaceId || 0 });
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
          workspace_id: req.workspaceId,
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
          workspace_id: req.workspaceId,
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
          workspace_id: req.workspaceId,
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
          workspace_id: req.workspaceId,
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
    {
      id: 'active', label: 'Active'
    },
    {
      id: 'pending', label: 'Pending', count: baseFilteredReqs.filter(req => {
        const isPendingWorkflow = req.rawStatus === 'Waiting' || (req.rawStatus as string) === 'Review';
        return isPendingWorkflow || req.approvalStatus === 'pending';
      }).length
    },
    {
      id: 'draft', label: 'Drafts', count: baseFilteredReqs.filter(req => {
        if (req.status === 'draft') return true;
        return false;
      }).length
    },
    {
      id: 'delayed', label: 'Delayed', count: baseFilteredReqs.filter(req => req.status === 'delayed').length
    },
    { id: 'completed', label: 'Completed' },
  ];



  return (
    <PageLayout
      title="Requirements"
      titleAction={{
        onClick: handleOpenCreate
      }}
      tabs={tabs}
      activeTab={activeStatusTab}
      onTabChange={(tabId) => {
        setActiveStatusTab(tabId);
        const params = new URLSearchParams(searchParams.toString());
        if (tabId === 'active') {
          params.delete('tab');
        } else {
          params.set('tab', tabId);
        }
        router.push(`?${params.toString()}`);
      }}
      titleExtra={
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
                requirement={requirement as any}
                selected={selectedReqs.includes(requirement.id)}
                onSelect={() => toggleSelect(requirement.id)}
                onAccept={() => {
                  console.log('onAccept Triggered', {
                    id: requirement.id,
                    type: requirement.type,
                    isSender: requirement.isSender,
                    rawStatus: requirement.rawStatus
                  });
                  const req = requirement;
                  if (req.type === 'outsourced') {
                    if (req.isReceiver) {
                      const status = req.rawStatus?.toLowerCase();
                      if (status === 'waiting' || status === 'rejected') {
                        setPendingReqId(requirement.id);
                        setIsQuotationOpen(true);
                      } else if (status === 'assigned' && !req.receiver_workspace_id) {
                        setPendingReqId(requirement.id);
                        setIsMappingOpen(true);
                      }
                    } else if (req.isSender) {
                      const status = req.rawStatus?.toLowerCase();
                      if (status === 'review') {
                        console.log('Attempting to approve requirement...', requirement.id);
                        approveRequirementMutation.mutate({
                          requirement_id: requirement.id,
                          status: 'Assigned'
                        });
                      } else if (status === 'rejected') {
                        handleEditDraft(requirement as any);
                      }
                    }
                  } else {
                    handleReqAccept(requirement.id)
                  }
                }}
                onReject={() => {
                  const req = requirement;
                  if (req.type === 'outsourced') {
                    setPendingReqId(requirement.id);
                    setIsRejectOpen(true);
                  } else {
                    handleReqReject(requirement.id);
                  }
                }}
                onEdit={() => handleEditDraft({
                  ...requirement,
                } as any)}
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
        centered
        className="rounded-[16px] overflow-hidden"
        styles={{
          body: {
            padding: 0,
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
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
            is_high_priority: editingReq.is_high_priority,
            contactPerson: editingReq.contactPerson,
            budget: String(editingReq.budget || ''),
          } : undefined}
          onSubmit={editingReq ? handleUpdateRequirement : handleCreateRequirement}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditingReq(undefined);
          }}
          workspaces={workspacesData?.result?.workspaces?.map((w: any) => ({ id: w.id, name: w.name })) || []}
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
      <InternalMappingModal
        open={isMappingOpen}
        onOpenChange={setIsMappingOpen}
        onConfirm={(workspaceId) => {
          if (!pendingReqId) return;
          updateRequirementMutation.mutate({
            id: pendingReqId,
            workspace_id: allRequirements.find(r => r.id === pendingReqId)?.workspaceId || 0, // Required field
            receiver_workspace_id: workspaceId,
            status: 'In_Progress'
          } as any, {
            onSuccess: () => {
              messageApi.success("Requirement mapped and activated!");
              setIsMappingOpen(false);
              setPendingReqId(null);
            }
          });
        }}
        workspaces={workspacesData?.result?.workspaces?.map((w: any) => ({ id: w.id, name: w.name })) || []}
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
  const isPending = useMemo(() => {
    // Special case for Receiver Mapping (Post-Approval)
    if (requirement.type === 'outsourced' && requirement.isReceiver) {
       const s = requirement.rawStatus?.toLowerCase();
       if (s === 'assigned' && !requirement.receiver_workspace_id) return true;
    }

    if (requirement.approvalStatus !== 'pending') return false;
    
    const status = requirement.rawStatus?.toLowerCase();
    
    if (requirement.type === 'outsourced') {
      if (requirement.isSender) {
         // Client acts only on 'review'
         return status === 'review';
      }
      if (requirement.isReceiver) {
         // Vendor acts on 'waiting' (new) or 'rejected' (resubmit)
         return status === 'waiting' || status === 'rejected';
      }
    }
    return true;
  }, [requirement]);



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

    // 2. Pending Actions (Workflow)
    if (requirement.approvalStatus === 'pending') {
      // Determine label based on role and precise status
      let label = 'Pending';
      let isActionNeeded = false;

      if (requirement.type === 'outsourced') {
        if (requirement.isSender) {
          // I am Client (Gaurav)
          // Status 'Review' means Vendor (Jayendra) submitted quote -> Action Needed
          if (requirement.rawStatus === 'Review' || requirement.rawStatus?.toLowerCase() === 'review') {
             label = 'Action Needed'; // Vendor submitted quote, I need to approve
             isActionNeeded = true;
          } else {
             label = 'Pending'; // Waiting for vendor (Waiting or Rejected)
          }
        } else if (requirement.isReceiver) {
          // I am Vendor (Jayendra)
          // Status 'Waiting' means Client created req -> Action Needed
          // Status 'Rejected' means Client rejected quote -> Action Needed (Resubmit)
          if (requirement.rawStatus === 'Waiting' || requirement.rawStatus?.toLowerCase() === 'waiting' || 
              requirement.rawStatus === 'Rejected' || requirement.rawStatus?.toLowerCase() === 'rejected') {
             label = 'Action Needed'; // Need to submit/resubmit quote
             isActionNeeded = true;
          } else {
             label = 'Pending'; // Waiting for client approval (Review)
          }
        }
      }

      if (isActionNeeded) {
        return {
          label: label,
          icon: <AlertCircle className="w-3 h-3" />,
          className: 'bg-[#FEFCE8] text-[#D97706] border-[#FEF08A] cursor-pointer hover:bg-[#FEF08A]',
          onClick: null
        };
      } else {
        return {
          label: label,
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]',
          onClick: null
        };
      }
    }

    // 3. Project Status
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
      if (requirement.rawStatus === 'Waiting') {
        return requirement.isReceiver ? 'New outsourced requirement. Needs a quote.' : 'Awaiting quote from vendor...';
      }
      if (requirement.rawStatus === 'Review') {
        return requirement.isSender ? 'Vendor submitted quote. Needs review.' : 'Quote submitted. Awaiting client decision...';
      }
      if (requirement.rawStatus === 'Rejected' && requirement.isSender) {
        return 'Requirement declined by vendor. Please review and resubmit.';
      }
      return `Collaborative interaction pending...`;
    }
    if (requirement.type === 'client') {
      return `Client Request. Awaiting review...`;
    }
    return 'Waiting for approval...';
  };

  const getApproveButtonText = () => {
    if (requirement.type === 'outsourced') {
      if (requirement.isReceiver) {
        if (requirement.rawStatus === 'Waiting' || requirement.rawStatus?.toLowerCase() === 'waiting') return 'Submit Quote';
        if (requirement.rawStatus === 'Rejected' || requirement.rawStatus?.toLowerCase() === 'rejected') return 'Resubmit Quote';
        if (requirement.rawStatus === 'Assigned' && !requirement.receiver_workspace_id) return 'Map Workspace';
        return 'Action Needed';
      }
      if (requirement.isSender) {
        if (requirement.rawStatus === 'Review') return 'Accept Quote';
        if (requirement.rawStatus === 'Rejected') return 'Edit & Resubmit';
        return 'Action Needed';
      }
      return 'Pending';
    }
    if (requirement.type === 'client') return 'Accept Job';
    return 'Approve';
  };

  const getCostDisplay = () => {
    // Priority: quotedPrice (vendor quote) > estimatedCost > budget
    if (requirement.quotedPrice) {
      return `$${requirement.quotedPrice.toLocaleString()}`;
    }
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
            {requirement.isSender && requirement.type === 'outsourced' ? 'OUTSOURCED' : 'INHOUSE'}
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
          {requirement.is_high_priority && (
            <div className="w-2 h-2 rounded-full bg-[#ff3b3b]" title="High Priority" />
          )}

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
          {/* Cost Display - only show if we have actual price data */}
          {costDisplay && (
            <span className={`text-[12px] font-['Manrope:Bold',sans-serif] ${requirement.type === 'outsourced' ? 'text-[#ff3b3b]' : 'text-[#0F9D58]'}`}>
              {costDisplay}
            </span>
          )}


          {isPending ? (
            <div className="flex gap-2">
              {!(requirement.isReceiver && requirement.type === 'outsourced' && requirement.rawStatus?.toLowerCase() === 'assigned') && (
              <button
                onClick={handleRejectClick}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#ff3b3b] text-[#ff3b3b] hover:bg-[#ff3b3b] hover:text-white transition-all shadow-sm"
                title="Reject"
              >
                <X className="w-3 h-3" />
              </button>
              )}
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
