'use client';

import { useState } from 'react';
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
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { PartnerRow, Partner } from './rows/PartnerRow';
import { BankOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';

// Mock Data
const initialPartners: Partner[] = [
    {
        id: 1,
        name: "Satyam Yadav",
        company: "Triem Security",
        type: 'ORGANIZATION',
        email: "satyam@triem.in",
        phone: "+91 98765 43210",
        country: "India",
        status: 'active',
        requirements: 5,
        onboarding: "15-Nov-2025"
    },
    {
        id: 2,
        name: "Alice Johnson",
        company: "Alice Johnson",
        type: 'INDIVIDUAL',
        email: "alice@design.com",
        phone: "+44 7700 900077",
        country: "UK",
        status: 'active',
        requirements: 2,
        onboarding: "20-Nov-2025"
    },
    {
        id: 3,
        name: "John Smith",
        company: "TechCorp Inc.",
        type: 'ORGANIZATION',
        email: "john@techcorp.com",
        phone: "+1 555 0123",
        country: "USA",
        status: 'active',
        requirements: 8,
        onboarding: "01-Nov-2025"
    },
    {
        id: 4,
        name: "Michael Brown",
        company: "MB Solutions",
        type: 'INDIVIDUAL',
        email: "michael@mb.com",
        phone: "+1 444 555 6666",
        country: "USA",
        status: 'inactive',
        requirements: 0,
        onboarding: "10-Oct-2025"
    }
];

const { Option } = Select;

export function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>(initialPartners);
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
        form.setFieldsValue({
            type: 'ORGANIZATION',
            country: 'USA',
            onboarding: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
            requirements: 0,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (record: Partner) => {
        setEditingPartner(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Deactivate Partner',
            content: 'Are you sure you want to deactivate this partner?',
            okText: 'Deactivate',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                setPartners(prev => prev.map(p => p.id === id ? { ...p, status: 'inactive' } : p));
                message.success('Partner deactivated');
            }
        });
    };

    const handleModalOk = () => {
        form.validateFields().then(values => {
            const newPartner: Partner = {
                id: editingPartner ? editingPartner.id : Math.max(...partners.map(p => p.id), 0) + 1,
                ...values,
                company: values.type === 'INDIVIDUAL' ? (values.company || values.name) : values.company,
                status: editingPartner ? editingPartner.status : 'active'
            };

            if (editingPartner) {
                setPartners(prev => prev.map(p => p.id === editingPartner.id ? newPartner : p));
                message.success('Partner updated successfully');
            } else {
                setPartners(prev => [newPartner, ...prev]);
                message.success('Partner added successfully');
            }
            setIsModalOpen(false);
        });
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
                            onDelete={() => handleDelete(partner.id)}
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
                            {editingPartner ? 'Edit Partner' : 'Add Partner'}
                        </span>
                    </div>
                }
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => setIsModalOpen(false)}
                okText={editingPartner ? 'Update' : 'Create'}
                cancelButtonProps={{ className: "font-['Manrope:SemiBold',sans-serif]" }}
                okButtonProps={{
                    style: { backgroundColor: '#111111' },
                    className: "font-['Manrope:SemiBold',sans-serif]"
                }}
                width={600}
                centered
                className="rounded-[16px] overflow-hidden"
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="type" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Partner Type</span>} rules={[{ required: true }]}>
                            <Select className="h-10">
                                <Option value="INDIVIDUAL">Individual</Option>
                                <Option value="ORGANIZATION">Organization</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="country" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Country</span>} rules={[{ required: true }]}>
                            <Select className="h-10" showSearch>
                                <Option value="USA">USA</Option>
                                <Option value="India">India</Option>
                                <Option value="UK">UK</Option>
                                <Option value="UAE">UAE</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                        {({ getFieldValue }) => (
                            getFieldValue('type') === 'ORGANIZATION' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item name="company" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Business Name</span>} rules={[{ required: true }]}>
                                        <Input prefix={<BankOutlined className="text-gray-400" />} className="h-10" placeholder="Company Name" />
                                    </Form.Item>
                                    <Form.Item name="name" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Contact Person</span>} rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined className="text-gray-400" />} className="h-10" placeholder="Contact Person" />
                                    </Form.Item>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item name="name" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Full Name</span>} rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined className="text-gray-400" />} className="h-10" placeholder="Full Name" />
                                    </Form.Item>
                                    <Form.Item name="company" hidden><Input /></Form.Item>
                                </div>
                            )
                        )}
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="email" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Email</span>} rules={[{ required: true, type: 'email' }]}>
                            <Input prefix={<MailOutlined className="text-gray-400" />} className="h-10" placeholder="email@example.com" />
                        </Form.Item>
                        <Form.Item name="phone" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Phone</span>} rules={[{ required: true }]}>
                            <Input prefix={<PhoneOutlined className="text-gray-400" />} className="h-10" placeholder="+1 234 567 890" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="onboarding" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Onboarding Date</span>}>
                            <Input prefix={<CalendarOutlined className="text-gray-400" />} className="h-10" placeholder="DD-MMM-YYYY" />
                        </Form.Item>
                        <Form.Item name="requirements" label={<span className="font-['Manrope:Bold',sans-serif] text-[13px]">Requirements Count</span>}>
                            <Input type="number" className="h-10" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
