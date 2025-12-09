'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckSquare, Calendar, User, ArrowLeft, Clock, AlertCircle, CheckCircle2, Loader2, Flag } from 'lucide-react';
import { Progress } from "./ui/progress";

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
                <Button variant="ghost" size="icon" onClick={() => router.push('/tasks')} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">#{task.taskId}</span>
                        <h1 className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">Task Details</h1>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete Task</Button>
                    <Button>Edit Task</Button>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto w-full space-y-6">

                {/* Title Card */}
                <Card className="border-none shadow-sm rounded-[16px] p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">{task.name}</h2>
                            <Badge variant="outline" className={`${getStatusColor(task.status)} capitalize px-3 py-1`}>
                                {task.status.replace('-', ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4" />
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
                        <Card className="border-none shadow-sm rounded-[16px]">
                            <CardHeader>
                                <CardTitle className="text-lg">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 leading-relaxed">
                                    No description provided for this task.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[16px]">
                            <CardHeader>
                                <CardTitle className="text-lg">Progress</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">Time Tracking</span>
                                        <span className="text-gray-500">{task.timeSpent}h / {task.estTime}h</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm rounded-[16px]">
                            <CardHeader>
                                <CardTitle className="text-sm uppercase text-gray-500">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                    <Badge variant="secondary" className={`${getPriorityColor(task.priority)} capitalize`}>
                                        {task.priority}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[16px]">
                            <CardHeader>
                                <CardTitle className="text-sm uppercase text-gray-500">Dates</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BriefcaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}
