'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// import profilePhoto from "figma:asset/1781e2061b1ba25df9b78787904bec3e7b4e9a89.png"; // Removed
import { AccessBadge } from './AccessBadge';
import Image from 'next/image';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Alert24Filled,
  Add24Filled,
  PeopleTeam24Filled,
  Apps24Filled,
  ClipboardTaskListLtr24Filled,
  Person24Filled,
  People24Filled,
  Handshake24Filled,
  Receipt24Filled,
  Calendar24Filled,
  Notepad24Filled
} from '@fluentui/react-icons';
import { FolderOpen, CheckSquare, FileText, UploadCloud, UserCog, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { TaskForm } from './forms/TaskForm';

type UserRole = 'Admin' | 'Manager' | 'Leader' | 'Employee';

interface HeaderProps {
  userRole?: UserRole;
  setUserRole?: (role: UserRole) => void;
}

export function Header({ userRole = 'Admin', setUserRole }: HeaderProps) {
  const router = useRouter();
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);

  // Form States
  const [newWorkspace, setNewWorkspace] = useState({ name: '', client: '', description: '', lead: '' });
  const [newRequirement, setNewRequirement] = useState({ title: '', workspace: '', type: '', priority: '', category: '', dueDate: '', description: '' });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'requirement', title: 'New Requirement: Mobile App Design', message: 'Client has submitted a new requirement', time: '5 min ago', unread: true },
    { id: 2, type: 'task', title: 'Task Completed: UI Mockups', message: 'Sarah completed the UI mockups task', time: '1 hour ago', unread: true },
    { id: 3, type: 'delivery', title: 'Delivery Ready for Review', message: 'Brand Identity Package is ready for approval', time: '2 hours ago', unread: true },
    { id: 4, type: 'workspace', title: 'Added to Workspace', message: 'You were added to E-commerce Platform workspace', time: '1 day ago', unread: false },
    { id: 5, type: 'requirement', title: 'Requirement Approved', message: 'Website Redesign requirement was approved', time: '2 days ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <>
      <div className="bg-white rounded-full p-4 w-full">
        <div className="flex flex-row items-center justify-between w-full">
          {/* Left: Greeting text */}
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center not-italic text-[#111111] text-nowrap">
            <div className="flex items-center gap-3">
              <p className="leading-[normal] text-[20px] whitespace-pre">
                <span className="font-['Manrope:Regular',sans-serif]">{`👋 Morning! `}</span>
                <span className="font-['Manrope:Bold',sans-serif]">Satyam</span>
              </p>
              <AccessBadge role={userRole} />
            </div>
          </div>

          {/* Right: CTAs, icons & profile section */}
          <div className="flex flex-row gap-6 items-center">
            {/* Add Button with Dropdown - Only visible to Admin, Manager, Leader */}
            {userRole !== 'Employee' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-full bg-[#ff3b3b] hover:bg-[#cc2f2f] flex items-center justify-center transition-all active:scale-95 hover:shadow-lg shadow-[4px_4px_7px_0px_inset_rgba(255,255,255,0.3)]">
                    <Add24Filled className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-2">
                  <DropdownMenuLabel className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif] px-2 py-1.5 uppercase tracking-wider">
                    Create New
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => setShowRequirementDialog(true)}
                    className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                  >
                    <PeopleTeam24Filled className="w-4 h-4 mr-3" />
                    Requirement
                  </DropdownMenuItem>

                  {(userRole === 'Admin' || userRole === 'Manager') && (
                    <DropdownMenuItem
                      onClick={() => setShowWorkspaceDialog(true)}
                      className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                    >
                      <Apps24Filled className="w-4 h-4 mr-3" />
                      Workspace
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setShowTaskDialog(true)}
                    className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                  >
                    <ClipboardTaskListLtr24Filled className="w-4 h-4 mr-3" />
                    Task
                  </DropdownMenuItem>

                  {(userRole === 'Admin' || userRole === 'Manager') && (
                    <>
                      <DropdownMenuSeparator className="my-2 bg-[#F7F7F7]" />
                      <DropdownMenuLabel className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif] px-2 py-1.5 uppercase tracking-wider">
                        People
                      </DropdownMenuLabel>

                      <DropdownMenuItem
                        onClick={() => router.push('/employees')}
                        className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                      >
                        <People24Filled className="w-4 h-4 mr-3" />
                        Employee
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => router.push('/clients')}
                        className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                      >
                        <Handshake24Filled className="w-4 h-4 mr-3" />
                        Client
                      </DropdownMenuItem>
                    </>
                  )}

                  {userRole === 'Admin' && (
                    <>
                      <DropdownMenuSeparator className="my-2 bg-[#F7F7F7]" />
                      <DropdownMenuLabel className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif] px-2 py-1.5 uppercase tracking-wider">
                        Finance
                      </DropdownMenuLabel>

                      <DropdownMenuItem
                        onClick={() => router.push('/invoices')}
                        className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                      >
                        <Receipt24Filled className="w-4 h-4 mr-3" />
                        Invoice
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-2 bg-[#F7F7F7]" />
                  <DropdownMenuLabel className="text-[11px] text-[#999999] font-['Inter:Medium',sans-serif] px-2 py-1.5 uppercase tracking-wider">
                    Quick Actions
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => router.push('/calendar')}
                    className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                  >
                    <Calendar24Filled className="w-4 h-4 mr-3" />
                    Schedule Meeting
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push('/notes')}
                    className="cursor-pointer py-2.5 px-3 rounded-lg font-['Inter:Medium',sans-serif] text-[14px] focus:bg-[#FEF3F2] focus:text-[#ff3b3b]"
                  >
                    <Notepad24Filled className="w-4 h-4 mr-3" />
                    Add Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notification icon */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative hover:opacity-70 transition-opacity">
                  <Alert24Filled className="w-6 h-6 text-[#000000]" strokeWidth={1.5} />
                  {/* Notification Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3b3b] rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] font-['Inter:Bold',sans-serif] text-white">{unreadCount}</span>
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[380px] p-0">
                <div className="p-4 border-b border-[#EEEEEE] flex items-center justify-between">
                  <h3 className="font-['Manrope:SemiBold',sans-serif] text-[16px] text-[#111111]">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[12px] font-['Inter:Medium',sans-serif] text-[#ff3b3b] hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#999999]">
                        No notifications
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-[#EEEEEE] hover:bg-[#F7F7F7] cursor-pointer transition-colors ${notification.unread ? 'bg-[#FEF3F2]' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-['Inter:SemiBold',sans-serif] text-[13px] text-[#111111]">
                                {notification.title}
                              </h4>
                              {notification.unread && (
                                <span className="w-2 h-2 bg-[#ff3b3b] rounded-full" />
                              )}
                            </div>
                            <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#666666] mb-1">
                              {notification.message}
                            </p>
                            <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#999999]">
                              {notification.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile photo & Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative shrink-0 size-[40px] rounded-full ring-2 ring-transparent hover:ring-[#ff3b3b]/20 transition-all cursor-pointer">
                  <div className="absolute inset-0">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" fill="var(--fill-0, #D9D9D9)" id="Ellipse 41" r="19" stroke="var(--stroke-0, #EEEEEE)" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <Image
                      alt="Satyam"
                      src="https://github.com/shadcn.png"
                      width={40}
                      height={40}
                      className="size-full object-cover"
                    />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-['Manrope:Bold',sans-serif] text-[#111111]">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userRole === 'Admin' && (
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                  <UserCog className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500 font-normal">Switch View (Demo)</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setUserRole?.('Admin')} className="cursor-pointer justify-between">
                  <span>Admin</span>
                  {userRole === 'Admin' && <CheckSquare className="w-4 h-4 text-[#ff3b3b]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserRole?.('Manager')} className="cursor-pointer justify-between">
                  <span>Manager</span>
                  {userRole === 'Manager' && <CheckSquare className="w-4 h-4 text-[#ff3b3b]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserRole?.('Leader')} className="cursor-pointer justify-between">
                  <span>Leader</span>
                  {userRole === 'Leader' && <CheckSquare className="w-4 h-4 text-[#ff3b3b]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserRole?.('Employee')} className="cursor-pointer justify-between">
                  <span>Employee</span>
                  {userRole === 'Employee' && <CheckSquare className="w-4 h-4 text-[#ff3b3b]" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Workspace Dialog - Rendered conditionally based on role is handled in trigger, but also here for safety */}
      <Dialog open={showWorkspaceDialog} onOpenChange={setShowWorkspaceDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
          <div className="p-6 border-b border-[#EEEEEE]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <FolderOpen className="w-5 h-5 text-[#666666]" />
                </div>
                Create Workspace
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                Create a new workspace to organize tasks and requirements.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace Name</Label>
                <Input
                  placeholder="e.g. Website Redesign"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Client</Label>
                <Select
                  value={newWorkspace.client}
                  onValueChange={(v) => setNewWorkspace({ ...newWorkspace, client: v })}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eventus Security">Eventus Security</SelectItem>
                    <SelectItem value="Triam Security">Triam Security</SelectItem>
                    <SelectItem value="DIST">DIST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Project Lead</Label>
                <Select
                  value={newWorkspace.lead}
                  onValueChange={(v) => setNewWorkspace({ ...newWorkspace, lead: v })}
                >
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]">
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Me (Current User)</SelectItem>
                    <SelectItem value="sarah">Sarah Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</Label>
              <Textarea
                placeholder="Describe your workspace..."
                className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] p-3"
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]">Reset Data</Button>
              <Button className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]">Create Workspace</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
          <div className="p-6 border-b border-[#EEEEEE]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <CheckSquare className="w-5 h-5 text-[#666666]" />
                </div>
                Create New Task
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                Assign task for people join to team
              </DialogDescription>
            </DialogHeader>
          </div>

          <TaskForm
            onSubmit={(data) => {
              console.log("Task created from header", data);
              setShowTaskDialog(false);
            }}
            onCancel={() => setShowTaskDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Requirement Dialog */}
      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[16px] border border-[#EEEEEE] p-0 overflow-hidden gap-0">
          <div className="p-6 border-b border-[#EEEEEE]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <FileText className="w-5 h-5 text-[#666666]" />
                </div>
                Create New Requirement
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] ml-11">
                Define a new requirement for the team
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Title</Label>
                <Input
                  placeholder="Requirement title"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]"
                  value={newRequirement.title}
                  onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace</Label>
                <Select value={newRequirement.workspace} onValueChange={(v) => setNewRequirement({ ...newRequirement, workspace: v })}>
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redesign">Website Redesign</SelectItem>
                    <SelectItem value="app">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Type</Label>
                <Select value={newRequirement.type} onValueChange={(v) => setNewRequirement({ ...newRequirement, type: v })}>
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inhouse">In-house</SelectItem>
                    <SelectItem value="outsourced">Outsourced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</Label>
                <Select value={newRequirement.priority} onValueChange={(v) => setNewRequirement({ ...newRequirement, priority: v })}>
                  <SelectTrigger className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Category</Label>
                <Input
                  placeholder="e.g. Development"
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]"
                  value={newRequirement.category}
                  onChange={(e) => setNewRequirement({ ...newRequirement, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</Label>
                <Input type="date" className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</Label>
              <Textarea
                placeholder="Requirement details..."
                className="min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] p-3"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-[#EEEEEE] flex items-center justify-end bg-white">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:bg-[#F7F7F7]">Reset Data</Button>
              <Button className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif]">Save Requirement</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}