'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Search, MoreVertical, Plus, Trash2, Edit } from 'lucide-react';
import { PageLayout } from '../../layout/PageLayout';
import { Modal, Button, Input, Select, Checkbox, Dropdown, MenuProps, message } from 'antd';
import { useClients, useInviteUser } from '@/hooks/useUser';

const { Option } = Select;

export function ClientsPage() {
  const router = useRouter();
  const { data: clientsData, isLoading } = useClients();
  const inviteUserMutation = useInviteUser();

  const [activeTab, setActiveTab] = useState<'Active' | 'Deactivated'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    country: undefined,
    company: undefined
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const clients = clientsData?.result || [];

  const handleInviteClient = () => {
    if (!inviteEmail) {
      message.error("Email is required");
      return;
    }

    inviteUserMutation.mutate(
      {
        email: inviteEmail,
        requestSentFor: "CLIENT"
      },
      {
        onSuccess: () => {
          message.success("Invitation sent successfully!");
          setIsDialogOpen(false);
          setInviteEmail('');
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to send invitation";
          message.error(errorMessage);
        }
      }
    );
  };

  const filteredClients = clients.filter((client: any) => {
    // Basic search
    const matchesSearch = searchQuery === '' ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Basic filters
    const matchesCountry = !filters.country || client.country === filters.country;
    const matchesCompany = !filters.company || client.company === filters.company;

    // Tab filter (Mocking status as 'Active' for all for now since API might not return it clearly usually)
    // In real scenario check client.is_active or similar
    const matchesTab = activeTab === 'Active' ? client.is_active !== false : client.is_active === false;

    return matchesSearch && matchesCountry && matchesCompany && matchesTab;
  });

  // Unique values for dropdowns
  const countries = Array.from(new Set(clients.map((c: any) => c.country).filter(Boolean)));
  const companies = Array.from(new Set(clients.map((c: any) => c.company).filter(Boolean)));

  return (
    <PageLayout
      title={
        <div className="flex items-center gap-2">
          <span className="text-[24px] font-['Manrope:Bold',sans-serif]">Clients</span>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="text-[#ff3b3b] hover:opacity-80 transition-opacity"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-6 relative">
          <button
            onClick={() => setActiveTab('Active')}
            className={`pb-2 text-[15px] font-['Manrope:Medium',sans-serif] transition-all relative z-10 ${activeTab === 'Active' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Active
            {activeTab === 'Active' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('Deactivated')}
            className={`pb-2 text-[15px] font-['Manrope:Medium',sans-serif] transition-all relative z-10 ${activeTab === 'Deactivated' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Deactivated
            {activeTab === 'Deactivated' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff3b3b]" />
            )}
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between pb-6 border-b border-[#EEEEEE] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-36 h-[42px]">
              <Select
                placeholder="Country"
                allowClear
                className="w-full h-full"
                rootClassName="custom-select-client"
                onChange={(val) => setFilters(prev => ({ ...prev, country: val }))}
                options={countries.map(c => ({ label: c, value: c }))}
                suffixIcon={<div className="text-gray-400">⌄</div>}
              />
            </div>
            <div className="w-44 h-[42px]">
              <Select
                placeholder="Company"
                allowClear
                className="w-full h-full"
                rootClassName="custom-select-client"
                onChange={(val) => setFilters(prev => ({ ...prev, company: val }))}
                options={companies.map(c => ({ label: c, value: c }))}
                suffixIcon={<div className="text-gray-400">⌄</div>}
              />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <Input
              placeholder="Search clients..."
              className="pl-9 h-[42px] w-64 rounded-full border border-[#EEEEEE] bg-white text-[13px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[40px_1.5fr_1fr_1.2fr_1.8fr_1.2fr_1fr_1fr_40px] items-center px-4 py-3 mb-2">
          <Checkbox className="scale-90" />
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Business Name</span>
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Type</span>
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Contact Person</span>
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Email</span>
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Contact</span>
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Onboarding</span>
          <span className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#6B7280] uppercase tracking-wider">Country</span>
          <span></span>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {isLoading ? (
            <div className="py-10 text-center text-[#6B7280]">Loading...</div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-3">
                <Briefcase className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-[#111111] font-['Manrope:SemiBold',sans-serif]">No clients found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredClients.map((client: any) => (
              <ClientRow key={client.id} client={client} />
            ))
          )}
        </div>

        {/* Invite Modal */}
        <Modal
          open={isDialogOpen}
          onCancel={() => setIsDialogOpen(false)}
          footer={null}
          width={500}
          centered
          className="rounded-[16px] overflow-hidden"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <div className="flex flex-col h-full bg-white">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <div className="p-2 rounded-full bg-[#F7F7F7]">
                    <Briefcase className="w-5 h-5 text-[#666666]" />
                  </div>
                  Invite Client
                </div>
              </div>
              <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
                An invitation link will be sent to this email address for the client to complete their registration.
              </p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-2">
                <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  Client Email Address <span className="text-[#ff3b3b]">*</span>
                </label>
                <Input
                  placeholder="email@company.com"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${inviteEmail ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-6 flex items-center justify-end bg-white gap-4">
              <Button
                type="text"
                onClick={() => setIsDialogOpen(false)}
                className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleInviteClient}
                loading={inviteUserMutation.isPending}
                className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
              >
                Send Invitation
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageLayout >
  );
}

function ClientRow({ client }: { client: any }) {
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit Details', icon: <Edit className="w-4 h-4" /> },
    { key: 'archive', label: 'Archive Client', icon: <Trash2 className="w-4 h-4" />, danger: true },
  ];

  // Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Get phone number from various possible fields
  const getPhoneNumber = () => {
    return client.phone || client.phone_number || client.mobile_number || 'N/A';
  };

  // Get client type: CLIENT = ORGANIZATION, OUTSOURCE = INDIVIDUAL
  const getClientType = () => {
    const requestSentFor = client.request_sent_for || client.requestSentFor;
    if (requestSentFor === 'CLIENT') {
      return 'ORGANIZATION';
    } else if (requestSentFor === 'OUTSOURCE') {
      return 'INDIVIDUAL';
    }
    // Default fallback - check if client_id exists (organization) or outsource_id exists (individual)
    if (client.client_id) {
      return 'ORGANIZATION';
    } else if (client.outsource_id) {
      return 'INDIVIDUAL';
    }
    return 'N/A';
  };

  return (
    <div className="group grid grid-cols-[40px_1.5fr_1fr_1.2fr_1.8fr_1.2fr_1fr_1fr_40px] items-center px-4 py-4 bg-white border border-[#E5E7EB] rounded-[12px] hover:border-[#ff3b3b] hover:shadow-md transition-all">
      <Checkbox className="scale-90" />

      <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate pr-4">
        {client.company || 'Unknown Company'}
      </span>

      <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate pr-4">
        {getClientType()}
      </span>

      <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate pr-4">
        {client.name || 'N/A'}
      </span>

      <span className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#666666] truncate pr-4">
        {client.email || 'N/A'}
      </span>

      <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate pr-4">
        {getPhoneNumber()}
      </span>

      <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate pr-4">
        {formatDate(client.created_at || client.associated_date)}
      </span>

      <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] truncate pr-4">
        {client.country || 'N/A'}
      </span>

      <div className="flex justify-end">
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <button className="w-8 h-8 rounded-full hover:bg-[#F7F7F7] flex items-center justify-center transition-colors text-[#999999] hover:text-[#111111] opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4" />
          </button>
        </Dropdown>
      </div>
    </div>
  );
}