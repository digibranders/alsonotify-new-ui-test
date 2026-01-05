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
    message,
    Dropdown
} from 'antd';
import { PageLayout } from '../../layout/PageLayout';
import {
    Plus,
    Trash2,
    Users,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Globe,
    Mail,
    MoreVertical,
    Building,
    User,
    Check,
    X
} from 'lucide-react';
import { PaginationBar } from '../../ui/PaginationBar';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTabSync } from '@/hooks/useTabSync';
import axiosApi from '../../../config/axios';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { PartnerRow, Partner, PartnerStatus } from './rows/PartnerRow';
import { acceptInvitation, updatePartnerStatus, getReceivedInvites, acceptInviteById, declineInviteById, getPartners } from '@/services/user';
import { BankOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';

// Mock Data
const { Option } = Select;

const countryCodes = [
    { code: "+1", country: "US" },
    { code: "+91", country: "IN" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "AU" },
    { code: "+81", country: "JP" },
    { code: "+49", country: "DE" },
    { code: "+971", country: "AE" },
];

export function PartnersPageContent() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]); // New state
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useTabSync<'active' | 'inactive' | 'requests'>({
        defaultTab: 'active',
        validTabs: ['active', 'inactive', 'requests']
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'All',
        country: 'All'
    });
    const [selectedPartners, setSelectedPartners] = useState<number[]>([]);
    const [requestTypeFilter, setRequestTypeFilter] = useState<'All' | 'Sent' | 'Received'>('All');
    const [form] = Form.useForm();

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const [partnersRes, invitesRes] = await Promise.all([
                getPartners(),
                getReceivedInvites() // Fetch invites
            ]);

            if (invitesRes.success) {
                setPendingInvites(invitesRes.result as any[]);
            }

            if (partnersRes.success) {
                const mappedPartners: Partner[] = partnersRes.result.map((item: any) => {
                    let status: 'active' | 'inactive' | 'pending' = 'pending';
                    if (item.status === 'ACCEPTED') {
                        status = item.is_active ? 'active' : 'inactive';
                    }

                    return {
                        id: item.association_id || item.invite_id,
                        association_id: item.association_id,
                        name: item.name || '',
                        company: item.company || '',
                        type: item.company ? 'ORGANIZATION' : 'INDIVIDUAL',
                        email: item.email || '',
                        phone: item.phone || '',
                        country: item.country || '',
                        timezone: item.timezone || '',
                        status,
                        requirements: 0,
                        onboarding: item.associated_date ? new Date(item.associated_date).toLocaleDateString() : '-',
                        rawStatus: item.status,
                        isOrgAccount: !!item.company,
                        partner_user_id: item.partner_user_id,
                        company_id: item.company_id
                    };
                });
                setPartners(mappedPartners); ``
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    // Sync activeTab with URL
    // Sync activeTab with URL - handled by useTabSync
    // useEffect(() => {
    //     const tab = searchParams.get('tab');
    //     if (tab === 'active' || tab === 'inactive' || tab === 'requests') {
    //         setActiveTab(tab);
    //     }
    // }, [searchParams]);

    // Handle invitation acceptance from URL
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
        inactive: partners.filter(p => p.status === 'inactive').length,
        requests: pendingInvites.length + partners.filter(p => p.status === 'pending').length
    };

    const [lastStandardTab, setLastStandardTab] = useState<'active' | 'inactive'>('active');

    // Update lastStandardTab when activeTab changes
    useEffect(() => {
        if (activeTab === 'active' || activeTab === 'inactive') {
            setLastStandardTab(activeTab);
        }
    }, [activeTab]);

    // Data Preparation Logic (Hoisted)
    // 1. Prepare Standard Partners (Active/Inactive)
    const effectiveStatusFilter = activeTab === 'requests' ? lastStandardTab : activeTab;

    const filteredPartners = partners.filter(item => {
        const matchesTab = item.status === effectiveStatusFilter;
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filters.type === 'All' || item.type.toUpperCase() === filters.type.toUpperCase();
        const matchesCountry = filters.country === 'All' || (() => {
            if (!item.country) return false;
            let fullName = item.country;
            try {
                fullName = new Intl.DisplayNames(['en'], { type: 'region' }).of(item.country) || item.country;
            } catch { }
            return fullName.toLowerCase() === filters.country.toLowerCase();
        })();
        return matchesTab && matchesSearch && matchesType && matchesCountry;
    });

    const standardStartIndex = (pagination.current - 1) * pagination.pageSize;
    const paginatedPartners = filteredPartners.slice(standardStartIndex, standardStartIndex + pagination.pageSize);

    // 2. Prepare Requests
    const receivedRequests = (requestTypeFilter === 'All' || requestTypeFilter === 'Received')
        ? pendingInvites.map(invite => ({ type: 'received' as const, data: invite }))
        : [];
    const sentRequests = (requestTypeFilter === 'All' || requestTypeFilter === 'Sent')
        ? partners.filter(p => p.status === 'pending').map(partner => ({ type: 'sent' as const, data: partner }))
        : [];

    const allRequests = [...receivedRequests, ...sentRequests];
    const requestsStartIndex = (pagination.current - 1) * pagination.pageSize;
    const paginatedRequests = allRequests.slice(requestsStartIndex, requestsStartIndex + pagination.pageSize);

    // Handlers
    const handleAdd = () => {
        setEditingPartner(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Partner) => {
        setEditingPartner(record);
        const nameParts = (record.name || "").split(" ");
        form.setFieldsValue({
            ...record,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || ""
        });
        setIsModalOpen(true);
    };

    const handleStatusUpdate = async (partner: Partner, newStatus: PartnerStatus) => {
        if (!partner.association_id) {
            message.warning('Cannot change status of a pending invitation');
            return;
        }

        const isActive = newStatus === 'active';
        const action = isActive ? 'activate' : 'deactivate';

        Modal.confirm({
            title: `${isActive ? 'Activate' : 'Deactivate'} Partner`,
            content: `Are you sure you want to ${action} this partner?`,
            okText: isActive ? 'Activate' : 'Deactivate',
            okType: isActive ? 'primary' : 'danger',
            cancelText: 'Cancel',
            async onOk() {
                try {
                    if (!partner.partner_user_id) {
                        message.error("Invalid Partner ID");
                        return;
                    }
                    const result = await updatePartnerStatus({
                        partner_user_id: partner.partner_user_id,
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

    const handleAcceptInvite = async (inviteId: number) => {
        try {
            const res = await acceptInviteById(inviteId);
            if (res.success) {
                message.success('Invite accepted successfully');
                // Optimistically remove from pending list
                setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
                fetchPartners(); // Refresh both lists to get updated active partners
            } else {
                message.error(res.message || 'Failed to accept invite');
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to accept invite');
        }
    };

    const handleDeclineInvite = async (inviteId: number) => {
        try {
            const res = await declineInviteById(inviteId);
            if (res.success) {
                message.success('Invite declined successfully');
                fetchPartners(); // Refresh both lists
            } else {
                message.error(res.message || 'Failed to decline invite');
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to decline invite');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();

            // Sending invitation
            const fullName = [values.firstName, values.lastName].filter(Boolean).join(' ').trim();
            await axiosApi.post('/user/invite', {
                email: values.email,
                name: fullName,
                requestSentFor: 'PARTNER'
            });

            message.success('Invitation sent successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchPartners();
        } catch (error: any) {
            console.error('Failed to send invitation:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send invitation. Please check your connection and try again.';
            message.error(errorMessage);
        }
    };

    // Filter Configuration
    const countries = ['All', ...Array.from(new Set(partners.map(p => {
        if (!p.country) return 'N/A';
        try {
            return new Intl.DisplayNames(['en'], { type: 'region' }).of(p.country) || p.country;
        } catch {
            return p.country;
        }
    })))];
    const filterOptions: FilterOption[] = [
        { id: 'type', label: 'Type', options: ['All', 'Individual', 'Organization'], defaultValue: 'All' },
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

    // Tab-specific Filter Options
    const requestsFilterOptions: FilterOption[] = [
        { id: 'requestType', label: 'Show', options: ['All', 'Received', 'Sent'], defaultValue: 'All' }
    ];

    const activeFilterOptions: FilterOption[] = [
        { id: 'type', label: 'Type', options: ['All', 'Individual', 'Organization'], defaultValue: 'All' },
        { id: 'country', label: 'Country', options: countries, defaultValue: 'All' }
    ];

    return (
        <PageLayout
            title="Partners"
            titleAction={{
                onClick: handleAdd,
                label: "Add Partner"
            }}
            tabs={[
                { id: 'active', label: 'Active', count: stats.active },
                { id: 'inactive', label: 'Deactivated', count: stats.inactive },
                { id: 'requests', label: 'Requests', count: stats.requests }
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) => {
                setActiveTab(tabId as any);
                setPagination(prev => ({ ...prev, current: 1 }));
                setSelectedPartners([]);
            }}
        >
            {/* Toolbar / Filters */}
            <div className="mt-4 mb-6">
                <FilterBar
                    filters={activeTab === 'requests' ? requestsFilterOptions : activeFilterOptions}
                    selectedFilters={activeTab === 'requests' ? { requestType: requestTypeFilter } : filters}
                    onFilterChange={(id, val) => {
                        if (id === 'requestType') {
                            setRequestTypeFilter(val as any);
                            setPagination(prev => ({ ...prev, current: 1 }));
                        } else {
                            handleFilterChange(id, val);
                        }
                    }}
                    onClearFilters={clearFilters}
                    searchPlaceholder="Search partners..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                />
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto relative pb-5">

                {/* 1. Requests View (Toggle Visibility) */}
                <div style={{ display: activeTab === 'requests' ? 'block' : 'none' }}>
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_1.5fr_2fr_1fr_100px] gap-4 px-4 py-3 mb-2 items-center">
                        <div className="flex justify-center"></div>
                        <div className="pl-[44px]">
                            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact Person</p>
                        </div>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Email</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Status</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide text-right pr-10">Actions</p>
                    </div>

                    {/* Content */}
                    <div className="px-4 space-y-2">
                        {allRequests.length === 0 ? (
                            <div className="text-center py-20 bg-[#FAFAFA] rounded-2xl border border-dashed border-[#EEEEEE] mx-4">
                                <Users className="w-10 h-10 text-[#CCCCCC] mx-auto mb-3" />
                                <p className="text-[#999999] font-['Manrope:Medium',sans-serif]">
                                    {requestTypeFilter === 'All'
                                        ? 'No pending requests'
                                        : requestTypeFilter === 'Received'
                                            ? 'No received invitations'
                                            : 'No sent invitations'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {paginatedRequests.map((item) => (
                                    <div key={item.type === 'received' ? item.data.id : `sent-${item.data.id}`}>
                                        {/* Render Logic Inline for simplicity/preservation of original row structure */}
                                        {item.type === 'received' ? (
                                            <div className="group bg-white border border-[#EEEEEE] rounded-[16px] px-4 py-3 transition-all duration-300 hover:border-[#ff3b3b]/20 hover:shadow-lg flex items-center">
                                                {/* [Previous Receiver Row Code] - Recreated here for clarity */}
                                                <div className="grid grid-cols-[40px_1.5fr_2fr_1fr_100px] gap-4 items-center w-full">
                                                    <div className="flex justify-center">
                                                        <div className={`w-2 h-2 rounded-full ${item.data.status === 'REJECTED' ? 'bg-[#EF4444]' : 'bg-[#3b8eff]'}`} title={item.data.status === 'REJECTED' ? "Rejected" : "New Invitation"} />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {(item.data.inviterName || "?")[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111]">
                                                                {item.data.inviterName?.replace(' undefined', '')}
                                                            </span>
                                                            {item.data.inviterCompany && (
                                                                <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                                                                    {item.data.inviterCompany}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[#666666] overflow-hidden">
                                                        <Mail className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="text-[13px] font-['Manrope:Medium',sans-serif] truncate block text-[#111111]">
                                                            {(item.data).inviterEmail || (item.data).email || (item.data).inviter_email || 'Not provided'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        {item.data.status === 'REJECTED' ? (
                                                            <div className="w-2 h-2 rounded-full bg-[#EF4444]" title="Rejected" />
                                                        ) : (
                                                            <Tag color="processing" className="text-[10px] font-bold uppercase rounded-full border-none px-2.5">Action Required</Tag>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-end gap-2 pr-5">
                                                        {item.data.status === 'REJECTED' ? (
                                                            <Tag color="error" className="text-[10px] font-bold uppercase rounded-full border-none px-2.5">Rejected</Tag>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleAcceptInvite(item.data.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#DCFCE7] text-[#16A34A] transition-colors"><Check className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDeclineInvite(item.data.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FEE2E2] text-[#DC2626] transition-colors"><X className="w-4 h-4" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="group bg-white border border-[#EEEEEE] rounded-[16px] px-4 py-3 transition-all duration-300 hover:border-[#ff3b3b]/20 hover:shadow-lg flex items-center">
                                                {/* [Previous Sent Row Code] */}
                                                <div className="grid grid-cols-[40px_1.5fr_2fr_1fr_100px] gap-4 items-center w-full">
                                                    <div className="flex justify-center"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" title="Pending" /></div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${item.data.company ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                                                            {(item.data.name || "?")[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-['Manrope:Bold',sans-serif] text-[14px] text-[#111111]">
                                                                {(item.data.name || item.data.email)?.replace(' undefined', '')}
                                                            </span>
                                                            {item.data.company && <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">{item.data.company}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[#666666] overflow-hidden">
                                                        <Mail className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="text-[13px] font-['Manrope:Medium',sans-serif] truncate block text-[#111111]">{item.data.email}</span>
                                                    </div>
                                                    <div><Tag color="orange" className="text-[10px] font-bold uppercase rounded-full border-none px-2.5">Pending</Tag></div>
                                                    <div className="flex justify-end pr-5">
                                                        <button disabled className="w-8 h-8 flex items-center justify-center rounded-full opacity-30"><MoreVertical className="w-4 h-4 text-[#666666]" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Standard View (Active/Inactive) (Toggle Visibility) */}
                <div style={{ display: activeTab !== 'requests' ? 'block' : 'none' }}>
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-white grid grid-cols-[40px_2fr_1fr_0.8fr_1.5fr_0.8fr_0.7fr_0.7fr_40px] gap-4 px-4 py-3 items-center">
                        <div className="flex justify-center">
                            <Checkbox
                                checked={paginatedPartners.length > 0 && selectedPartners.length === paginatedPartners.length}
                                onChange={toggleSelectAll}
                                className="red-checkbox"
                            />
                        </div>
                        <div className="pl-[48px]">
                            <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Business Name</p>
                        </div>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Contact Person</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Type</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Email</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Onboarding</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Status</p>
                        <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Country</p>
                        <p></p>
                    </div>

                    {/* Content */}
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
            </div>

            {/* Pagination */}
            {(() => {
                const total = activeTab === 'requests' ? allRequests.length : filteredPartners.length;

                return (
                    <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-6 z-10 w-full">
                        <PaginationBar
                            currentPage={pagination.current}
                            totalItems={total}
                            pageSize={pagination.pageSize}
                            onPageChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
                            onPageSizeChange={(size) => setPagination(prev => ({ ...prev, pageSize: size, current: 1 }))}
                            itemLabel={activeTab === 'requests' ? "requests" : "partners"}
                            className="!border-none !mt-0 !pt-3 !pb-3"
                        />
                    </div>
                );
            })()}

            {/* Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-[18px] font-['Manrope:Bold',sans-serif]">
                        <UserOutlined className="p-2 bg-[#F7F7F7] rounded-full text-[#666666]" />
                        {editingPartner ? 'Partner Details' : 'Invite Partner'}
                    </div>
                }
                open={isModalOpen}
                onOk={editingPartner ? () => setIsModalOpen(false) : handleModalOk}
                onCancel={() => setIsModalOpen(false)}
                okText={editingPartner ? 'Close' : 'Send Invitation'}
                okButtonProps={{
                    className: editingPartner
                        ? "bg-[#666666] hover:bg-[#555555] border-none rounded-[8px] h-10 px-6 font-['Manrope:SemiBold',sans-serif]"
                        : "bg-[#111111] hover:bg-black border-none rounded-[8px] h-10 px-6 font-['Manrope:SemiBold',sans-serif]"
                }}
                cancelButtonProps={{
                    style: { display: editingPartner ? 'none' : 'inline-block' },
                    className: "rounded-[8px] h-10 px-6 font-['Manrope:SemiBold',sans-serif]"
                }}
                centered
                className="rounded-[16px] overflow-hidden"
            >
                {editingPartner ? (
                    <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-1">Contact Person</p>
                                <p className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">{editingPartner.name}</p>
                            </div>
                            {editingPartner.company && (
                                <div>
                                    <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-1">Company Name</p>
                                    <p className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">{editingPartner.company}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-1">Email Address</p>
                                <div className="flex items-center gap-2">
                                    <MailOutlined className="text-[#666666] text-[12px]" />
                                    <p className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#111111]">{editingPartner.email}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-1">Contact</p>
                                <div className="flex items-center gap-2">
                                    <PhoneOutlined className="text-[#666666] text-[12px]" />
                                    <p className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                                        {(() => {
                                            const phone = editingPartner.phone || '';
                                            if (phone.startsWith('+')) return phone;
                                            const code = countryCodes.find(c => c.country === editingPartner.country)?.code || '';
                                            return code ? `${code} ${phone}` : (phone || 'N/A');
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-1">Country</p>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-[#666666]" />
                                    <p className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                                        {(() => {
                                            if (!editingPartner.country) return 'N/A';
                                            try {
                                                return new Intl.DisplayNames(['en'], { type: 'region' }).of(editingPartner.country);
                                            } catch (e) {
                                                return editingPartner.country;
                                            }
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider mb-1">Timezone</p>
                                <p className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#111111]">{editingPartner.timezone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Form form={form} layout="vertical" className="mt-6" initialValues={{ countryCode: '+91' }}>
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="firstName"
                                label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">First Name</span>}
                                rules={[{ required: true, message: 'First name is required' }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-gray-400" />}
                                    className="h-10"
                                    placeholder="First Name"
                                />
                            </Form.Item>

                            <Form.Item
                                name="lastName"
                                label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Last Name</span>}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-gray-400" />}
                                    className="h-10"
                                    placeholder="Last Name (Optional)"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="email"
                            label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Email Address</span>}
                            rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
                        >
                            <Input
                                prefix={<MailOutlined className="text-gray-400" />}
                                className="h-10"
                                placeholder="email@example.com"
                            />
                        </Form.Item>
                    </Form>
                )}

            </Modal>
        </PageLayout >
    );
}
