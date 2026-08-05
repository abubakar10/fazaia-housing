/**
 * Single source of truth for permission codes.
 * Seeded into DB in Module 3; services import PERMISSIONS / ALL_PERMISSION_CODES.
 * Format: `{module}.{action}`
 */

export type PermissionDefinition = {
  code: string;
  module: string;
  action: string;
  description: string;
};

function def(
  code: string,
  description: string,
): PermissionDefinition {
  const [module, action] = code.split(".");
  if (!module || !action) {
    throw new Error(`Invalid permission code: ${code}`);
  }
  return { code, module, action, description };
}

/** Core catalog from docs/07-PERMISSIONS-MATRIX.md + additive codes from docs/08. */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Platform
  def("users.read", "View users"),
  def("users.create", "Create users"),
  def("users.update", "Update users"),
  def("users.deactivate", "Activate / deactivate / soft-delete users"),
  def("users.reset_password", "Reset user passwords"),
  def("users.invite", "Invite users"),
  def("roles.read", "View roles"),
  def("roles.create", "Create roles"),
  def("roles.update", "Update roles and role permissions"),
  def("roles.assign", "Assign roles to users"),
  def("permissions.read", "View permission catalog"),
  def("org.read", "View organization units"),
  def("org.create", "Create organization units"),
  def("org.update", "Update organization units"),
  def("org.delete", "Delete organization units"),
  def("audit.read", "View audit logs"),
  def("audit.export", "Export audit logs"),
  def("settings.manage", "Manage system settings"),
  def("sessions.manage", "Manage user sessions"),
  def("mfa.manage", "Manage MFA settings"),

  // Projects & structure
  def("projects.read", "View projects"),
  def("projects.create", "Create projects"),
  def("projects.update", "Update projects"),
  def("projects.archive", "Archive projects"),
  def("projects.members", "Manage project members"),
  def("phases.manage", "Manage project phases"),
  def("sectors.manage", "Manage sectors"),
  def("blocks.manage", "Manage blocks"),
  def("house_types.manage", "Manage house types"),
  def("houses.read", "View houses"),
  def("houses.create", "Create houses"),
  def("houses.update", "Update houses"),
  def("houses.import", "Import houses"),
  def("houses.status", "Change house status"),

  // Parties
  def("contractors.read", "View contractors"),
  def("contractors.manage", "Manage contractors"),
  def("contractors.assign", "Assign contractors to projects"),
  def("employees.read", "View employees"),
  def("employees.manage", "Manage employees"),
  def("employees.assign", "Assign employees"),

  // Construction
  def("boq.read", "View BOQ"),
  def("boq.manage", "Manage BOQ"),
  def("boq.revise", "Revise BOQ"),
  def("boq.approve", "Approve BOQ"),
  def("boq.submit", "Submit BOQ"),
  def("activities.read", "View activities"),
  def("activities.manage", "Manage activities"),
  def("ir.read", "View inspection requests"),
  def("ir.create", "Create inspection requests"),
  def("ir.submit", "Submit inspection requests"),
  def("ir.review", "Review inspection requests"),
  def("ir.approve", "Approve inspection requests"),
  def("dpr.read", "View daily progress reports"),
  def("dpr.create", "Create daily progress reports"),
  def("dpr.submit", "Submit daily progress reports"),
  def("dpr.approve", "Approve daily progress reports"),
  def("wpr.read", "View weekly progress reports"),
  def("wpr.create", "Create weekly progress reports"),
  def("wpr.submit", "Submit weekly progress reports"),
  def("wpr.approve", "Approve weekly progress reports"),
  def("mb.read", "View measurement books"),
  def("mb.manage", "Manage measurement books"),
  def("mb.approve", "Approve measurement books"),
  def("mb.submit", "Submit measurement books"),

  // Inventory
  def("warehouses.read", "View warehouses"),
  def("warehouses.manage", "Manage warehouses"),
  def("warehouses.post", "Post warehouse transactions"),
  def("materials.read", "View materials"),
  def("materials.manage", "Manage materials"),
  def("grn.read", "View GRNs"),
  def("grn.create", "Create GRNs"),
  def("grn.post", "Post GRNs"),
  def("grn.submit", "Submit GRNs"),
  def("mr.read", "View material requests"),
  def("mr.create", "Create material requests"),
  def("mr.approve", "Approve material requests"),
  def("mr.submit", "Submit material requests"),
  def("dv.read", "View delivery vouchers"),
  def("dv.create", "Create delivery vouchers"),
  def("dv.approve", "Approve delivery vouchers"),
  def("dv.submit", "Submit delivery vouchers"),
  def("issue.read", "View material issues"),
  def("issue.create", "Create material issues"),
  def("issue.post", "Post material issues"),
  def("issue.submit", "Submit material issues"),
  def("consumption.read", "View material consumption"),
  def("consumption.create", "Create material consumption"),
  def("consumption.post", "Post material consumption"),
  def("consumption.submit", "Submit material consumption"),
  def("returns.read", "View material returns"),
  def("returns.create", "Create material returns"),
  def("returns.post", "Post material returns"),
  def("returns.submit", "Submit material returns"),
  def("ledger.read", "View inventory ledger"),
  def("stock.override", "Override stock constraints"),
  def("stock.adjust", "Adjust stock"),
  def("stock.transfer", "Transfer stock"),

  // Finance
  def("bills.read", "View bills"),
  def("bills.create", "Create bills"),
  def("bills.submit", "Submit bills"),
  def("bills.verify", "Verify bills"),
  def("bills.approve", "Approve bills"),
  def("payments.read", "View payments"),
  def("payments.create", "Create payments"),
  def("payments.post", "Post payments"),
  def("payments.approve", "Approve payments"),
  def("budgets.read", "View budgets"),
  def("budgets.manage", "Manage budgets"),
  def("budgets.submit", "Submit budgets"),
  def("budgets.approve", "Approve budgets"),
  def("period.close", "Close financial periods"),
  def("period.open", "Open financial periods"),
  def("retention.manage", "Manage retention"),
  def("retention.approve", "Approve retention"),

  // Governance
  def("directives.read", "View directives"),
  def("directives.create", "Create directives"),
  def("directives.acknowledge", "Acknowledge directives"),
  def("directives.publish", "Publish directives"),
  def("directives.close", "Close directives"),
  def("documents.read", "View documents"),
  def("documents.manage", "Manage documents"),
  def("documents.upload", "Upload documents"),
  def("notifications.read", "View notifications"),
  def("notifications.broadcast", "Broadcast notifications"),
  def("inbox.read", "View inbox"),
  def("inbox.act", "Act on inbox items"),
  def("reports.read", "View reports"),
  def("reports.export", "Export reports"),
  def("dashboards.read", "View dashboards"),
  def("imports.manage", "Manage data imports"),
  def("exports.manage", "Manage data exports"),
  def("masters.restore", "Restore soft-deleted masters"),
  def("comments.manage", "Manage comments"),
  def("search.use", "Use global search"),
  def("workflow.manage", "Manage workflows"),
  def("workflow.self_approve", "Self-approve workflow steps"),
  def("workflow.delegate", "Delegate workflow tasks"),
];

