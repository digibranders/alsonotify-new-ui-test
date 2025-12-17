import { useState, useMemo, useEffect, useRef } from 'react';
import { Button, Input, Select, Divider, message, Upload } from "antd";
import { Camera, Pencil, Upload as UploadIcon } from 'lucide-react';
import Image from "next/image";
import { useUserDetails, useUpdateProfile } from '@/hooks/useUser';
import { DocumentCard } from '@/components/ui/DocumentCard';
import { DocumentPreviewModal } from '@/components/ui/DocumentPreviewModal';
import { UserDocument, DocumentType } from '@/types/genericTypes';

const { Option } = Select;

export function ProfilePage() {
   const [isEditing, setIsEditing] = useState(false);
   const { data: userDetailsData } = useUserDetails();
   const updateProfileMutation = useUpdateProfile();

   // Get user data from localStorage or backend
   const user = useMemo(() => {
      // First try localStorage (most up-to-date after login)
      try {
         if (typeof window !== 'undefined') {
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (localUser && Object.keys(localUser).length > 0) {
               return localUser;
            }
         }
      } catch (error) {
         console.error("Error reading user from localStorage:", error);
      }
      // Fallback to API data - backend returns { result: { user: {...user_profile nested inside...}, access: {...}, token: "..." } }
      const apiUser = userDetailsData?.result?.user || userDetailsData?.result || {};
      return apiUser;
   }, [userDetailsData]);

   // Initialize profile state with real data or fallback to mock data
   const initialProfile = useMemo(() => {
      const userProfile = user?.user_profile || {};
      const fullName = user?.name || '';
      const nameParts = fullName.split(' ');

      return {
         firstName: userProfile?.first_name || nameParts[0] || 'Satyam', // Mock fallback
         middleName: userProfile?.middle_name || nameParts[1] || '',
         lastName: userProfile?.last_name || nameParts.slice(2).join(' ') || nameParts[1] || 'Yadav', // Mock fallback
         email: user?.email || 'satyam.yadav@alsonotify.com', // Mock fallback
         phone: userProfile?.mobile_number || user?.phone || '+91 98765 43210', // Mock fallback
         designation: userProfile?.designation || user?.designation || 'Senior Product Designer', // Mock fallback
         dob: userProfile?.date_of_birth ? new Date(userProfile.date_of_birth).toISOString().split('T')[0] : '1995-08-15', // Mock fallback
         gender: userProfile?.gender || 'Male', // Mock fallback
         employeeId: user?.employee_id || userProfile?.employee_id || 'AN-0042', // Mock fallback
         addressLine1: userProfile?.address?.split(',')[0] || userProfile?.address || 'B-402, Green Valley Apartments', // Mock fallback
         addressLine2: userProfile?.address?.split(',').slice(1).join(',') || 'Tech Park Road, Whitefield', // Mock fallback
         city: userProfile?.city || 'Bangalore', // Mock fallback
         state: userProfile?.state || 'Karnataka', // Mock fallback
         zipCode: userProfile?.zipcode || '560066', // Mock fallback
         country: userProfile?.country || 'India', // Mock fallback
         emergencyContactName: (userProfile?.emergency_contact as any)?.name || 'Ravi Yadav', // Mock fallback
         emergencyRelationship: (userProfile?.emergency_contact as any)?.relationship || 'Brother', // Mock fallback
         emergencyContactNumber: (userProfile?.emergency_contact as any)?.phone || '+91 98765 00000', // Mock fallback
         newPassword: '',
         confirmPassword: ''
      };
   }, [user]);

   const [profile, setProfile] = useState(initialProfile);

   // Update profile when user data changes
   useEffect(() => {
      setProfile(initialProfile);
   }, [initialProfile]);

   const renderField = (label: string, value: string, field: keyof typeof profile, type: string = "text", placeholder: string = "-") => {
      return (
         <div className="space-y-2">
            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{label}</div>
            <Input
               value={profile[field]}
               onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
               placeholder={placeholder}
               type={type}
               disabled={!isEditing}
               className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
            />
         </div>
      );
   };

   const renderSelect = (label: string, value: string, field: keyof typeof profile, options: string[]) => {
      return (
         <div className="space-y-2">
            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{label}</div>
            <Select
               value={profile[field]}
               onChange={(v) => setProfile({ ...profile, [field]: String(v) })}
               disabled={!isEditing}
               className={`w-full h-11 ${!isEditing ? 'bg-[#FAFAFA]' : ''}`}
            >
               {options.map(opt => (
                  <Option key={opt} value={opt}>{opt}</Option>
               ))}
            </Select>
         </div>
      );
   };

   const handleSaveChanges = async () => {
      try {
         // Prepare user profile payload
         const userProfilePayload = {
            first_name: profile.firstName,
            middle_name: profile.middleName || null,
            last_name: profile.lastName,
            mobile_number: profile.phone,
            designation: profile.designation,
            date_of_birth: profile.dob ? new Date(profile.dob).toISOString() : null,
            gender: profile.gender,
            employee_id: profile.employeeId,
            address: `${profile.addressLine1}, ${profile.addressLine2}`.trim(),
            city: profile.city,
            state: profile.state,
            zipcode: profile.zipCode,
            country: profile.country,
            emergency_contact: {
               name: profile.emergencyContactName,
               relationship: profile.emergencyRelationship,
               phone: profile.emergencyContactNumber,
            },
         };

         await updateProfileMutation.mutateAsync(userProfilePayload);
         message.success('Profile updated successfully!');
         setIsEditing(false);
      } catch (error: any) {
         console.error("Error updating profile:", error);
         const errorMessage = error?.response?.data?.message || "Failed to update profile";
         message.error(errorMessage);
      }
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
                     className="bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif] px-6 h-10 rounded-full text-[13px] flex items-center gap-2 border-none"
                  >
                     <Pencil className="w-4 h-4" />
                     Edit
                  </Button>
               ) : (
                  <div className="flex items-center gap-3">
                     <Button
                        onClick={handleCancelEdit}
                        type="text"
                        className="text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] font-['Manrope:SemiBold',sans-serif] px-6 h-10 rounded-full text-[13px]"
                     >
                        Cancel
                     </Button>
                     <Button
                        onClick={handleSaveChanges}
                        loading={updateProfileMutation.isPending}
                        className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white font-['Manrope:SemiBold',sans-serif] px-8 h-10 rounded-full shadow-lg shadow-[#ff3b3b]/20 text-[13px] border-none"
                     >
                        Save Changes
                     </Button>
                  </div>
               )}
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif]">Manage your account settings and preferences</p>
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
                              src={user?.user_profile?.profile_pic || user?.profile_pic || "https://github.com/shadcn.png"}
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

            <Divider className="my-8 bg-[#EEEEEE]" />

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

            <Divider className="my-8 bg-[#EEEEEE]" />

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

            <Divider className="my-8 bg-[#EEEEEE]" />

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