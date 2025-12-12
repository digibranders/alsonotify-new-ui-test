'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, List, LayoutGrid, Search, MoreVertical, Plus, Trash2, Edit, Phone, Mail, Globe, MapPin, Building, FolderOpen } from 'lucide-react';
import { PageLayout } from './PageLayout';
import { FilterBar, FilterOption } from './FilterBar';
import { Modal, Button, Input, Select, Checkbox, Dropdown, MenuProps, message } from 'antd';
import { useClients, useCreateClient } from '@/hooks/useUser';

const { TextArea } = Input;
const { Option } = Select;

export function ClientsPage() {
  const router = useRouter();
  const { data: clientsData, isLoading } = useClients();
  const createClientMutation = useCreateClient();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'All',
    industry: 'All'
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    industry: '',
    description: '',
    website: '',
    address: ''
  });

  const clients = clientsData?.result || [];
  const itemsPerPage = 8;

  // Filter Options
  const industries = ['All', ...Array.from(new Set(clients.map((c: any) => c.business_category).filter(Boolean)))];

  const filterOptions: FilterOption[] = [
    {
      id: 'industry',
      label: 'Industry',
      options: industries as string[],
      placeholder: 'Industry',
      defaultValue: 'All'
    },
    {
      id: 'status',
      label: 'Status',
      options: ['All', 'Active', 'Inactive'],
      placeholder: 'Status',
      defaultValue: 'All'
    }
  ];

  const handleCreateClient = () => {
    if (!newClient.company || !newClient.name) {
      message.error("Company and Contact Name are required");
      return;
    }

    createClientMutation.mutate(
      {
        company: newClient.company,
        name: newClient.name,
        email: newClient.email,
        mobile: newClient.phone,
        business_category: newClient.industry,
        description: newClient.description,
        website: newClient.website,
        address: newClient.address,
        password: 'password123' // Default password as per original logic if needed, or backend handles it
      } as any,
      {
        onSuccess: () => {
          message.success("Client added successfully!");
          setIsDialogOpen(false);
          setNewClient({
            company: '',
            name: '',
            email: '',
            phone: '',
            industry: '',
            description: '',
            website: '',
            address: ''
          });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to add client";
          message.error(errorMessage);
        }
      }
    );
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: 'All', industry: 'All' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = searchQuery === '' ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter is dummy for now as no status in returned data usually, but keeping structure
    const matchesStatus = filters.status === 'All' || (filters.status === 'Active');
    const matchesIndustry = filters.industry === 'All' || client.business_category === filters.industry;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <PageLayout
      title="Clients"
      action={
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-[#111111] hover:bg-[#000000]/90 text-white border-0 h-10 px-4 rounded-lg flex items-center gap-2 font-['Manrope:SemiBold',sans-serif]"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Client
        </Button>
      }
    >
      <div className="flex flex-col h-full bg-white rounded-[24px] border border-[#EEEEEE] overflow-hidden">

        {/* Toolbar */}
        <div className="p-6 border-b border-[#EEEEEE] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <FilterBar
              filters={filterOptions}
              selectedFilters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              searchPlaceholder="Search clients..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <div className="flex items-center bg-[#F7F7F7] p-1 rounded-lg border border-[#EEEEEE] ml-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-[#ff3b3b] shadow-sm' : 'text-[#999999] hover:text-[#111111]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-[#ff3b3b] shadow-sm' : 'text-[#999999] hover:text-[#111111]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-[#DDDDDD]" />
              </div>
              <h3 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-1">No clients found</h3>
              <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif]">
                Try adjusting your filters or add a new client.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentClients.map((client: any) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {currentClients.map((client: any) => (
                <ClientListItem key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>

        {/* Create Client Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              <div className="p-2 rounded-full bg-[#F7F7F7]">
                <Building className="w-5 h-5 text-[#666666]" />
              </div>
              Add New Client
            </div>
          }
          open={isDialogOpen}
          onCancel={() => setIsDialogOpen(false)}
          footer={null}
          width={600}
          centered
          className="rounded-[16px] overflow-hidden"
        >
          <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Company Name <span className="text-[#ff3b3b]">*</span></label>
                <Input
                  placeholder="e.g. Acme Corp"
                  className="h-10 font-['Manrope:Regular',sans-serif]"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Industry</label>
                <Input
                  placeholder="e.g. Technology"
                  className="h-10 font-['Manrope:Regular',sans-serif]"
                  value={newClient.industry}
                  onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Contact Person <span className="text-[#ff3b3b]">*</span></label>
              <Input
                placeholder="Full Name"
                className="h-10 font-['Manrope:Regular',sans-serif]"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Email Address</label>
                <Input
                  placeholder="email@company.com"
                  className="h-10 font-['Manrope:Regular',sans-serif]"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Phone Number</label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  className="h-10 font-['Manrope:Regular',sans-serif]"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Website</label>
              <Input
                placeholder="https://example.com"
                className="h-10 font-['Manrope:Regular',sans-serif]"
                prefix={<Globe className="w-4 h-4 text-[#999999] mr-1" />}
                value={newClient.website}
                onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Address</label>
              <Input
                placeholder="123 Business St, City, Country"
                className="h-10 font-['Manrope:Regular',sans-serif]"
                prefix={<MapPin className="w-4 h-4 text-[#999999] mr-1" />}
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</label>
              <TextArea
                placeholder="Add client details..."
                className="min-h-[100px] font-['Manrope:Regular',sans-serif] py-2"
                value={newClient.description}
                onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#EEEEEE]">
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] border-none hover:bg-[#F7F7F7]"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleCreateClient}
                loading={createClientMutation.isPending}
                className="h-10 px-6 bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif] border-none rounded-lg"
              >
                Add Client
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageLayout>
  );
}

function ClientCard({ client }: { client: any }) {
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit Details', icon: <Edit className="w-4 h-4" /> },
    { key: 'archive', label: 'Archive Client', icon: <Trash2 className="w-4 h-4" />, danger: true },
  ];

  return (
    <div className="group relative bg-white border border-[#EEEEEE] rounded-[16px] p-6 hover:border-[#ff3b3b] hover:shadow-lg hover:shadow-[#ff3b3b]/10 transition-all cursor-pointer">
      <div className="absolute top-4 right-4 z-10">
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-5 h-5 text-[#666666]" />
          </button>
        </Dropdown>
      </div>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#FEF3F2] border border-[#ff3b3b]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Briefcase className="w-8 h-8 text-[#ff3b3b]" />
        </div>
        <h3 className="font-['Manrope:Bold',sans-serif] text-[16px] text-[#111111] mb-1 line-clamp-1">{client.company}</h3>
        <p className="text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">{client.business_category || 'General'}</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-[13px] text-[#666666]">
          <div className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-[#999999]" />
          </div>
          <span className="truncate">{client.email || 'No email'}</span>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-[#666666]">
          <div className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-[#999999]" />
          </div>
          <span>{client.mobile || 'No phone'}</span>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-[#666666]">
          <div className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0">
            <FolderOpen className="w-4 h-4 text-[#999999]" />
          </div>
          <span>{client.projects?.length || 0} Active Projects</span>
        </div>
      </div>

      <div className="pt-4 border-t border-[#EEEEEE] flex items-center justify-between">
        <span className="px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#16A34A]">
          Active
        </span>
        <span className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#666666]">
          View Profile
        </span>
      </div>
    </div>
  );
}

function ClientListItem({ client }: { client: any }) {
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit Details', icon: <Edit className="w-4 h-4" /> },
    { key: 'archive', label: 'Archive Client', icon: <Trash2 className="w-4 h-4" />, danger: true },
  ];

  return (
    <div className="group flex items-center justify-between bg-white border border-[#EEEEEE] rounded-[12px] p-4 hover:border-[#ff3b3b] hover:shadow-md hover:shadow-[#ff3b3b]/5 transition-all cursor-pointer">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-[#FEF3F2] flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5 text-[#ff3b3b]" />
        </div>
        <div>
          <h3 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111]">{client.company}</h3>
          <p className="text-[12px] text-[#666666] font-['Manrope:Regular',sans-serif]">{client.business_category}</p>
        </div>
      </div>

      <div className="flex items-center gap-8 mr-8">
        <div className="flex items-center gap-2 w-48">
          <Mail className="w-4 h-4 text-[#999999]" />
          <span className="text-[13px] text-[#666666] truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2 w-32">
          <Phone className="w-4 h-4 text-[#999999]" />
          <span className="text-[13px] text-[#666666]">{client.mobile}</span>
        </div>
        <div className="w-24">
          <span className="px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#16A34A]">
            Active
          </span>
        </div>
      </div>

      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <button className="w-8 h-8 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
          <MoreVertical className="w-5 h-5 text-[#666666]" />
        </button>
      </Dropdown>
    </div>
  )
}