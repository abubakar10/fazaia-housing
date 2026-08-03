import type { OrgUnitRecord } from "./repositories/org.repository";

export function toOrgUnitDto(unit: OrgUnitRecord) {
  return {
    id: unit.id,
    parentId: unit.parentId,
    code: unit.code,
    name: unit.name,
    type: unit.type,
    status: unit.status,
    sortOrder: unit.sortOrder,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    parent: unit.parent
      ? {
          id: unit.parent.id,
          code: unit.parent.code,
          name: unit.parent.name,
          type: unit.parent.type,
        }
      : null,
    childCount: unit._count.children,
    activeUserCount: unit._count.users,
  };
}

export type OrgUnitDto = ReturnType<typeof toOrgUnitDto>;

export type OrgTreeNode = OrgUnitDto & {
  children: OrgTreeNode[];
};

export function buildOrgTree(units: OrgUnitDto[]): OrgTreeNode[] {
  const map = new Map<string, OrgTreeNode>();
  for (const unit of units) {
    map.set(unit.id, { ...unit, children: [] });
  }

  const roots: OrgTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: OrgTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
    for (const child of nodes) sortNodes(child.children);
  };
  sortNodes(roots);
  return roots;
}
