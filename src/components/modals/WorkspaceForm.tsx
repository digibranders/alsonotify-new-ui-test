'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Checkbox, DatePicker, App } from "antd";
import { FolderOpen } from 'lucide-react';
import { useCreateWorkspace } from '@/hooks/useWorkspace';
import { useClients as useGetClients, useEmployees } from '@/hooks/useUser';

const { TextArea } = Input;
const { Option } = Select;

interface WorkspaceFormProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (data?: any) => void;
}

const defaultWorkspaceData = {
    name: '',
    client: '',
    description: '',
    highPriority: false,
    inHouse: false,
    contactPerson: '',
    manager: '',
    leader: '',
    startDate: '', // String for input value
    dueDate: '',
    documentLink: ''
};

export function WorkspaceForm({ open, onCancel, onSuccess }: WorkspaceFormProps) {
    const { message } = App.useApp();
    const { data: clientsData } = useGetClients();
    const { data: employeesData } = useEmployees();
    const createWorkspaceMutation = useCreateWorkspace();

    const [newWorkspace, setNewWorkspace] = useState(defaultWorkspaceData);

    // Reset form when opened
    useEffect(() => {
        if (open) {
            setNewWorkspace(defaultWorkspaceData);
        }
    }, [open]);

    const handleReset = () => {
        setNewWorkspace(defaultWorkspaceData);
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspace.name) {
            message.error("Workspace name is required");
            return;
        }

        // Find client ID from client name
        const selectedClient = clientsData?.result?.find((c: any) => c.name === newWorkspace.client);

        // Find manager/leader ID
        const managerId = newWorkspace.manager ? Number(newWorkspace.manager) : null;
        const leaderId = newWorkspace.leader ? Number(newWorkspace.leader) : null;

        createWorkspaceMutation.mutate(
            {
                name: newWorkspace.name,
                description: newWorkspace.description || '',
                client_id: selectedClient?.id || null,
                manager_id: managerId,
                leader_id: leaderId,
                start_date: newWorkspace.startDate ? new Date(newWorkspace.startDate).toISOString() : new Date().toISOString(),
                end_date: newWorkspace.dueDate ? new Date(newWorkspace.dueDate).toISOString() : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                document_link: newWorkspace.documentLink,
                high_priority: newWorkspace.highPriority,
                in_house: newWorkspace.inHouse,
                contact_person: newWorkspace.contactPerson,
            } as any,
            {
                onSuccess: (data: any) => {
                    message.success("Workspace created successfully!");
                    if (onSuccess) onSuccess(data);
                    onCancel();
                    handleReset();
                },
                onError: (error: any) => {
                    const errorMessage = error?.response?.data?.message || "Failed to create workspace";
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
                    height: 'calc(100vh - 100px)',
                    maxHeight: 'calc(100vh - 100px)',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <div className="flex flex-col h-full bg-white">
                {/* Fixed Header */}
                <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[17px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                            <div className="p-1.5 rounded-full bg-[#F7F7F7]">
                                <FolderOpen className="w-3.5 h-3.5 text-[#666666]" />
                            </div>
                            ADD WORKSPACE
                        </div>
                    </div>
                    <p className="text-[11px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-9">
                        Create a new workspace to organize tasks and requirements.
                    </p>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-1 gap-5 mb-5">
                        {/* Workspace Name */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#111111]">Workspace Name <span className="text-[#ff3b3b]">*</span></label>
                            <Input
                                placeholder="e.g. Website Redesign"
                                className="h-11 rounded-lg border-[#EEEEEE]"
                                value={newWorkspace.name}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#111111]">Description</label>
                            <TextArea
                                placeholder="Enter workspace description..."
                                className="font-['Manrope:Regular',sans-serif] rounded-lg border border-[#EEEEEE]"
                                rows={4}
                                value={newWorkspace.description}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                            />
                            <div className="text-right text-[11px] text-[#999999]">0/5000 characters</div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex items-center gap-6">
                            <Checkbox
                                checked={newWorkspace.highPriority}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, highPriority: e.target.checked })}
                                className="font-['Manrope:Medium',sans-serif] text-[13px]"
                            >
                                High Priority
                            </Checkbox>
                            <Checkbox
                                checked={newWorkspace.inHouse}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, inHouse: e.target.checked })}
                                className="font-['Manrope:Medium',sans-serif] text-[13px]"
                            >
                                In House
                            </Checkbox>
                        </div>

                        {/* Contact Person */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#111111]">Contact Person</label>
                            <Select
                                className="w-full h-11"
                                placeholder="Contact person"
                                value={newWorkspace.contactPerson || undefined}
                                onChange={(val) => setNewWorkspace({ ...newWorkspace, contactPerson: String(val) })}
                            >
                                <Option value="Sarah Wilson">Sarah Wilson</Option>
                                <Option value="John Smith">John Smith</Option>
                            </Select>
                        </div>

                        {/* Manager & Leader */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-[#111111]">Manager</label>
                                <Select
                                    className="w-full h-11"
                                    placeholder="Manager"
                                    value={newWorkspace.manager || undefined}
                                    onChange={(val) => setNewWorkspace({ ...newWorkspace, manager: String(val) })}
                                >
                                    {employeesData?.result?.map((emp: any) => (
                                        <Option key={emp.user_id || emp.id} value={String(emp.user_id || emp.id)}>
                                            {emp.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-[#111111]">Leader</label>
                                <Select
                                    className="w-full h-11"
                                    placeholder="Leader"
                                    value={newWorkspace.leader || undefined}
                                    onChange={(val) => setNewWorkspace({ ...newWorkspace, leader: String(val) })}
                                >
                                    {employeesData?.result?.map((emp: any) => (
                                        <Option key={emp.user_id || emp.id} value={String(emp.user_id || emp.id)}>
                                            {emp.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-[#111111]">Start Date <span className="text-[#ff3b3b]">*</span></label>
                                <DatePicker
                                    placeholder="Start Date"
                                    className="w-full h-11 rounded-lg"
                                    onChange={(_, dateString) => setNewWorkspace({ ...newWorkspace, startDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-[#111111]">Due Date</label>
                                <DatePicker
                                    placeholder="Due Date"
                                    className="w-full h-11 rounded-lg"
                                    onChange={(_, dateString) => setNewWorkspace({ ...newWorkspace, dueDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                                />
                            </div>
                        </div>

                        {/* Document Link */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#111111]">Document Link</label>
                            <Input
                                placeholder="e.g. Google Drive, Figma..."
                                className="h-11 rounded-lg border-[#EEEEEE]"
                                value={newWorkspace.documentLink}
                                onChange={(e) => setNewWorkspace({ ...newWorkspace, documentLink: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-4 flex items-center justify-end bg-white gap-4">
                    {/* Reset Data Button */}
                    <Button // Matching TaskForm Reset Button
                        type="text"
                        onClick={handleReset}
                        className="h-[40px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
                    >
                        Reset Data
                    </Button>

                    {/* ADD Button */}
                    <Button
                        type="primary"
                        onClick={handleCreateWorkspace}
                        className="h-[40px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none shadow-none"
                    >
                        ADD
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
