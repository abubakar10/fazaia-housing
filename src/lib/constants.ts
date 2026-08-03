export const APP_NAME = "FAZIA Housing";
export const APP_DESCRIPTION =
  "Enterprise construction management ERP for residential housing programs.";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Module 0: shell navigation placeholders. Permission filtering arrives with RBAC. */
export const NAV_ITEMS = [
  { title: "Overview", href: "/", icon: "LayoutDashboard" },
  { title: "Projects", href: "/projects", icon: "Building2", disabled: true },
  { title: "Store", href: "/store", icon: "Warehouse", disabled: true },
  { title: "Billing", href: "/billing", icon: "Receipt", disabled: true },
  { title: "Reports", href: "/reports", icon: "FileBarChart", disabled: true },
  { title: "Inbox", href: "/inbox", icon: "Inbox", disabled: true },
  { title: "Admin", href: "/admin", icon: "Settings", disabled: true },
] as const;