export const ALL_PERMISSION_CODES = PERMISSION_DEFINITIONS.map((p) => p.code);

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DEACTIVATE: "users.deactivate",
  USERS_RESET_PASSWORD: "users.reset_password",
  USERS_INVITE: "users.invite",
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_ASSIGN: "roles.assign",
  PERMISSIONS_READ: "permissions.read",
  ORG_READ: "org.read",
  ORG_CREATE: "org.create",
  ORG_UPDATE: "org.update",
  ORG_DELETE: "org.delete",
  AUDIT_READ: "audit.read",
  SETTINGS_MANAGE: "settings.manage",
  PROJECTS_READ: "projects.read",
  PROJECTS_CREATE: "projects.create",
  PROJECTS_UPDATE: "projects.update",
  PROJECTS_ARCHIVE: "projects.archive",
  PROJECTS_MEMBERS: "projects.members",
  PHASES_MANAGE: "phases.manage",
  SECTORS_MANAGE: "sectors.manage",
  BLOCKS_MANAGE: "blocks.manage",
  MASTERS_RESTORE: "masters.restore",
  DASHBOARDS_READ: "dashboards.read",
  REPORTS_READ: "reports.read",
  INBOX_READ: "inbox.read",
  DOCUMENTS_READ: "documents.read",
  NOTIFICATIONS_READ: "notifications.read",
} as const;

export type PermissionCode =
  | (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
  | (typeof ALL_PERMISSION_CODES)[number];

export const SYSTEM_ROLE_CODES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADH: "ADH",
  AD_TECH: "AD_TECH",
  RESIDENT_ENGINEER: "RESIDENT_ENGINEER",
  QUALITY_MANAGER: "QUALITY_MANAGER",
  CONTRACTOR: "CONTRACTOR",
  CONTRACTOR_ENGINEER: "CONTRACTOR_ENGINEER",
  STORE_OFFICER: "STORE_OFFICER",
  FINANCE: "FINANCE",
  SITE_SUPERVISOR: "SITE_SUPERVISOR",
  SENIOR_MANAGEMENT: "SENIOR_MANAGEMENT",
} as const;

export type SystemRoleCode =
  (typeof SYSTEM_ROLE_CODES)[keyof typeof SYSTEM_ROLE_CODES];
