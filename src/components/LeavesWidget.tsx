import svgPaths from "../constants/iconPaths";
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Modal, Input, Button, Select } from 'antd';
import Image from "next/image";

const { Option } = Select;

export function LeavesWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [showDialog, setShowDialog] = useState(false);

  const leaves = [
    { name: "Priya Sharma", type: "Sick Leave", dates: "Nov 18 - Nov 20", avatar: "https://images.unsplash.com/photo-1710655180941-056bf55fed7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjMzOTI3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { name: "Rahul Kumar", type: "Vacation", dates: "Nov 22 - Nov 27", avatar: "https://images.unsplash.com/photo-1695398170358-99749f64c887?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBtYW4lMjBidXNpbmVzc3xlbnwxfHx8fDE3NjM0NDI0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { name: "Anjali Patel", type: "Personal", dates: "Nov 25 - Nov 26", avatar: "https://images.unsplash.com/photo-1705810860988-91b9de086226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBwcm9mZXNzaW9uYWwlMjBwZXJzb258ZW58MXx8fHwxNzYzNDQyNDk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  ];

  return (
    <>
      <div className="bg-white rounded-[24px] p-6 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Leaves</h3>
            <button onClick={() => setShowDialog(true)} className="hover:scale-110 active:scale-95 transition-transform">
              <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
            </button>
          </div>
          <button className="flex items-center gap-1 text-[#666666] text-[14px] font-['Manrope:SemiBold',sans-serif] hover:text-[#111111] transition-colors" onClick={() => onNavigate && onNavigate('leaves')}>
            <span>View All</span>
            <svg className="size-[17px]" fill="none" viewBox="0 0 17 17">
              <path d={svgPaths.p3ac7a560} stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Leaves List */}
        <div className="flex flex-col gap-4 flex-1 mt-3">
          {leaves.map((leave, index) => (
            <LeaveItem key={index} {...leave} />
          ))}
        </div>
      </div>

      {/* Add Leave Modal */}
      <Modal
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        footer={null}
        width={500}
        centered
        className="rounded-[16px] overflow-hidden"
      >
        <div className="p-0">
          <div className="mb-6">
            <h2 className="font-['Manrope:Bold',sans-serif] text-[24px] text-[#111111] mb-1">Request Leave</h2>
            <p className="font-['Manrope:Regular',sans-serif] text-[14px] text-[#666666]">Please fill out the form below to request a leave.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Employee Name</label>
              <Input placeholder="Enter name" className="rounded-lg h-10 font-['Manrope:Medium',sans-serif]" />
            </div>
            <div>
              <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Leave Type</label>
              <Select className="w-full h-10 font-['Manrope:Medium',sans-serif]" placeholder="Select type">
                <Option value="Sick Leave">Sick Leave</Option>
                <Option value="Vacation">Vacation</Option>
                <Option value="Personal">Personal</Option>
                <Option value="Casual">Casual</Option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">From Date</label>
                <Input type="date" className="rounded-lg h-10 font-['Manrope:Medium',sans-serif]" />
              </div>
              <div>
                <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">To Date</label>
                <Input type="date" className="rounded-lg h-10 font-['Manrope:Medium',sans-serif]" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="default" onClick={() => setShowDialog(false)} className="flex-1 rounded-full h-10 font-['Manrope:SemiBold',sans-serif]">
                Cancel
              </Button>
              <Button type="primary" onClick={() => setShowDialog(false)} className="flex-1 rounded-full bg-[#ff3b3b] hover:bg-[#cc2f2f] h-10 border-none font-['Manrope:SemiBold',sans-serif]">
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

function LeaveItem({ name, type, dates, avatar }: { name: string; type: string; dates: string; avatar: any }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer">
      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-[#F7F7F7]">
        <Image src={avatar} alt={name} width={48} height={48} className="w-full h-full object-cover" />
      </div>

      {/* Leave Details */}
      <div className="flex-1">
        <p className="font-['Manrope:Medium',sans-serif] text-[14px] text-[#111111] mb-1">{name}</p>
        <p className="font-['Manrope:Regular',sans-serif] text-[12px] text-[#666666]">{type}</p>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1 text-[12px] font-['Manrope:Regular',sans-serif] text-[#666666]">
        <svg className="size-[14px]" fill="none" viewBox="0 0 17 17">
          <path d={svgPaths.pe10e980} stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M11.334 2.125V4.95833" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M5.66602 2.125V4.95833" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M2.83398 7.79199H14.1673" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        <span>{dates}</span>
      </div>
    </div>
  );
}