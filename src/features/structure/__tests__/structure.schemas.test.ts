import { describe, expect, it } from "vitest";
import { numberToAlphaCode } from "@/infrastructure/numbering/number-sequence.service";
import {
  bulkCreatePhasesSchema,
  createBlockSchema,
  createPhaseSchema,
  createSectorSchema,
  listBlocksQuerySchema,
  listPhasesQuerySchema,
  listSectorsQuerySchema,
  updateSectorSchema,
} from "../schemas/structure.schemas";
import { buildProjectHierarchy } from "../mappers";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("structure.schemas", () => {
  it("requires projectId for phase list", () => {
    expect(() => listPhasesQuerySchema.parse({})).toThrow();
    const result = listPhasesQuerySchema.parse({
      projectId: UUID,
    });
    expect(result.page).toBe(1);
    expect(result.sort).toBe("sortOrder");
  });

  it("requires parent scope for sectors and blocks", () => {
    expect(() => listSectorsQuerySchema.parse({})).toThrow();
    expect(() => listBlocksQuerySchema.parse({})).toThrow();
    expect(
      listSectorsQuerySchema.parse({
        phaseId: UUID,
      }).phaseId,
    ).toBeDefined();
  });

  it("allows auto-generated codes on create", () => {
    const phase = createPhaseSchema.parse({
      projectId: UUID,
      name: "Phase 1",
    });
    expect(phase.code).toBeUndefined();

    const sector = createSectorSchema.parse({
      phaseId: UUID,
      name: "Sector A",
    });
    expect(sector.name).toBe("Sector A");

    const block = createBlockSchema.parse({
      sectorId: UUID,
      name: "Block 01",
      code: "blk-01",
    });
    expect(block.code).toBe("BLK-01");
  });

  it("parses bulk create payload", () => {
    const result = bulkCreatePhasesSchema.parse({
      projectId: UUID,
      items: [{ name: "North" }, { name: "South" }],
    });
    expect(result.items).toHaveLength(2);
  });

  it("allows moving sector via phaseId update", () => {
    const result = updateSectorSchema.parse({
      phaseId: UUID,
      name: "Moved",
    });
    expect(result.phaseId).toBeDefined();
  });
});

describe("structure code helpers", () => {
  it("maps numbers to alpha sector codes", () => {
    expect(numberToAlphaCode(1)).toBe("A");
    expect(numberToAlphaCode(26)).toBe("Z");
    expect(numberToAlphaCode(27)).toBe("AA");
  });
});

describe("buildProjectHierarchy", () => {
  it("nests phases → sectors → blocks without N+1 shape", () => {
    const now = new Date();
    const tree = buildProjectHierarchy({
      projectId: "p1",
      phases: [
        {
          id: "ph1",
          projectId: "p1",
          code: "PH-001",
          name: "Phase 1",
          description: null,
          status: "ACTIVE",
          statusBeforeArchive: null,
          sortOrder: 0,
          version: 1,
          startDate: null,
          endDate: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          createdById: null,
          updatedById: null,
          sectors: [
            {
              id: "s1",
              phaseId: "ph1",
              projectId: "p1",
              code: "SEC-A",
              name: "Sector A",
              description: null,
              status: "ACTIVE",
              statusBeforeArchive: null,
              sortOrder: 0,
              version: 1,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
              createdById: null,
              updatedById: null,
              blocks: [
                {
                  id: "b1",
                  sectorId: "s1",
                  projectId: "p1",
                  code: "BLK-01",
                  name: "Block 1",
                  description: null,
                  status: "ACTIVE",
                  statusBeforeArchive: null,
                  sortOrder: 0,
                  version: 1,
                  createdAt: now,
                  updatedAt: now,
                  deletedAt: null,
                  createdById: null,
                  updatedById: null,
                },
              ],
            },
          ],
        },
      ],
    });

    expect(tree.counts).toEqual({ phases: 1, sectors: 1, blocks: 1 });
    expect(tree.phases[0]?.children[0]?.children[0]?.code).toBe("BLK-01");
  });
});
