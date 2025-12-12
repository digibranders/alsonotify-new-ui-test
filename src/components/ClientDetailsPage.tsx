'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';
import { Tag, Button, Card, message } from "antd";
import { Building, Globe, Mail, Phone, Calendar, ArrowLeft, Users, Briefcase } from 'lucide-react';

export function ClientDetailsPage() {
    const params = useParams();
    const clientId = params.clientId;
    const router = useRouter();
    const { getClient } = useData();

    const client = getClient(Number(clientId));

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-bold text-gray-800">Client not found</h2>
                <p className="text-gray-500 mb-4">The client you are looking for does not exist.</p>
                <Button onClick={() => router.push('/clients')}>Back to Clients</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F7F7F7] overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-[#EEEEEE] px-6 py-4 flex items-center gap-4 shrink-0">
                <Button type="text" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/clients')} />
                <h1 className="text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111] m-0">Client Profile</h1>
            </div>

            <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
                {/* Header Card */}
                <Card className="border-none shadow-sm rounded-[16px] [&>.ant-card-body]:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                                <Building className="w-10 h-10 text-gray-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#111111] mb-1">{client.company}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {client.country}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <Tag className={`${client.status === 'active' ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50'}`}>
                                        {client.status === 'active' ? 'Active Account' : 'Inactive'}
                                    </Tag>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button>Contact</Button>
                            <Button type="primary" className="bg-[#111111]">Create Project</Button>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Contact Person */}
                    <div className="md:col-span-1 space-y-6">
                        <Card title={<span className="text-lg">Point of Contact</span>} className="border-none shadow-sm rounded-[16px] [&>.ant-card-head]:border-b-0">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center text-white text-lg font-bold">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 m-0">{client.name}</p>
                                        <p className="text-xs text-gray-500 m-0">Primary Contact</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{client.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{client.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[16px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500 font-medium">Client Since</span>
                                <Calendar className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-lg font-bold text-gray-900 m-0">{client.onboarding}</p>
                        </Card>
                    </div>

                    {/* Right: Stats & Projects */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="border-none shadow-sm rounded-[16px] bg-blue-50/50">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-gray-500">Active Requirements</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-bold text-gray-900">{client.requirements}</span>
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <Card className="border-none shadow-sm rounded-[16px] bg-green-50/50">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-gray-500">Total Projects</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-bold text-gray-900">12</span>
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card title={<span className="text-lg">Recent Activity</span>} className="border-none shadow-sm rounded-[16px]">
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No recent activity logs found.
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
