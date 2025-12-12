import { Tag } from "antd";

interface AccessBadgeProps {
  role: string | "Admin" | "Manager" | "Leader" | "Employee";
  className?: string; // Support className for custom styling overrides
}

export function AccessBadge({ role, className }: AccessBadgeProps) {
  let color = "default";
  let textColor = "#666666";
  let bgColor = "#F7F7F7";
  let borderColor = "#DDDDDD";

  switch (role) {
    case "Admin":
      color = "error";
      textColor = "#ff3b3b";
      bgColor = "#FFF5F5";
      borderColor = "#ff3b3b";
      break;
    case "Manager":
      color = "processing";
      textColor = "#2F80ED";
      bgColor = "#F0F7FF";
      borderColor = "#2F80ED";
      break;
    case "Leader":
      color = "warning";
      textColor = "#F2994A";
      bgColor = "#FFFAF5";
      borderColor = "#F2994A";
      break;
    case "Employee":
    default:
      color = "default";
      textColor = "#666666";
      bgColor = "#F7F7F7";
      borderColor = "#DDDDDD";
      break;
  }

  // Using custom styling with Tag for exact visual match
  return (
    <Tag
      className={className}
      style={{
        color: textColor,
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderRadius: "100px",
        padding: "0 10px",
        fontSize: "11px",
        fontFamily: "'Manrope:SemiBold', sans-serif",
        textTransform: "uppercase",
        borderWidth: "1px",
      }}
    >
      {role}
    </Tag>
  );
}
