'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Input, Select, Button, Upload, DatePicker, Checkbox } from 'antd';
import { Upload as UploadIcon, FileText, ChevronDown, User } from 'lucide-react';
import { useOutsourcePartners, useEmployees } from '@/hooks/useUser';

const { TextArea } = Input;
const { Option } = Select;

import { CreateRequirementRequestDto } from '@/types/dto/requirement.dto';

export interface RequirementFormData {
    title: string;
    workspace: string | number | undefined;
    type: 'inhouse' | 'outsourced';
    contactPerson?: string;
    contact_person_id?: number;
    dueDate: string;
    budget?: string;
    is_high_priority?: boolean;
    description: string;
    status?: string;
    receiver_company_id?: number;
}

interface RequirementsFormProps {
    initialData?: RequirementFormData;
    onSubmit: (data: CreateRequirementRequestDto) => void;
    onCancel: () => void;
    workspaces: { id: number | string; name: string }[];
    isLoading?: boolean;
    isEditing?: boolean;
}

export function RequirementsForm({
    initialData,
    onSubmit,
    onCancel,
    workspaces,
    isLoading = false,
    isEditing = false,
}: Readonly<RequirementsFormProps>) {
    const { data: partnersData, isLoading: isLoadingPartners, refetch: refetchPartners } = useOutsourcePartners();
    const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();

    // Refetch partners when form opens to ensure fresh data (especially after status changes)
    useEffect(() => {
        refetchPartners();
    }, [refetchPartners]);

    // Process partners - filter for active and ensure unique IDs
    const partners = (partnersData?.result || [])
        // Relaxed filter: Allow if status is ACCEPTED OR if is_active is explicitly true (handling potential missing status in legacy data)
        .filter((item: any) => (item.status === 'ACCEPTED' || item.is_active === true) && item.is_active !== false)
        .map((item: any) => {
            // Fix: Backend returns client_id/outsource_id/association_id/invite_id, not user_... prefixes
            const id = item.partner_user_id ?? item.user_id ?? item.client_id ?? item.outsource_id ?? item.association_id ?? item.invite_id ?? item.id;
            return {
                id: (typeof id === 'number' ? id : undefined) as number | undefined,
                name: (item.partner_user?.name || item.name || item.partner_user?.company || item.company || 'Unknown Partner') as string,
                company: (item.partner_user?.company || item.company) as string | undefined,
                company_id: item.company_id as number | undefined // Preserve company_id for receiver_company_id logic
            };
        })
        .filter((p: { id?: number }) => p.id !== undefined);

    // Process employees
    const employees = (employeesData?.result || [])
        .filter((item: any) => item.user_employee?.is_active !== false)
        .map((item: any) => {
            const id = item.user_id ?? item.id;
            return {
                id: (typeof id === 'number' ? id : undefined) as number | undefined,
                name: (item.name || 'Unknown Employee') as string,
                designation: item.designation as string | undefined
            };
        })
        .filter((e: { id?: number }) => e.id !== undefined);

    const [formData, setFormData] = useState<RequirementFormData>({
        title: '',
        workspace: undefined,
        type: 'inhouse',
        contactPerson: undefined,
        dueDate: '',
        budget: '',
        is_high_priority: false,
        description: '',
        ...initialData,
    });

    // Reset form when initialData changes (for editing mode switching)
    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({ 
                ...prev, 
                ...initialData,
                contact_person_id: initialData.contact_person_id ?? undefined,
                workspace: initialData.workspace ?? undefined
            }));
        }
    }, [initialData]);

    const handleSubmit = () => {
        // Find the selected partner to extract receiver_company_id
        const selectedPartner = partners.find(p => p.id === formData.contact_person_id);
        
        console.log('RequirementsForm handleSubmit DEBUG:', {
            formDataType: formData.type,
            formDataContactPersonId: formData.contact_person_id,
            formDataWorkspace: formData.workspace,
            partnersCount: partners.length,
            selectedPartner,
            derivedReceiverCompanyId: selectedPartner?.company_id,
        });

        // Build payload with workspace_id
        const payload: CreateRequirementRequestDto = {
            title: formData.title,
            workspace_id: formData.workspace ? Number(formData.workspace) : 0, // Ensure valid ID
            description: formData.description,
            type: formData.type,
            status: 'Assigned', // specific string literal if required or mapped
            is_high_priority: formData.is_high_priority,
            contact_person_id: formData.contact_person_id,
            contact_person: formData.contactPerson,
            receiver_company_id: selectedPartner?.company_id,
            budget: Number(formData.budget) || 0,
            end_date: formData.dueDate ? dayjs(formData.dueDate).toISOString() : undefined,
            start_date: new Date().toISOString(),
            priority: formData.is_high_priority ? 'High' : 'Medium', // Map boolean to string expected by DTO/Backend
        };

        onSubmit(payload);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-3">
                <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2 text-[17px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                        <div className="p-1.5 rounded-full bg-[#F7F7F7]">
                            <FileText className="w-3.5 h-3.5 text-[#666666]" />
                        </div>
                        {isEditing ? 'Edit Requirement' : 'New Requirement'}
                    </div>
                </div>
                <p className="text-[11px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-9">
                    Define a new requirement and send it for approval/processing.
                </p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {/* Row 1: Title & Workspace */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                    <div className="space-y-1.5">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Title</span>
                        <Input
                            placeholder="Enter requirement title"
                            className="h-11 rounded-lg border border-[#EEEEEE]"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace</span>
                        <Select
                            showSearch={{
                                filterOption: (input, option) =>
                                    (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                            }}
                            className="w-full h-11"
                            placeholder="Select workspace"
                            value={formData.workspace ? String(formData.workspace) : undefined}
                            onChange={(v) => setFormData({ ...formData, workspace: v })}
                            popupStyle={{ zIndex: 2000 }}
                            suffixIcon={<ChevronDown className="w-4 h-4 text-gray-400" />}
                            disabled={formData.type === 'outsourced'}
                        >
                            {workspaces && workspaces.length > 0 ? (
                                workspaces.map((w) => (
                                    <Option key={String(w.id)} value={String(w.id)}>
                                        {w.name}
                                    </Option>
                                ))
                            ) : (
                                <Option value="none" disabled>
                                    No workspaces available
                                </Option>
                            )}
                        </Select>
                    </div>
                </div>

                {/* Row 2: Requirement Type & Contact Person */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                    <div className="space-y-1.5">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Type</span>
                        <Select
                            className="w-full h-11"
                            placeholder="Select type"
                            value={formData.type}
                            onChange={(v) => setFormData({ 
                                ...formData, 
                                type: v, 
                                contact_person_id: undefined, 
                                contactPerson: undefined,
                                // If outsourced, clear workspace (Receiver assigns it)
                                workspace: v === 'outsourced' ? undefined : formData.workspace 
                            })}
                            suffixIcon={<ChevronDown className="w-4 h-4 text-gray-400" />}
                        >
                            <Option value="inhouse">In-house</Option>
                            <Option value="outsourced">Partner (Outsourced)</Option>
                        </Select>
                    </div>

                    <div className="space-y-1.5" id="contact-person-selection">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Contact Person</span>
                        <Select
                            showSearch={{
                                filterOption: (input, option) =>
                                    (String(option?.label ?? '')).toLowerCase().includes(input.toLowerCase())
                            }}
                            className="w-full h-11"
                            placeholder={`Select ${formData.type === 'inhouse' ? 'employee' : 'partner'}`}
                            value={typeof formData.contact_person_id === 'number' ? formData.contact_person_id : undefined}
                            onChange={(v, option: any) => setFormData({
                                ...formData,
                                contact_person_id: typeof v === 'number' ? v : undefined,
                                contactPerson: option?.label
                            })}
                            loading={formData.type === 'inhouse' ? isLoadingEmployees : isLoadingPartners}
                            suffixIcon={<ChevronDown className="w-4 h-4 text-gray-400" />}
                        >
                            {formData.type === 'inhouse' ? (
                                employees.map((e: any) => (
                                    <Option key={e.id} value={e.id} label={e.name}>
                                        <div className="flex flex-col py-1">
                                            <span className="font-semibold">{e.name}</span>
                                            {e.designation && <span className="text-[10px] text-gray-400 font-normal">{e.designation}</span>}
                                        </div>
                                    </Option>
                                ))
                            ) : (
                                partners.map((p: any) => (
                                    <Option key={p.id} value={p.id} label={p.name}>
                                        <div className="flex flex-col py-1">
                                            <span className="font-semibold">{p.name}</span>
                                            {p.company && <span className="text-[10px] text-gray-400 font-normal">{p.company}</span>}
                                        </div>
                                    </Option>
                                ))
                            )}
                        </Select>
                    </div>
                </div>
                {/* Row 3: Standard Fields (Due Date & Priority) */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                    <div className="space-y-1.5">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</span>
                        <DatePicker
                            placeholder="Select due date"
                            className="w-full h-11 rounded-lg border-[#EEEEEE]"
                            value={formData.dueDate ? dayjs(formData.dueDate) : null}
                            onChange={(date, dateString) => setFormData({ ...formData, dueDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                        />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-center">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">Priority</span>
                        <Checkbox
                            checked={formData.is_high_priority}
                            onChange={(e) => setFormData({ ...formData, is_high_priority: e.target.checked })}
                            className="font-medium text-sm"
                        >
                            High Priority
                        </Checkbox>
                    </div>
                </div>

                {/* Row 4: Budget (Outsourced only) - Only show when editing */}
                {formData.type === 'outsourced' && isEditing && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                        <div className="space-y-1.5">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Target Budget</span>
                            <Input
                                type="number"
                                prefix="$"
                                placeholder="0.00"
                                className="h-11 rounded-lg border border-[#EEEEEE]"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-1.5 mb-4">
                    <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
                    <TextArea
                        placeholder="Describe the requirement..."
                        className="min-h-[100px] rounded-lg border border-[#EEEEEE] resize-none p-3.5"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Upload Documents */}
                <div className="space-y-1.5">
                    <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Upload Documents</span>
                    <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-[#ff3b3b]/30 hover:bg-[#FFFAFA] transition-colors cursor-pointer bg-white group">
                        <div className="w-8 h-8 rounded-full bg-[#F7F7F7] group-hover:bg-white flex items-center justify-center mb-1.5 transition-colors">
                            <UploadIcon className="w-4 h-4 text-[#999999] group-hover:text-[#ff3b3b] transition-colors" />
                        </div>
                        <p className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-0.5">
                            Choose a file or drag & drop it here
                        </p>
                        <p className="text-[10px] text-[#999999] font-['Inter:Regular',sans-serif]">
                            txt, docx, pdf, jpeg, xlsx - Up to 50MB
                        </p>
                        <Button className="mt-2.5 h-7 px-4 bg-white border border-[#EEEEEE] text-[11px] font-['Manrope:SemiBold',sans-serif] text-[#111111] hover:bg-[#F7F7F7] hover:text-[#ff3b3b] hover:border-[#ff3b3b]/20 rounded-md">
                            Browse files
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-4 flex items-center justify-end bg-white gap-4">
                <Button
                    type="text"
                    onClick={onCancel}
                    className="h-[40px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
                >
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
                    className="h-[40px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditing ? 'Update Requirement' : 'Save Requirement'}
                </Button>
            </div>
        </div>
    );
}
