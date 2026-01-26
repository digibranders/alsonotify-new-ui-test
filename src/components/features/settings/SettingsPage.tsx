import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Plus, Edit, Trash2, X, Pencil, CreditCard, Bell, Lock, Database, AlertTriangle, Eye, EyeOff, Shield, ChevronDown, ChevronRight, Check, Building2 } from 'lucide-react';
import { Button, Input, Select, Switch, Divider, App, Modal, DatePicker, Collapse, Checkbox, Upload } from "antd";
import { useUpdateCompany, useCurrentUserCompany, useRoles, useRolePermissions, useUpsertRole, useUpdateRolePermissions, useUserDetails } from '@/hooks/useUser';
import { usePublicHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from '@/hooks/useHoliday';
import { getErrorMessage } from '@/types/api-utils';
import { DEFAULT_DOCUMENT_TYPES, DOCUMENT_TYPES_STORAGE_KEY } from '@/constants/documentTypes';
import { useDocumentSettings } from '@/hooks/useDocumentSettings';
import { getRoleFromUser } from '@/utils/roleUtils';
import { useAccountType } from '@/utils/accountTypeUtils';
import { People24Filled } from "@fluentui/react-icons";
import { commonCountries } from '@/data/defaultData';
import dayjs from 'dayjs';
import { Department, Holiday, Role } from '@/types/domain';
import { CompanyUpdateInput } from '@/types/genericTypes';
import { CompanyLeaveSetting } from '@/types/auth';
import { fileService } from '@/services/file.service';

const { TextArea } = Input;
const { Option } = Select;

// Get all IANA timezones without duplicates
// Only returns canonical (latest) timezone names, excluding deprecated aliases
const getTimezones = (): Array<{ value: string; label: string }> => {
  // Mapping of deprecated timezone aliases to their canonical names
  const deprecatedToCanonical: Record<string, string> = {
    'Asia/Calcutta': 'Asia/Kolkata',      
    'America/Godthab': 'America/Nuuk',    
    'Europe/Kiev': 'Europe/Kyiv',        
    'US/Alaska': 'America/Anchorage',     
    'US/Aleutian': 'America/Adak',
    'US/Arizona': 'America/Phoenix',
    'US/Central': 'America/Chicago',
    'US/East-Indiana': 'America/Indiana/Indianapolis',
    'US/Eastern': 'America/New_York',
    'US/Hawaii': 'Pacific/Honolulu',
    'US/Indiana-Starke': 'America/Indiana/Knox',
    'US/Michigan': 'America/Detroit',
    'US/Mountain': 'America/Denver',
    'US/Pacific': 'America/Los_Angeles',
    'US/Pacific-New': 'America/Los_Angeles',
    'US/Samoa': 'Pacific/Pago_Pago',
    'Canada/Atlantic': 'America/Halifax',
    'Canada/Central': 'America/Winnipeg',
    'Canada/Eastern': 'America/Toronto',
    'Canada/Mountain': 'America/Edmonton',
    'Canada/Newfoundland': 'America/St_Johns',
    'Canada/Pacific': 'America/Vancouver',
    'Canada/Saskatchewan': 'America/Regina',
    'Canada/Yukon': 'America/Whitehorse',
    'Mexico/BajaNorte': 'America/Tijuana',
    'Mexico/BajaSur': 'America/Mazatlan',
    'Mexico/General': 'America/Mexico_City',
    'Brazil/Acre': 'America/Rio_Branco',
    'Brazil/DeNoronha': 'America/Noronha',
    'Brazil/East': 'America/Sao_Paulo',
    'Brazil/West': 'America/Manaus',
    'Egypt': 'Africa/Cairo',
    'Libya': 'Africa/Tripoli',
    'Poland': 'Europe/Warsaw',
    'Portugal': 'Europe/Lisbon',
    'Turkey': 'Europe/Istanbul',
    'GMT': 'UTC',
    'GMT+0': 'UTC',
    'GMT-0': 'UTC',
    'GMT0': 'UTC',
    'Greenwich': 'UTC',
    'Universal': 'UTC',
    'Zulu': 'UTC',
  };

  try {
    // Use native Intl API if available (modern browsers)
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      const timezones = Intl.supportedValuesOf('timeZone');

      // Convert deprecated timezones to canonical names
      const canonicalTimezones = timezones.map(tz => deprecatedToCanonical[tz] || tz);

      // Create a Set to remove duplicates and ensure uniqueness
      const uniqueTimezonesSet = new Set(canonicalTimezones);

      // CRITICAL: Always ensure Asia/Kolkata is included (important for Indian users)
      // This handles cases where the browser might not include it or it might be filtered out
      uniqueTimezonesSet.add('Asia/Kolkata');

      // Convert Set to sorted array
      const uniqueTimezones = Array.from(uniqueTimezonesSet).sort();

      return uniqueTimezones.map(tz => ({ value: tz, label: tz }));
    }
  } catch (e) {
    // empty
  }

  // Fallback: Comprehensive list of IANA timezones (canonical names only, no deprecated aliases)
  // This ensures compatibility with older browsers
  // Note: Only latest/canonical timezone names are included
  const commonTimezones = [
    'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Asmara',
    'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Blantyre',
    'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta',
    'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
    'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
    'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
    'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
    'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
    'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey',
    'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 'Africa/Sao_Tome', 'Africa/Tripoli',
    'Africa/Tunis', 'Africa/Windhoek',
    'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua', 'America/Araguaina',
    'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
    'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
    'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
    'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
    'America/Aruba', 'America/Asuncion', 'America/Atikokan', 'America/Bahia', 'America/Bahia_Banderas',
    'America/Barbados', 'America/Belem', 'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista',
    'America/Bogota', 'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
    'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago', 'America/Chihuahua',
    'America/Costa_Rica', 'America/Creston', 'America/Cuiaba', 'America/Curacao', 'America/Danmarkshavn',
    'America/Dawson', 'America/Dawson_Creek', 'America/Denver', 'America/Detroit', 'America/Dominica',
    'America/Edmonton', 'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
    'America/Glace_Bay', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada',
    'America/Guadeloupe', 'America/Guatemala', 'America/Guayaquil', 'America/Guyana', 'America/Halifax',
    'America/Havana', 'America/Hermosillo', 'America/Indiana/Indianapolis', 'America/Indiana/Knox',
    'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Tell_City',
    'America/Indiana/Vevay', 'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Inuvik',
    'America/Iqaluit', 'America/Jamaica', 'America/Juneau', 'America/Kentucky/Louisville',
    'America/Kentucky/Monticello', 'America/Kralendijk', 'America/La_Paz', 'America/Lima',
    'America/Los_Angeles', 'America/Lower_Princes', 'America/Maceio', 'America/Managua', 'America/Manaus',
    'America/Marigot', 'America/Martinique', 'America/Matamoros', 'America/Mazatlan', 'America/Menominee',
    'America/Merida', 'America/Metlakatla', 'America/Mexico_City', 'America/Miquelon', 'America/Moncton',
    'America/Monterrey', 'America/Montevideo', 'America/Montserrat', 'America/Nassau', 'America/New_York',
    'America/Nipigon', 'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah',
    'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/Nuuk', 'America/Ojinaga',
    'America/Panama', 'America/Pangnirtung', 'America/Paramaribo', 'America/Phoenix', 'America/Port-au-Prince',
    'America/Port_of_Spain', 'America/Porto_Velho', 'America/Puerto_Rico', 'America/Punta_Arenas',
    'America/Rainy_River', 'America/Rankin_Inlet', 'America/Recife', 'America/Regina', 'America/Resolute',
    'America/Rio_Branco', 'America/Santarem', 'America/Santiago', 'America/Santo_Domingo', 'America/Sao_Paulo',
    'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy', 'America/St_Johns', 'America/St_Kitts',
    'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent', 'America/Swift_Current', 'America/Tegucigalpa',
    'America/Thule', 'America/Thunder_Bay', 'America/Tijuana', 'America/Toronto', 'America/Tortola',
    'America/Vancouver', 'America/Whitehorse', 'America/Winnipeg', 'America/Yakutat', 'America/Yellowknife',
    'Antarctica/Casey', 'Antarctica/Davis', 'Antarctica/DumontDUrville', 'Antarctica/Macquarie',
    'Antarctica/Mawson', 'Antarctica/McMurdo', 'Antarctica/Palmer', 'Antarctica/Rothera',
    'Antarctica/Syowa', 'Antarctica/Troll', 'Antarctica/Vostok',
    'Arctic/Longyearbyen',
    'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau', 'Asia/Aqtobe', 'Asia/Ashgabat',
    'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut',
    'Asia/Bishkek', 'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus',
    'Asia/Dhaka', 'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta', 'Asia/Gaza', 'Asia/Hebron',
    'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Hovd', 'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura',
    'Asia/Jerusalem', 'Asia/Kabul', 'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Khandyga',
    'Asia/Kolkata', 'Asia/Krasnoyarsk', 'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau',
    'Asia/Magadan', 'Asia/Makassar', 'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia', 'Asia/Novokuznetsk',
    'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh', 'Asia/Pontianak', 'Asia/Pyongyang',
    'Asia/Qatar', 'Asia/Qostanay', 'Asia/Qyzylorda', 'Asia/Riyadh', 'Asia/Sakhalin', 'Asia/Samarkand',
    'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent',
    'Asia/Tbilisi', 'Asia/Tehran', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar',
    'Asia/Urumqi', 'Asia/Ust-Nera', 'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Yangon',
    'Asia/Yekaterinburg', 'Asia/Yerevan',
    'Atlantic/Azores', 'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Cape_Verde', 'Atlantic/Faroe',
    'Atlantic/Madeira', 'Atlantic/Reykjavik', 'Atlantic/South_Georgia', 'Atlantic/St_Helena', 'Atlantic/Stanley',
    'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Darwin', 'Australia/Eucla',
    'Australia/Hobart', 'Australia/Lindeman', 'Australia/Lord_Howe', 'Australia/Melbourne', 'Australia/Perth',
    'Australia/Sydney',
    'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens', 'Europe/Belgrade',
    'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest',
    'Europe/Busingen', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar',
    'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey',
    'Europe/Kaliningrad', 'Europe/Kirov', 'Europe/Kyiv', 'Europe/Lisbon', 'Europe/London', 'Europe/Luxembourg',
    'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn', 'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow',
    'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica', 'Europe/Prague', 'Europe/Riga', 'Europe/Rome',
    'Europe/Samara', 'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Saratov', 'Europe/Simferopol',
    'Europe/Skopje', 'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane', 'Europe/Ulyanovsk',
    'Europe/Uzhgorod', 'Europe/Vaduz', 'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Volgograd',
    'Europe/Warsaw', 'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich',
    'Indian/Antananarivo', 'Indian/Chagos', 'Indian/Christmas', 'Indian/Cocos', 'Indian/Comoro',
    'Indian/Kerguelen', 'Indian/Mahe', 'Indian/Maldives', 'Indian/Mauritius', 'Indian/Mayotte',
    'Indian/Reunion',
    'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham', 'Pacific/Chuuk',
    'Pacific/Easter', 'Pacific/Efate', 'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti',
    'Pacific/Galapagos', 'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu',
    'Pacific/Kiritimati', 'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro', 'Pacific/Marquesas',
    'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue', 'Pacific/Norfolk', 'Pacific/Noumea',
    'Pacific/Pago_Pago', 'Pacific/Palau', 'Pacific/Pitcairn', 'Pacific/Pohnpei', 'Pacific/Port_Moresby',
    'Pacific/Rarotonga', 'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa', 'Pacific/Tongatapu',
    'Pacific/Wake', 'Pacific/Wallis',
    'UTC'
  ];

  // Remove duplicates using Set (ensures uniqueness)
  // Note: The hardcoded list already contains only canonical names, no deprecated aliases
  const uniqueTimezonesSet = new Set(commonTimezones);

  // CRITICAL: Always ensure Asia/Kolkata is included (important for Indian users)
  uniqueTimezonesSet.add('Asia/Kolkata');

  // Convert Set to sorted array
  const uniqueTimezones = Array.from(uniqueTimezonesSet).sort();

  return uniqueTimezones.map(tz => ({ value: tz, label: tz }));
};

