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
  { label: "Event Planning", value: 20 },
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
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "BR", name: "Brazil" },
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
