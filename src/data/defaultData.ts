export const businessTypes = [
  { label: "Software Development", value: 1 },
  { label: "IT Consulting Firms", value: 2 },
  { label: "Web Designing", value: 3 },
  { label: "Marketing Agencies", value: 4 },
  { label: "Engineering Firms", value: 5 },
  { label: "Architecture Firms", value: 6 },
  { label: "Graphic Design Firms", value: 7 },
  { label: "Advertising Agencies", value: 8 },
  { label: "Video Production", value: 9 },
  { label: "Photography Studios", value: 10 },
  { label: "Healthcare Services", value: 11 },
  { label: "Educational Services", value: 12 },
  { label: "Training Institutes", value: 13 },
  { label: "Financial Services", value: 14 },
  { label: "Manufacturing", value: 15 },
  { label: "Supply Chain and Logistics", value: 16 },
  { label: "Warehousing", value: 17 },
  { label: "Retail Services", value: 18 },
  { label: "Travel Agencies", value: 19 },
  { label: "Others", value: 21 },
];
// Map industry string to businessType value
export const industryToBusinessType: Record<string, number> = {
  technology: 1,
  marketing: 4,
  finance: 14,
  retail: 18,
  healthcare: 11,
  education: 12,
  other: 21,
};

// Common countries list (simplified - can be expanded)
export const commonCountries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BD", name: "Bangladesh" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
];

// Common timezones
export const commonTimezones = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Chicago",
  "America/Toronto",
  "Europe/Berlin",
];

// Initial data for DataContext (empty arrays - data will come from API)
import { Workspace, Requirement, Employee, Client, Task } from '../types/genericTypes';

export const initialWorkspaces: Workspace[] = [];
export const initialRequirements: Requirement[] = [];
export const initialEmployees: Employee[] = [];
export const initialClients: Client[] = [];
export const initialTasks: Task[] = [];
