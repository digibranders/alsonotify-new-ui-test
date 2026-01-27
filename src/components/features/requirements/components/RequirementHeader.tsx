import { Breadcrumb, Button, Modal, Select, Skeleton } from 'antd';
import { X, FileText, ListTodo, BarChart2, Columns, TrendingUp, Paperclip } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabButton } from './TabButton';
import { App } from 'antd';
import { useState } from 'react';

const { Option } = Select;

interface RequirementHeaderProps {
  workspace: any;
  requirement: any;
  ctaConfig: any;
  requirementStatus: string;
  assignedTo: any[];
  router: any;
  myWorkspacesData: any;
  updateRequirement: any;
  activeTab: string;
  setActiveTab: (tab: 'details' | 'tasks' | 'gantt' | 'kanban' | 'pnl' | 'documents') => void;
}

export function RequirementHeader({
  workspace,
  requirement,
  ctaConfig,
  requirementStatus,
  assignedTo,
  router,
  myWorkspacesData,
  updateRequirement,
  activeTab,
  setActiveTab
}: RequirementHeaderProps) {
  const { message } = App.useApp();
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedReceiverWorkspace, setSelectedReceiverWorkspace] = useState<string | undefined>(undefined);

  const handleAcceptRequirement = () => {
    if (!selectedReceiverWorkspace) {
      message.error("Please select a workspace to import this requirement into.");
      return;
    }
    if (!requirement) return;

    updateRequirement.mutate({
      id: requirement.id,
      workspace_id: requirement.workspace_id,
      title: requirement.title,
      status: 'Assigned',
      receiver_workspace_id: Number(selectedReceiverWorkspace)
    } as unknown as any, {
      onSuccess: () => {
        message.success("Requirement accepted and assigned to workspace.");
        setIsAcceptModalOpen(false);
      },
      onError: (err: any) => {
        message.error((err as any).message || "Failed to accept requirement");
      }
    });
  };

  return (
    <div className="px-6 pt-6 pb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {workspace ? (
            <Breadcrumb
              separator={<span className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#999999]">/</span>}
              items={[
                {
                  title: (
                    <span
                      onClick={() => router.push(`/dashboard/workspace/${workspace.id}/requirements`)}
                      className="cursor-pointer font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#999999] hover:text-[#666666] transition-colors"
                    >
                      {workspace.name}
                    </span>
                  ),
                },
                {
                  title: (
                    <span className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111] line-clamp-1 max-w-[300px]">
                      {requirement.title || requirement.name || 'Untitled Requirement'}
                    </span>
                  ),
                },
              ]}
            />
          ) : (
            <Skeleton.Input active size="small" style={{ width: 200 }} />
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Standardized Requirement Action CTA */}
          {ctaConfig.primaryAction && (
            <div className="flex items-center gap-2">
              {ctaConfig.primaryAction.modal === 'mapping' && (
                <Button 
                  type="primary" 
                  className="bg-[#111111] hover:bg-[#000000]/90"
                  onClick={() => setIsAcceptModalOpen(true)}
                >
                  {ctaConfig.primaryAction.label}
                </Button>
              )}
              {ctaConfig.primaryAction.modal === 'quotation' && (
                <Button 
                  type="primary" 
                  className="bg-[#111111]"
                  onClick={() => {
                    message.info("Please use the 'Edit' action in the requirements list to resubmit your quote.");
                  }}
                >
                  {ctaConfig.primaryAction.label}
                </Button>
              )}
              {ctaConfig.primaryAction.modal === 'none' && (
                <Button 
                  type="primary" 
                  className="bg-[#111111]"
                  onClick={() => {
                    const newStatus = requirement.status === 'Submitted' ? 'Assigned' : 'Completed';
                    updateRequirement.mutate({
                      id: requirement.id,
                      workspace_id: requirement.workspace_id,
                      status: newStatus
                    } as any, {
                      onSuccess: () => message.success("Requirement accepted successfully")
                    });
                  }}
                >
                  {ctaConfig.primaryAction.label}
                </Button>
              )}
              {ctaConfig.primaryAction.modal === 'edit' && (
                <Button 
                  type="primary" 
                  className="bg-[#111111]"
                  onClick={() => {
                    message.info("Edit functionality");
                  }}
                >
                  {ctaConfig.primaryAction.label}
                </Button>
              )}
            </div>
          )}

          {/* Reject Action (Secondary) */}
          {ctaConfig.secondaryAction?.type === 'danger' && (
            <Button 
              danger 
              icon={<X className="w-4 h-4" />}
              onClick={() => {
                Modal.confirm({
                  title: 'Reject Requirement',
                  content: 'Are you sure you want to reject this requirement?',
                  onOk: () => {
                    updateRequirement.mutate({
                      id: requirement.id,
                      workspace_id: requirement.workspace_id,
                      status: 'Rejected'
                    } as any);
                  }
                });
              }}
            >
              {ctaConfig.secondaryAction.label || 'Reject'}
            </Button>
          )}

          {/* Accept Modal */}
          <Modal
            open={isAcceptModalOpen}
            onCancel={() => setIsAcceptModalOpen(false)}
            title="Accept Requirement"
            onOk={handleAcceptRequirement}
            okText="Accept & Import"
            okButtonProps={{ className: "bg-[#111111]" }}
          >
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Select one of your existing workspaces to assign this requirement to.
              </p>
              <Select
                className="w-full"
                placeholder="Select your workspace"
                value={selectedReceiverWorkspace}
                onChange={setSelectedReceiverWorkspace}
              >
                {myWorkspacesData?.result?.workspaces?.map((w: { id: number; name: string }) => (
                  <Option key={w.id} value={String(w.id)}>{w.name}</Option>
                ))}
              </Select>
            </div>
          </Modal>

          <StatusBadge status={requirementStatus} showLabel />
          {requirement.is_high_priority && (
            <span className="px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] uppercase tracking-wide bg-[#FFF5F5] text-[#ff3b3b]">
              HIGH PRIORITY
            </span>
          )}
          <div className="flex -space-x-2">
            {Array.isArray(assignedTo) && assignedTo.slice(0, 3).map((person: { name: string } | string, i: number) => {
              const name = typeof person === 'string' ? person : person?.name || 'U';
              return (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#ff3b3b] to-[#ff6b6b] flex items-center justify-center shadow-sm" title={name}>
                  <span className="text-[10px] text-white font-['Manrope:Bold',sans-serif]">
                    {name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EEEEEE]">
        <div className="flex items-center gap-8">
          <TabButton
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
            icon={FileText}
            label="Details"
          />
          <TabButton
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            icon={ListTodo}
            label="Tasks & Revisions"
          />
          <TabButton
            active={activeTab === 'gantt'}
            onClick={() => setActiveTab('gantt')}
            icon={BarChart2}
            label="Gantt Chart"
          />
          <TabButton
            active={activeTab === 'kanban'}
            onClick={() => setActiveTab('kanban')}
            icon={Columns}
            label="Kanban Board"
          />
          <TabButton
            active={activeTab === 'pnl'}
            onClick={() => setActiveTab('pnl')}
            icon={TrendingUp}
            label="P&L"
          />
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            icon={Paperclip}
            label="Documents"
          />
        </div>
      </div>
    </div>
  );
}
