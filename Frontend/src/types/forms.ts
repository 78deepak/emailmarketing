export type FormType = 'embedded' | 'popup' | 'hosted';

export type FieldInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldInputType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select dropdowns
}

export interface FormSettings {
  title?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  backgroundColor?: string;
  buttonColor?: string;
  textColor?: string;
}

export interface Form {
  id: string;
  tenantId: string;
  name: string;
  type: FormType;
  listId: string | null;
  fields: FormField[];
  settings: FormSettings;
  isActive: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormPayload {
  name: string;
  type?: FormType;
  listId?: string;
  fields?: FormField[];
  settings?: FormSettings;
  isActive?: boolean;
}

export interface UpdateFormPayload {
  name?: string;
  type?: FormType;
  listId?: string | null;
  fields?: FormField[];
  settings?: FormSettings;
  isActive?: boolean;
}

export interface FormSubmissionContact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  contactId: string | null;
  data: Record<string, any>;
  ipAddress: string | null;
  contact: FormSubmissionContact | null;
  createdAt: string;
}

export interface SubmitFormPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  data?: Record<string, any>;
}
