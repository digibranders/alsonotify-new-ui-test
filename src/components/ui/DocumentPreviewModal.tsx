import { Modal } from 'antd';
import { X } from 'lucide-react';
import { UserDocument } from '@/types/genericTypes';
import Image from 'next/image';

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: UserDocument | null;
}

export function DocumentPreviewModal({ open, onClose, document }: DocumentPreviewModalProps) {
  if (!document) return null;

  const renderPreview = () => {
    if (document.fileType === 'image') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#F9FAFB] rounded-lg overflow-hidden">
          <Image
            src={document.fileUrl}
            alt={document.fileName}
            width={800}
            height={600}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    if (document.fileType === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#F9FAFB] rounded-lg overflow-hidden">
          <iframe
            src={document.fileUrl}
            className="w-full h-[70vh] border-0"
            title={document.fileName}
          />
        </div>
      );
    }

    // For other file types (docx, text, csv, excel), show a message
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F9FAFB] rounded-lg p-8">
        <div className="text-center">
          <p className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-2">
            {document.fileName}
          </p>
          <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] mb-4">
            Preview not available for this file type. Please download to view.
          </p>
          <a
            href={document.fileUrl}
            download={document.fileName}
            className="inline-block px-6 py-2 bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white rounded-full text-[13px] font-['Manrope:SemiBold',sans-serif] transition-colors"
          >
            Download File
          </a>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      className="rounded-[16px] overflow-hidden"
      closeIcon={<X className="w-5 h-5 text-[#666666]" />}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div className="bg-white p-6">
        <div className="mb-4">
          <h3 className="text-[18px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-1">
            {document.fileName}
          </h3>
          <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif]">
            {document.documentTypeName}
          </p>
        </div>
        {renderPreview()}
      </div>
    </Modal>
  );
}




