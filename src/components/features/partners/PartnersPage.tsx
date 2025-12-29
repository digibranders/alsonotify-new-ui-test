'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    Input,
    Select,
    Modal,
    Form,
    Checkbox,
    Tag,
    message
} from 'antd';
import {
    Plus,
    Trash2,
    Users,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosApi from '../../../config/axios';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { PartnerRow, Partner } from './rows/PartnerRow';
import { acceptInvitation, updateAssociationStatus } from '@/services/user';
import { BankOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';

// Mock Data
const { Option } = Select;

export function PartnersPageContent() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'All',
        country: 'All'
    });
    const [selectedPartners, setSelectedPartners] = useState<number[]>([]);
    const [form] = Form.useForm();

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await axiosApi.get('/user/outsource');
            if (response.data.success) {
                const mappedPartners: Partner[] = response.data.result.map((item: any) => {
                    const isAccepted = item.status === 'ACCEPTED';
                    const isActive = item.is_active === true;

                    return {
                        id: item.association_id || item.invite_id,
                        association_id: item.association_id, // Keep track of association_id for updates
                        name: item.name || '',
                        company: item.company || '',
                        type: 'ORGANIZATION',
                        email: item.email || '',
                        phone: '',
                        country: '',
                        status: (isAccepted && isActive) ? 'active' : 'inactive',
                        requirements: 0,
                        onboarding: item.associated_date ? new Date(item.associated_date).toLocaleDateString() : '-',
                        rawStatus: item.status // Keep raw status to distinguish between pending and deactivated
                    };
                });
                // Filter out pending invites if needed, or show them. User asked to connect data, so we show all.
                // Assuming 'status' logic: active = connected, inactive = pending/deactivated? 
                // The current tabs are 'active' | 'inactive'. 
                // Let's map pending/invited to 'inactive' or maybe keep them visible. 
                // For now, mapping PENDING status from backend to 'inactive' tab might be confusing if they are just invited.
                // But the UI only has Active/Deactivated. Let's start with this mapping.

                setPartners(mappedPartners);
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error);
            message.error('Failed to load partners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    // Handle invitation acceptance from URL
    const searchParams = useSearchParams();
    const router = useRouter();
    const inviteToken = searchParams.get('invite');

    useEffect(() => {
        if (inviteToken) {
            const processInvite = async () => {
                const hide = message.loading('Accepting invitation...', 0);
                try {
                    const result = await acceptInvitation(inviteToken);
                    if (result.success) {
                        message.success('Invitation accepted! You are now partners.');
                        fetchPartners();
                    } else {
                        message.error(result.message || 'Failed to accept invitation.');
                    }
                } catch (error: any) {
                    const msg = error?.response?.data?.message || 'Something went wrong while accepting invitation.';
                    message.error(msg);
                } finally {
                    hide();
                    // Clean up URL
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('invite');
                    params.delete('email'); // Also clean up email if present
                    const newPath = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
                    router.replace(newPath);
                }
            };
            processInvite();
        }
    }, [inviteToken, searchParams, router]);

    // Pagination
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10
    });

    // Stats
    const stats = {
        active: partners.filter(p => p.status === 'active').length,
        inactive: partners.filter(p => p.status === 'inactive').length
    };

    // Filter Data
    const filteredPartners = partners.filter(item => {
        const matchesTab = item.status === activeTab;
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filters.type === 'All' || item.type === filters.type;
        const matchesCountry = filters.country === 'All' || item.country === filters.country;

        return matchesTab && matchesSearch && matchesType && matchesCountry;
    });

    // Pagination Logic
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const paginatedPartners = filteredPartners.slice(startIndex, startIndex + pagination.pageSize);
    const totalItems = filteredPartners.length;

    // Handlers
    const handleAdd = () => {
        setEditingPartner(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Partner) => {
        setEditingPartner(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleStatusUpdate = async (partner: Partner, isActive: boolean) => {
        if (!partner.association_id) {
            message.warning('Cannot change status of a pending invitation');
            return;
        }

        const action = isActive ? 'activate' : 'deactivate';
        Modal.confirm({
            title: `${isActive ? 'Activate' : 'Deactivate'} Partner`,
            content: `Are you sure you want to ${action} this partner?`,
            okText: isActive ? 'Activate' : 'Deactivate',
            okType: isActive ? 'primary' : 'danger',
            cancelText: 'Cancel',
            async onOk() {
                try {
                    const result = await updateAssociationStatus({
                        association_id: partner.association_id!,
                        is_active: isActive
                    });
                    if (result.success) {
                        message.success(`Partner ${isActive ? 'activated' : 'deactivated'}`);
                        fetchPartners();
                    } else {
                        message.error(result.message || `Failed to ${action} partner`);
                    }
                } catch (error) {
                    console.error(`Failed to ${action} partner:`, error);
                    message.error(`Failed to ${action} partner`);
                }
            }
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();

            // Sending invitation
            await axiosApi.post('/user/invite', {
                email: values.email,
                name: values.name,
                requestSentFor: 'OUTSOURCE'
            });

            message.success('Invitation sent successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchPartners();
        } catch (error) {
            console.error('Failed to send invitation:', error);
            // message.error('Failed to send invitation'); // Optional: Generic error handling usually handled by interceptors
        }
    };

    // Filter Configuration
    const countries = ['All', ...Array.from(new Set(partners.map(p => p.country)))];
    const filterOptions: FilterOption[] = [
        { id: 'type', label: 'Type', options: ['All', 'INDIVIDUAL', 'ORGANIZATION'], defaultValue: 'All' },
        { id: 'country', label: 'Country', options: countries, defaultValue: 'All' }
    ];

    const handleFilterChange = (filterId: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterId]: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const clearFilters = () => {
        setFilters({ type: 'All', country: 'All' });
        setSearchQuery('');
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const toggleSelectAll = () => {
        if (selectedPartners.length === paginatedPartners.length) {
            setSelectedPartners([]);
        } else {
            setSelectedPartners(paginatedPartners.map(p => p.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedPartners.includes(id)) {
            setSelectedPartners(selectedPartners.filter(pid => pid !== id));
        } else {
            setSelectedPartners([...selectedPartners, id]);
        }
    };

    return (
        <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">
                            Partners
                        </h2>
                        <button
                            onClick={handleAdd}
                            className="hover:scale-110 active:scale-95 transition-transform"
                        >
                            <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-[#EEEEEE]">
                    {(['active', 'inactive'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setPagination(prev => ({ ...prev, current: 1 })); setSelectedPartners([]); }}
                            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors flex items-center gap-2 ${activeTab === tab
                                ? 'text-[#ff3b3b]'
                                : 'text-[#666666] hover:text-[#111111]'
                                }`}
                        >
                            {tab === 'active' ? 'Active' : 'Deactivated'}
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === tab
                                ? 'bg-[#ff3b3b] text-white'
                                : 'bg-[#F7F7F7] text-[#666666]'
                                }`}>
                                {stats[tab]}
                            </span>
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toolbar / Filters */}
            <div className="mb-6">
                <FilterBar
                    filters={filterOptions}
                    selectedFilters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                    searchPlaceholder="Search partners..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                />
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto relative pb-20">
                {/* Grid Header */}
                <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_1.8fr_1.2fr_1fr_1.5fr_1.2fr_1fr_0.8fr_40px] gap-4 px-4 py-3 mb-2 items-center">
                    <div className="flex justify-center">
                        <Checkbox
                            checked={paginatedPartners.length > 0 && selectedPartners.length === paginatedPartners.length}
                            onChange={toggleSelectAll}
                            className="red-checkbox"
                        />
                    </div>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Business Name</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact Person</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Type</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Email</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Onboarding</p>
                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Country</p>
                    <p></p>
                </div>

                <div className="space-y-2">
                    {paginatedPartners.map(partner => (
                        <PartnerRow
                            key={partner.id}
                            partner={partner}
                            selected={selectedPartners.includes(partner.id)}
                            onSelect={() => toggleSelect(partner.id)}
                            onEdit={() => handleEdit(partner)}
                            onStatusUpdate={(isActive) => handleStatusUpdate(partner, isActive)}
                        />
                    ))}
                </div>

                {filteredPartners.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-[#999999] font-['Manrope:Regular',sans-serif]">
                            No partners found
                        </p>
                    </div>
                )}

                {/* Bulk Action Bar */}
                {selectedPartners.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center gap-2 border-r border-white/20 pr-6">
                            <div className="bg-[#ff3b3b] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                                {selectedPartners.length}
                            </div>
                            <span className="text-[14px] font-['Manrope:SemiBold',sans-serif]">Selected</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Export">
                                <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#ff3b3b]" title="Deactivate">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <button onClick={() => setSelectedPartners([])} className="ml-2 text-[12px] text-[#999999] hover:text-white transition-colors">
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
                <div className="mt-6 flex items-center justify-between border-t border-[#EEEEEE] pt-6">
                    <p className="text-[14px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                        {startIndex + 1}-{Math.min(startIndex + pagination.pageSize, totalItems)} of {totalItems} partners
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                            disabled={pagination.current === 1}
                            className="w-8 h-8 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4 text-[#666666]" />
                        </button>

                        {/* Simplified Pagination Digits */}
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#ff3b3b] text-white font-['Manrope:SemiBold',sans-serif] text-[13px]">
                            {pagination.current}
                        </button>

                        <button
                            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                            disabled={startIndex + pagination.pageSize >= totalItems}
                            className="w-8 h-8 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4 text-[#666666]" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F7F7F7]">
                            <Users className="w-5 h-5 text-[#666666]" />
                        </div>
                        <span className="font-['Manrope:Bold',sans-serif] text-[18px]">
                            {editingPartner ? 'Edit Partner' : 'Invite Partner'}
                        </span>
                    </div>
                }
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => setIsModalOpen(false)}
                okText={editingPartner ? 'Update' : 'Send Invitation'}
                cancelButtonProps={{ className: "font-['Manrope:SemiBold',sans-serif]" }}
                okButtonProps={{
                    style: { backgroundColor: '#111111' },
                    className: "font-['Manrope:SemiBold',sans-serif]"
                }}
                width={500}
                centered
                className="rounded-[16px] overflow-hidden"
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <Form.Item name="name" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Name</span>} rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined className="text-gray-400" />} className="h-10" placeholder="Partner Name" />
                    </Form.Item>

                    <Form.Item name="email" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Email</span>} rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined className="text-gray-400" />} className="h-10" placeholder="email@example.com" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
