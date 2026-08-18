"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Building2,
  FileBarChart,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Receipt,
  Search,
  Settings,
  Shield,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";
import { APP_FULL_NAME, APP_SHORT_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth, useLogout } from "@/features/auth/hooks/use-auth";
import { ProjectContextSwitcher } from "@/features/projects/components/project-context-switcher";
import { usePermissions } from "@/features/rbac/components/can";
import { BrandLogo } from "@/components/brand";

const ICONS = {
  LayoutDashboard,
  Users,
  Shield,
  Network,
  Building2,
  Home,
  Warehouse,
  Receipt,
  FileBarChart,
  Inbox,
  Settings,
} as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can, isSuperAdmin, isLoading, permissionsReady } = usePermissions();
  const reduceMotion = useReducedMotion();

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
      {NAV_ITEMS.map((item, index) => {
        const Icon = ICONS[item.icon];
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const disabled = "disabled" in item && item.disabled;
        const needsPermission =
          "permission" in item && !!item.permission && !isSuperAdmin;
        const permitted =
          isSuperAdmin ||
          !("permission" in item) ||
          !item.permission ||
          can(item.permission);

        if (isLoading && needsPermission && !permissionsReady) {
          return (
            <div
              key={item.href}
              className="h-11 animate-pulse rounded-xl bg-sidebar-accent/40"
            />
          );
        }

        if (!permitted) return null;

        if (disabled) {
          return (
            <div
              key={item.href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground/45"
              aria-disabled
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              <Badge variant="secondary" className="text-[10px] font-normal">
                Soon
              </Badge>
            </div>
          );
        }

        return (
          <motion.div
            key={item.href}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * index, duration: 0.28 }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(0,174,239,0.35)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              prefetch
            >
              <Icon className="size-4 shrink-0" />
              {item.title}
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <BrandLogo size="sm" className="rounded-2xl" />
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.28em] text-white">
          {APP_SHORT_NAME}
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-primary/80">
          {APP_FULL_NAME}
        </p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <BrandMark />
      <Separator className="bg-sidebar-border" />
      <div className="flex-1 overflow-y-auto">
        <NavLinks />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-sidebar-foreground/60">
          {APP_SHORT_NAME}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-sidebar-foreground/50">
          {APP_FULL_NAME}
        </p>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="min-h-11 min-w-11 lg:hidden">
          <Menu className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <BrandMark />
        <Separator className="bg-sidebar-border" />
        <NavLinks />
      </SheetContent>
    </Sheet>
  );
}

export function AppTopbar() {
  const { user } = useAuth();
  const { logout, isPending } = useLogout();
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AF";

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <MobileSidebar />

      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground md:flex">
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search projects, houses, documents…</span>
        <kbd className="ml-auto rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </div>

      <div className="relative z-40 ml-auto flex shrink-0 items-center gap-2">
        <ProjectContextSwitcher />
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden min-h-11 min-w-11 sm:inline-flex"
          disabled
        >
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden min-h-11 min-w-11 sm:inline-flex"
          disabled
        >
          <Inbox className="size-4" />
          <span className="sr-only">Inbox</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="min-h-11 shrink-0 gap-2 rounded-full px-1.5 sm:px-2"
            >
              <Avatar className="size-9 border border-primary/30">
                <AvatarFallback className="bg-primary/15 text-xs font-medium text-navy">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
                {user?.name ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="min-h-11 cursor-pointer">
              <Link href="/settings/profile">
                <UserRound className="size-4" />
                My profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => logout()}
              className="min-h-11 cursor-pointer"
            >
              <LogOut className="size-4" />
              {isPending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
