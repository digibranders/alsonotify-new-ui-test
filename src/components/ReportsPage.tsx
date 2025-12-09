import { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { PageLayout } from './PageLayout';
import { FilterBar, FilterOption } from './FilterBar';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  formats: string[];
  lastGenerated: string;
}

const projectReportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Project Summary Report',
    description: 'Overview of all active projects with timelines and budgets',
    formats: ['PDF', 'Excel'],
    lastGenerated: '18 Nov 2025'
  },
  {
    id: '2',
    name: 'Project Performance Analysis',
    description: 'Detailed analysis of project metrics and KPIs',
    formats: ['PDF', 'Excel', 'PowerPoint'],
    lastGenerated: '15 Nov 2025'
  },
  {
    id: '3',
    name: 'Client Project Report',
    description: 'Client-specific project status and deliverables',
    formats: ['PDF', 'Excel'],
    lastGenerated: '12 Nov 2025'
  }
];

const activitiesReportTemplates: ReportTemplate[] = [
  {
    id: '4',
    name: 'Daily Activities Log',
    description: 'Comprehensive log of all team activities',
    formats: ['Excel', 'CSV'],
    lastGenerated: '18 Nov 2025'
  },
  {
    id: '5',
    name: 'Task Completion Report',
    description: 'Summary of completed tasks and productivity metrics',
    formats: ['PDF', 'Excel'],
    lastGenerated: '17 Nov 2025'
  }
];

const employeeReportTemplates: ReportTemplate[] = [
  {
    id: '6',
    name: 'Employee Performance Report',
    description: 'Individual performance metrics and achievements',
    formats: ['PDF', 'Excel'],
    lastGenerated: '15 Nov 2025'
  },
  {
    id: '7',
    name: 'Team Productivity Analysis',
    description: 'Team-wide productivity and efficiency metrics',
    formats: ['PDF', 'Excel', 'PowerPoint'],
    lastGenerated: '14 Nov 2025'
  },
  {
    id: '8',
    name: 'Attendance & Leave Report',
    description: 'Employee attendance and leave utilization',
    formats: ['Excel', 'CSV'],
    lastGenerated: '12 Nov 2025'
  }
];

const worklogReportTemplates: ReportTemplate[] = [
  {
    id: '9',
    name: 'Weekly Worklog Summary',
    description: 'Time tracking and billable hours breakdown',
    formats: ['Excel', 'PDF'],
    lastGenerated: '16 Nov 2025'
  },
  {
    id: '10',
    name: 'Billable Hours Report',
    description: 'Client billing and revenue tracking',
    formats: ['Excel', 'CSV'],
    lastGenerated: '10 Nov 2025'
  }
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'project' | 'activities' | 'employee' | 'worklog'>('project');
  const [filters, setFilters] = useState<Record<string, string>>({
    company: 'All Companies',
    dateRange: 'Last 30 Days'
  });

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const clearFilters = () => {
    setFilters({
      company: 'All Companies',
      dateRange: 'Last 30 Days'
    });
  };

  const filterOptions: FilterOption[] = [
    { 
      id: 'dateRange', 
      label: 'Date Range', 
      options: ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Month', 'Last Month', 'Custom'], 
      placeholder: 'Date Range',
      defaultValue: 'Last 30 Days'
    },
    { 
      id: 'company', 
      label: 'Company', 
      options: ['All Companies', 'Triem Security', 'Eventus Security', 'In-House'], 
      placeholder: 'Company',
      defaultValue: 'All Companies'
    }
  ];

  const getCurrentTemplates = () => {
    switch (activeTab) {
      case 'project':
        return projectReportTemplates;
      case 'activities':
        return activitiesReportTemplates;
      case 'employee':
        return employeeReportTemplates;
      case 'worklog':
        return worklogReportTemplates;
      default:
        return projectReportTemplates;
    }
  };

  const templates = getCurrentTemplates();

  return (
    <PageLayout
      title="Reports"
      tabs={[
        { id: 'project', label: 'Project' },
        { id: 'activities', label: 'Activities' },
        { id: 'employee', label: 'Employee' },
        { id: 'worklog', label: 'Worklog' }
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as any)}
    >
      {/* Filters Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          showClearButton={false}
        />
      </div>

      {/* Report Templates Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-[#EEEEEE] rounded-[16px] p-6 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <h4 className="font-['Manrope:SemiBold',sans-serif] text-[15px] text-[#111111] mb-2">
                {template.name}
              </h4>
              <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#666666] mb-4">
                {template.description}
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-['Inter:Medium',sans-serif] text-[#999999] mb-1">
                    Available Formats
                  </p>
                  <div className="flex items-center gap-2">
                    {template.formats.map((format) => (
                      <span
                        key={format}
                        className="px-2 py-1 bg-white rounded-[6px] text-[11px] font-['Inter:SemiBold',sans-serif] text-[#666666] border border-[#EEEEEE]"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-[#ff3b3b] text-white rounded-[8px] hover:bg-[#e63535] transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="font-['Manrope:SemiBold',sans-serif] text-[12px]">
                    Generate
                  </span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-[#DDDDDD]">
                <div className="flex items-center gap-1 text-[11px] font-['Inter:Regular',sans-serif] text-[#999999]">
                  <Calendar className="w-3 h-3" />
                  Last generated: {template.lastGenerated}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}