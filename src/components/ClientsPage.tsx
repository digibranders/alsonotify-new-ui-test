import { useState, useMemo } from 'react';
import { PageLayout } from './PageLayout';
import { FilterBar, FilterOption } from './FilterBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { User, Mail, Archive, Trash2 } from 'lucide-react';
import { Checkbox } from "./ui/checkbox";
import { ClientForm, ClientFormData } from './forms/ClientForm';
import { ClientRow } from './rows/ClientRow';
import { useData } from '../context/DataContext';
import { Client } from '../lib/types';

export function ClientsPage() {
  const { clients, addClient, updateClient } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    country: 'All',
    company: 'All'
  });
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesTab = client.status === activeTab;
      const matchesSearch = searchQuery === '' ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = filters.country === 'All' || client.country === filters.country;
      const matchesCompany = filters.company === 'All' || client.company === filters.company;
      return matchesTab && matchesSearch && matchesCountry && matchesCompany;
    });
  }, [clients, activeTab, searchQuery, filters]);

  // Get unique filters
  const countries = useMemo(() => ['All', ...Array.from(new Set(clients.map(c => c.country)))], [clients]);
  const companies = useMemo(() => ['All', ...Array.from(new Set(clients.map(c => c.company)))], [clients]);

  const filterOptions: FilterOption[] = [
    {
      id: 'country',
      label: 'Country',
      options: countries,
      placeholder: 'Country',
      defaultValue: 'All'
    },
    {
      id: 'company',
      label: 'Company',
      options: companies,
      placeholder: 'Company',
      defaultValue: 'All'
    }
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({ country: 'All', company: 'All' });
    setSearchQuery('');
  };

  const handleOpenDialog = (client?: Client) => {
    setEditingClient(client || null);
    setIsDialogOpen(true);
  };

  const handleSaveClient = (data: ClientFormData) => {
    // Validation: If editing, check name. If adding, check email.
    if (editingClient) {
      if (!data.name) return;
    } else {
      if (!data.email) return;
    }

    const clientData: Client = {
      id: editingClient ? editingClient.id : Math.max(...clients.map(c => c.id), 0) + 1,
      name: data.name || "Pending Invite",
      company: data.company || "Pending",
      email: data.email,
      phone: data.phone || "-",
      country: data.country || "Pending",
      status: editingClient ? editingClient.status : 'active',
      requirements: parseInt(data.requirements) || 0,
      onboarding: data.onboarding || new Date().toLocaleDateString()
    };

    if (editingClient) {
      updateClient(editingClient.id, clientData);
    } else {
      addClient(clientData);
    }

    setIsDialogOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedClients.includes(id)) {
      setSelectedClients(selectedClients.filter(clientId => clientId !== id));
    } else {
      setSelectedClients([...selectedClients, id]);
    }
  };

  return (
    <PageLayout
      title="Clients"
      tabs={[
        { id: 'active', label: 'Active' },
        { id: 'inactive', label: 'Deactivated' }
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as 'active' | 'inactive')}
      titleAction={{
        onClick: () => handleOpenDialog()
      }}
    >
      {/* Filters Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          searchPlaceholder="Search clients..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 relative">
        {/* Table Header */}
        <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_1.5fr_1.2fr_1.5fr_1fr_1fr_0.8fr_0.3fr] gap-4 px-4 py-3 mb-2 items-center">
          <div className="flex justify-center">
            <Checkbox
              checked={filteredClients.length > 0 && selectedClients.length === filteredClients.length}
              onCheckedChange={toggleSelectAll}
              className="border-[#DDDDDD] data-[state=checked]:bg-[#ff3b3b] data-[state=checked]:border-[#ff3b3b]"
            />
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Company Name</p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact Person</p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Email</p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact</p>
          <div className="flex items-center gap-1">
            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Onboarding</p>
          </div>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Country</p>
          <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide"></p>
        </div>

        <div className="space-y-3">
          {filteredClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              selected={selectedClients.includes(client.id)}
              onSelect={() => toggleSelect(client.id)}
              onEdit={() => handleOpenDialog(client)}
            />
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#999999] font-['Inter:Regular',sans-serif]">
              No clients found
            </p>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedClients.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2 border-r border-white/20 pr-6">
              <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {selectedClients.length}
              </div>
              <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Send Email">
                <Mail className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Deactivate">
                <Archive className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => setSelectedClients([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
          <div className="p-6 border-b border-[#EEEEEE]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <User className="w-5 h-5 text-[#666666]" />
                </div>
                {editingClient ? 'Edit Client' : 'Invite Client'}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                {editingClient ? 'Update client details' : 'Send an invitation to a new client to join the workspace.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ClientForm
            initialData={editingClient ? {
              name: editingClient.name,
              company: editingClient.company,
              email: editingClient.email,
              phone: editingClient.phone,
              country: editingClient.country,
              requirements: editingClient.requirements.toString(),
              onboarding: editingClient.onboarding
            } : undefined}
            onSubmit={handleSaveClient}
            onCancel={() => setIsDialogOpen(false)}
            isEditing={!!editingClient}
          />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}