'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Input, Select, Button, Upload, DatePicker } from 'antd';
import { Upload as UploadIcon, FileText } from 'lucide-react';

const { TextArea } = Input;
const { Option } = Select;

export interface RequirementFormData {
    title: string;
    workspace: string | number | undefined;
    type: 'inhouse' | 'outsourced';
    contactPerson?: string;
    dueDate: string;
    budget?: string;
    priority?: string;
    description: string;
    status?: string;
}

interface RequirementsFormProps {
    initialData?: RequirementFormData;
    onSubmit: (data: RequirementFormData) => void;
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
}: RequirementsFormProps) {
    const [formData, setFormData] = useState<RequirementFormData>({
        title: '',
        workspace: undefined,
        type: 'inhouse',
        contactPerson: undefined,
        dueDate: '',
        budget: '',
        priority: undefined,
        description: '',
        ...initialData,
    });

    // Reset form when initialData changes (for editing mode switching)
    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSubmit = () => {
        onSubmit(formData);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                        <div className="p-2 rounded-full bg-[#F7F7F7]">
                            <FileText className="w-5 h-5 text-[#666666]" />
                        </div>
                        {isEditing ? 'Edit Requirement' : 'New Requirement'}
                    </div>
                </div>
                <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
                    Define a new requirement and send it for approval/processing.
                </p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {/* Row 1: Title & Workspace */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Title</span>
                        <Input
                            placeholder="Enter requirement title"
                            className={`h-[46px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Medium',sans-serif] ${formData.title ? 'bg-white' : ''}`}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace</span>
                        <Select
                            className="w-full h-[46px] custom-modal-select"
                            placeholder="Select workspace"
                            variant="borderless"
                            value={formData.workspace ? String(formData.workspace) : undefined}
                            onChange={(v) => setFormData({ ...formData, workspace: v })}
                            style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                            dropdownStyle={{ zIndex: 2000 }}
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

                {/* Row 2: Type & (Contact Person OR Due Date) */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Type</span>
                        <Select
                            className="w-full h-[46px] custom-modal-select"
                            placeholder="Select type"
                            variant="borderless"
                            value={formData.type}
                            onChange={(v) => setFormData({ ...formData, type: v })}
                            style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                        >
                            <Option value="inhouse">In-house (Internal / Client)</Option>
                            <Option value="outsourced">Outsourced (Vendor)</Option>
                        </Select>
                    </div>

                    {/* Contact Person (Visible for Outsourced) */}
                    {formData.type === 'outsourced' ? (
                        <div className="space-y-2">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Contact Person</span>
                            <Select
                                className="w-full h-[46px] custom-modal-select"
                                placeholder="Select contact"
                                variant="borderless"
                                value={formData.contactPerson}
                                onChange={(v) => setFormData({ ...formData, contactPerson: v })}
                                style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                            >
                                <Option value="Sarah Wilson">Sarah Wilson</Option>
                                <Option value="John Smith">John Smith</Option>
                                <Option value="David Brown">David Brown</Option>
                                <Option value="Emily Chen">Emily Chen</Option>
                            </Select>
                        </div>
                    ) : (
                        /* Due Date (Visible for In-house) */
                        <div className="space-y-2">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</span>
                            <DatePicker
                                placeholder="Select due date"
                                className={`w-full h-[46px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Medium',sans-serif] ${formData.dueDate ? 'bg-white' : ''}`}
                                value={formData.dueDate ? dayjs(formData.dueDate) : null}
                                onChange={(date, dateString) => setFormData({ ...formData, dueDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                            />
                        </div>
                    )}
                </div>

                {/* Row 3: Outsourced (Due Date & Priority) / In-house (Priority) */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {formData.type === 'outsourced' ? (
                        <>
                            <div className="space-y-2">
                                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</span>
                                <DatePicker
                                    placeholder="Select due date"
                                    className={`w-full h-[46px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Medium',sans-serif] ${formData.dueDate ? 'bg-white' : ''}`}
                                    value={formData.dueDate ? dayjs(formData.dueDate) : null}
                                    onChange={(date, dateString) => setFormData({ ...formData, dueDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</span>
                                <Select
                                    className="w-full h-[46px] custom-modal-select"
                                    placeholder="Select priority"
                                    variant="borderless"
                                    value={formData.priority}
                                    onChange={(v) => setFormData({ ...formData, priority: v })}
                                    style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                                >
                                    <Option value="low">Low</Option>
                                    <Option value="medium">Medium</Option>
                                    <Option value="high">High</Option>
                                </Select>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</span>
                            <Select
                                className="w-full h-[46px] custom-modal-select"
                                placeholder="Select priority"
                                variant="borderless"
                                value={formData.priority}
                                onChange={(v) => setFormData({ ...formData, priority: v })}
                                style={{ backgroundColor: '#F7F7F7', borderRadius: '8px', border: '1px solid #EEEEEE' }}
                            >
                                <Option value="low">Low</Option>
                                <Option value="medium">Medium</Option>
                                <Option value="high">High</Option>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Row 4: Budget (Outsourced only) - Only show when editing */}
                {formData.type === 'outsourced' && isEditing && (
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Target Budget</span>
                            <Input
                                type="number"
                                prefix="$"
                                placeholder="0.00"
                                className="h-[46px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Medium',sans-serif]"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
                    <TextArea
                        placeholder="Describe the requirement..."
                        className={`min-h-[120px] rounded-lg border-[#EEEEEE] bg-[#F7F7F7] focus:bg-white transition-colors font-['Manrope:Regular',sans-serif] resize-none p-4 ${formData.description ? 'bg-white' : ''}`}
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Upload Documents */}
                <div className="space-y-2">
                    <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Upload Documents</span>
                    <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-[#ff3b3b]/30 hover:bg-[#FFFAFA] transition-colors cursor-pointer bg-white group">
                        <div className="w-10 h-10 rounded-full bg-[#F7F7F7] group-hover:bg-white flex items-center justify-center mb-2 transition-colors">
                            <UploadIcon className="w-5 h-5 text-[#999999] group-hover:text-[#ff3b3b] transition-colors" />
                        </div>
                        <p className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-0.5">
                            Choose a file or drag & drop it here
                        </p>
                        <p className="text-[11px] text-[#999999] font-['Inter:Regular',sans-serif]">
                            txt, docx, pdf, jpeg, xlsx - Up to 50MB
                        </p>
                        <Button className="mt-3 h-8 bg-white border border-[#EEEEEE] text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#111111] hover:bg-[#F7F7F7] hover:text-[#ff3b3b] hover:border-[#ff3b3b]/20">
                            Browse files
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-6 flex items-center justify-end bg-white gap-4">
                <Button
                    type="text"
                    onClick={onCancel}
                    className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
                >
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
                    className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditing ? 'Update Requirement' : 'Save Requirement'}
                </Button>
            </div>
        </div>
    );
}
