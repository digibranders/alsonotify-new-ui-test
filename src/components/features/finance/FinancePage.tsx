'use client';

import { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Check, 
  X,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal, Button } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { DateRangeSelector } from '../../common/DateRangeSelector';

dayjs.extend(isBetween);

// --- Types ---

interface Requirement {
  id: number;
  title: string;
  type: string;
  estimatedCost: number;
  status: 'completed' | 'in_progress' | 'pending';
  approvalStatus: 'approved' | 'pending' | 'rejected';
  invoiceStatus: 'unbilled' | 'billed' | 'paid';
  invoiceId?: string;
  client: string;
  dueDate: string;
}

interface InvoiceItem {
  requirementId: number;
  title: string;
  cost: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'sent' | 'overdue' | 'draft';
  items: InvoiceItem[];
}

// --- Mock Data ---

const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: 101,
    title: 'Frontend Refactoring',
    type: 'Development',
    estimatedCost: 5000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'TechCorp Inc.',
    dueDate: '2025-12-01T10:00:00Z'
  },
  {
    id: 102,
    title: 'Security Audit',
    type: 'Security',
    estimatedCost: 3500,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'TechCorp Inc.',
    dueDate: '2025-12-05T10:00:00Z'
  },
  {
    id: 103,
    title: 'Mobile App Design',
    type: 'Design',
    estimatedCost: 8000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'StartupHub',
    dueDate: '2025-11-20T10:00:00Z'
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2025-001',
    invoiceNumber: 'INV-2025-001',
    client: 'Triem Security',
    date: '2025-11-01T09:00:00Z',
    dueDate: '2025-11-15T09:00:00Z',
    amount: 15000,
    status: 'paid',
    items: []
  },
  {
    id: 'INV-2025-002',
    invoiceNumber: 'INV-2025-002',
    client: 'Eventus Security',
    date: '2025-11-05T09:00:00Z',
    dueDate: '2025-11-20T09:00:00Z',
    amount: 8500,
    status: 'sent',
    items: []
  }
];

// --- Main Component ---