// Removed local Department and Holiday interfaces in favor of domain types

// Types declaration
// CompanyLeaveSetting imported from types/auth

interface DocumentTypeLocal {
  id: string;
  name: string;
  required: boolean;
}

export function SettingsPage() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isIndividual } = useAccountType();
  
  // Redirect individual accounts to profile page (matching reference implementation)
  useEffect(() => {
    if (isIndividual) {
      router.replace('/dashboard/profile');
      return;
    }
  }, [isIndividual, router]);
  
  const [activeTab, setActiveTab] = useState<'company' | 'leaves' | 'working-hours' | 'integrations' | 'notifications' | 'security' | 'access-management'>('company');

  // Sync state with URL on mount and param change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['company', 'leaves', 'working-hours', 'integrations', 'notifications', 'security', 'access-management'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as 'company' | 'leaves' | 'working-hours' | 'integrations' | 'notifications' | 'security' | 'access-management');
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);
  const [isEditing, setIsEditing] = useState(false);

  // State for new tabs
  const [bankDetails, setBankDetails] = useState({ accountName: '', bankName: '', accountNumber: '', ifscCode: '' });
  const [notifications, setNotifications] = useState({ email: true, push: false, reports: true });
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactor: false });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const updateCompanyMutation = useUpdateCompany();
  const { data: companyData } = useCurrentUserCompany();
  const { data: userDetails } = useUserDetails();

  const isAdmin = useMemo(() => {
    const userData = userDetails?.result || {};
    return getRoleFromUser(userData) === 'Admin';
  }, [userDetails]);

  // Get timezones list (memoized to avoid regenerating on every render)
  const timezones = useMemo(() => getTimezones(), []);

  // Company Details State - initialize from backend data
  const [companyName, setCompanyName] = useState(companyData?.result?.name || '');
  const [companyLogo, setCompanyLogo] = useState(companyData?.result?.logo || '');
  const [taxId, setTaxId] = useState(companyData?.result?.tax_id || '');
  const [timeZone, setTimeZone] = useState(companyData?.result?.timezone || 'Asia/Kolkata');
  const [currency, setCurrency] = useState(companyData?.result?.currency || 'USD');
  const [country, setCountry] = useState(companyData?.result?.country || '');
  const [address, setAddress] = useState(companyData?.result?.address || '');
  const [defaultEmployeePassword, setDefaultEmployeePassword] = useState(companyData?.result?.default_employee_password || 'Pass@123');

  // Update state when company data loads
  useEffect(() => {
    if (companyData?.result) {
      setCompanyName(companyData.result.name || '');
      setCompanyLogo(companyData.result.logo || '');
      setTaxId(companyData.result.tax_id || '');
      setTimeZone(companyData.result.timezone || 'Asia/Kolkata');
      setCurrency(companyData.result.currency || 'USD');
      setCountry(companyData.result.country || '');
      setAddress(companyData.result.address || '');
      setDefaultEmployeePassword(companyData.result.default_employee_password || 'Pass@123');
      
      if (companyData.result.leaves) {
        setLeaves(companyData.result.leaves);
      }
      
      if (companyData.result.working_hours) {
        setWorkStartTime(companyData.result.working_hours.start_time || '09:00');
        setWorkEndTime(companyData.result.working_hours.end_time || '18:00');
        setWorkingDays(companyData.result.working_hours.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        setBreakTime(companyData.result.working_hours.break_time || '60');
      }
    }
  }, [companyData]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Design', active: true },
    { id: '2', name: 'Development', active: true },
    { id: '3', name: 'SEO', active: true },
  ]);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const { documentTypes: requiredDocuments, updateDocumentTypes: setRequiredDocuments } = useDocumentSettings();
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  // Persist done via hook


  // Leaves State
  const [leaves, setLeaves] = useState<CompanyLeaveSetting[]>([
    { id: '1', name: 'Sick Leave', count: 10 },
    { id: '2', name: 'Casual Leave', count: 5 }
  ]);

  // Holidays - Fetch from API
  const { data: holidaysData, isLoading: isLoadingHolidays } = usePublicHolidays();
  const createHolidayMutation = useCreateHoliday();
  const updateHolidayMutation = useUpdateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  // Holiday modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: null as dayjs.Dayjs | null });

  // Get holidays from API, filter out deleted ones
  const publicHolidays = useMemo((): Holiday[] => {
    if (!holidaysData?.result) return [];
    return holidaysData.result
      .filter((h: Holiday) => !h.is_deleted)
      .map((h: Holiday) => ({
        id: h.id,
        name: h.name,
        date: h.date,
        is_api: h.is_api
      }));
  }, [holidaysData]);

  // Working Hours State
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [breakTime, setBreakTime] = useState('60');

  // Role Management State
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormColor, setRoleFormColor] = useState('#BBBBBB');
  const [editingRole, setEditingRole] = useState<{ id?: number; name: string; color?: string } | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());

  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();
  const { data: rolePermissions, isLoading: isLoadingPermissions } = useRolePermissions(selectedRoleId);
  const upsertRoleMutation = useUpsertRole();
  const updatePermissionsMutation = useUpdateRolePermissions();

  useEffect(() => {
    if (rolePermissions?.result) {
      const initial = new Set<number>();
      rolePermissions.result.forEach((mod) => {
        mod.actions.forEach((act) => {
          if (act.assigned) {
            initial.add(act.id);
          }
        });
      });
      setSelectedPermissionIds(initial);
    }
  }, [rolePermissions]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Handlers
  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, { id: Date.now().toString(), name: newDeptName, active: true }]);
    setNewDeptName('');
    setIsAddingDept(false);
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
  };

  const toggleDepartmentStatus = (id: string) => {
    setDepartments(departments.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    setRequiredDocuments([...requiredDocuments, { id: Date.now().toString(), name: newDocName, required: true }]);
    setNewDocName('');
    setIsAddingDoc(false);
  };

  const handleDeleteDocument = (id: string) => {
    setRequiredDocuments(requiredDocuments.filter(d => d.id !== id));
  };

  const toggleDocumentRequired = (id: string) => {
    setRequiredDocuments(requiredDocuments.map(d => d.id === id ? { ...d, required: !d.required } : d));
  };

  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Holiday Handlers
  const handleAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({ name: '', date: null });
    setIsHolidayModalOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      date: dayjs(holiday.date)
    });
    setIsHolidayModalOpen(true);
  };

  const handleDeleteHoliday = (id: number | string) => {
    Modal.confirm({
      title: 'Delete Holiday',
      content: 'Are you sure you want to delete this holiday?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteHolidayMutation.mutate(Number(id));
      }
    });
  };

  const handleSaveHoliday = () => {
    if (!holidayForm.name.trim()) {
      message.error('Holiday name is required');
      return;
    }
    if (!holidayForm.date) {
      message.error('Holiday date is required');
      return;
    }

    const payload = {
      name: holidayForm.name.trim(),
      date: holidayForm.date.format('YYYY-MM-DD')
    };

    if (editingHoliday) {
      updateHolidayMutation.mutate(
        { id: Number(editingHoliday.id), payload },
        {
          onSuccess: () => {
            setIsHolidayModalOpen(false);
            setEditingHoliday(null);
            setHolidayForm({ name: '', date: null });
          }
        }
      );
    } else {
      createHolidayMutation.mutate(payload, {
        onSuccess: () => {
          setIsHolidayModalOpen(false);
          setHolidayForm({ name: '', date: null });
        }
      });
    }
  };

  const handleSaveRole = () => {
    if (!roleFormName.trim()) {
      message.error('Role name is required');
      return;
    }

    const payload = {
      id: editingRole?.id,
      name: roleFormName.trim(),
      color: roleFormColor,
    };

    upsertRoleMutation.mutate(payload, {
      onSuccess: () => {
        message.success(`Role ${editingRole ? 'updated' : 'added'} successfully`);
        setIsRoleModalOpen(false);
        setRoleFormName('');
        setRoleFormColor('#BBBBBB');
        setEditingRole(null);
      },
      onError: (error: unknown) => {
        message.error(getErrorMessage(error, `Failed to ${editingRole ? 'update' : 'add'} role`));
      },
    });
  };

  const handleUpdateLeaveCount = (id: string, count: string) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, count: parseInt(count) || 0 } : l));
  };

  const handleSaveChanges = async () => {
    try {
      // Prepare company update payload based on active tab
      const payload: Record<string, unknown> = {};

      if (activeTab === 'company') {
        payload.name = companyName;
        payload.logo = companyLogo;
        payload.tax_id = taxId;
        payload.timezone = timeZone;
        payload.currency = currency;
        payload.country = country;
        payload.address = address;
      }

      if (activeTab === 'security' && isAdmin) {
        payload.default_employee_password = defaultEmployeePassword;
      }
      if (activeTab === 'leaves') {
        payload.leaves = leaves;
      }

      if (activeTab === 'working-hours') {
        payload.working_hours = {
          start_time: workStartTime,
          end_time: workEndTime,
          working_days: workingDays,
          break_time: breakTime
        };
      }

      await updateCompanyMutation.mutateAsync(payload as unknown as CompanyUpdateInput);
      message.success('Settings saved successfully!');
      setIsEditing(false);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to update settings");
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

  // Determine if the user is an employee (not Admin/Owner)
  const permissions = userDetails?.result?.permissions?.['Settings'] || {};
  
  const canViewCompany = isAdmin || permissions['VIEW_COMPANY_DETAILS'];
  const canEditCompany = isAdmin || permissions['EDIT_COMPANY_DETAILS'];
  const canViewNotifications = isAdmin || permissions['VIEW_NOTIFICATIONS'];
  const canViewSecurity = isAdmin || permissions['VIEW_SECURITY'];
  const canEditSecurity = isAdmin || permissions['EDIT_SECURITY'];
  const canViewLeaves = isAdmin || permissions['VIEW_LEAVES'];
  const canEditLeaves = isAdmin || permissions['EDIT_LEAVES'];
  const canViewWorkingHours = isAdmin || permissions['VIEW_WORKING_HOURS'];
  const canEditWorkingHours = isAdmin || permissions['EDIT_WORKING_HOURS'];
  const canViewAccessManagement = isAdmin || permissions['VIEW_ACCESS_MANAGEMENT'];
  const canEditAccessManagement = isAdmin || permissions['EDIT_ACCESS_MANAGEMENT'];
  const canViewIntegrations = isAdmin || permissions['VIEW_INTEGRATIONS'];
  const canEditIntegrations = isAdmin || permissions['EDIT_INTEGRATIONS'];

  /* Helper to determine tab visibility */
  const showTab = (tabId: string) => {
    if (isIndividual) {
      // Individual User Tabs
      return ['company', 'financials', 'notifications', 'security', 'integrations'].includes(tabId);
    }
    
    // Organization User Tabs (Permission Check)
    switch(tabId) {
      case 'company': return isAdmin || canViewCompany;
      case 'leaves': return isAdmin || canViewLeaves;
      case 'working-hours': return isAdmin || canViewWorkingHours;
      case 'integrations': return isAdmin || canViewIntegrations;
      case 'notifications': return isAdmin || canViewNotifications;
      case 'security': return isAdmin || canViewSecurity;
      case 'access-management': return isAdmin || canViewAccessManagement;
      case 'financials': return isAdmin; 
      default: return true;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[24px] border border-[#EEEEEE] p-8 flex flex-col overflow-hidden relative font-['Manrope',sans-serif]">
      {/* Header Section */}
      <div className="flex-none mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
            {isIndividual ? 'Settings' : 'Company Settings'}
          </h1>
          {/* Only show Edit button if user has edit permission */}
          {(activeTab === 'company' && canEditCompany) || (activeTab === 'security' && canEditSecurity) ? (
            !isEditing ? (
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
                  loading={updateCompanyMutation.isPending}
                  className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white font-['Manrope:SemiBold',sans-serif] px-8 h-10 rounded-full shadow-lg shadow-[#ff3b3b]/20 text-[13px] border-none"
                >
                  Save Changes
                </Button>
              </div>
            )
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#EEEEEE] overflow-x-auto">
            {showTab('company') && (
              <button
                onClick={() => handleTabChange('company')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'company' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                {isIndividual ? 'Details' : 'Company Details'}
                {activeTab === 'company' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}

            {showTab('notifications') && (
              <button
                onClick={() => handleTabChange('notifications')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                Notifications
                {activeTab === 'notifications' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}
            
            {showTab('security') && (
              <button
                onClick={() => handleTabChange('security')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'security' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                Security
                {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}

            {showTab('leaves') && (
              <button
                onClick={() => handleTabChange('leaves')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'leaves' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                Leaves
                {activeTab === 'leaves' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}
            
            {showTab('working-hours') && (
              <button
                onClick={() => handleTabChange('working-hours')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'working-hours' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                Working Hours
                {activeTab === 'working-hours' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}
            
            {showTab('access-management') && (
              <button
                onClick={() => handleTabChange('access-management')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'access-management' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                Access Management
                {activeTab === 'access-management' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}
            
            {showTab('integrations') && (
              <button
                onClick={() => handleTabChange('integrations')}
                className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors whitespace-nowrap ${activeTab === 'integrations' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
                  }`}
              >
                Integrations
                {activeTab === 'integrations' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
              </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">

        {/* Company Details Tab */}
        {activeTab === 'company' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="mb-10">
              <div className="flex flex-col md:flex-row gap-10">
                {/* Left Column: Header & Logo */}
                <div className="flex-none w-48 flex flex-col justify-between">
                  <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Company Information</h2>
                  
                  <div className="relative group self-start">
                    <div className="w-32 h-32 rounded-full border border-[#EEEEEE] bg-[#FAFAFA] flex items-center justify-center overflow-hidden">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-[#999999]" />
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute -bottom-1 -right-1">
                        <Upload
                          name="logo"
                          showUploadList={false}
                          customRequest={async ({ file, onSuccess, onError }) => {
                            try {
                              message.loading({ content: 'Uploading logo...', key: 'logo-upload' });
                              const fileObj = file as File;
                              
                              if (!companyData?.result?.id) {
                                throw new Error('Company ID not found');
                              }

                              const result = await fileService.uploadFile(
                                fileObj,
                                'COMPANY_LOGO', 
                                companyData.result.id
                              );
                              
                              // Update local state with the download URL (presigned)
                              // Note: For long-term persistence, we might need to handle expiration or use public URLs
                              if (result.download_url) {
                                setCompanyLogo(result.download_url);
                                onSuccess?.(result);
                                message.success({ content: 'Logo uploaded successfully!', key: 'logo-upload' });
                              } else {
                                throw new Error('No download URL returned');
                              }
                            } catch (error) {
                              console.error('Logo upload error:', error);
                              onError?.(error as Error);
                              message.error({ content: 'Failed to upload logo', key: 'logo-upload' });
                            }
                          }}
                          beforeUpload={(file) => {
                            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                            if (!isJpgOrPng) {
                              message.error('You can only upload JPG/PNG file!');
                              return Upload.LIST_IGNORE;
                            }
                            const isLt2M = file.size / 1024 / 1024 < 2;
                            if (!isLt2M) {
                              message.error('Image must smaller than 2MB!');
                              return Upload.LIST_IGNORE;
                            }
                            return true;
                          }}
                        >
                          <Button 
                            icon={<Pencil className="w-3.5 h-3.5" />} 
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#111111] text-white border-white border-2 hover:bg-black hover:text-white p-0 shadow-sm"
                          />
                        </Upload>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Inputs */}
                <div className="flex-1 w-full space-y-6">
                  {/* Row 1: Name & Tax ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Company Name</span>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={!isEditing}
                        className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Country</span>
                      <Select
                        value={country || undefined}
                        onChange={(v) => setCountry(String(v))}
                        disabled={!isEditing}
                        className="w-full h-11"
                        showSearch={{
                          filterOption: (input, option) => {
                            const searchText = input.toLowerCase().trim();
                            const label = String(option?.children ?? '').toLowerCase();
                            return label.includes(searchText);
                          }
                        }}
                        placeholder="Select country"
                        optionFilterProp="label"
                      >
                        {commonCountries.map((c) => (
                          <Option key={c.code} value={c.name} label={c.name}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: TimeZone & Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Time Zone</span>
                      <Select
                        value={timeZone}
                        onChange={(v) => setTimeZone(String(v))}
                        disabled={!isEditing}
                        className="w-full h-11"
                        showSearch={{
                          filterOption: (input, option) => {
                            const searchText = input.toLowerCase().trim();
                            if (!searchText) return true;
                            const label = String(option?.label ?? option?.children ?? '').toLowerCase();
                            const value = String(option?.value ?? '').toLowerCase();
                            if (label.includes(searchText) || value.includes(searchText)) return true;
                            if (label.includes('kolkata')) {
                              if (['kol', 'cal', 'calcutta', 'india', 'ist'].some(term => searchText.includes(term))) {
                                return true;
                              }
                            }
                            return false;
                          }
                        }}
                        placeholder="Select timezone"
                        optionFilterProp="label"
                        notFoundContent="No timezone found"
                        popupMatchSelectWidth={true}
                        virtual={false}
                        listHeight={400}
                      >
                        {timezones.map((tz) => (
                          <Option key={tz.value} value={tz.value} label={tz.label}>
                            {tz.label}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Currency</span>
                      <Select
                        value={currency}
                        onChange={(v) => setCurrency(String(v))}
                        disabled={!isEditing}
                        className="w-full h-11"
                      >
                        <Option value="USD">USD</Option>
                        <Option value="EUR">EUR</Option>
                        <Option value="INR">INR</Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Width: Address */}
              <div className="mb-6 relative mt-6">
                <div className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Address</span>
                  <TextArea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter company address"
                    disabled={!isEditing}
                    rows={3}
                    className={`rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Regular',sans-serif] text-[13px] resize-none p-3 ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                  />
                </div>
                {isEditing && (
                  <div className="absolute bottom-3 right-3 p-1.5 bg-[#F7F7F7] rounded-md border border-[#EEEEEE] pointer-events-none">
                    <span className="text-[14px]">📍</span>
                  </div>
                )}
              </div>

              {/* Full Width: Tax ID */}
              <div className="mb-6">
                <div className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Tax ID</span>
                  <Input
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Enter Tax ID"
                    disabled={!isEditing}
                    className={`h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px] ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                  />
                </div>
              </div>
            </section>

            {/* Departments & Required Documents - Only for Organizations */}
            {!isIndividual && (
              <>
                <Divider className="my-8 bg-[#EEEEEE]" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Departments Column */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                        Departments
                      </h2>
                      {!isAddingDept && canEditCompany && (
                        <button
                          onClick={() => setIsAddingDept(true)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Plus className="w-5 h-5 text-[#ff3b3b]" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-end gap-6 group">
                          <div className="space-y-2 flex-1">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                              Department Name
                            </span>
                            <Input
                              value={dept.name}
                              readOnly
                              className="h-11 rounded-lg border-[#EEEEEE] bg-[#FAFAFA] text-[#666666] font-['Manrope:Medium',sans-serif] text-[13px]"
                            />
                          </div>
                          <div className="flex items-center gap-4 pb-3 h-11">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] text-[#666666] font-['Manrope:Bold',sans-serif]">
                                Active
                              </span>
                                <Switch
                                  checked={dept.active}
                                  onChange={() => toggleDepartmentStatus(String(dept.id))}
                                  disabled={!canEditCompany}
                                  className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor: dept.active ? "#ff3b3b" : undefined,
                                  }}
                                />
                            </div>
                            {canEditCompany && (
                              <>
                                <button className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#666666] hover:text-[#111111]">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDepartment(String(dept.id))}
                                  className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#ff3b3b]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {isAddingDept && (
                        <div className="flex items-end gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-2 flex-1">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                              New Department Name
                            </span>
                            <Input
                              value={newDeptName}
                              onChange={(e) => setNewDeptName(e.target.value)}
                              placeholder="e.g. Marketing"
                              autoFocus
                              className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                              onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
                            />
                          </div>
                          <div className="flex items-center gap-2 pb-1 h-11">
                            <Button
                              onClick={handleAddDepartment}
                              className="h-9 px-4 bg-[#111111] hover:bg-[#000000]/90 text-white text-[12px] font-['Manrope:SemiBold',sans-serif] rounded-full border-none"
                            >
                              Add
                            </Button>
                            <Button
                              type="text"
                              onClick={() => setIsAddingDept(false)}
                              className="h-9 px-4 text-[#666666] hover:text-[#111111] text-[12px] font-['Manrope:SemiBold',sans-serif] hover:bg-[#F7F7F7] rounded-full"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Required Documents Column */}
                  <section className="lg:border-l lg:border-[#EEEEEE] lg:pl-12">
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                        Required Documents
                      </h2>
                      {!isAddingDoc && canEditCompany && (
                        <button
                          onClick={() => setIsAddingDoc(true)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Plus className="w-5 h-5 text-[#ff3b3b]" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {requiredDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-end gap-6 group">
                          <div className="space-y-2 flex-1">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                              Document Name
                            </span>
                            <Input
                              value={doc.name}
                              readOnly
                              className="h-11 rounded-lg border-[#EEEEEE] bg-[#FAFAFA] text-[#666666] font-['Manrope:Medium',sans-serif] text-[13px]"
                            />
                          </div>
                          <div className="flex items-center gap-4 pb-3 h-11">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] text-[#666666] font-['Manrope:Bold',sans-serif]">
                                Required
                              </span>
                              <Switch
                                checked={doc.required}
                                onChange={() => toggleDocumentRequired(doc.id)}
                                disabled={!canEditCompany}
                                className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: doc.required ? "#ff3b3b" : undefined,
                                }}
                              />
                            </div>
                            {canEditCompany && (
                              <>
                                <button className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#666666] hover:text-[#111111]">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#ff3b3b]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {isAddingDoc && (
                        <div className="flex items-end gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-2 flex-1">
                            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                              New Document Name
                            </span>
                            <Input
                              value={newDocName}
                              onChange={(e) => setNewDocName(e.target.value)}
                              placeholder="e.g. Passport"
                              autoFocus
                              className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                              onKeyDown={(e) => e.key === "Enter" && handleAddDocument()}
                            />
                          </div>
                          <div className="flex items-center gap-2 pb-1 h-11">
                            <Button
                              onClick={handleAddDocument}
                              className="h-9 px-4 bg-[#111111] hover:bg-[#000000]/90 text-white text-[12px] font-['Manrope:SemiBold',sans-serif] rounded-full border-none"
                            >
                              Add
                            </Button>
                            <Button
                              type="text"
                              onClick={() => setIsAddingDoc(false)}
                              className="h-9 px-4 text-[#666666] hover:text-[#111111] text-[12px] font-['Manrope:SemiBold',sans-serif] hover:bg-[#F7F7F7] rounded-full"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-2 gap-12">
            {/* Leaves Column */}
            <div className="space-y-6 sticky top-0 self-start">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Leaves</h2>
              </div>

              {leaves.map((leave) => (
                <div key={leave.id} className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{leave.name}</span>
                  <div className="flex items-center gap-3">
                    <Input
                      value={leave.count}
                      onChange={(e) => handleUpdateLeaveCount(String(leave.id), e.target.value)}
                      disabled={!canEditLeaves}
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                    />
                    <button className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-full transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-6">
                <div className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#666666]">Total Leaves</span>
                  <div className="h-11 px-3 flex items-center rounded-lg border border-[#EEEEEE] bg-[#F7F7F7] text-[#666666] font-['Manrope:Medium',sans-serif] text-[13px]">
                    {leaves.reduce((acc, curr) => acc + curr.count, 0)} days
                  </div>
                </div>
              </div>
            </div>

            {/* Public Holidays Column */}
            <div className="space-y-6 border-l border-[#EEEEEE] pl-12">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Public Holidays</h2>
                {canEditLeaves && (
                  <button
                    onClick={handleAddHoliday}
                  className="hover:scale-110 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5 text-[#ff3b3b]" />
                </button>
                )}
              </div>

              <div className="space-y-4">
                {isLoadingHolidays ? (
                  <div className="text-center py-4 text-[13px] text-[#999999]">Loading holidays...</div>
                ) : publicHolidays.length > 0 ? (
                  publicHolidays.map((holiday) => (
                    <div key={holiday.id} className="p-4 border border-[#EEEEEE] rounded-[12px] flex items-center justify-between bg-white hover:shadow-sm transition-shadow">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111]">{holiday.name}</p>
                          {holiday.is_api && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-['Manrope:Bold',sans-serif]">
                              Public
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#666666] font-['Manrope:Medium',sans-serif]">{new Date(holiday.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!holiday.is_api && (
                          <>
                            {canEditLeaves && (
                              <button
                                onClick={() => handleEditHoliday(holiday)}
                              className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-full transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            )}
                            {canEditLeaves && (
                              <button
                                onClick={() => handleDeleteHoliday(holiday.id)}
                                className="p-2 text-[#ff3b3b] hover:bg-[#FFF5F5] rounded-full transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {holiday.is_api && (
                           <button
                             className="p-2 text-[#999999] cursor-not-allowed opacity-50"
                             title="Public holidays cannot be edited"
                           >
                             <Lock className="w-4 h-4" />
                           </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-[13px] text-[#999999]">No holidays added yet</div>
                )}
              </div>

              {/* Pagination placeholder */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#999999] hover:bg-[#F7F7F7] disabled:opacity-50" disabled>
                  &lt;
                </button>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ff3b3b] text-[#ff3b3b] font-bold text-[13px]">
                  1
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#999999] hover:bg-[#F7F7F7]">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours Tab */}
        {activeTab === 'working-hours' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
            <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">Working Hours</h2>

            <div className="space-y-8">
              {/* Working Days */}
              <div className="space-y-3">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Working Days</span>
                <div className="min-h-[48px] p-2 rounded-lg border border-[#EEEEEE] flex flex-wrap gap-2">
                  {workingDays.map(day => (
                    <div key={day} className="h-8 px-3 bg-[#F0F0F0] rounded-md flex items-center gap-2 text-[13px] font-['Manrope:Medium',sans-serif] text-[#111111]">
                      {day}
                      {canEditWorkingHours && (
                        <button onClick={() => toggleWorkingDay(day)} className="hover:text-[#ff3b3b]">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {canEditWorkingHours && (
                    <div className="relative group">
                      <button className="h-8 w-8 flex items-center justify-center hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 text-[#ff3b3b]" />
                      </button>
                    <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-40 bg-white border border-[#EEEEEE] shadow-lg rounded-lg p-1 z-10">
                      {daysOfWeek.filter(d => !workingDays.includes(d)).map(day => (
                        <button
                          key={day}
                          onClick={() => toggleWorkingDay(day)}
                          className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F7F7F7] rounded-md"
                        >
                          {day}
                        </button>
                      ))}
                      {daysOfWeek.filter(d => !workingDays.includes(d)).length === 0 && (
                        <div className="px-3 py-2 text-[12px] text-[#999999]">All days selected</div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="space-y-3">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Working Hours</span>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      disabled={!canEditWorkingHours}
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                    />
                  </div>
                  <span className="text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">to</span>
                  <div className="relative flex-1">
                    <Input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      disabled={!canEditWorkingHours}
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                    />
                  </div>
                </div>
              </div>

              {/* Break Time */}
              <div className="space-y-3">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Break Time (in minutes)</span>
                <Input
                  type="number"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                  disabled={!canEditWorkingHours}
                  className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab Placeholder */}
        {activeTab === 'integrations' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-[#999999]" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Integrations</h3>
              <button className="hover:scale-110 active:scale-95 transition-transform">
                <Plus className="w-5 h-5 text-[#ff3b3b]" />
              </button>
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] max-w-sm">
              Connect your favorite tools and services to streamline your workflow.
            </p>
          </div>
        )}

        {/* Access Management Tab */}
        {activeTab === 'access-management' && (
          <div className="bg-white rounded-[24px] p-8 border border-[#EEEEEE] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-[18px] font-['Manrope:Bold',sans-serif] text-[#111111]">Access Management</h2>
                <p className="text-[13px] text-[#666666] mt-1 font-['Manrope:Regular',sans-serif]">
                  Manage roles and define specific permissions for your team.
                </p>
              </div>
              {canEditAccessManagement && (
                <Button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleFormName('');
                    setIsRoleModalOpen(true);
                  }}
                  className="bg-[#111111] hover:bg-[#000000]/90 text-white font-['Manrope:SemiBold',sans-serif] px-6 h-11 rounded-full text-[13px] flex items-center gap-2 border-none transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Role
                </Button>
              )}
            </div>

            <div className="flex gap-8 h-[calc(100vh-500px)] min-h-[500px]">
              {/* Roles List - Sticky */}
              <div className="w-1/3 flex flex-col">
                <div className="flex items-center h-10 mb-2 px-1">
                  <span className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider">
                    Roles
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-1">
                    {rolesData?.result
                      ?.filter((role: Role) => role.name !== 'Super Admin')
                      ?.sort((a: Role, b: Role) => {
                        const order = ['Admin', 'Head', 'Finance', 'HR', 'Manager', 'Employee'];
                        const aIdx = order.indexOf(a.name);
                        const bIdx = order.indexOf(b.name);
                        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                        if (aIdx !== -1) return -1;
                        if (bIdx !== -1) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      ?.map((role: Role) => (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedRoleId === role.id
                            ? 'bg-[#111111] text-white shadow-lg'
                            : 'hover:bg-[#F7F7F7] text-[#111111]'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Lock className={`w-4 h-4 ${selectedRoleId === role.id ? 'text-white/70' : 'text-[#666666]'}`} />
                            <span className="text-[14px] font-['Manrope:Medium',sans-serif]">{role.name}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEditAccessManagement && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRole(role);
                                  setRoleFormName(role.name);
                                  setRoleFormColor(role.color || '#BBBBBB');
                                  setIsRoleModalOpen(true);
                                }}
                                className={`p-1.5 rounded-md hover:bg-white/20 ${selectedRoleId === role.id ? 'text-white' : 'text-[#666666]'}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    {isLoadingRoles && (
                      <div className="py-8 text-center text-[#999999] text-[13px]">Loading roles...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Permissions Editor - Scrollable */}
              <div className="w-2/3 flex flex-col">
                {selectedRoleId ? (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between h-10 mb-2 px-1">
                      <span className="text-[12px] font-['Manrope:Bold',sans-serif] text-[#999999] uppercase tracking-wider">
                        Permissions for {rolesData?.result?.find((r: Role) => r.id === selectedRoleId)?.name}
                      </span>
                      {canEditAccessManagement && (
                        <Button
                          onClick={() => {
                            updatePermissionsMutation.mutate({
                              roleId: selectedRoleId,
                              actions: Array.from(selectedPermissionIds),
                            });
                          }}
                          loading={updatePermissionsMutation.isPending}
                          className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white font-['Manrope:SemiBold',sans-serif] px-6 h-9 rounded-full text-[12px] border-none shadow-sm active:scale-95 transition-all"
                        >
                          Save Permissions
                        </Button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                      {isLoadingPermissions ? (
                        <div className="py-20 text-center text-[#999999] text-[13px]">
                          Loading permissions...
                        </div>
                      ) : (
                        <Collapse
                          ghost
                          accordion
                          expandIcon={({ isActive }) => (
                            <div className={`transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`}>
                              <ChevronRight className="w-4 h-4 text-[#666666]" />
                            </div>
                          )}
                          className="custom-permissions-collapse"
                          items={rolePermissions?.result?.map((mod) => {
                            const actionIds = mod.actions.map((a) => a.id);
                            const allChecked = actionIds.every((id) => selectedPermissionIds.has(id));
                            const indeterminate = actionIds.some((id) => selectedPermissionIds.has(id)) && !allChecked;

                            return {
                              key: mod.module,
                              header: (
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                                    {mod.module}
                                  </span>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      indeterminate={indeterminate}
                                      checked={allChecked}
                                      onChange={(e) => {
                                        const next = new Set(selectedPermissionIds);
                                        actionIds.forEach((id) => {
                                          if (e.target.checked) next.add(id);
                                          else next.delete(id);
                                        });
                                        setSelectedPermissionIds(next);
                                      }}
                                    />
                                  </div>
                                </div>
                              ),
                              label: (
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                                    {mod.module}
                                  </span>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      indeterminate={indeterminate}
                                      checked={allChecked}
                                      onChange={(e) => {
                                        const next = new Set(selectedPermissionIds);
                                        actionIds.forEach((id) => {
                                          if (e.target.checked) next.add(id);
                                          else next.delete(id);
                                        });
                                        setSelectedPermissionIds(next);
                                      }}
                                    />
                                  </div>
                                </div>
                              ),
                              children: (
                                <div className="grid grid-cols-2 gap-4 p-2">
                                  {mod.actions.map((act) => (
                                    <div
                                      key={act.id}
                                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                      onClick={() => {
                                        const next = new Set(selectedPermissionIds);
                                        if (next.has(act.id)) next.delete(act.id);
                                        else next.add(act.id);
                                        setSelectedPermissionIds(next);
                                      }}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedPermissionIds.has(act.id)
                                        ? 'bg-[#ff3b3b] border-[#ff3b3b]'
                                        : 'bg-white border-[#DDDDDD]'
                                        }`}>
                                        {selectedPermissionIds.has(act.id) && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                                      </div>
                                      <span className="text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">
                                        {act.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ),
                              className: "mb-2 bg-[#F9FAFB] rounded-xl border-none overflow-hidden"
                            };
                          })}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#F9FAFB] rounded-2xl border border-dashed border-[#EEEEEE]">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <Shield className="w-6 h-6 text-[#999999]" />
                    </div>
                    <h3 className="text-[15px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Select a role</h3>
                    <p className="text-[13px] text-[#666666] mt-1 max-w-[240px]">
                      Select a role from the left to view and manage its permissions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
            <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">Notification Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-[#EEEEEE] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F7F7F7] rounded-full"><Bell className="w-5 h-5 text-[#666666]" /></div>
                  <div>
                    <h3 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111]">Email Notifications</h3>
                    <p className="text-[12px] text-[#666666]">Receive updates about leaves, payload, and announcements.</p>
                  </div>
                </div>
                <Switch checked={notifications.email} onChange={(v) => setNotifications({ ...notifications, email: v })} />
              </div>
              <div className="flex items-center justify-between p-4 border border-[#EEEEEE] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F7F7F7] rounded-full"><Bell className="w-5 h-5 text-[#666666]" /></div>
                  <div>
                    <h3 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111]">Push Notifications</h3>
                    <p className="text-[12px] text-[#666666]">Receive real-time alerts on your device.</p>
                  </div>
                </div>
                <Switch checked={notifications.push} onChange={(v) => setNotifications({ ...notifications, push: v })} />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
            <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">Security Settings</h2>



            <Divider />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111]">Two-Factor Authentication</h3>
                <p className="text-[12px] text-[#666666]">Add an extra layer of security to your account.</p>
              </div>
              <Switch checked={security.twoFactor} onChange={(v) => setSecurity({ ...security, twoFactor: v })} />
            </div>

            {canEditSecurity && (
              <>
                <Divider />
                <div className="mt-8">
                  <h3 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4 flex items-center gap-2">
                    <People24Filled className="w-4 h-4 text-[#ff3b3b]" color="#ff3b3b" /> Default Employee Password
                  </h3>
                  <div className="max-w-md">
                    <p className="text-[12px] text-[#666666] mb-3">This password will be pre-filled when creating new employees.</p>
                    <Input
                      placeholder="Default Password"
                      value={defaultEmployeePassword}
                      onChange={(e) => setDefaultEmployeePassword(e.target.value)}
                      disabled={!isEditing}
                      className="h-11 rounded-lg"
                    />
                  </div>
                </div>
              </>
            )}

            <Divider className="my-8" />
            
            <div className="p-4 border border-[#ff3b3b]/20 bg-[#FFF5F5] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#ff3b3b]/10 rounded-full"><AlertTriangle className="w-5 h-5 text-[#ff3b3b]" /></div>
                <div>
                  <h3 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#ff3b3b]">Delete Account</h3>
                  <p className="text-[12px] text-[#ff3b3b]/80">Permanently delete your account and all data.</p>
                </div>
              </div>
              <Button danger type="primary">Delete Account</Button>
            </div>
          </div>
        )}

        {/* Data Tab */}

      </div>

      {/* Holiday Modal */}
      <Modal
        title={null}
        open={isHolidayModalOpen}
        onCancel={() => {
          setIsHolidayModalOpen(false);
          setEditingHoliday(null);
          setHolidayForm({ name: '', date: null });
        }}
        footer={null}
        width={500}
        centered
        className="rounded-[16px] overflow-hidden"
        closeIcon={<X className="w-5 h-5 text-[#666666]" />}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="flex flex-col bg-white">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
            <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">
              <div className="p-2 rounded-full bg-[#F7F7F7]">
                <Plus className="w-5 h-5 text-[#666666]" />
              </div>
              {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
              {editingHoliday ? 'Update holiday details' : 'Add a new public holiday for your company'}
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              {/* Holiday Name */}
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <span className="text-[#ff3b3b]">*</span> Holiday Name
                </span>
                <Input
                  placeholder="e.g., New Year, Christmas"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${holidayForm.name ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                />
              </div>

              {/* Holiday Date */}
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                  <span className="text-[#ff3b3b]">*</span> Date
                </span>
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select holiday date"
                  className={`w-full h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${holidayForm.date ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={holidayForm.date}
                  onChange={(date) => setHolidayForm({ ...holidayForm, date })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6">
                <Button
                  type="text"
                  onClick={() => {
                    setIsHolidayModalOpen(false);
                    setEditingHoliday(null);
                    setHolidayForm({ name: '', date: null });
                  }}
                  className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleSaveHoliday}
                  loading={createHolidayMutation.isPending || updateHolidayMutation.isPending}
                  className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
                >
                  {editingHoliday ? 'Update' : 'Add'} Holiday
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Role Management Modal */}
      <Modal
        title={null}
        open={isRoleModalOpen}
        onCancel={() => {
          setIsRoleModalOpen(false);
          setRoleFormName('');
          setEditingRole(null);
        }}
        footer={null}
        width={400}
        centered
        className="rounded-2xl overflow-hidden"
        closeIcon={null}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h3>
            <button
              onClick={() => {
                setIsRoleModalOpen(false);
                setRoleFormName('');
                setEditingRole(null);
              }}
              className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#666666]" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Role Name
              </span>
              <Input
                placeholder="e.g. Project Manager"
                value={roleFormName}
                onChange={(e) => setRoleFormName(e.target.value)}
                className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRole()}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                Badge Color
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['#BBBBBB', '#ff3b3b', '#2E90FA', '#12B76A', '#7F56D9', '#F79009', '#F04438', '#667085'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setRoleFormColor(color)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${roleFormColor === color ? 'border-[#111111] scale-110' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="text"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setRoleFormName('');
                  setEditingRole(null);
                }}
                className="h-10 px-6 font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#666666]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRole}
                loading={upsertRoleMutation.isPending}
                className="bg-[#111111] hover:bg-black text-white font-['Manrope:SemiBold',sans-serif] px-8 h-11 rounded-full text-[13px] border-none shadow-sm transition-all active:scale-95"
              >
                {editingRole ? 'Update' : 'Add'} Role
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}