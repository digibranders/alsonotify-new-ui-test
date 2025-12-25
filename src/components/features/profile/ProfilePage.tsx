import { useState, useMemo, useEffect, useRef } from "react";
import { Button, Input, Select, Divider, Upload, Switch, Progress, App } from "antd";
import { Camera, Pencil, Upload as UploadIcon, FileText, Bell, Shield } from "lucide-react";
import Image from "next/image";
import { useUserDetails, useUpdateProfile } from "@/hooks/useUser";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { DocumentPreviewModal } from "@/components/ui/DocumentPreviewModal";
import { UserDocument, DocumentType } from "@/types/genericTypes";
import {
    DEFAULT_DOCUMENT_TYPES,
    DOCUMENT_TYPES_STORAGE_KEY,
} from "@/constants/documentTypes";

const { Option } = Select;

const countryCodes = [
    { code: "+1", country: "US" },
    { code: "+91", country: "IN" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "AU" },
    { code: "+81", country: "JP" },
    { code: "+49", country: "DE" },
];

export function ProfilePage() {
    const { message } = App.useApp();
    const { data: currentUserData } = useUserDetails();
    const user = currentUserData?.result?.user;
    const updateProfileMutation = useUpdateProfile();

    // Initialize profile state with real data or fallback to mock data
    const initialProfile = useMemo(() => {
        // user_profile is an array in the User model definition
        const rawUserProfile = user?.user_profile;
        const userProfile = Array.isArray(rawUserProfile) ? rawUserProfile[0] : rawUserProfile || {};

        const fullName = user?.name || "";
        const nameParts = fullName.split(" ");

        // Robust mobile number resolution (same as EmployeesPage)
        const fullMobileNumber =
            userProfile?.mobile_number ||
            user?.mobile_number ||
            userProfile?.phone ||
            user?.phone ||
            "";

        let phone = fullMobileNumber;
        let countryCode = "+91";

        // Parse country code
        if (phone && phone.startsWith("+")) {
            const matched = countryCodes.find(c => phone.startsWith(c.code));
            if (matched) {
                countryCode = matched.code;
                phone = phone.replace(matched.code, "").trim();
            }
        } else if (!phone) {
            // Default if no phone
            phone = "";
        }

        // Parse address
        const fullAddress = userProfile?.address || "";
        const addressParts = fullAddress.split(",").map((p: string) => p.trim());
        const addressLine1 = addressParts[0] || "";
        const addressLine2 = addressParts.slice(1).join(", ") || "";

        // Parse Working Hours
        const workingHours = userProfile?.working_hours || {};
        const startTime = (workingHours as any)?.start_time || "09:30";
        const endTime = (workingHours as any)?.end_time || "18:30";

        return {
            firstName: userProfile?.first_name || nameParts[0] || "",
            middleName: userProfile?.middle_name || (nameParts.length > 2 ? nameParts[1] : "") || "",
            lastName: userProfile?.last_name || nameParts.slice(nameParts.length > 2 ? 2 : 1).join(" ") || "",
            email: user?.email || "",
            phone: phone,
            countryCode: countryCode,
            designation: userProfile?.designation || user?.designation || "",
            dob: userProfile?.date_of_birth
                ? new Date(userProfile.date_of_birth)
                    .toISOString()
                    .split("T")[0]
                : "",
            gender: userProfile?.gender || "",
            employeeId: user?.employee_id || userProfile?.employee_id || "",

            // Employment Details
            employmentType: userProfile?.employment_type || "Full-time",
            dateOfJoining: userProfile?.date_of_joining
                ? new Date(userProfile.date_of_joining)
                    .toISOString()
                    .split("T")[0]
                : "",
            experience: userProfile?.experience || 0,
            startTime: startTime,
            endTime: endTime,
            salary: userProfile?.salary_yearly || 0,
            hourlyRate: userProfile?.hourly_rates || 0,
            leaves: userProfile?.no_of_leaves || 0,

            addressLine1: addressLine1,
            addressLine2: addressLine2,
            city: userProfile?.city || "",
            state: userProfile?.state || "",
            zipCode: userProfile?.zipcode || "",
            country: userProfile?.country || "India",
            emergencyContactName: (userProfile?.emergency_contact as any)?.name || "",
            emergencyRelationship: (userProfile?.emergency_contact as any)?.relationship || "",
            emergencyContactNumber: (userProfile?.emergency_contact as any)?.phone || "",
            newPassword: "",
            confirmPassword: "",
        };
    }, [user]);

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(initialProfile);

    // Notification preferences state
    const [notificationPreferences, setNotificationPreferences] = useState({
        emailNotifications: true,
        securityAlerts: true,
    });
    const [selectedDocument, setSelectedDocument] =
        useState<UserDocument | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    // Document types configuration shared with Settings page (via localStorage)
    const documentTypes: DocumentType[] = useMemo(() => {
        try {
            if (typeof window !== "undefined") {
                const stored = window.localStorage.getItem(
                    DOCUMENT_TYPES_STORAGE_KEY
                );
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed.map((doc: any, index: number) => ({
                            id: String(doc.id ?? index + 1),
                            name: String(doc.name ?? ""),
                            required: Boolean(doc.required),
                        }));
                    }
                }
            }
        } catch (error) {
            console.error(
                "Error reading document types from localStorage:",
                error
            );
        }

        return DEFAULT_DOCUMENT_TYPES;
    }, []);

    // Mock documents data - TODO: Replace with actual API call when available
    const documents = useMemo(() => {
        // Check if user data has documents
        const userDocs = user?.documents || user?.user_profile?.documents || [];
        if (Array.isArray(userDocs) && userDocs.length > 0) {
            return userDocs;
        }
        // Mock documents from docs folder - all 4 types
        const mockDocuments: UserDocument[] = [
            {
                id: "1",
                documentTypeId: documentTypes[0]?.id || "1",
                documentTypeName:
                    documentTypes[0]?.name || "Resume / CV",
                fileName: "Resume_Gaurav.pdf",
                fileSize: 2400000, // 2.4 MB
                fileUrl: "/documents/Jayendra_Jadhav_Resume.pdf",
                uploadedDate: "2024-10-24T00:00:00Z",
                fileType: "pdf",
                isRequired: documentTypes[0]?.required ?? true,
            },
            {
                id: "2",
                documentTypeId: documentTypes[1]?.id || "2",
                documentTypeName: documentTypes[1]?.name || "ID Proof",
                fileName: "profile_photo.webp",
                fileSize: 1000000, // 1 MB
                fileUrl: "/documents/profile.png",
                uploadedDate: "2024-01-15T00:00:00Z",
                fileType: "image",
                isRequired: documentTypes[1]?.required ?? true,
            },
            {
                id: "3",
                documentTypeId: documentTypes[2]?.id || "3",
                documentTypeName:
                    documentTypes[2]?.name || "Contract Agreement",
                fileName: "Employment_Contract.docx",
                fileSize: 206000, // 206 KB
                fileUrl: "/documents/AI Agent Documentation.docx",
                uploadedDate: "2024-01-20T00:00:00Z",
                fileType: "docx",
                isRequired: documentTypes[2]?.required ?? true,
            },
            {
                id: "4",
                documentTypeId: documentTypes[3]?.id || "4",
                documentTypeName:
                    documentTypes[3]?.name || "Supporting Documents",
                fileName: "sample_csv.csv",
                fileSize: 50000, // 50 KB
                fileUrl: "/documents/ollama_filtered_json_support.csv",
                uploadedDate: "2024-12-17T00:00:00Z",
                fileType: "csv",
                isRequired: documentTypes[3]?.required ?? false,
            },
            {
                id: "5",
                documentTypeId: documentTypes[4]?.id || "5",
                documentTypeName:
                    documentTypes[4]?.name || "Additional Document",
                fileName: "",
                fileSize: 0,
                fileUrl: "",
                uploadedDate: "",
                fileType: "pdf",
                isRequired: documentTypes[4]?.required ?? false,
            },
        ];
        return mockDocuments;
    }, [user, documentTypes]);

    // Update profile when user data changes
    useEffect(() => {
        setProfile(initialProfile);
    }, [initialProfile]);

    const handleDocumentPreview = (document: UserDocument) => {
        setSelectedDocument(document);
        setIsPreviewModalOpen(true);
    };

    const handleDocumentDownload = (document: UserDocument) => {
        if (document.fileUrl) {
            window.open(document.fileUrl, "_blank");
        } else {
            message.warning("Document URL not available");
        }
    };

    const handleDocumentUpload = (documentTypeId: string) => {
        message.info(
            `Upload functionality for document type ${documentTypeId} - To be implemented`
        );
        // TODO: Implement upload functionality
    };

    const renderField = (
        label: string,
        value: string,
        field: keyof typeof profile,
        type: string = "text",
        placeholder: string = "-"
    ) => {
        return (
            <div className="space-y-2">
                <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                    {label}
                </div>
                <Input
                    value={profile[field]}
                    onChange={(e) =>
                        setProfile({ ...profile, [field]: e.target.value })
                    }
                    placeholder={placeholder}
                    type={type}
                    disabled={!isEditing}
                    className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif] text-[13px] ${!isEditing ? "bg-[#FAFAFA] text-[#666666]" : "bg-white"
                        }`}
                />
            </div>
        );
    };

    const renderSelect = (
        label: string,
        value: string,
        field: keyof typeof profile,
        options: string[]
    ) => {
        return (
            <div className="space-y-2">
                <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                    {label}
                </div>
                <Select
                    value={profile[field]}
                    onChange={(v) =>
                        setProfile({ ...profile, [field]: String(v) })
                    }
                    disabled={!isEditing}
                    className={`w-full h-11 ${!isEditing ? "bg-[#FAFAFA]" : ""
                        }`}
                >
                    {options.map((opt) => (
                        <Option key={opt} value={opt}>
                            {opt}
                        </Option>
                    ))}
                </Select>
            </div>
        );
    };

    const handleSaveChanges = async () => {
        try {
            // Prepare user profile payload
            const fullMobileNumber = `${profile.countryCode || "+91"} ${profile.phone}`.trim();
            const userProfilePayload = {
                name: `${profile.firstName} ${profile.lastName}`.trim(),
                email: profile.email,
                first_name: profile.firstName,
                middle_name: profile.middleName || null,
                last_name: profile.lastName,
                mobile_number: fullMobileNumber,
                designation: profile.designation,
                date_of_birth: profile.dob
                    ? new Date(profile.dob).toISOString()
                    : null,
                gender: profile.gender,
                employee_id: profile.employeeId,
                address:
                    `${profile.addressLine1}, ${profile.addressLine2}`.trim(),
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
            message.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            const errorMessage =
                error?.response?.data?.message || "Failed to update profile";
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

    // Calculate profile completion percentage
    const profileCompletion = useMemo(() => {
        const requiredFields = [
            profile.firstName,
            profile.lastName,
            profile.designation,
            profile.email,
            profile.dob,
            profile.gender,
            profile.employeeId,
            profile.country,
            profile.addressLine1,
            profile.city,
            profile.state,
            profile.zipCode,
            profile.emergencyContactName,
            profile.emergencyContactNumber,
        ];

        const filledFields = requiredFields.filter(
            (field) => field && field.toString().trim() !== ""
        ).length;

        const totalFields = requiredFields.length;
        const percentage = Math.round((filledFields / totalFields) * 100);
        return percentage;
    }, [profile]);

    return (
        <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative font-['Manrope',sans-serif]">
            {/* Header Section */}
            <div className="flex-none mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                        <h1 className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                            My Profile
                        </h1>
                        {/* Profile Completion Progress Bar */}
                        <div className="flex-1 max-w-xs bg-[#FAFAFA] rounded-lg px-4 py-2.5 border border-[#EEEEEE]">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[12px] font-['Manrope:Medium',sans-serif] text-[#666666]">
                                    Profile Completion
                                </span>
                                <span className={`text-[12px] font-['Manrope:SemiBold',sans-serif] ${profileCompletion === 100
                                    ? 'text-[#2ecc71]'
                                    : profileCompletion >= 50
                                        ? 'text-[#3b8eff]'
                                        : 'text-[#ff3b3b]'
                                    }`}>
                                    {profileCompletion}%
                                </span>
                            </div>
                            <Progress
                                percent={profileCompletion}
                                showInfo={false}
                                strokeColor={
                                    profileCompletion === 100
                                        ? "#2ecc71"
                                        : profileCompletion >= 50
                                            ? "#3b8eff"
                                            : "#ff3b3b"
                                }
                                trailColor="#E5E5E5"
                                className="profile-completion-progress"
                                style={{
                                    height: '6px',
                                }}
                            />
                        </div>
                    </div>
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
                <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif]">
                    Manage your account settings and preferences
                </p>
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
                                        src={
                                            user?.user_profile?.profile_pic ||
                                            user?.profile_pic ||
                                            "/documents/profile.png"
                                        }
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
                                {renderField(
                                    "First Name",
                                    profile.firstName,
                                    "firstName"
                                )}
                                {renderField(
                                    "Middle Name",
                                    profile.middleName,
                                    "middleName"
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderField(
                                    "Last Name",
                                    profile.lastName,
                                    "lastName"
                                )}
                                {renderField(
                                    "Designation",
                                    profile.designation,
                                    "designation"
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {renderField("Email Address", profile.email, "email")}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Phone Number
                            </div>
                            <div className="flex gap-2">
                                <Select
                                    value={profile.countryCode}
                                    onChange={(v) =>
                                        setProfile({ ...profile, countryCode: String(v) })
                                    }
                                    disabled={!isEditing}
                                    className={`w-[85px] h-11 ${!isEditing ? "bg-[#FAFAFA]" : ""}`}
                                    suffixIcon={<div className="text-gray-400">⌄</div>}
                                >
                                    {countryCodes.map((c) => (
                                        <Option key={c.code} value={c.code}>{c.code} {c.country}</Option>
                                    ))}
                                </Select>
                                <Input
                                    value={profile.phone}
                                    onChange={(e) =>
                                        setProfile({ ...profile, phone: e.target.value })
                                    }
                                    placeholder="123 456 7890"
                                    disabled={!isEditing}
                                    className={`flex-1 h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] focus:ring-[#ff3b3b]/10 font-['Manrope:Medium',sans-serif] text-[13px] ${!isEditing ? "bg-[#FAFAFA] text-[#666666]" : "bg-white"
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {renderField("DOB", profile.dob, "dob", "date")}
                        {renderSelect("Gender", profile.gender, "gender", [
                            "Male",
                            "Female",
                            "Other",
                        ])}
                        {renderField(
                            "Employee ID",
                            profile.employeeId,
                            "employeeId"
                        )}
                    </div>
                </section>

                <Divider className="my-8 bg-[#EEEEEE]" />

                {/* Employment Details */}
                <section className="mb-10">
                    <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                        Employment Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Employment Type - Read Only */}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Employment Type
                            </div>
                            <Input
                                value={profile.employmentType}
                                disabled={true}
                                className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                            />
                        </div>
                        {/* Date of Joining - Read Only */}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Date of Joining
                            </div>
                            <Input
                                value={profile.dateOfJoining}
                                type="date"
                                disabled={true}
                                className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Experience */}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Experience (Years)
                            </div>
                            <Input
                                value={profile.experience}
                                disabled={true}
                                className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                            />
                        </div>
                        {/* Working Hours */}
                        <div className="col-span-2 space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Working Hours
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={profile.startTime}
                                    disabled={true}
                                    className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                                />
                                <span className="text-[#666666] text-sm">to</span>
                                <Input
                                    value={profile.endTime}
                                    disabled={true}
                                    className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Salary */}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Salary (Yearly)
                            </div>
                            <Input
                                value={profile.salary}
                                disabled={true}
                                prefix="$"
                                className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                            />
                        </div>
                        {/* Hourly Rate */}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Hourly Rate
                            </div>
                            <Input
                                value={profile.hourlyRate}
                                disabled={true}
                                suffix="/Hr"
                                className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                            />
                        </div>
                        {/* Leaves Balance */}
                        <div className="space-y-2">
                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                Leaves Balance
                            </div>
                            <Input
                                value={profile.leaves}
                                disabled={true}
                                className="h-11 rounded-lg border-[#EEEEEE] font-['Manrope:Medium',sans-serif] text-[13px] bg-[#FAFAFA] text-[#666666]"
                            />
                        </div>
                    </div>
                </section>

                <Divider className="my-8 bg-[#EEEEEE]" />

                {/* Address Information */}
                <section className="mb-10">
                    <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                        Address Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField(
                            "Address Line 1",
                            profile.addressLine1,
                            "addressLine1"
                        )}
                        {renderField(
                            "Address Line 2",
                            profile.addressLine2,
                            "addressLine2"
                        )}
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
                        {renderField(
                            "Emergency Contact Name",
                            profile.emergencyContactName,
                            "emergencyContactName"
                        )}
                        {renderField(
                            "Relationship",
                            profile.emergencyRelationship,
                            "emergencyRelationship"
                        )}
                        {renderField(
                            "Emergency Contact Number",
                            profile.emergencyContactNumber,
                            "emergencyContactNumber"
                        )}
                    </div>
                </section>

                <Divider className="my-8 bg-[#EEEEEE]" />

                {/* Professional Documents */}
                <section className="mb-10">
                    <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                        Professional Documents
                    </h2>
                    {documentTypes && documentTypes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {documentTypes.map((docType) => {
                                const matchingDoc = documents?.find(
                                    (doc: UserDocument) =>
                                        doc.documentTypeId === docType.id
                                );

                                const documentForCard: UserDocument =
                                    matchingDoc ||
                                    ({
                                        id: docType.id,
                                        documentTypeId: docType.id,
                                        documentTypeName: docType.name,
                                        fileName: "",
                                        fileSize: 0,
                                        fileUrl: "",
                                        uploadedDate: "",
                                        fileType: "pdf",
                                        isRequired: docType.required,
                                    } as UserDocument);

                                return (
                                    <div key={docType.id} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                                                {docType.name}
                                            </div>
                                            {!docType.required && (
                                                <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                                                    Optional
                                                </span>
                                            )}
                                        </div>
                                        <DocumentCard
                                            document={documentForCard}
                                            onPreview={handleDocumentPreview}
                                            onDownload={handleDocumentDownload}
                                            showUpload={!documentForCard.fileUrl}
                                            onUpload={handleDocumentUpload}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="border border-[#EEEEEE] border-dashed rounded-lg p-8 bg-[#FAFAFA] text-center">
                            <FileText className="w-12 h-12 text-[#CCCCCC] mx-auto mb-3" />
                            <p className="text-[13px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-1">
                                No documents configured
                            </p>
                            <p className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                                Add required documents in Settings to manage employee files.
                            </p>
                        </div>
                    )}
                </section>

                <Divider className="my-8 bg-[#EEEEEE]" />

                {/* Password */}
                <section className="mb-10">
                    <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                        Change Password
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField(
                            "New Password",
                            profile.newPassword,
                            "newPassword",
                            "password"
                        )}
                        {renderField(
                            "Confirm Password",
                            profile.confirmPassword,
                            "confirmPassword",
                            "password"
                        )}
                    </div>
                </section>

                <Divider className="my-8 bg-[#EEEEEE]" />

                {/* Notification Preferences */}
                <section className="mb-6">
                    <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">
                        Notification Preferences
                    </h2>
                    <div className="space-y-6">
                        {/* Email Notifications */}
                        <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg border border-[#EEEEEE]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#FFF4F4] rounded-lg flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-[#ff3b3b]" />
                                </div>
                                <div>
                                    <div className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-1">
                                        Email Notifications
                                    </div>
                                    <div className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                                        Receive updates via email for important activities.
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={notificationPreferences.emailNotifications}
                                onChange={(checked) =>
                                    setNotificationPreferences({
                                        ...notificationPreferences,
                                        emailNotifications: checked,
                                    })
                                }
                                className="bg-[#CCCCCC]"
                                checkedChildren="ON"
                                unCheckedChildren="OFF"
                                style={{
                                    backgroundColor: notificationPreferences.emailNotifications
                                        ? "#ff3b3b"
                                        : undefined,
                                }}
                            />
                        </div>

                        {/* Security Alerts */}
                        <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg border border-[#EEEEEE]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#FFF4F4] rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-[#ff3b3b]" />
                                </div>
                                <div>
                                    <div className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-1">
                                        Security Alerts
                                    </div>
                                    <div className="text-[13px] font-['Manrope:Regular',sans-serif] text-[#666666]">
                                        Get notified about new sign-ins and suspicious activity.
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={notificationPreferences.securityAlerts}
                                onChange={(checked) =>
                                    setNotificationPreferences({
                                        ...notificationPreferences,
                                        securityAlerts: checked,
                                    })
                                }
                                className="bg-[#CCCCCC]"
                                checkedChildren="ON"
                                unCheckedChildren="OFF"
                                style={{
                                    backgroundColor: notificationPreferences.securityAlerts
                                        ? "#ff3b3b"
                                        : undefined,
                                }}
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Document Preview Modal */}
            <DocumentPreviewModal
                open={isPreviewModalOpen}
                onClose={() => {
                    setIsPreviewModalOpen(false);
                    setSelectedDocument(null);
                }}
                document={selectedDocument}
            />
        </div>
    );
}
