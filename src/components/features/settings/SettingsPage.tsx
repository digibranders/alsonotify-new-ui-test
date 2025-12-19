import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Pencil } from 'lucide-react';
import { Button, Input, Select, Switch, Divider } from "antd";
import { message } from "antd";
import { useUpdateCompany, useCurrentUserCompany } from '@/hooks/useUser';
import { DEFAULT_DOCUMENT_TYPES, DOCUMENT_TYPES_STORAGE_KEY } from '@/constants/documentTypes';

const { TextArea } = Input;
const { Option } = Select;

// Get all IANA timezones without duplicates
// Only returns canonical (latest) timezone names, excluding deprecated aliases
const getTimezones = (): Array<{ value: string; label: string }> => {
  // Mapping of deprecated timezone aliases to their canonical names
  const deprecatedToCanonical: Record<string, string> = {
    'Asia/Calcutta': 'Asia/Kolkata',      // India - Calcutta deprecated, use Kolkata
    'America/Godthab': 'America/Nuuk',    // Greenland - Godthab deprecated, use Nuuk
    'Europe/Kiev': 'Europe/Kyiv',         // Ukraine - Kiev deprecated, use Kyiv
    'US/Alaska': 'America/Anchorage',     // US timezone aliases
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
    // Fallback if Intl.supportedValuesOf is not available
    console.warn('Intl.supportedValuesOf not available, using fallback timezone list');
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

interface Department {
  id: string;
  name: string;
  active: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

interface LeaveType {
  id: string;
  name: string;
  count: number;
}

interface DocumentTypeLocal {
  id: string;
  name: string;
  required: boolean;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'leaves' | 'working-hours' | 'integrations'>('company');
  const [isEditing, setIsEditing] = useState(false);
  const updateCompanyMutation = useUpdateCompany();
  const { data: companyData } = useCurrentUserCompany();
  
  // Get timezones list (memoized to avoid regenerating on every render)
  const timezones = useMemo(() => getTimezones(), []);

  // Company Details State - initialize from backend data
  const [companyName, setCompanyName] = useState(companyData?.result?.name || '');
  const [taxId, setTaxId] = useState(companyData?.result?.tax_id || '');
  const [timeZone, setTimeZone] = useState(companyData?.result?.timezone || 'Asia/Kolkata');
  const [currency, setCurrency] = useState(companyData?.result?.currency || 'USD');
  const [address, setAddress] = useState(companyData?.result?.address || '');
  
  // Update state when company data loads
  useEffect(() => {
    if (companyData?.result) {
      setCompanyName(companyData.result.name || '');
      setTaxId(companyData.result.tax_id || '');
      setTimeZone(companyData.result.timezone || 'Asia/Kolkata');
      setCurrency(companyData.result.currency || 'USD');
      setAddress(companyData.result.address || '');
    }
  }, [companyData]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Design', active: true },
    { id: '2', name: 'Development', active: true },
    { id: '3', name: 'SEO', active: true },
  ]);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Required Documents State - initialized from localStorage (saved settings) or defaults
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentTypeLocal[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(DOCUMENT_TYPES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((doc: any, index: number) => ({
              id: String(doc.id ?? index + 1),
              name: String(doc.name ?? ''),
              required: Boolean(doc.required),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error reading document types from localStorage:', error);
    }

    // Fallback to shared defaults
    return DEFAULT_DOCUMENT_TYPES;
  });
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  // Persist required documents configuration so Profile page can read it
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DOCUMENT_TYPES_STORAGE_KEY, JSON.stringify(requiredDocuments));
      }
    } catch (error) {
      console.error('Error saving document types to localStorage:', error);
    }
  }, [requiredDocuments]);

  // Leaves State
  const [leaves, setLeaves] = useState<LeaveType[]>([
    { id: '1', name: 'Sick Leave', count: 10 },
    { id: '2', name: 'Casual Leave', count: 5 }
  ]);
  const [publicHolidays, setPublicHolidays] = useState<Holiday[]>([
    { id: '1', name: 'New year', date: '2026-01-01' }
  ]);

  // Working Hours State
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [breakTime, setBreakTime] = useState('60');

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

  const handleUpdateLeaveCount = (id: string, count: string) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, count: parseInt(count) || 0 } : l));
  };

  const handleSaveChanges = async () => {
    try {
      // Prepare company update payload based on active tab
      const payload: any = {};
      
      if (activeTab === 'company') {
        payload.name = companyName;
        payload.tax_id = taxId;
        payload.timezone = timeZone;
        payload.currency = currency;
        payload.address = address;
      }
      // Note: Departments, leaves, and working hours might need separate API endpoints
      // For now, we'll save company basic info
      
      await updateCompanyMutation.mutateAsync(payload);
      message.success('Settings saved successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      const errorMessage = error?.response?.data?.message || "Failed to update settings";
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Global Settings</h1>
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
                loading={updateCompanyMutation.isPending}
                className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90 text-white font-['Manrope:SemiBold',sans-serif] px-8 h-10 rounded-full shadow-lg shadow-[#ff3b3b]/20 text-[13px] border-none"
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#EEEEEE]">
          <button
            onClick={() => setActiveTab('company')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'company' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Company Details
            {activeTab === 'company' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'leaves' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Leaves
            {activeTab === 'leaves' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
          <button
            onClick={() => setActiveTab('working-hours')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'working-hours' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Working Hours
            {activeTab === 'working-hours' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-1 relative font-['Manrope:SemiBold',sans-serif] text-[14px] transition-colors ${activeTab === 'integrations' ? 'text-[#ff3b3b]' : 'text-[#666666] hover:text-[#111111]'
              }`}
          >
            Integrations
            {activeTab === 'integrations' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b3b]" />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">

        {/* Company Details Tab */}
        {activeTab === 'company' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="mb-10">
              <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111] mb-6">Company Information</h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
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

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Time Zone</span>
                  <Select
                    value={timeZone}
                    onChange={(v) => setTimeZone(String(v))}
                    disabled={!isEditing}
                    className="w-full h-11"
                    showSearch
                    filterOption={(input, option) => {
                      const searchText = input.toLowerCase().trim();
                      
                      // If no search text, show all options
                      if (!searchText) {
                        return true;
                      }
                      
                      // Get the label text
                      const label = String(option?.label ?? option?.children ?? '').toLowerCase();
                      const value = String(option?.value ?? '').toLowerCase();
                      
                      // Direct match in label or value
                      if (label.includes(searchText) || value.includes(searchText)) {
                        return true;
                      }
                      
                      // Special handling for Indian timezone searches
                      // "kol", "cal", "calcutta", "kolkata" should match "Asia/Kolkata"
                      if (label.includes('kolkata')) {
                        if (searchText.includes('kol') || 
                            searchText.includes('cal') || 
                            searchText.includes('kolkata') || 
                            searchText.includes('calcutta') ||
                            searchText.includes('india') ||
                            searchText.includes('ist')) {
                          return true;
                        }
                      }
                      
                      return false;
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

              <div className="mb-6 relative">
                <div className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Address</span>
                  <TextArea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter company address"
                    disabled={!isEditing}
                    className={`min-h-[100px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Regular',sans-serif] text-[13px] resize-none p-3 pr-10 ${!isEditing ? 'bg-[#FAFAFA] text-[#666666]' : 'bg-white'}`}
                  />
                </div>
                {isEditing && (
                  <button className="absolute bottom-3 right-3 p-1.5 bg-[#F7F7F7] hover:bg-[#eeeeee] rounded-md transition-colors border border-[#EEEEEE]">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-[14px]">📍</span>
                    </div>
                  </button>
                )}
              </div>
            </section>

            <Divider className="my-8 bg-[#EEEEEE]" />

            {/* Departments & Required Documents side‑by‑side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Departments Column */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                    Departments
                  </h2>
                  {!isAddingDept && (
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
                            onChange={() => toggleDepartmentStatus(dept.id)}
                            className="bg-gray-200 hover:bg-gray-300"
                            style={{
                              backgroundColor: dept.active ? "#ff3b3b" : undefined,
                            }}
                          />
                        </div>
                        <button className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#666666] hover:text-[#111111]">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#ff3b3b]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                  {!isAddingDoc && (
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
                            className="bg-gray-200 hover:bg-gray-300"
                            style={{
                              backgroundColor: doc.required ? "#ff3b3b" : undefined,
                            }}
                          />
                        </div>
                        <button className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#666666] hover:text-[#111111]">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#ff3b3b]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-2 gap-12">
            {/* Leaves Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">Leaves</h2>
              </div>

              {leaves.map((leave) => (
                <div key={leave.id} className="space-y-2">
                  <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">{leave.name}</span>
                  <div className="flex items-center gap-3">
                    <Input
                      value={leave.count}
                      onChange={(e) => handleUpdateLeaveCount(leave.id, e.target.value)}
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
                <button className="hover:scale-110 active:scale-95 transition-transform">
                  <Plus className="w-5 h-5 text-[#ff3b3b]" />
                </button>
              </div>

              <div className="space-y-4">
                {publicHolidays.map((holiday) => (
                  <div key={holiday.id} className="p-4 border border-[#EEEEEE] rounded-[12px] flex items-center justify-between bg-white hover:shadow-sm transition-shadow">
                    <div>
                      <p className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111]">{holiday.name}</p>
                      <p className="text-[12px] text-[#666666] font-['Manrope:Medium',sans-serif]">{new Date(holiday.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-full transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#ff3b3b] hover:bg-[#FFF5F5] rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
                      <button onClick={() => toggleWorkingDay(day)} className="hover:text-[#ff3b3b]">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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
                      className="h-11 rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Medium',sans-serif] text-[13px]"
                    />
                  </div>
                  <span className="text-[13px] text-[#666666] font-['Manrope:Medium',sans-serif]">to</span>
                  <div className="relative flex-1">
                    <Input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
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
      </div>
    </div>
  );
}