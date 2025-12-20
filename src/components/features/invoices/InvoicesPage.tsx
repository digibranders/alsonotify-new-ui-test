import { useState } from 'react';
import { Download, Send, Eye, MoreVertical, Calendar, DollarSign } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { FilterBar, FilterOption } from '../../ui/FilterBar';

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  project: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
}

const invoicesData: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-001',
    client: 'Triem Security',
    project: 'Cleanstart - UI',
    amount: 15000,
    issueDate: '2025-11-01',
    dueDate: '2025-11-15',
    status: 'paid'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-002',
    client: 'Eventus Security',
    project: 'Eventus - Documentation',
    amount: 8500,
    issueDate: '2025-11-05',
    dueDate: '2025-11-20',
    status: 'pending'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-003',
    client: 'TechCorp Inc.',
    project: 'Website Redesign',
    amount: 25000,
    issueDate: '2025-11-10',
    dueDate: '2025-11-25',
    status: 'pending'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-004',
    client: 'Triem Security',
    project: 'Mobile App Development',
    amount: 18000,
    issueDate: '2025-10-20',
    dueDate: '2025-11-05',
    status: 'paid'
  },
  {
    id: '5',
    invoiceNumber: 'INV-2025-005',
    client: 'Eventus Security',
    project: 'Branding Package',
    amount: 12000,
    issueDate: '2025-10-01',
    dueDate: '2025-10-15',
    status: 'overdue'
  },
  {
    id: '6',
    invoiceNumber: 'DRAFT-001',
    client: 'New Client',
    project: 'Consultation Project',
    amount: 5000,
    issueDate: '',
    dueDate: '',
    status: 'draft'
  }
];

export function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    client: 'All',
    dateRange: 'All Time'
  });

  const filteredInvoices = invoicesData.filter(invoice => {
    const matchesTab = activeTab === 'all' || invoice.status === activeTab;
    const matchesSearch = searchQuery === '' ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = filters.client === 'All' || invoice.client === filters.client;
    return matchesTab && matchesSearch && matchesClient;
  });

  // Get unique clients for filter
  const clients = ['All', ...Array.from(new Set(invoicesData.map(i => i.client)))];

  const filterOptions: FilterOption[] = [
    {
      id: 'client',
      label: 'Client',
      options: clients,
      placeholder: 'Client',
      defaultValue: 'All'
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      options: ['All Time', 'This Month', 'Last Month', 'Last 3 Months', 'This Year'],
      placeholder: 'Date Range',
      defaultValue: 'All Time'
    }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({ client: 'All', dateRange: 'All Time' });
    setSearchQuery('');
  };

  const stats = {
    all: invoicesData.length,
    paid: invoicesData.filter(i => i.status === 'paid').length,
    pending: invoicesData.filter(i => i.status === 'pending').length,
    overdue: invoicesData.filter(i => i.status === 'overdue').length,
    draft: invoicesData.filter(i => i.status === 'draft').length
  };

  const totalRevenue = invoicesData
    .filter(i => i.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoicesData
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#E8F5E9] text-[#4CAF50]';
      case 'pending':
        return 'bg-[#FFF3E0] text-[#FF9800]';
      case 'overdue':
        return 'bg-[#FFEBEE] text-[#ff3b3b]';
      case 'draft':
        return 'bg-[#F7F7F7] text-[#999999]';
      default:
        return 'bg-[#F7F7F7] text-[#666666]';
    }
  };

  return (
    <PageLayout
      title="Invoices"
      tabs={[
        { id: 'all', label: 'All', count: stats.all },
        { id: 'paid', label: 'Paid', count: stats.paid },
        { id: 'pending', label: 'Pending', count: stats.pending },
        { id: 'overdue', label: 'Overdue', count: stats.overdue },
        { id: 'draft', label: 'Draft', count: stats.draft }
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as any)}
      searchPlaceholder="Search invoices..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      showExport
      titleAction={{
        onClick: () => {}
      }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-[#EEEEEE] rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-[#4CAF50]" />
            <span className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999]">
              Total Revenue
            </span>
          </div>
          <p className="font-['Manrope:Bold',sans-serif] text-[24px] text-[#111111]">
            ${totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666] mt-1">
            From {stats.paid} paid invoices
          </p>
        </div>

        <div className="border border-[#EEEEEE] rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-[#FF9800]" />
            <span className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999]">
              Pending Amount
            </span>
          </div>
          <p className="font-['Manrope:Bold',sans-serif] text-[24px] text-[#111111]">
            ${pendingAmount.toLocaleString()}
          </p>
          <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666] mt-1">
            {stats.pending + stats.overdue} invoices unpaid
          </p>
        </div>

        <div className="border border-[#EEEEEE] rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-[#ff3b3b]" />
            <span className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999]">
              Overdue
            </span>
          </div>
          <p className="font-['Manrope:Bold',sans-serif] text-[24px] text-[#ff3b3b]">
            {stats.overdue}
          </p>
          <p className="text-[11px] font-['Manrope:Regular',sans-serif] text-[#666666] mt-1">
            Requires immediate action
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Invoices List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white border border-[#EEEEEE] rounded-[16px] p-6 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                  {/* Invoice Number & Client */}
                  <div>
                    <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-1">
                      {invoice.invoiceNumber}
                    </h4>
                    <p className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                      {invoice.client}
                    </p>
                  </div>

                  {/* Project */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                      Project
                    </p>
                    <p className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate">
                      {invoice.project}
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                      Amount
                    </p>
                    <p className="font-['Manrope:Bold',sans-serif] text-[16px] text-[#111111]">
                      ${invoice.amount.toLocaleString()}
                    </p>
                  </div>

                  {/* Dates */}
                  <div>
                    {invoice.status !== 'draft' ? (
                      <>
                        <p className="text-[11px] font-['Manrope:Medium',sans-serif] text-[#999999] mb-1">
                          Issue / Due Date
                        </p>
                        <div className="flex items-center gap-1 text-[12px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                          <Calendar className="w-3 h-3" />
                          {new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </>
                    ) : (
                      <p className="text-[12px] font-['Manrope:Regular',sans-serif] text-[#999999] italic">
                        Draft - Not sent
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full text-[12px] font-['Manrope:SemiBold',sans-serif] ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button className="p-2 hover:bg-white rounded-[8px] transition-colors" title="View">
                    <Eye className="w-4 h-4 text-[#666666]" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-[8px] transition-colors" title="Download">
                    <Download className="w-4 h-4 text-[#666666]" />
                  </button>
                  {invoice.status !== 'paid' && invoice.status !== 'draft' && (
                    <button className="p-2 hover:bg-white rounded-[8px] transition-colors" title="Send Reminder">
                      <Send className="w-4 h-4 text-[#666666]" />
                    </button>
                  )}
                  <button className="p-2 hover:bg-white rounded-[8px] transition-colors" title="More">
                    <MoreVertical className="w-4 h-4 text-[#666666]" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
                No invoices found
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}