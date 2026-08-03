"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  FileBarChart,
  Inbox,
  LayoutDashboard,
  Menu,
  Receipt,
  Search,
  Settings,
  Warehouse,
} from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const ICONS = {
  LayoutDashboard,
  Building2,
  Warehouse,
  Receipt,
  FileBarChart,
  Inbox,
  Settings,
} as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href;
        const disabled = "disabled" in item && item.disabled;

        if (disabled) {
          return (
            <div
              key={item.href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground/70"
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
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <span className="font-display text-sm font-semibold tracking-tight">
          FH
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold tracking-tight">
          {APP_NAME}
        </p>
        <p className="truncate text-xs text-muted-foreground">Construction ERP</p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex lg:flex-col">
      <BrandMark />
      <Separator />
      <div className="flex-1 overflow-y-auto">
        <NavLinks />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">
          Module 0 · Foundation shell
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
      <SheetContent side="left" className="w-[18rem] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <BrandMark />
        <Separator />
        <NavLinks />
      </SheetContent>
    </Sheet>
  );
}

export function AppTopbar() {
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

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden min-h-11 sm:inline-flex"
          disabled
        >
          Project context
        </Button>
        <Button variant="ghost" size="icon" className="relative min-h-11 min-w-11" disabled>
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" disabled>
          <Inbox className="size-4" />
          <span className="sr-only">Inbox</span>
        </Button>
        <Avatar className="size-9 border border-border">
          <AvatarFallback className="bg-muted text-xs font-medium">
            FH
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
