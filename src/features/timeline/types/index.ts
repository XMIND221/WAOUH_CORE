export type TimelineEventType = 
  | 'project_created'
  | 'project_updated'
  | 'task_created'
  | 'task_status_changed'
  | 'client_created'
  | 'client_updated'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'invoice_created'
  | 'invoice_paid'
  | 'user_added'
  | 'user_role_changed'
  | 'security_event';
export interface TimelineEvent {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}
export interface TimelineEventDisplay {
  icon: string;
  color: string;
  title: string;
  description: string;
  userName: string;
  time: string;
}
