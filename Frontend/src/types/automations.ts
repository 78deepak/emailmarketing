export type TriggerType =
  | 'contact_created'
  | 'contact_added_to_list'
  | 'email_opened'
  | 'email_clicked'
  | 'form_submitted'
  | 'manual';

export type StepType =
  | 'send_email'
  | 'wait'
  | 'add_tag'
  | 'remove_tag'
  | 'add_to_list'
  | 'condition'
  | 'exit';

export type AutomationStatus = 'draft' | 'active' | 'paused';

export interface AutomationStep {
  id?: string;
  stepOrder: number;
  stepType: StepType;
  config?: Record<string, any>;
}

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;
  status: AutomationStatus;
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationPayload {
  name: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;
  steps?: AutomationStep[];
}

export interface UpdateAutomationPayload {
  name?: string;
  triggerConfig?: Record<string, any>;
}

export interface SetStepsPayload {
  steps: AutomationStep[];
}

export interface EnrollPayload {
  contactId: string;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  contactId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStepOrder: number;
  contact?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
