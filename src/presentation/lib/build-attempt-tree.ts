/**
 * Transforms a flat list of attempts into a hierarchical tree structure
 * based on parentAttemptId relationships.
 *
 * Rules:
 * - Root nodes: attempts with no parentAttemptId, or orphans whose parent is missing
 * - Roots and children are sorted oldest-first by startedAt (ascending)
 * - Labels reflect actual chronological order across ALL attempts (oldest = 1)
 * - Cycle guard: if a cycle is detected, the node is promoted to root
 */

export interface AttemptFlat {
  id: string;
  slug: string;
  status: string;
  score: number | null;
  startedAt: string;
  formattedDuration: string | null;
  parentAttemptId: string | null;
}

export interface AttemptTreeNode {
  attempt: AttemptFlat;
  children: AttemptTreeNode[];
  /** Global label based on chronological order (oldest attempt = "1") */
  label: string;
  /** Depth in tree (0 = root) */
  depth: number;
}

/**
 * Compare function: oldest-first by startedAt (ascending).
 * Ties broken by id ascending for deterministic output.
 */
function compareOldestFirst(a: AttemptFlat, b: AttemptFlat): number {
  const diff =
    new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
  if (diff !== 0) return diff;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Sort tree nodes oldest-first.
 */
function sortOldestFirst<T extends { attempt: AttemptFlat }>(nodes: T[]): T[] {
  return nodes.sort((a, b) => compareOldestFirst(a.attempt, b.attempt));
}

/**
 * Build a chronological label map: attempt id → global sequence number.
 * Sorted by startedAt ascending (oldest = 1), with id as tie-breaker.
 */
function buildLabelMap(attempts: AttemptFlat[]): Map<string, string> {
  const sorted = [...attempts].sort(compareOldestFirst);
  const map = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i]!.id, `${i + 1}`);
  }
  return map;
}

/**
 * Recursively assign labels from the pre-computed chronological map
 * and set each node's depth.
 */
function assignLabelsAndDepth(
  nodes: AttemptTreeNode[],
  depth: number,
  labelMap: Map<string, string>,
): void {
  for (const node of nodes) {
    node.label = labelMap.get(node.attempt.id) ?? "?";
    node.depth = depth;
    assignLabelsAndDepth(node.children, depth + 1, labelMap);
  }
}

/**
 * Build a hierarchical tree from flat attempts.
 *
 * @param attempts - Flat list of attempts (order doesn't matter)
 * @returns Tree of AttemptTreeNode[], sorted oldest-first at every level,
 *          with labels based on actual chronological attempt order
 */
export function buildAttemptTree(attempts: AttemptFlat[]): AttemptTreeNode[] {
  if (attempts.length === 0) return [];

  // Build chronological label map before any tree manipulation
  const labelMap = buildLabelMap(attempts);

  // Index all attempts by ID for O(1) lookup
  const byId = new Map<string, AttemptTreeNode>();
  for (const attempt of attempts) {
    byId.set(attempt.id, { attempt, children: [], label: "", depth: 0 });
  }

  const roots: AttemptTreeNode[] = [];

  // Build parent-child links; promote orphans and cycle participants to roots
  for (const node of byId.values()) {
    const parentId = node.attempt.parentAttemptId;

    if (!parentId) {
      // No parent — it's a root
      roots.push(node);
      continue;
    }

    const parentNode = byId.get(parentId);
    if (!parentNode) {
      // Parent not in this dataset — orphan promoted to root
      roots.push(node);
      continue;
    }

    // Cycle detection: walk the ancestor chain from parentNode.
    // If we encounter `node` again, it's a cycle — promote to root.
    let isCycle = false;
    let ancestor: AttemptTreeNode | undefined = parentNode;
    const visited = new Set<string>([node.attempt.id]);
    while (ancestor) {
      if (visited.has(ancestor.attempt.id)) {
        isCycle = true;
        break;
      }
      visited.add(ancestor.attempt.id);
      const nextParentId: string | null = ancestor.attempt.parentAttemptId;
      ancestor = nextParentId ? byId.get(nextParentId) : undefined;
    }

    if (isCycle) {
      roots.push(node);
    } else {
      parentNode.children.push(node);
    }
  }

  // Sort children at every level oldest-first, then sort roots
  function sortRecursive(nodes: AttemptTreeNode[]): void {
    sortOldestFirst(nodes);
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  }
  sortRecursive(roots);

  // Assign chronological labels and depth
  assignLabelsAndDepth(roots, 0, labelMap);

  return roots;
}
