import { useState } from 'react';
import { Eye, Download, FileText } from 'lucide-react';
import { UserDocument } from '@/types/genericTypes';

interface DocumentCardProps {
  document: UserDocument;
  onPreview: (document: UserDocument) => void;
  onDownload: (document: UserDocument) => void;
  showUpload?: boolean;
  onUpload?: (documentTypeId: string) => void;
}

export function DocumentCard({ document, onPreview, onDownload, showUpload, onUpload }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  const getFileIcon = () => {
    return <FileText className="w-4 h-4 text-[#ff3b3b]" />;
  };

  if (!document.fileUrl && showUpload && onUpload) {
    // Placeholder for missing document
    return (
      <div
        className="border border-[#EEEEEE] rounded-lg p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
        onClick={() => onUpload(document.documentTypeId)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-1 truncate">
              {document.documentTypeName}
            </p>
            <p className="text-[11px] text-[#666666] font-['Manrope:Regular',sans-serif]">
              {document.isRequired ? 'Required' : 'Optional'}
            </p>
            <p className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif] mt-1">
              Click to upload
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border border-[#EEEEEE] rounded-lg p-4 bg-white hover:shadow-sm transition-shadow relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-1 truncate">
            {document.fileName}
          </p>
          <p className="text-[11px] text-[#666666] font-['Manrope:Regular',sans-serif]">
            {formatFileSize(document.fileSize)} • {formatDate(document.uploadedDate)}
          </p>
        </div>
      </div>

      {/* Hover actions */}
      {isHovered && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(document);
            }}
            className="w-8 h-8 rounded-full bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4 text-[#666666]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(document);
            }}
            className="w-8 h-8 rounded-full bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4 text-[#666666]" />
          </button>
        </div>
      )}
    </div>
  );
}
