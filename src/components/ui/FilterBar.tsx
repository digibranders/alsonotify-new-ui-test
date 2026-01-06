import { useState, useRef, useEffect } from 'react';
import { Search24Filled, ChevronDown24Filled } from '@fluentui/react-icons';
import { X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
}

interface FilterBarProps {
  filters?: FilterOption[];
  selectedFilters?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
  onClearFilters?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showClearButton?: boolean;
}

export function FilterBar({
  filters = [],
  selectedFilters = {},
  onFilterChange,
  onClearFilters,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  showClearButton = true
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownEl = dropdownRefs.current[openDropdown];
        if (dropdownEl && !dropdownEl.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const hasActiveFilters = filters.some(filter => {
    const value = selectedFilters[filter.id];
    return value && value !== 'All' && value !== filter.defaultValue;
  });

  if (filters.length === 0 && !onSearchChange) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 pb-4 border-b border-[#EEEEEE]">
      {/* Filter Dropdowns */}
      {filters.map((filter, index) => {
        const selectedValue = selectedFilters[filter.id] || filter.defaultValue || filter.options[0];
        const isDefault = selectedValue === 'All' || selectedValue === filter.defaultValue;
        const hasSelection = !isDefault;

        return (
          <div
            key={filter.id}
            className="relative"
            ref={(el) => { dropdownRefs.current[filter.id] = el; }}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === filter.id ? null : filter.id)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[13px] font-['Manrope:Regular',sans-serif] transition-colors justify-between min-w-[120px] ${hasSelection
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#666666] border-[#EEEEEE] hover:border-[#111111] hover:text-[#111111]'
                }`}
            >
              <span className="truncate">
                {isDefault ? (filter.placeholder || filter.label) : selectedValue}
              </span>
              <ChevronDown24Filled className={`w-4 h-4 flex-shrink-0 transition-transform ${openDropdown === filter.id ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === filter.id && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-[#EEEEEE] rounded-[12px] shadow-lg w-[200px] py-2 z-50 max-h-[300px] overflow-y-auto">
                {filter.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onFilterChange?.(filter.id, option);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 font-['Manrope:Regular',sans-serif] text-[14px] hover:bg-[#F7F7F7] transition-colors ${selectedValue === option
                      ? 'text-[#ff3b3b] bg-[#FEF3F2]'
                      : 'text-[#666666]'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Clear Filter Button - Moved to right of all filters */}
      {showClearButton && hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="w-8 h-8 rounded-full bg-[#FEF3F2] hover:bg-[#FEE4E2] transition-colors flex items-center justify-center"
          title="Clear filters"
        >
          <X className="w-4 h-4 text-[#ff3b3b]" />
        </button>
      )}

      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative ml-auto">
          <Search24Filled className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-4 py-1.5 bg-white border border-[#EEEEEE] rounded-lg text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] w-[240px]"
          />
        </div>
      )}
    </div>
  );
}