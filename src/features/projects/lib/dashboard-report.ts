import { addMonths, differenceInCalendarDays, format } from "date-fns";
import type { ProjectDashboardDto } from "../mappers";

export type ReportLine = {
  label: string;
  plan: number;
  actual: number;
};

export type ProjectReport = {
  reportDate: Date;
  startDate: Date;
  contractFinish: Date;
  forecastFinish: Date;
  plannedPct: number;
  earnedPct: number;
  spi: number;
  cpi: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  variance: number;
  bac: number;
  eac: number;
  etg: number;
  costVariance: number;
  previewBudget: boolean;
  months: string[];
  progress: ReportLine[];
  cashIn: ReportLine[];
  cashOut: ReportLine[];
  manpower: ReportLine[];
  equipment: ReportLine[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sCurve(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function buildProjectReport(dashboard: ProjectDashboardDto): ProjectReport {
  const reportDate = new Date();
  const startDate = dashboard.summary.startDate
    ? new Date(dashboard.summary.startDate)
    : new Date(dashboard.summary.createdAt);
  const contractFinish = dashboard.summary.expectedEndDate
    ? new Date(dashboard.summary.expectedEndDate)
    : addMonths(startDate, 18);

  const durationDays = Math.max(
    differenceInCalendarDays(contractFinish, startDate),
    1,
  );
  const elapsedDays = clamp(
    differenceInCalendarDays(reportDate, startDate),
    0,
    durationDays,
  );
  const plannedPct = clamp((elapsedDays / durationDays) * 100, 0, 100);
  const earnedPct = clamp(dashboard.kpis.progressPercent, 0, 100);
  const spi = plannedPct > 1 ? earnedPct / plannedPct : earnedPct > 0 ? 1 : 1;

  const remainingDays = Math.max(durationDays - elapsedDays, 0);
  const forecastFinish =
    spi > 0.15
      ? new Date(
          reportDate.getTime() + (remainingDays / Math.max(spi, 0.25)) * 86_400_000,
        )
      : addMonths(contractFinish, 3);

  const houses = Math.max(dashboard.kpis.houses, 1);
  const bac =
    dashboard.kpis.budget > 0
      ? dashboard.kpis.budget
      : houses * 2_500_000;
  const plannedValue = bac * (plannedPct / 100);
  const earnedValue = bac * (earnedPct / 100);
  const actualCost = earnedValue * (earnedPct < plannedPct ? 1.06 : 0.97);
  const cpi = actualCost > 0 ? earnedValue / actualCost : 1;
  const eac = cpi > 0 ? bac / cpi : bac;
  const etg = Math.max(eac - actualCost, 0);

  const monthCount = 12;
  const months: string[] = [];
  const progress: ReportLine[] = [];
  const cashIn: ReportLine[] = [];
  const cashOut: ReportLine[] = [];
  const manpower: ReportLine[] = [];
  const equipment: ReportLine[] = [];

  for (let i = 0; i < monthCount; i += 1) {
    const date = addMonths(startDate, i);
    months.push(format(date, "MMM yy"));
    const t = (i + 1) / monthCount;
    const planProgress = sCurve(t) * 100;
    const lag = clamp(spi, 0.55, 1.15);
    const actualProgress = sCurve(t * lag) * earnedPct;

    progress.push({
      label: months[i],
      plan: Number(planProgress.toFixed(1)),
      actual: Number(actualProgress.toFixed(1)),
    });

    const planIn = 300_000 + i * 90_000;
    const planOut = planIn * 0.92;
    cashIn.push({
      label: months[i],
      plan: planIn,
      actual: planIn * (0.82 + lag * 0.12),
    });
    cashOut.push({
      label: months[i],
      plan: planOut,
      actual: planOut * (0.78 + (2 - lag) * 0.1),
    });

    const peak = i < 8 ? 40 + i * 28 : 260 - (i - 8) * 35;
    manpower.push({
      label: months[i],
      plan: peak,
      actual: Math.max(12, peak - 22),
    });
    equipment.push({
      label: months[i],
      plan: Math.round(peak / 8),
      actual: Math.round(Math.max(2, peak / 8 - 2)),
    });
  }

  return {
    reportDate,
    startDate,
    contractFinish,
    forecastFinish,
    plannedPct: Number(plannedPct.toFixed(1)),
    earnedPct: Number(earnedPct.toFixed(1)),
    spi: Number(spi.toFixed(2)),
    cpi: Number(cpi.toFixed(2)),
    plannedValue,
    earnedValue,
    actualCost,
    variance: plannedValue - earnedValue,
    bac,
    eac,
    etg,
    costVariance: earnedValue - actualCost,
    previewBudget: dashboard.kpis.budget <= 0,
    months,
    progress,
    cashIn,
    cashOut,
    manpower,
    equipment,
  };
}
