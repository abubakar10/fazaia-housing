import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  listProjectMembersQuerySchema,
  listProjectsQuerySchema,
  setProjectMembersSchema,
  updateProjectSchema,
} from "../schemas/project.schemas";

describe("project.schemas", () => {
  it("parses list query defaults", () => {
    const result = listProjectsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sort).toBe("updatedAt");
  });

  it("accepts create project input", () => {
    const result = createProjectSchema.parse({
      name: "Fazaia Heights Phase 1",
      currencyCode: "PKR",
      timezone: "Asia/Karachi",
    });
    expect(result.name).toBe("Fazaia Heights Phase 1");
    expect(result.status).toBe("DRAFT");
  });

  it("parses member list query defaults", () => {
    const result = listProjectMembersQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.sort).toBe("createdAt");
    expect(result.order).toBe("asc");
  });

  it("accepts expanded project settings", () => {
    const result = updateProjectSchema.parse({
      projectType: "RESIDENTIAL",
      projectPriority: "HIGH",
      clientOwner: "Fazaia Housing",
      fiscalYear: 2026,
      gpsLatitude: 33.7,
      gpsLongitude: 73.1,
      logoUrl: "https://example.com/logo.png",
      internalNotes: "Internal only",
    });
    expect(result.projectPriority).toBe("HIGH");
    expect(result.fiscalYear).toBe(2026);
  });

  it("requires userId in member assignments", () => {
    const result = setProjectMembersSchema.safeParse({ members: [] });
    expect(result.success).toBe(true);

    const bad = setProjectMembersSchema.safeParse({
      members: [{ userId: "not-a-uuid" }],
    });
    expect(bad.success).toBe(false);
  });
});
