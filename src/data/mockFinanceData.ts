export interface Requirement {
  id: number;
  title: string;
  type: string;
  estimatedCost: number;
  status: 'completed' | 'in_progress' | 'pending';
  approvalStatus: 'approved' | 'pending' | 'rejected';
  invoiceStatus: 'unbilled' | 'billed' | 'paid';
  invoiceId?: string;
  client: string;
  dueDate: string;
}

export interface InvoiceItem {
  requirementId: number;
  title: string;
  cost: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'sent' | 'overdue' | 'draft';
  items: InvoiceItem[];
}

export const MOCK_REQUIREMENTS: Requirement[] = [
  // TechCorp Inc. - Mixed statuses
  {
    id: 101,
    title: 'Frontend Refactoring',
    type: 'Development',
    estimatedCost: 5000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'TechCorp Inc.',
    dueDate: '2025-12-01T10:00:00Z'
  },
  {
    id: 102,
    title: 'Security Audit Phase 1',
    type: 'Security',
    estimatedCost: 3500,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'TechCorp Inc.',
    dueDate: '2025-12-05T10:00:00Z'
  },
  {
    id: 106,
    title: 'Backend Optimization',
    type: 'Development',
    estimatedCost: 4200,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'billed',
    invoiceId: 'INV-2025-004',
    client: 'TechCorp Inc.',
    dueDate: '2025-11-15T10:00:00Z'
  },
  
  // StartupHub - Design focus
  {
    id: 103,
    title: 'Mobile App Design',
    type: 'Design',
    estimatedCost: 8000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'StartupHub',
    dueDate: '2025-11-20T10:00:00Z'
  },
  {
    id: 104,
    title: 'Landing Page Redesign',
    type: 'Design',
    estimatedCost: 2500,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'StartupHub',
    dueDate: '2025-12-10T10:00:00Z'
  },

  // Global Systems - Heavy varied load
  {
    id: 105,
    title: 'Cloud Migration Strategy',
    type: 'Consulting',
    estimatedCost: 12000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'Global Systems',
    dueDate: '2025-12-15T10:00:00Z'
  },
  {
    id: 107,
    title: 'Database Sharding',
    type: 'Development',
    estimatedCost: 6000,
    status: 'in_progress',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'Global Systems',
    dueDate: '2026-01-20T10:00:00Z'
  },

  // Innovative Solutions
  {
    id: 108,
    title: 'AI Model Integration',
    type: 'AI/ML',
    estimatedCost: 15000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'Innovative Solutions',
    dueDate: '2025-11-28T10:00:00Z'
  },
  {
    id: 109,
    title: 'User Testing',
    type: 'QA',
    estimatedCost: 1800,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'unbilled',
    client: 'Innovative Solutions',
    dueDate: '2025-12-08T10:00:00Z'
  },

  // Historical / Billed items for reference
  {
    id: 110,
    title: 'Q3 Maintenance',
    type: 'Maintenance',
    estimatedCost: 3000,
    status: 'completed',
    approvalStatus: 'approved',
    invoiceStatus: 'paid',
    invoiceId: 'INV-2025-001',
    client: 'Triem Security',
    dueDate: '2025-10-15T10:00:00Z'
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2025-001',
    invoiceNumber: 'INV-2025-001',
    client: 'Triem Security',
    date: '2025-11-01T09:00:00Z',
    dueDate: '2025-11-15T09:00:00Z',
    amount: 15000,
    status: 'paid',
    items: []
  },
  {
    id: 'INV-2025-002',
    invoiceNumber: 'INV-2025-002',
    client: 'Eventus Security',
    date: '2025-11-05T09:00:00Z',
    dueDate: '2025-11-20T09:00:00Z',
    amount: 8500,
    status: 'sent',
    items: []
  },
  {
    id: 'INV-2025-003',
    invoiceNumber: 'INV-2025-003',
    client: 'Global Systems',
    date: '2025-10-20T09:00:00Z',
    dueDate: '2025-11-05T09:00:00Z',
    amount: 22000,
    status: 'overdue',
    items: []
  },
  {
    id: 'INV-2025-004',
    invoiceNumber: 'INV-2025-004',
    client: 'TechCorp Inc.',
    date: '2025-11-18T09:00:00Z',
    dueDate: '2025-12-02T09:00:00Z',
    amount: 4200,
    status: 'sent',
    items: []
  },
  {
    id: 'INV-2025-005',
    invoiceNumber: 'INV-2025-005',
    client: 'Alpha Dynamics',
    date: '2025-09-15T09:00:00Z',
    dueDate: '2025-09-30T09:00:00Z',
    amount: 12500,
    status: 'paid',
    items: []
  },
   {
    id: 'INV-2025-006',
    invoiceNumber: 'INV-2025-006',
    client: 'Beta Corp',
    date: '2025-11-25T09:00:00Z',
    dueDate: '2025-12-10T09:00:00Z',
    amount: 6700,
    status: 'draft',
    items: []
  }
];
