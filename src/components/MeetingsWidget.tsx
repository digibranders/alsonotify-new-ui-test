import svgPaths from "../constants/iconPaths";
import { Plus, Clock } from 'lucide-react';
import { useState } from 'react';
import { Modal, Input, Button, Select } from 'antd';
import Image from "next/image";

const { TextArea } = Input;
const { Option } = Select;

export function MeetingsWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [showDialog, setShowDialog] = useState(false);

  const meetings = [
    {
      title: "Client Review - Alsonotify Dashboard",
      time: "10:00 AM",
      duration: "1 hour",
      attendees: [
        { name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1711182673833-7e11dffa0eec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXNpbmVzcyUyMHdvbWFufGVufDF8fHx8MTc2MzQ0Mjg3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
        { name: "Rahul Kumar", avatar: "https://images.unsplash.com/photo-1656221007870-dbb3900d6d99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXNpbmVzc21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzM3NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
        { name: "Anjali Patel", avatar: "https://images.unsplash.com/photo-1710655180941-056bf55fed7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjMzOTI3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
      ],
      totalAttendees: 5,
      status: "upcoming",
      platform: "Teams",
      organizer: "Priya Sharma"
    },
    {
      title: "Design Sprint Planning",
      time: "2:30 PM",
      duration: "45 mins",
      attendees: [
        { name: "Satyam", avatar: "https://images.unsplash.com/photo-1695398170358-99749f64c887?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBtYW4lMjBidXNpbmVzc3xlbnwxfHx8fDE3NjM0NDI0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
        { name: "Priya", avatar: "https://images.unsplash.com/photo-1711182673833-7e11dffa0eec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXNpbmVzcyUyMHdvbWFufGVufDF8fHx8MTc2MzQ0Mjg3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
      ],
      totalAttendees: 8,
      status: "in-progress",
      platform: "Zoom",
      organizer: "Satyam Yadav"
    },
  ];

  return (
    <>
      <div className="bg-white rounded-[24px] p-6 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Meetings</h3>
            <button onClick={() => setShowDialog(true)} className="hover:scale-110 active:scale-95 transition-transform">
              <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
            </button>
          </div>
          <button className="flex items-center gap-1 text-[#666666] text-[14px] font-['Manrope:SemiBold',sans-serif] hover:text-[#111111] transition-colors" onClick={() => onNavigate && onNavigate('calendar')}>
            <span>View All</span>
            <svg className="size-[17px]" fill="none" viewBox="0 0 17 17">
              <path d={svgPaths.p3ac7a560} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Meetings List */}
        <div className="flex flex-col gap-3 flex-1 mt-3">
          {meetings.map((meeting, index) => (
            <MeetingItem key={index} {...meeting} />
          ))}
        </div>
      </div>

      {/* Add Meeting Modal */}
      <Modal
        title={
          <div className="font-['Manrope:Bold',sans-serif] text-[24px]">Schedule Meeting</div>
        }
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        footer={null}
        width={500}
        centered
        className="rounded-[16px] overflow-hidden"
      >
        <div className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-4">Add a new meeting to your schedule.</div>
        <div className="space-y-4">
          <div>
            <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Meeting Title</label>
            <Input placeholder="Enter meeting title" className="rounded-lg h-9" />
          </div>
          <div>
            <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Description</label>
            <TextArea placeholder="Meeting agenda and details" className="rounded-lg" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Time</label>
              <Input type="time" className="rounded-lg h-9" />
            </div>
            <div>
              <label className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Duration</label>
              <Select className="w-full h-9" placeholder="Select duration" defaultValue="30 mins">
                <Option value="30 mins">30 mins</Option>
                <Option value="45 mins">45 mins</Option>
                <Option value="1 hour">1 hour</Option>
                <Option value="1.5 hours">1.5 hours</Option>
                <Option value="2 hours">2 hours</Option>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowDialog(false)} className="flex-1 rounded-full h-10 font-['Manrope:SemiBold',sans-serif]">
              Cancel
            </Button>
            <Button type="primary" onClick={() => setShowDialog(false)} className="flex-1 rounded-full bg-[#ff3b3b] hover:bg-[#cc2f2f] h-10 font-['Manrope:SemiBold',sans-serif] border-none text-white">
              Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function MeetingItem({ title, time, duration, attendees, totalAttendees, status, organizer }: { title: string; time: string; duration: string; attendees: { name: string; avatar: string }[]; totalAttendees: number; status: string; organizer: string }) {
  return (
    <div className="group p-4 rounded-xl border border-[#EEEEEE] hover:border-[#ff3b3b]/20 transition-all duration-300 hover:shadow-lg cursor-pointer">
      <div className="flex items-start gap-3">
        {/* Time Badge */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] rounded-xl flex flex-col items-center justify-center text-white">
            <span className="text-[10px] font-['Manrope:Medium',sans-serif] opacity-90">NOV</span>
            <span className="text-[18px] font-['Manrope:Bold',sans-serif]">18</span>
          </div>
        </div>

        {/* Meeting Info */}
        <div className="flex-1 min-w-0">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] line-clamp-1 flex-1">
              {title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Manrope:Medium',sans-serif] flex-shrink-0 ${status === 'in-progress'
              ? 'bg-[#E8F5E9] text-[#2E7D32]'
              : 'bg-[#E3F2FD] text-[#1565C0]'
              }`}>
              {status === 'in-progress' ? 'Live' : 'Upcoming'}
            </span>
          </div>

          {/* Time & Duration */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 text-[#666666] text-[11px] font-['Manrope:Regular',sans-serif]">
              <Clock className="size-3.5" strokeWidth={2} />
              <span>{time}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#CCCCCC]" />
            <span className="text-[#666666] text-[11px] font-['Manrope:Regular',sans-serif]">{duration}</span>
          </div>

          {/* Attendees & Platform */}
          <div className="flex items-center justify-between">
            {/* Avatar Stack */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {attendees.slice(0, 3).map((attendee, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-[#F7F7F7]"
                  >
                    <Image
                      src={attendee.avatar}
                      alt={attendee.name}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {totalAttendees > attendees.length && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#ff3b3b] flex items-center justify-center">
                    <span className="text-[9px] font-['Manrope:SemiBold',sans-serif] text-white">
                      +{totalAttendees - attendees.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Badge */}
            <div className="flex items-center gap-1 px-2 py-1 bg-[#F7F7F7] rounded-md">
              <span className="text-[10px] font-['Manrope:Regular',sans-serif] text-[#999999]">by</span>
              <span className="text-[10px] font-['Manrope:Medium',sans-serif] text-[#666666]">{organizer}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}