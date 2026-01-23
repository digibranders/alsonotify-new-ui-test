/**
 * Requirement Modal Configuration
 *
 * Defines field configurations for modals used in requirement workflows.
 * Each modal type has specific fields and validation rules.
 */

/**
 * Field types supported in modal forms.
 */
export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'currency';

/**
 * Pricing model for quotation modals.
 */
export type PricingModel = 'hourly' | 'project';

/**
 * Context passed to field condition functions.
 */
export interface ModalContext {
  readonly pricingModel?: PricingModel;
  readonly hasExistingQuote?: boolean;
}

/**
 * Definition for a single form field.
 *
 * @property name - Field identifier (used for form data)
 * @property type - Input type
 * @property label - Display label
 * @property required - Whether the field is required
 * @property placeholder - Placeholder text
 * @property condition - Optional function to determine if field should be shown
 * @property validation - Optional validation rules
 */
export interface FieldDefinition {
  readonly name: string;
  readonly type: FieldType;
  readonly label: string;
  readonly required: boolean;
  readonly placeholder?: string;
  readonly condition?: (context: ModalContext) => boolean;
  readonly validation?: FieldValidation;
}

/**
 * Validation rules for a field.
 */
export interface FieldValidation {
  readonly min?: number;
  readonly max?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
}

/**
 * Complete modal configuration.
 *
 * @property title - Modal title
 * @property submitLabel - Submit button text
 * @property fields - Array of field definitions
 * @property requiresReason - Whether a reason/note is required
 */
export interface ModalFieldConfig {
  readonly title: string;
  readonly submitLabel: string;
  readonly fields: readonly FieldDefinition[];
  readonly requiresReason?: boolean;
}

/**
 * Rejection action types for the reject modal.
 */
export type RejectAction = 'decline' | 'reject_quote' | 'request_revision';

// =============================================================================
// Quotation Modal
// =============================================================================

/**
 * Gets the field configuration for the quotation modal.
 *
 * Fields vary based on pricing model:
 * - Hourly: Hourly Rate + Estimated Hours
 * - Project: Total Project Cost
 * - Both: Currency (always shown)
 *
 * @param pricingModel - The pricing model for this requirement
 * @returns Modal configuration for quotation submission
 *
 * @example
 * getQuotationModalConfig('hourly')
 * // Returns config with hourly rate and estimated hours fields
 *
 * @example
 * getQuotationModalConfig('project')
 * // Returns config with total project cost field
 */
export function getQuotationModalConfig(pricingModel: PricingModel): ModalFieldConfig {
  const context: ModalContext = { pricingModel };

  return {
    title: 'Submit Quotation',
    submitLabel: 'Submit Quote',
    fields: QUOTATION_FIELDS.filter((field) => {
      if (!field.condition) return true;
      return field.condition(context);
    }),
  };
}

/**
 * All possible quotation fields.
 * Conditions determine which are shown based on pricing model.
 */
/**
 * All possible quotation fields.
 * Field names use snake_case to match backend API (UpdateRequirementRequestDto).
 * Conditions determine which are shown based on pricing model.
 */
const QUOTATION_FIELDS: readonly FieldDefinition[] = [
  {
    name: 'hourly_rate',
    type: 'number',
    label: 'Hourly Rate',
    required: true,
    placeholder: 'Enter hourly rate',
    condition: (ctx) => ctx.pricingModel === 'hourly',
    validation: {
      min: 0,
    },
  },
  {
    name: 'estimated_hours',
    type: 'number',
    label: 'Estimated Hours',
    required: true,
    placeholder: 'Enter estimated hours',
    condition: (ctx) => ctx.pricingModel === 'hourly',
    validation: {
      min: 0,
    },
  },
  {
    name: 'quoted_price',
    type: 'number',
    label: 'Total Project Cost',
    required: true,
    placeholder: 'Enter total project cost',
    condition: (ctx) => ctx.pricingModel === 'project',
    validation: {
      min: 0,
    },
  },
  {
    name: 'currency',
    type: 'currency',
    label: 'Currency',
    required: true,
    placeholder: 'Select currency',
  },
  {
    name: 'notes',
    type: 'textarea',
    label: 'Notes (Optional)',
    required: false,
    placeholder: 'Add any additional notes or terms',
    validation: {
      maxLength: 1000,
    },
  },
] as const;

// =============================================================================
// Reject Modal
// =============================================================================

/**
 * Gets the field configuration for the reject modal.
 *
 * The modal title and submit label vary based on the action:
 * - decline: "Decline Requirement" / "Decline"
 * - reject_quote: "Reject Quote" / "Reject"
 * - request_revision: "Request Revision" / "Request Revision"
 *
 * @param action - The type of rejection being performed
 * @returns Modal configuration for rejection
 *
 * @example
 * getRejectModalConfig('decline')
 * // Returns config for declining a requirement
 *
 * @example
 * getRejectModalConfig('request_revision')
 * // Returns config for requesting work revision
 */
