'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';
import { Tag, Button, Card, Progress } from 'antd';
import { CheckSquare, Calendar, User, ArrowLeft, Clock, AlertCircle, CheckCircle2, Loader2, Flag, Briefcase } from 'lucide-react';

export function TaskDetailsPage() {
    const params = useParams();
    const taskId = params.taskId;
    const router = useRouter();
    const { getTask } = useData();

    const task = getTask(Array.isArray(taskId) ? taskId[0] : taskId || '');

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-bold text-gray-800">Task not found</h2>
                <p className="text-gray-500 mb-4">The task you are looking for does not exist.</p>
                <Button onClick={() => router.push('/tasks')}>Back to Tasks</Button>
            </div>
        );
    }

    const progress = (task.timeSpent / task.estTime) * 100;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'impediment': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-orange-600 bg-orange-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F7F7F7] overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-[#EEEEEE] px-6 py-4 flex items-center gap-4 shrink-0">
                <Button type="text" shape="circle" onClick={() => router.push('/tasks')} className="h-8 w-8 flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">#{task.taskId}</span>
                        <h1 className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">Task Details</h1>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button danger type="text" className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete Task</Button>
                    <Button>Edit Task</Button>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto w-full space-y-6">

                {/* Title Card */}
                <Card className="border-none shadow-sm rounded-[16px]" styles={{ body: { padding: '24px' } }}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">{task.name}</h2>
                            <Tag className={`${getStatusColor(task.status)} capitalize px-3 py-1 border-0 rounded-full text-sm`}>
                                {task.status.replace('-', ' ')}
                            </Tag>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                <span>{task.client}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-400">Project:</span>
                                <span>{task.project}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm rounded-[16px]" title={<span className="text-lg">Description</span>}>
                            <p className="text-gray-600 leading-relaxed">
                                No description provided for this task.
                            </p>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[16px]" title={<span className="text-lg">Progress</span>}>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">Time Tracking</span>
                                        <span className="text-gray-500">{task.timeSpent}h / {task.estTime}h</span>
                                    </div>
                                    <Progress percent={progress} size="small" showInfo={false} strokeColor="#3b82f6" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                        <Clock className="w-8 h-8 text-blue-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Estimated</p>
                                            <p className="text-lg font-bold">{task.estTime} Hours</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Spent</p>
                                            <p className="text-lg font-bold">{task.timeSpent} Hours</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm rounded-[16px]" title={<span className="text-sm uppercase text-gray-500">Details</span>}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Assigned To</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                                            {task.assignedTo.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium">{task.assignedTo}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Leader</span>
                                    <span className="text-sm font-medium">{task.leader}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Priority</span>
                                    <Tag className={`${getPriorityColor(task.priority)} capitalize border-0 rounded-full px-2.5`}>
                                        {task.priority}
                                    </Tag>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[16px]" title={<span className="text-sm uppercase text-gray-500">Dates</span>}>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Start Date</p>
                                        <p className="text-sm font-medium">{task.startDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Flag className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Due Date</p>
                                        <p className="text-sm font-medium">{task.dueDate}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
