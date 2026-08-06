import { describe, expect, it } from "vitest";
import {
  createHouseSchema,
  createHouseTypeSchema,
  houseImportPreviewSchema,
  listHousesQuerySchema,
  reviseHouseTemplateSchema,
} from "../schemas/house.schemas";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("house.schemas", () => {
  it("requires projectId for house list", () => {
    expect(() => listHousesQuerySchema.parse({})).toThrow();
    const result = listHousesQuerySchema.parse({ projectId: UUID });
    expect(result.page).toBe(1);
    expect(result.sort).toBe("code");
  });

  it("accepts house type create without code", () => {
    const result = createHouseTypeSchema.parse({
      name: "Type A",
      projectId: UUID,
    });
    expect(result.name).toBe("Type A");
  });

  it("accepts house create payload", () => {
    const result = createHouseSchema.parse({
      projectId: UUID,
      phaseId: UUID,
      sectorId: UUID,
      blockId: UUID,
      houseTypeId: UUID,
      plotNo: "P-12",
    });
    expect(result.plotNo).toBe("P-12");
  });

  it("parses import preview rows", () => {
    const result = houseImportPreviewSchema.parse({
      projectId: UUID,
      rows: [
        {
          phaseCode: "PH-001",
          sectorCode: "SEC-A",
          blockCode: "BLK-01",
          houseTypeCode: "HT-001",
        },
      ],
    });
    expect(result.rows).toHaveLength(1);
  });

  it("parses template revision", () => {
    const result = reviseHouseTemplateSchema.parse({
      revisionNote: "Updated durations",
      activate: true,
    });
    expect(result.activate).toBe(true);
  });
});
