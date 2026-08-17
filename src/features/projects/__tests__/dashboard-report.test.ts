import { describe, expect, it } from "vitest";
import { buildZeroKpis, type ProjectDashboardDto, type ProjectDto } from "../mappers";
import { buildProjectReport } from "../lib/dashboard-report";

function stubDashboard(overrides?: Partial<ProjectDto>): ProjectDashboardDto {
  return {
    summary: {
      id: "p1",
      code: "PRJ-001",
      name: "Sample",
      description: null,
      location: "Malir",
      status: "ACTIVE",
      statusBeforeArchive: null,
      projectType: "RESIDENTIAL",
      projectPriority: "MEDIUM",
      clientOwner: null,
      consultant: null,
      mainContractorId: null,
      fiscalYear: 2026,
      gpsLatitude: null,
      gpsLongitude: null,
      logoUrl: null,
      internalNotes: null,
      startDate: "2025-01-01T00:00:00.000Z",
      expectedEndDate: "2026-12-31T00:00:00.000Z",
      actualEndDate: null,
      orgUnitId: null,
      projectManagerId: null,
      currencyCode: "PKR",
      timezone: "Asia/Karachi",
      defaultWarehouseId: null,
      memberCount: 0,
      orgUnit: null,
      projectManager: null,
      mainContractor: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      ...overrides,
    },
    kpis: { ...buildZeroKpis(), houses: 12, progressPercent: 40 },
    houseStats: {
      total: 12,
      houseTypeCount: 3,
      completed: 2,
      planning: 4,
      constructionProgressPercent: 40,
      placeholders: {
        activities: 0,
        boq: 0,
        inspections: 0,
        materials: 0,
        progress: 0,
        budget: null,
      },
    },
    memberPreview: [],
    memberCount: 0,
    deadlines: [],
    recentActivity: [],
    placeholders: {
      workflowTasks: true,
      documents: true,
      notifications: true,
    },
  };
}

describe("buildProjectReport", () => {
  it("builds schedule and preview series from live house progress", () => {
    const report = buildProjectReport(stubDashboard());
    expect(report.months).toHaveLength(12);
    expect(report.progress).toHaveLength(12);
    expect(report.earnedPct).toBe(40);
    expect(report.bac).toBeGreaterThan(0);
    expect(report.previewBudget).toBe(true);
    expect(report.spi).toBeGreaterThan(0);
  });
});
