'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, App } from "antd";
import { FolderOpen } from 'lucide-react';
import { useCreateWorkspace, useUpdateWorkspace } from '@/hooks/useWorkspace';
import { usePartners, useCurrentUserCompany } from '@/hooks/useUser';

const { TextArea } = Input;
const { Option } = Select;

interface WorkspaceFormProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (data?: any) => void;
    initialData?: any; // Added for edit mode
}

const defaultWorkspaceData = {
    id: null as number | null,
    name: '',
    description: '',
    partner_id: null as number | null,
    inHouse: true,
};

export function WorkspaceForm({ open, onCancel, onSuccess, initialData }: WorkspaceFormProps) {
    const { message } = App.useApp();
    const { data: partnersData } = usePartners();
    const { data: companyData } = useCurrentUserCompany();
    const createWorkspaceMutation = useCreateWorkspace();
    const updateWorkspaceMutation = useUpdateWorkspace();

    const [newWorkspace, setNewWorkspace] = useState(defaultWorkspaceData);

    // Sync form with initialData when opened
    useEffect(() => {
        if (open) {
            if (initialData) {
                setNewWorkspace({
                    id: initialData.id,
                    name: initialData.name || '',
                    description: initialData.description || '',
                    partner_id: initialData.partner_id || null,
                    inHouse: initialData.in_house ?? !initialData.partner_id,
                });
            } else {
                setNewWorkspace(defaultWorkspaceData);
            }
        }
    }, [open, initialData]);


    const handleAction = async () => {
        if (!newWorkspace.name) {
            message.error("Workspace name is required");
            return;
        }

        const payload = {
            name: newWorkspace.name,
            description: newWorkspace.description || '',
            partner_id: newWorkspace.inHouse ? null : newWorkspace.partner_id,
            in_house: newWorkspace.inHouse,
        };

        const mutation = initialData ? updateWorkspaceMutation : createWorkspaceMutation;
        const mutationParams = initialData ? { id: initialData.id, ...payload } : payload;

        mutation.mutate(
            mutationParams as any,
            {
                onSuccess: (data: any) => {
                    message.success(`Workspace ${initialData ? 'updated' : 'created'} successfully!`);
                    if (onSuccess) onSuccess(data);
                    onCancel();
                },
                onError: (error: any) => {
                    const errorMessage = error?.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} workspace`;
                    message.error(errorMessage);
                },
            }
        );
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={null}
            width={600}
            centered
            className="workspace-form-modal rounded-[16px] overflow-hidden"
            closable={true}
            styles={{
                body: {
                    padding: 0,
                    maxHeight: 'calc(100vh - 100px)',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <div className="flex flex-col h-full bg-white">
                {/* Fixed Header */}
                <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-4">
                    <div className="flex items-center gap-2 text-[17px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                        <div className="p-1.5 rounded-full bg-[#F7F7F7]">
                            <FolderOpen className="w-4 h-4 text-[#666666]" />
                        </div>
                        {initialData ? 'EDIT WORKSPACE' : 'CREATE WORKSPACE'}
                    </div>
                    <p className="text-[12px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-10 mt-1">
                        {initialData ? 'Update your workspace details.' : 'Create a new workspace to organize your Requirements.'}
                    </p>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Workspace Name */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace Name</label>
                            <Input
                                placeholder="e.g. Website Redesign"
                                className="h-11 rounded-xl border-[#EEEEEE] font-['Manrope:Medium',sans-serif]"
                                value={newWorkspace.name}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                            />
                        </div>

                        {/* Organization (Partner Company) */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Organization</label>
                            <Select
                                showSearch={{
                                    filterOption: (input, option) =>
                                        (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                                }}
                                className="w-full h-11"
                                placeholder="Select organization"
                                value={newWorkspace.inHouse ? 'self' : newWorkspace.partner_id}
                                onChange={(val) => {
                                    if (val === 'self') {
                                        setNewWorkspace({ ...newWorkspace, inHouse: true, partner_id: null });
                                    } else {
                                        setNewWorkspace({ ...newWorkspace, inHouse: false, partner_id: val as number });
                                    }
                                }}
                                styles={{ popup: { root: { borderRadius: '12px', padding: '8px' } } }}
                            >
                                <Option value="self" className="rounded-lg mb-1">
                                    {companyData?.result?.name || 'My Company'} (Self)
                                </Option>
                                {partnersData?.result?.map((partner: any) => (
                                    <Option key={partner.partner_user_id || partner.id} value={partner.partner_user_id || partner.id} className="rounded-lg mb-1">
                                        {partner.company || partner.partner_company?.name || partner.name || partner.email}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        {/* Description - Full Width */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</label>
                            <TextArea
                                placeholder="Describe your workspace..."
                                className="rounded-xl border-[#EEEEEE] font-['Manrope:Medium',sans-serif] py-3"
                                rows={4}
                                value={newWorkspace.description}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-5 flex items-center justify-end bg-white gap-3">
                    <Button
                        type="text"
                        onClick={onCancel}
                        className="h-11 px-6 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-xl transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleAction}
                        loading={createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending}
                        className="h-11 px-8 rounded-xl bg-[#111111] hover:bg-[#000000] text-white text-[14px] font-['Manrope:SemiBold',sans-serif] border-none shadow-none transition-all active:scale-95"
                    >
                        {initialData ? 'Update Workspace' : 'Create Workspace'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
