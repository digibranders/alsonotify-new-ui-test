'use client';

import React from 'react';
import { Paperclip, FileText, Eye, Download } from 'lucide-react';
import { App } from 'antd';

interface DocumentItem {
  name: string;
  uploadedBy: string;
  date: string;
  size: string;
  type: string;
  activityId: number;
}

interface ActivityItem {
  id: number;
  type: string;
  user: string;
  avatar: string;
  date: string;
  message: React.ReactNode;
  isSystem: boolean;
  attachments: string[];
  time?: string;
  category?: string;
  task?: string;
}

interface DocumentsTabProps {
  activityData: ActivityItem[];
}

export function DocumentsTab({ activityData }: DocumentsTabProps) {
  const { message } = App.useApp();

  // Aggregate all attachments from activity data
  const allDocuments: DocumentItem[] = activityData.flatMap(activity => {
    if (!activity.attachments || activity.attachments.length === 0) return [];
    return activity.attachments.map(file => {
      const isString = typeof file === 'string';
      const name = isString ? file : (file as unknown as { file_name?: string; name?: string }).file_name || (file as unknown as { name?: string }).name || 'Unknown';
      const size = isString ? 0 : (file as unknown as { file_size?: number }).file_size || 0;
      const type = isString ? 'FILE' : ((file as unknown as { file_type?: string }).file_type || name.split('.').pop()?.toUpperCase() || 'FILE');
      
      return {
        name,
        uploadedBy: activity.user,
        date: activity.date,
        size: size ? `${(size / 1024).toFixed(1)} KB` : 'Unknown',
        type: type.toUpperCase(),
        activityId: activity.id
      };
    });
  });

  if (allDocuments.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
          <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#ff3b3b]" />
            Documents
          </h3>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Paperclip className="w-8 h-8 text-[#999999]" />
            </div>
            <h4 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-2">No documents found</h4>
            <p className="text-[14px] text-[#666666] font-['Inter:Regular',sans-serif] max-w-sm mx-auto">
              Files shared in the Activity & Chat section will automatically appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-[16px] p-8 border border-[#EEEEEE] shadow-sm">
        <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-6 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-[#ff3b3b]" />
          Documents
          <span className="text-[12px] font-['Inter:Regular',sans-serif] text-[#999999] ml-1">
            ({allDocuments.length})
          </span>
        </h3>
        
        <div className="overflow-hidden rounded-[12px] border border-[#EEEEEE] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#EEEEEE]">
                <th className="py-3 px-4 text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider w-[40%]">File Name</th>
                <th className="py-3 px-4 text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Sender</th>
                <th className="py-3 px-4 text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Size</th>
                <th className="py-3 px-4 text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-[12px] font-['Manrope:Bold',sans-serif] text-[#666666] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allDocuments.map((doc, idx) => (
                <tr key={`${doc.activityId}-${idx}`} className="group hover:bg-[#FFF5F5]/50 transition-colors border-b border-[#EEEEEE] last:border-b-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#FFF5F5] flex items-center justify-center text-[#ff3b3b] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111] truncate max-w-[200px]" title={doc.name}>
                        {doc.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#444444]">{doc.uploadedBy}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[13px] font-['Inter:Regular',sans-serif] text-[#666666]">{doc.size}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[13px] font-['Inter:Regular',sans-serif] text-[#666666]">{doc.date}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-['Manrope:Bold',sans-serif] px-2 py-1 bg-[#F7F7F7] rounded text-[#666666] uppercase inline-block">
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-1.5 rounded hover:bg-[#F0F0F0] text-[#666666] transition-colors"
                        onClick={() => message.info(`Previewing ${doc.name}`)}
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 rounded hover:bg-[#FFF0F0] text-[#ff3b3b] transition-colors"
                        onClick={() => message.success(`Downloading ${doc.name}`)}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
