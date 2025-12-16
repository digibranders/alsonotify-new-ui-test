import { ShieldCheck, Briefcase, User, Users } from "lucide-react";

interface AccessBadgeProps {
  role: string | "Admin" | "Manager" | "Leader" | "Employee";
  className?: string; // Support className for custom styling overrides
}

export function AccessBadge({ role, className }: AccessBadgeProps) {
  let textColor = "#666666";
  let iconColor = "#666666";
  let bgColor = "#F7F7F7";
  let IconComponent = User;

  switch (role) {
    case "Admin":
      textColor = "#7F56D9"; // Purple
      iconColor = "#7F56D9"; // Purple
      bgColor = "#F9F5FF"; // Light lavender
      IconComponent = ShieldCheck;
      break;
    case "Manager":
      textColor = "#2E90FA"; // Blue
      iconColor = "#2E90FA"; // Blue
      bgColor = "#EFF8FF"; // Light blue
      IconComponent = Briefcase;
      break;
    case "Employee":
      textColor = "#12B76A"; // Green
      iconColor = "#12B76A"; // Green
      bgColor = "#ECFDF3"; // Light green
      IconComponent = User;
      break;
    case "Leader":
      textColor = "#7F56D9"; // Purple (same as Admin)
      iconColor = "#7F56D9"; // Purple (same as Admin)
      bgColor = "#F9F5FF"; // Light lavender (same as Admin)
      IconComponent = Users; // Two persons icon
      break;
    default:
      textColor = "#666666";
      iconColor = "#666666";
      bgColor = "#F7F7F7";
      IconComponent = User;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${className || ''}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <IconComponent 
        className="w-3 h-3" 
        style={{ color: iconColor }}
      />
      <span className="text-[11px] font-['Manrope:SemiBold',sans-serif]">
        {role}
      </span>
    </span>
  );
}
