"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardCheck,
  HardHat,
  Home,
  Layers,
  Map,
  Package,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectKpiSnapshot } from "../mappers";

const KPI_ITEMS: Array<{
  key: keyof ProjectKpiSnapshot;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "houses", label: "Houses", icon: Home },
  { key: "phases", label: "Phases", icon: Layers },
  { key: "sectors", label: "Sectors", icon: Map },
  { key: "blocks", label: "Blocks", icon: Building2 },
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "progressPercent", label: "Progress", icon: TrendingUp },
  { key: "contractors", label: "Contractors", icon: HardHat },
  { key: "employees", label: "Employees", icon: Users },
  { key: "inventoryItems", label: "Inventory", icon: Package },
  { key: "openInspections", label: "Open IRs", icon: ClipboardCheck },
];

export function ProjectKpiGrid({ kpis }: { kpis: ProjectKpiSnapshot }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {KPI_ITEMS.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * index, duration: 0.32 }}
        >
        <Card className="border-border/70 shadow-soft transition-shadow duration-300 hover:shadow-glow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <item.icon className="size-3.5 text-primary" />
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">
              {item.key === "budget"
                ? kpis.budget
                  ? kpis.budget.toLocaleString()
                  : "—"
                : item.key === "progressPercent"
                  ? `${kpis.progressPercent}%`
                  : kpis[item.key]}
            </p>
          </CardContent>
        </Card>
        </motion.div>
      ))}
    </div>
  );
}
