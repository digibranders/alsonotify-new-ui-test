'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTask } from '@/hooks/useTask';
import { Button, Tag, Divider } from 'antd';
import { CheckCircle2, Loader2, AlertCircle, Clock, Calendar, User, Briefcase, FileText } from 'lucide-react';

const mapBackendStatusToUI = (status: string): 'impediment' | 'in-progress' | 'completed' | 'todo' | 'delayed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower === 'done') return 'completed';
    if (statusLower.includes('blocked') || statusLower === 'impediment') return 'impediment';
    if (statusLower.includes('progress') || statusLower === 'in_progress') return 'in-progress';
    if (statusLower.includes('delayed')) return 'delayed';
    return 'todo';
};

export function TaskDetailsPage() {
    const params = useParams();
    const taskId = params.taskId as string;
    const router = useRouter();
    const { data: taskData, isLoading } = useTask(parseInt(taskId || '0'));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-[#999999]">Loading task...</p>
            </div>
        );
    }

    const backendTask = taskData?.result;
    if (!backendTask) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-xl font-semibold mb-2">Task not found</h2>
                <Button onClick={() => router.push('/dashboard/tasks')}>Back to Tasks</Button>
            </div>
        );
    }

    // Transform backend data to UI format
    const assignedToName = (backendTask.assigned_to as any)?.name || (backendTask.assigned_to_user as any)?.name || 'Unassigned';

    const task = {
        id: String(backendTask.id),
        name: backendTask.name || backendTask.title || '',
        taskId: String(backendTask.id),
        client: backendTask.client?.name || backendTask.client_company_name || 'In-House',
        project: backendTask.requirement?.name || backendTask.requirement_id ? `Requirement ${backendTask.requirement_id}` : 'General',
        leader: backendTask.leader?.name || 'Unassigned',
        assignedTo: assignedToName,
        startDate: backendTask.start_date ? new Date(backendTask.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        dueDate: backendTask.due_date ? new Date(backendTask.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        estTime: backendTask.estimated_time || 0,
        timeSpent: backendTask.time_spent || 0,
        activities: backendTask.worklogs?.length || 0,
        status: mapBackendStatusToUI(backendTask.status || ''),
        priority: (typeof backendTask.priority === 'string' ? backendTask.priority.toLowerCase() : 'medium') as 'high' | 'medium' | 'low',
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Completed' };
            case 'in-progress': return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'In Progress' };
            case 'impediment': return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Blocked' };
            default: return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'To Do' };
        }
    };

    const statusConfig = getStatusConfig(task.status);
    const StatusIcon = statusConfig.icon;
    const progress = (task.timeSpent / task.estTime) * 100;

    return (
        <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button type="text" onClick={() => router.push('/dashboard/tasks')} className="pl-0 hover:bg-transparent hover:text-[#ff3b3b]">
                    ← Back to Tasks
                </Button>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-[#EEEEEE] p-8 max-w-4xl mx-auto w-full">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-[#999999]">#{task.taskId}</span>
                            <Tag className={`
                            ${task.priority === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                                    task.priority === 'medium' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                        'text-blue-600 border-blue-200 bg-blue-50'}
                        `}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </Tag>
                        </div>
                        <h1 className="text-3xl font-['Manrope:Bold',sans-serif] text-[#111111] mb-2 leading-tight">
                            {task.name}
                        </h1>
                        <div className="flex items-center gap-2 text-[#666666]">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-sm font-['Manrope:Medium',sans-serif]">
                                {task.client} • {task.project}
                            </span>
                        </div>
                    </div>
                </div>

                <Divider className="my-8" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Description</h3>
                            <p className="text-[#111111] leading-relaxed">
                                {backendTask.description || 'No description provided for this task yet.'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide mb-4">Progress</h3>
                            <div className="bg-[#F7F7F7] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-[#111111]">{Math.round(progress)}% Complete</span>
                                    <span className="text-sm text-[#666666]">{task.timeSpent}h of {task.estTime}h</span>
                                </div>
                                <div className="w-full h-2 bg-[#EEEEEE] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="p-5 border border-[#EEEEEE] rounded-xl space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-[#999999] mt-0.5" />
                                <div>
                                    <p className="text-xs text-[#999999] mb-1 m-0">Assigned To</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center text-white text-[10px] font-bold">
                                            {task.assignedTo.charAt(0)}
                                        </div>
                                        <p className="text-sm font-medium text-[#111111] m-0">{task.assignedTo}</p>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-2" />

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-[#999999] mt-0.5" />
                                <div>
                                    <p className="text-xs text-[#999999] mb-1 m-0">Due Date</p>
                                    <p className="text-sm font-medium text-[#111111] m-0">{task.dueDate}</p>
                                </div>
                            </div>

                            <Divider className="my-2" />

                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-[#999999] mt-0.5" />
                                <div>
                                    <p className="text-xs text-[#999999] mb-1 m-0">Project</p>
                                    <p className="text-sm font-medium text-[#111111] m-0">{task.project}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}