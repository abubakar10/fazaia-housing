"use client";

import Link from "next/link";
import { ChevronRight, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrgTreeNode } from "../mappers";

type Props = {
  nodes: OrgTreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: OrgTreeNode;
  depth: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const active = selectedId === node.id;

  return (
    <div>
      <div
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/60",
        )}
        style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            node.children.length ? "opacity-100" : "opacity-0",
          )}
        />
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left font-medium"
          onClick={() => onSelect?.(node.id)}
        >
          {node.name}
        </button>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {node.type}
        </Badge>
        <Link
          href={`/organization/${node.id}`}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          Open
        </Link>
      </div>
      {node.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function OrgTreeView({ nodes, selectedId, onSelect }: Props) {
  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center">
        <FolderTree className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No organization units yet</p>
        <p className="text-xs text-muted-foreground">
          Create an HQ or region to start the hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-2 sm:p-3">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
