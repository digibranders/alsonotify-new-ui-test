import {
  Add24Filled,
  ArrowDownload24Filled,
  Search24Filled,
  Filter24Filled
} from '@fluentui/react-icons';
import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
  showExport?: boolean;
  onExportClick?: () => void;
  titleAction?: {
    onClick: () => void;
    label?: string;
    icon?: ReactNode;
    variant?: string;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }>;
  customFilters?: ReactNode;
  customTabRender?: (tab: { id: string; label: string; count?: number }, isActive: boolean, onClick: () => void) => ReactNode;
  action?: ReactNode;
}

export function PageLayout({
  title,
  children,
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  showFilter = false,
  onFilterClick,
  showExport = false,
  onExportClick,
  titleAction,
  secondaryActions,
  customFilters,
  customTabRender,
  action
}: PageLayoutProps) {
  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        {/* Left: Title and Tabs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">
              {title}
            </h2>
            {/* Title Action - Plus icon next to title */}
            {titleAction && (
              <button
                onClick={titleAction.onClick}
                className="hover:scale-110 active:scale-95 transition-transform"
                title={titleAction.label}
              >
                {titleAction.icon ? titleAction.icon : <Add24Filled className="size-5 text-[#ff3b3b]" />}
              </button>
            )}
          </div>

          {/* Tabs below title */}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-8 border-b border-[#EEEEEE]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === tab.id
                    ? 'text-[#ff3b3b]'
                    : 'text-[#666666] hover:text-[#111111]'
                    }`}
                >
                  {tab.label}
                  {tab.count !== undefined && ` (${tab.count})`}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Search and Action buttons */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {onSearchChange && (
            <div className="relative">
              <Search24Filled className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 pr-4 py-2.5 bg-white border border-[#EEEEEE] rounded-full text-[14px] font-['Manrope:Regular',sans-serif] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#ff3b3b] w-[280px]"
              />
            </div>
          )}

          {/* Filter */}
          {showFilter && (
            <button
              onClick={onFilterClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-full hover:bg-[#F7F7F7] transition-colors"
            >
              <Filter24Filled className="w-4 h-4 text-[#666666]" />
              <span className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#666666]">
                Filter
              </span>
            </button>
          )}

          {/* Custom Filters */}
          {customFilters}

          {/* Secondary Actions */}
          {secondaryActions?.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-full hover:bg-[#F7F7F7] transition-colors"
            >
              {action.icon}
              <span className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#666666]">
                {action.label}
              </span>
            </button>
          ))}

          {/* Export */}
          {showExport && (
            <button
              onClick={onExportClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-full hover:bg-[#F7F7F7] transition-colors"
            >
              <ArrowDownload24Filled className="w-4 h-4 text-[#666666]" />
              <span className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#666666]">
                Export
              </span>
            </button>
          )}

          {/* Primary Action */}
          {action}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}