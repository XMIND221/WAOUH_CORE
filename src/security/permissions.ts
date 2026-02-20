export const PERMISSIONS = {
  CLIENT_CREATE: "client_create",
  CLIENT_UPDATE: "client_update",
  CLIENT_DELETE: "client_delete",
  PROJECT_CREATE: "project_create",
  PROJECT_UPDATE: "project_update",
  PROJECT_DELETE: "project_delete",
  TASK_CREATE: "task_create",
  TASK_UPDATE: "task_update",
  TASK_DELETE: "task_delete",
  INVOICE_CREATE: "invoice_create",
  INVOICE_UPDATE: "invoice_update",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  VIEW_AUDIT_LOGS: "view_audit_logs",
};
export const checkPermission = (userPermissions: string[], required: string): boolean => {
  return userPermissions.includes(required);
};
