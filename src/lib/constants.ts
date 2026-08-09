export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Falcon Housing";
export const APP_DESCRIPTION =
  "Enterprise construction management ERP for residential housing programs.";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Shell navigation.
 * `permission` filters the sidebar via the current user's effective permissions.
 * Omit permission for items visible to any authenticated user.
 */
export const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: "Users",
    permission: "users.read",
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: "Shield",
    permission: "roles.read",
  },
  {
    title: "Organization",
    href: "/organization",
    icon: "Network",
    permission: "org.read",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: "Building2",
    permission: "projects.read",
  },
  {
    title: "House types",
    href: "/house-types",
    icon: "Home",
    permission: "houses.read",
  },
  {
    title: "Store",
    href: "/store",
    icon: "Warehouse",
    permission: "warehouses.read",
    disabled: true,
  },
  {
    title: "Billing",
    href: "/billing",
    icon: "Receipt",
    permission: "bills.read",
    disabled: true,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "FileBarChart",
    permission: "reports.read",
    disabled: true,
  },
  {
    title: "Inbox",
    href: "/inbox",
    icon: "Inbox",
    permission: "inbox.read",
    disabled: true,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: "Settings",
    permission: "settings.manage",
    disabled: true,
  },
] as const;
