import { Badge } from "./ui/badge";
import { ShieldCheck, Briefcase, Users, User, Eye } from "lucide-react";

interface AccessBadgeProps {
  role: string;
  className?: string;
}

export function AccessBadge({ role, className }: AccessBadgeProps) {
  // Normalize role for comparison
  const roleLower = role.toLowerCase();
  
  let styles = "border-gray-200 bg-gray-50 text-gray-700";
  let Icon = User;

  switch (roleLower) {
    case 'admin':
      styles = "border-purple-200 bg-purple-50 text-purple-700";
      Icon = ShieldCheck;
      break;
    case 'manager':
      styles = "border-blue-200 bg-blue-50 text-blue-700";
      Icon = Briefcase;
      break;
    case 'leader':
      styles = "border-indigo-200 bg-indigo-50 text-indigo-700";
      Icon = Users;
      break;
    case 'employee':
      styles = "border-emerald-200 bg-emerald-50 text-emerald-700";
      Icon = User;
      break;
    default:
        // Default styling
      break;
  }

  return (
    <Badge variant="outline" className={`
        border rounded-md px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 w-fit
        ${styles}
        ${className || ''}
    `}>
        <Icon className="w-3 h-3" />
        {role}
    </Badge>
  );
}
