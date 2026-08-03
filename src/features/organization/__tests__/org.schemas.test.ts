import { describe, expect, it } from "vitest";
import { buildOrgTree, type OrgUnitDto } from "@/features/organization/mappers";
import {
  createOrgUnitSchema,
  updateOrgUnitSchema,
} from "@/features/organization/schemas/org.schemas";

function unit(
  partial: Partial<OrgUnitDto> & Pick<OrgUnitDto, "id" | "code" | "name" | "parentId">,
): OrgUnitDto {
  return {
    type: "REGION",
    status: "ACTIVE",
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    parent: null,
    childCount: 0,
    activeUserCount: 0,
    ...partial,
  };
}

describe("org schemas", () => {
  it("uppercases org codes", () => {
    const parsed = createOrgUnitSchema.parse({
      code: "reg-west",
      name: "Western Region",
      type: "REGION",
    });
    expect(parsed.code).toBe("REG-WEST");
    expect(parsed.status).toBe("ACTIVE");
  });

  it("accepts DIVISION type and nullable parent", () => {
    const parsed = updateOrgUnitSchema.parse({
      type: "DIVISION",
      parentId: null,
    });
    expect(parsed.type).toBe("DIVISION");
    expect(parsed.parentId).toBeNull();
  });
});

describe("buildOrgTree", () => {
  it("nests unlimited depth and sorts by sortOrder", () => {
    const tree = buildOrgTree([
      unit({ id: "1", code: "HQ", name: "HQ", parentId: null, type: "HQ", sortOrder: 0 }),
      unit({
        id: "2",
        code: "R2",
        name: "Region B",
        parentId: "1",
        sortOrder: 2,
      }),
      unit({
        id: "3",
        code: "R1",
        name: "Region A",
        parentId: "1",
        sortOrder: 1,
      }),
      unit({
        id: "4",
        code: "D1",
        name: "Division",
        parentId: "3",
        type: "DIVISION",
        sortOrder: 0,
      }),
      unit({
        id: "5",
        code: "S1",
        name: "Site",
        parentId: "4",
        type: "SITE",
        sortOrder: 0,
      }),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((c) => c.code)).toEqual(["R1", "R2"]);
    expect(tree[0].children[0].children[0].children[0].code).toBe("S1");
  });

  it("treats missing parents as roots", () => {
    const tree = buildOrgTree([
      unit({ id: "orphan", code: "ORPH", name: "Orphan", parentId: "missing" }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].code).toBe("ORPH");
  });
});