export function FinancePage() {
  // Local State for Data (Simulating Backend)
  const [requirements, setRequirements] = useState<Requirement[]>(MOCK_REQUIREMENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);

  // UI State
  const [activeTab, setActiveTab] = useState<'unbilled' | 'history'>('unbilled');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection State
  const [selectedReqs, setSelectedReqs] = useState<number[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  // Expansion State
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Filter State
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Dialog State
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<string | null>(null);

  // --- Derived Data & helpers ---

  const clientOptions = useMemo(() => {
    const clients = new Set<string>();
    invoices.forEach(inv => clients.add(inv.client));
    requirements.forEach(req => clients.add(req.client));
    return Array.from(clients).sort();
  }, [invoices, requirements]);

  const filterOptions: FilterOption[] = [
    {
      id: 'client',
      label: 'Client',
      options: ['All', ...clientOptions],
      placeholder: 'All Partners',
      defaultValue: 'All'
    },
    ...(activeTab === 'history' ? [{
      id: 'status',
      label: 'Status',
      options: ['All', 'Paid', 'Sent', 'Overdue'],
      placeholder: 'All Statuses',
      defaultValue: 'All'
    }] : [])
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    if (filterId === 'client') setClientFilter(value);
    else if (filterId === 'status') setStatusFilter(value);
  };

  const clearFilters = () => {
    setClientFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
  };

  // --- Filtering Logic ---

  const unbilledReqs = useMemo(() => {
    return requirements.filter(req => {
      // Base logic: approved + completed + unbilled
      const isUnbilled = req.status === 'completed' && 
        req.approvalStatus === 'approved' && 
        (req.invoiceStatus === 'unbilled' || !req.invoiceStatus);
      
      if (!isUnbilled) return false;

      // Search
      if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase()) && !req.client.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filters
      if (clientFilter !== 'All' && req.client !== clientFilter) return false;
      
      // Date Range (using Due Date)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const dueDate = dayjs(req.dueDate);
        if (!dueDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
          return false;
        }
      }
      
      return true;
    });
  }, [requirements, searchQuery, clientFilter, dateRange]);

  const unbilledByClient = useMemo(() => {
    return unbilledReqs.reduce((acc, req) => {
      if (!acc[req.client]) acc[req.client] = [];
      acc[req.client].push(req);
      return acc;
    }, {} as Record<string, Requirement[]>);
  }, [unbilledReqs]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (clientFilter !== 'All' && inv.client !== clientFilter) return false;
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;

      // Date Range (using Invoice Date)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const invDate = dayjs(inv.date);
        if (!invDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
            return false;
        }
      }

      return true;
    });
  }, [invoices, searchQuery, clientFilter, statusFilter, dateRange]);

  // --- Stats ---
  
  // Card 1: Amount Invoiced (Total), Received (Paid), Due (Unpaid)
  const kpiInvoiced = useMemo(() => {
    // For these cards, do we use filtered invoices or all invoices within range?
    // Usually KPI cards respect the filters.
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const received = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const due = total - received;
    return { total, received, due };
  }, [filteredInvoices]);

  // Card 2: Amount to be Invoiced (Unbilled)
  const kpiToBeInvoiced = unbilledReqs.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);

  // Card 3: Total Expenses
  // Mock logic: 65% of revenue (Invoiced + Unbilled)
  const kpiTotalExpenses = (kpiInvoiced.total + kpiToBeInvoiced) * 0.65;


  // --- Actions ---

  const handleOpenInvoiceDialog = (client: string) => {
    setSelectedClientForInvoice(client);
    setIsInvoiceDialogOpen(true);
    // Auto-select all if none selected for this client
    const clientReqs = unbilledByClient[client] || [];
    const currentlySelectedForClient = selectedReqs.filter(id => clientReqs.some(r => r.id === id));
    if (currentlySelectedForClient.length === 0) {
      setSelectedReqs(prev => [...prev, ...clientReqs.map(r => r.id)]);
    }
  };

  const handleGenerateInvoice = () => {
    if (!selectedClientForInvoice) return;
    
    // Get reqs for this client that are selected
    const clientReqs = unbilledByClient[selectedClientForInvoice] || [];
    const itemsToBill = clientReqs.filter(r => selectedReqs.includes(r.id));
    
    if (itemsToBill.length === 0) {
      toast.error("Please select at least one requirement to invoice");
      return;
    }

    const totalAmount = itemsToBill.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);
    const invoiceId = `INV-${dayjs().year()}-${String(invoices.length + 1).padStart(3, '0')}`;
    
    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceId,
      client: selectedClientForInvoice,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: totalAmount,
      status: 'sent',
      items: itemsToBill.map(req => ({
        requirementId: req.id,
        title: req.title,
        cost: req.estimatedCost || 0
      }))
    };

    // Update State
    setInvoices(prev => [newInvoice, ...prev]);
    
    setRequirements(prev => prev.map(req => {
      if (itemsToBill.some(item => item.id === req.id)) {
        return { ...req, invoiceStatus: 'billed', invoiceId: invoiceId };
      }
      return req;
    }));

    toast.success(`Invoice ${invoiceId} generated for ${selectedClientForInvoice}`);
    setIsInvoiceDialogOpen(false);
    setSelectedClientForInvoice(null);
    setSelectedReqs(prev => prev.filter(id => !itemsToBill.some(r => r.id === id)));
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    // Update invoice
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv));
    
    // Find invoice items and update requirements
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
       setRequirements(prev => prev.map(req => req.invoiceId === invoiceId ? { ...req, invoiceStatus: 'paid' as const } : req));
    }
    
    toast.success("Invoice marked as paid");
  };

  const handleBulkMarkAsPaid = () => {
    selectedInvoices.forEach(id => handleMarkAsPaid(id));
    setSelectedInvoices([]);
  };

  // --- Render Helpers ---

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#E8F5E9] text-[#4CAF50]';
      case 'sent': return 'bg-[#E3F2FD] text-[#2196F3]'; // 'pending' maps to 'sent' visually
      case 'pending': return 'bg-[#FFF3E0] text-[#FF9800]';
      case 'overdue': return 'bg-[#FFEBEE] text-[#ff3b3b]';
      case 'draft': return 'bg-[#F7F7F7] text-[#999999]';
      default: return 'bg-[#F7F7F7] text-[#666666]';
    }
  };

  return (
    <PageLayout
      title="Finance"
      tabs={[
        { id: 'unbilled', label: 'Ready to Bill', count: Object.keys(unbilledByClient).length },
        { id: 'history', label: 'Invoice History', count: invoices.length }
      ]}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
      searchPlaceholder="Search finance..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      showFilter={false} // We implement custom filter bar
      customFilters={
        <div className="flex items-center gap-3">
            <Button
                onClick={() => toast.info('Download functionality to be implemented')}
                icon={<Download className="w-4 h-4" />}
                className="font-['Manrope:SemiBold',sans-serif] text-[13px] rounded-full"
            >
                Download
            </Button>
            <DateRangeSelector
                value={dateRange}
                onChange={setDateRange}
            />
        </div>
      }
    >
      <div className="flex flex-col h-full bg-white relative">
        {/* KPI Cards */}
        {/* Grid layout: First card takes up more space if needed, or equal 3 cols? 
            Image description suggests 3 blocks. Let's use 3 columns. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            {/* Card 1: Amount Invoiced | Received | Due */}
            <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-0 flex flex-col md:flex-row h-auto md:h-[120px]">
                {/* Main Section: Amount Invoiced */}
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-[#EEEEEE] flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Amount Invoiced</span>
                        {activeTab === 'history' && <div className="w-2 h-2 rounded-full bg-[#7ccf00]"></div>}
                    </div>
                    <span className="text-[28px] font-['Manrope:Bold',sans-serif] text-[#111111]">${kpiInvoiced.total.toLocaleString()}</span>
                </div>
                
                {/* Sub Sections: Received & Due */}
                <div className="flex-1 flex flex-row">
                    <div className="flex-1 p-6 border-r border-[#EEEEEE] flex flex-col justify-between">
                         <span className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">Received</span>
                         <span className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#4CAF50]">${kpiInvoiced.received.toLocaleString()}</span>
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                         <span className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">Due</span>
                         <span className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#ff3b3b]">${kpiInvoiced.due.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Amount to be Invoiced */}
            <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-6 flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                    <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Amount to be Invoiced</span>
                    <Wallet className="w-5 h-5 text-[#999999]" />
                </div>
                <span className="text-[28px] font-['Manrope:Bold',sans-serif] text-[#111111]">${kpiToBeInvoiced.toLocaleString()}</span>
            </div>

             {/* Card 3: Total Expenses */}
             <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-6 flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                    <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Total Expenses</span>
                    <CreditCard className="w-5 h-5 text-[#999999]" />
                </div>
                <span className="text-[28px] font-['Manrope:Bold',sans-serif] text-[#111111]">${kpiTotalExpenses.toLocaleString()}</span>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            filters={filterOptions}
            selectedFilters={{
                client: clientFilter,
                status: statusFilter
            }}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          {activeTab === 'unbilled' ? (
             Object.keys(unbilledByClient).length === 0 ? (
                <EmptyState 
                    icon={<CheckCircle className="w-8 h-8 text-[#666666]" />}
                    title="All caught up!"
                    description="No requirements are ready to bill at the moment."
                />
             ) : (
                <div className="space-y-4">
                  {Object.entries(unbilledByClient).map(([client, reqs]) => (
                    <ClientGroup 
                        key={client}
                        client={client}
                        reqs={reqs}
                        collapsed={!!collapsedGroups[client]}
                        selectedReqs={selectedReqs}
                        onToggleCollapse={() => setCollapsedGroups(prev => ({ ...prev, [client]: !prev[client] }))}
                        onSelectReq={(id, checked) => {
                            if (checked) setSelectedReqs(prev => [...prev, id]);
                            else setSelectedReqs(prev => prev.filter(r => r !== id));
                        }}
                        onSelectAll={(checked) => {
                            const ids = reqs.map(r => r.id);
                            if (checked) setSelectedReqs(prev => [...new Set([...prev, ...ids])]);
                            else setSelectedReqs(prev => prev.filter(id => !ids.includes(id)));
                        }}
                        onGenerateInvoice={() => handleOpenInvoiceDialog(client)}
                    />
                  ))}
                </div>
             )
          ) : (
             // History Tab
             <div className="bg-white border border-[#EEEEEE] rounded-[16px] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#F9FAFB] border-b border-[#EEEEEE]">
                    <tr>
                      <th className="px-6 py-4 w-12 rounded-tl-[16px]">
                        <input 
                            type="checkbox"
                            className="rounded border-[#EEEEEE] text-[#ff3b3b] focus:ring-[#ff3b3b]"
                            checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                            onChange={(e) => {
                                if (e.target.checked) setSelectedInvoices(filteredInvoices.map(i => i.id));
                                else setSelectedInvoices([]);
                            }}
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase">Invoice #</th>
                      <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase">Client</th>
                      <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase">Amount</th>
                      <th className="px-6 py-4 text-left text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase rounded-tr-[16px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]">
                    {filteredInvoices.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-[#999999] font-['Manrope:Regular',sans-serif]">
                                No invoices found
                            </td>
                        </tr>
                    ) : (
                        filteredInvoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-[#F9FAFB] transition-colors">
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-[#EEEEEE] text-[#ff3b3b] focus:ring-[#ff3b3b]"
                                        checked={selectedInvoices.includes(invoice.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedInvoices(prev => [...prev, invoice.id]);
                                            else setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4 text-[14px] font-['Manrope:Medium',sans-serif] text-[#111111]">{invoice.invoiceNumber}</td>
                                <td className="px-6 py-4 text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111]">{invoice.client}</td>
                                <td className="px-6 py-4 text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">{dayjs(invoice.date).format('MMM D, YYYY')}</td>
                                <td className="px-6 py-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">${invoice.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium capitalize ${getStatusColor(invoice.status)}`}>
                                        {invoice.status}
                                     </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-white rounded-full transition-colors">
                                        <Download className="w-4 h-4 text-[#666666]" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                  </tbody>
                </table>
             </div>
          )}
        </div>

        {/* Floating Action Bar equivalent (Fixed at bottom) */}
        {((activeTab === 'unbilled' && selectedReqs.length > 0) || (activeTab === 'history' && selectedInvoices.length > 0)) && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50">
               <div className="flex items-center gap-3 border-r border-white/20 pr-6">
                    <span className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                        {activeTab === 'unbilled' ? selectedReqs.length : selectedInvoices.length}
                    </span>
                    <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
               </div>
               
               {activeTab === 'unbilled' ? (
                   <>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-white/80">
                           Ready to Invoice
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                            // Find which client(s) selected
                            const client = selectedClientForInvoice || Object.keys(unbilledByClient).find(c => unbilledByClient[c].some(r => selectedReqs.includes(r.id))) || '';
                            handleOpenInvoiceDialog(client);
                        }}
                        className="flex items-center gap-2 hover:text-[#ff3b3b] transition-colors"
                      >
                         <FileText className="w-4 h-4" />
                         <span className="text-[13px] font-bold">Generate Invoice</span>
                      </button>
                   </>
               ) : (
                   <>
                      <button 
                         onClick={handleBulkMarkAsPaid}
                         className="flex items-center gap-2 hover:text-[#ff3b3b] transition-colors"
                      >
                         <Check className="w-4 h-4" />
                         <span className="text-[13px] font-bold">Mark Paid</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-[#ff3b3b] transition-colors">
                         <Download className="w-4 h-4" />
                         <span className="text-[13px] font-bold">Download</span>
                      </button>
                   </>
               )}

               <button 
                    onClick={() => {
                        setSelectedReqs([]);
                        setSelectedInvoices([]);
                    }}
                    className="ml-2 text-[#999999] hover:text-white transition-colors"
               >
                    <X className="w-4 h-4" />
               </button>
            </div>
        )}

        {/* Invoice Generation Dialog */}
        <Modal 
            open={isInvoiceDialogOpen} 
            onCancel={() => setIsInvoiceDialogOpen(false)}
            footer={null}
            title={null}
            centered
            width={500}
        >
            <div className="p-4">
                <h3 className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">Generate Invoice</h3>
                <p className="text-[14px] text-[#666666] mb-6">
                    Create an invoice for <span className="font-bold text-[#111111]">{selectedClientForInvoice}</span>
                </p>
                
                <div className="bg-[#F9FAFB] p-4 rounded-[12px] mb-6 border border-[#EEEEEE]">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-[14px] text-[#666666]">Selected Items</span>
                         <span className="text-[14px] font-bold text-[#111111]">{unbilledByClient[selectedClientForInvoice || '']?.filter(r => selectedReqs.includes(r.id)).length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-[14px] text-[#666666]">Total Amount</span>
                         <span className="text-[18px] font-bold text-[#ff3b3b]">
                            ${(unbilledByClient[selectedClientForInvoice || '']?.filter(r => selectedReqs.includes(r.id)).reduce((sum, r) => sum + (r.estimatedCost || 0), 0) || 0).toLocaleString()}
                         </span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsInvoiceDialogOpen(false)}
                        className="flex-1 py-3 px-4 rounded-full border border-[#EEEEEE] text-[#666666] font-['Manrope:SemiBold',sans-serif] hover:bg-[#F7F7F7] transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleGenerateInvoice}
                        className="flex-1 py-3 px-4 rounded-full bg-[#ff3b3b] text-white font-['Manrope:SemiBold',sans-serif] hover:bg-[#e63535] transition-colors"
                    >
                        Generate Invoice
                    </button>
                </div>
            </div>
        </Modal>

      </div>
    </PageLayout>
  );
}

// --- Sub-Components ---

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-12 text-center h-[400px] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-4">
            {icon}
            </div>
            <div>
            <h3 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-2">
                {title}
            </h3>
            <p className="text-[14px] text-[#666666] font-['Manrope:Regular',sans-serif]">
                {description}
            </p>
            </div>
        </div>
    );
}

function ClientGroup({ 
    client, 
    reqs, 
    collapsed, 
    selectedReqs, 
    onToggleCollapse, 
    onSelectReq, 
    onSelectAll,
    onGenerateInvoice 
}: { 
    client: string, 
    reqs: Requirement[], 
    collapsed: boolean, 
    selectedReqs: number[], 
    onToggleCollapse: () => void,
    onSelectReq: (id: number, checked: boolean) => void,
    onSelectAll: (checked: boolean) => void,
    onGenerateInvoice: () => void
}) {
    const allSelected = reqs.every(req => selectedReqs.includes(req.id));
    const someSelected = reqs.some(req => selectedReqs.includes(req.id));
    const totalAmount = reqs.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);

    return (
        <div className="bg-white border border-[#EEEEEE] rounded-[16px] overflow-hidden">
            {/* Header */}
            <div className="bg-[#F9FAFB] border-b border-[#EEEEEE] p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <input
                        type="checkbox"
                        className="rounded border-[#EEEEEE] text-[#ff3b3b] focus:ring-[#ff3b3b]"
                        checked={allSelected}
                        ref={input => { if (input) input.indeterminate = someSelected && !allSelected; }}
                        onChange={(e) => onSelectAll(e.target.checked)}
                    />
                    <button onClick={onToggleCollapse} className="text-[#666666] hover:text-[#111111]">
                        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-[#ff3b3b]/10 flex items-center justify-center text-[#ff3b3b] font-bold text-[14px]">
                        {client.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                        <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111]">{client}</h3>
                        <p className="text-[12px] text-[#666666]">{reqs.length} requirements ready to bill</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111]">${totalAmount.toLocaleString()}</p>
                        <p className="text-[12px] text-[#666666]">Total unbilled</p>
                    </div>
                    <button 
                        onClick={onGenerateInvoice}
                        className="px-4 py-2 bg-[#ff3b3b] text-white rounded-full text-[13px] font-bold hover:bg-[#e63535] transition-colors"
                    >
                        Generate Invoice
                    </button>
                </div>
            </div>

            {/* List */}
            {!collapsed && (
                <table className="w-full">
                    <thead className="bg-white border-b border-[#EEEEEE]">
                        <tr>
                            <th className="w-12 px-6 py-2"></th>
                            <th className="px-6 py-2 text-left text-[11px] text-[#999999] uppercase font-bold">Requirement</th>
                            <th className="px-6 py-2 text-left text-[11px] text-[#999999] uppercase font-bold">Type</th>
                            <th className="px-6 py-2 text-left text-[11px] text-[#999999] uppercase font-bold">Due Date</th>
                            <th className="px-6 py-2 text-left text-[11px] text-[#999999] uppercase font-bold">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]">
                        {reqs.map(req => (
                            <tr key={req.id} className="hover:bg-[#F9FAFB]">
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-[#EEEEEE] text-[#ff3b3b] focus:ring-[#ff3b3b]"
                                        checked={selectedReqs.includes(req.id)}
                                        onChange={(e) => onSelectReq(req.id, e.target.checked)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-4 h-4 text-[#7ccf00]" />
                                        <span className="text-[14px] font-medium text-[#111111]">{req.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full bg-[#F7F7F7] text-[#666666] text-[11px]">
                                        {req.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[13px] text-[#666666]">
                                    {dayjs(req.dueDate).format('MMM D, YYYY')}
                                </td>
                                <td className="px-6 py-4 text-[14px] font-bold text-[#111111]">
                                    ${(req.estimatedCost || 0).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
