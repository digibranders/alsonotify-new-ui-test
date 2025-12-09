import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
// import profilePhoto from "figma:asset/1781e2061b1ba25df9b78787904bec3e7b4e9a89.png"; // Removed
import { Camera, Pencil } from 'lucide-react';
import { toast } from "sonner";
import Image from "next/image";

export function ProfilePage() {
   const [isEditing, setIsEditing] = useState(false);

   const [profile, setProfile] = useState({
      firstName: 'Satyam',
      middleName: '',
      lastName: 'Yadav',
      email: 'satyam.yadav@alsonotify.com',
      phone: '+91 98765 43210',
      designation: 'Senior Product Designer',
      dob: '1995-08-15',
      gender: 'Male',
      employeeId: 'AN-0042',
      addressLine1: 'B-402, Green Valley Apartments',
      addressLine2: 'Tech Park Road, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560066',
      country: 'India',
      emergencyContactName: 'Ravi Yadav',
      emergencyRelationship: 'Brother',
      emergencyContactNumber: '+91 98765 00000',
      newPassword: '',
      confirmPassword: ''
   });

   const renderField = (label: string, value: string, field: keyof typeof profile, type: string = "text", placeholder: string = "-") => {
      return (
         <div className="space-y-2">
            <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{label}</Label>
            <Input
               value={profile[field]}
               onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
               placeholder={placeholder}
               type={type}
               disabled={!isEditing}
               className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
            />
         </div>
      );
   };

   const renderSelect = (label: string, value: string, field: keyof typeof profile, options: string[]) => {
      return (
         <div className="space-y-2">
            <Label className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{label}</Label>
            <Select
               value={profile[field]}
               onValueChange={(v) => setProfile({ ...profile, [field]: v })}
               disabled={!isEditing}
            >
               <SelectTrigger className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Inter:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}>
                  <SelectValue placeholder="-" />
               </SelectTrigger>
               <SelectContent>
                  {options.map(opt => (
                     <SelectItem key={opt} value={opt} className="text-[13px] font-['Inter:Medium',sans-serif]">{opt}</SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
      );
   };

   const handleSaveChanges = () => {
      setIsEditing(false);
      toast.success('Profile updated successfully!');
   };

   const handleCancelEdit = () => {
      setIsEditing(false);
      // Reset changes if needed
   };

   const handleEdit = () => {
      setIsEditing(true);
   };

   return (
      <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative font-['Manrope',sans-serif]">
         {/* Header Section */}
         <div className="flex-none mb-6">
            <div className="flex items-center justify-between mb-1">
               <h1 className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">My Profile</h1>
               {!isEditing ? (
                  <Button
                     onClick={handleEdit}
                     className="bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif] px-6 h-10 rounded-full text-[13px] flex items-center gap-2"
                  >
                     <Pencil className="w-4 h-4" />
                     Edit
                  </Button>
               ) : (
                  <div className="flex items-center gap-3">
                     <Button
                        onClick={handleCancelEdit}
                        variant="ghost"
                        className="text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] font-['Manrope:SemiBold',sans-serif] px-6 h-10 rounded-full text-[13px]"
                     >
                        Cancel
                     </Button>
                     <Button
                        onClick={handleSaveChanges}
                        className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white font-['Manrope:SemiBold',sans-serif] px-8 h-10 rounded-full shadow-lg shadow-[#ff3b3b]/20 text-[13px]"
                     >
                        Save Changes
                     </Button>
                  </div>
               )}
            </div>
            <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif]">Manage your account settings and preferences</p>
         </div>

         <div className="flex-1 overflow-y-auto pr-2 pb-10">

            {/* Personal Details */}
            <section className="mb-10">
               <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                  Personal Details
               </h2>

               <div className="flex flex-col md:flex-row gap-10 items-start mb-8">
                  {/* Avatar */}
                  <div className="shrink-0">
                     <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-full overflow-hidden border border-[#EEEEEE] shadow-sm">
                           <Image
                              src="https://github.com/shadcn.png"
                              alt="Profile"
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Camera className="w-8 h-8 text-white" />
                        </div>
                     </div>
                  </div>

                  {/* Fields Grid */}
                  <div className="flex-1 w-full space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("First Name", profile.firstName, "firstName")}
                        {renderField("Middle Name", profile.middleName, "middleName")}
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField("Last Name", profile.lastName, "lastName")}
                        {renderField("Designation", profile.designation, "designation")}
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {renderField("Email Address", profile.email, "email")}
                  {renderField("Phone Number", profile.phone, "phone")}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderField("DOB", profile.dob, "dob", "date")}
                  {renderSelect("Gender", profile.gender, "gender", ["Male", "Female", "Other"])}
                  {renderField("Employee ID", profile.employeeId, "employeeId")}
               </div>
            </section>

            <Separator className="my-8 bg-[#EEEEEE]" />

            {/* Address Information */}
            <section className="mb-10">
               <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                  Address Information
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField("Address Line 1", profile.addressLine1, "addressLine1")}
                  {renderField("Address Line 2", profile.addressLine2, "addressLine2")}
                  {renderField("City", profile.city, "city")}
                  {renderField("State", profile.state, "state")}
                  {renderField("ZIP Code", profile.zipCode, "zipCode")}
                  {renderField("Country", profile.country, "country")}
               </div>
            </section>

            <Separator className="my-8 bg-[#EEEEEE]" />

            {/* Emergency Contact Information */}
            <section className="mb-10">
               <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                  Emergency Contact Information
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderField("Emergency Contact Name", profile.emergencyContactName, "emergencyContactName")}
                  {renderField("Relationship", profile.emergencyRelationship, "emergencyRelationship")}
                  {renderField("Emergency Contact Number", profile.emergencyContactNumber, "emergencyContactNumber")}
               </div>
            </section>

            <Separator className="my-8 bg-[#EEEEEE]" />

            {/* Password */}
            <section className="mb-6">
               <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                  Change Password
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField("New Password", profile.newPassword, "newPassword", "password")}
                  {renderField("Confirm Password", profile.confirmPassword, "confirmPassword", "password")}
               </div>
            </section>

         </div>

      </div>
   );
}