export function getRejectModalConfig(action: RejectAction): ModalFieldConfig {
  const config = REJECT_CONFIG[action];

  return {
    title: config.title,
    submitLabel: config.submitLabel,
    fields: REJECT_FIELDS,
    requiresReason: true,
  };
}

/**
 * Configuration for different rejection actions.
 */
const REJECT_CONFIG: Readonly<Record<RejectAction, { title: string; submitLabel: string }>> = {
  decline: {
    title: 'Decline Requirement',
    submitLabel: 'Decline',
  },
  reject_quote: {
    title: 'Reject Quote',
    submitLabel: 'Reject',
  },
  request_revision: {
    title: 'Request Revision',
    submitLabel: 'Request Revision',
  },
} as const;

/**
 * Fields for the reject modal.
 * Field names use snake_case to match backend API.
 */
const REJECT_FIELDS: readonly FieldDefinition[] = [
  {
    name: 'rejection_reason',
    type: 'textarea',
    label: 'Reason',
    required: true,
    placeholder: 'Please provide a reason for this action',
    validation: {
      minLength: 10,
      maxLength: 1000,
    },
  },
] as const;

// =============================================================================
// Mapping Modal
// =============================================================================

/**
 * Gets the field configuration for the workspace mapping modal.
 *
 * Used when receiver needs to map an outsourced requirement
 * to their internal workspace.
 *
 * @returns Modal configuration for workspace mapping
 *
 * @example
 * getMappingModalConfig()
 * // Returns config for workspace selection
 */
export function getMappingModalConfig(): ModalFieldConfig {
  return {
    title: 'Map to Workspace',
    submitLabel: 'Map Workspace',
    fields: MAPPING_FIELDS,
  };
}

/**
 * Fields for the mapping modal.
 * Field names use snake_case to match backend API.
 */
const MAPPING_FIELDS: readonly FieldDefinition[] = [
  {
    name: 'receiver_workspace_id',
    type: 'select',
    label: 'Select Workspace',
    required: true,
    placeholder: 'Choose a workspace',
  },
] as const;

// =============================================================================
// Edit Modal
// =============================================================================

/**
 * Gets the field configuration for the edit requirement modal.
 *
 * Used when sender needs to edit and resend a rejected requirement.
 *
 * @returns Modal configuration for requirement editing
 *
 * @example
 * getEditModalConfig()
 * // Returns config for requirement editing
 */
export function getEditModalConfig(): ModalFieldConfig {
  return {
    title: 'Edit Requirement',
    submitLabel: 'Save & Resend',
    fields: EDIT_FIELDS,
  };
}

/**
 * Fields for the edit modal.
 * Note: This is a simplified config. The actual edit form
 * may have more fields loaded from the requirement data.
 */
const EDIT_FIELDS: readonly FieldDefinition[] = [
  {
    name: 'title',
    type: 'text',
    label: 'Title',
    required: true,
    placeholder: 'Requirement title',
    validation: {
      minLength: 3,
      maxLength: 200,
    },
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    required: true,
    placeholder: 'Describe the requirement',
    validation: {
      minLength: 10,
      maxLength: 5000,
    },
  },
] as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Filters fields based on context conditions.
 *
 * @param fields - Array of field definitions
 * @param context - Context for condition evaluation
 * @returns Filtered array of fields that should be shown
 *
 * @example
 * filterFieldsByContext(QUOTATION_FIELDS, { pricingModel: 'hourly' })
 * // Returns only fields applicable to hourly pricing
 */
export function filterFieldsByContext(
  fields: readonly FieldDefinition[],
  context: ModalContext
): readonly FieldDefinition[] {
  return fields.filter((field) => {
    if (!field.condition) return true;
    return field.condition(context);
  });
}

/**
 * Validates a field value against its validation rules.
 *
 * @param field - Field definition with validation rules
 * @param value - Value to validate
 * @returns Error message if invalid, undefined if valid
 *
 * @example
 * validateField(reasonField, 'short')
 * // Returns 'Reason must be at least 10 characters'
 */
export function validateField(
  field: FieldDefinition,
  value: string | number | undefined
): string | undefined {
  if (field.required && (value === undefined || value === '')) {
    return `${field.label} is required`;
  }

  if (!field.validation || value === undefined || value === '') {
    return undefined;
  }

  const { min, max, minLength, maxLength } = field.validation;

  if (typeof value === 'number') {
    if (min !== undefined && value < min) {
      return `${field.label} must be at least ${min}`;
    }
    if (max !== undefined && value > max) {
      return `${field.label} must be at most ${max}`;
    }
  }

  if (typeof value === 'string') {
    if (minLength !== undefined && value.length < minLength) {
      return `${field.label} must be at least ${minLength} characters`;
    }
    if (maxLength !== undefined && value.length > maxLength) {
      return `${field.label} must be at most ${maxLength} characters`;
    }
  }

  return undefined;
}
