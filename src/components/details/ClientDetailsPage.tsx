'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageLayout } from '../PageLayout';
import { Button } from '../ui/button';
import { Building, Globe, Mail, Phone, Calendar, CheckCircle2, FileText, ArrowLeft } from 'lucide-react';
import { Separator } from '../ui/separator';

export function ClientDetailsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const router = useRouter();
  const { getClient } = useData();

  const client = getClient(Number(clientId));

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-2">Client not found</h2>
        <Button onClick={() => router.push('/clients')}>Back to Clients</Button>
      </div>
    );
  }

  return (
    <PageLayout
      title="Client Details"
      titleAction={{
        label: "Back",
        icon: <ArrowLeft className="w-5 h-5" />,
        onClick: () => router.push('/clients'),
        variant: "outline"
      }}
    >
      <div className="bg-white rounded-[24px] border border-[#EEEEEE] p-8 max-w-4xl mx-auto mt-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">{client.company}</h1>
            <div className="flex items-center gap-2 text-[#666666]">
              <Building className="w-4 h-4" />
              <span className="text-sm font-['Inter:Medium',sans-serif]">{client.country}</span>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${client.status === 'active'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
            }`}>
            <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            {client.status === 'active' ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Person Info */}
          <div className="space-y-6">
            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Primary Contact</h3>
            <div className="p-5 bg-[#F7F7F7] rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center text-white text-lg font-bold">
                {client.name.charAt(0)}
              </div>
              <div>
                <p className="text-base font-bold text-[#111111]">{client.name}</p>
                <p className="text-sm text-[#666666]">Primary Point of Contact</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999]">Email Address</p>
                  <p className="text-sm font-medium text-[#111111]">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999]">Phone Number</p>
                  <p className="text-sm font-medium text-[#111111]">{client.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-6">
            <h3 className="text-sm font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wide">Business Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999]">Location</p>
                  <p className="text-sm font-medium text-[#111111]">{client.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#666666]" />
                </div>
                <div>
                  <p className="text-xs text-[#999999]">Onboarding Date</p>
                  <p className="text-sm font-medium text-[#111111]">{client.onboarding}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Requirements Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-[#EEEEEE] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-[#666666] mb-1">Active Requirements</p>
              <p className="text-3xl font-bold text-[#111111]">{client.requirements}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="p-6 border border-[#EEEEEE] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-[#666666] mb-1">Project Status</p>
              <p className="text-lg font-bold text-[#111111] text-green-600">On Track</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}