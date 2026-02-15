import { describe, expect, it } from "bun:test";
import {
  buildAttemptTree,
  type AttemptFlat,
} from "../../presentation/lib/build-attempt-tree";

// ── helpers ────────────────────────────────────────────────────────────

function makeAttempt(
  overrides: Partial<AttemptFlat> & { id: string },
): AttemptFlat {
  return {
    slug: `slug-${overrides.id}`,
    status: "submitted",
    score: 80,
    startedAt: new Date().toISOString(),
    formattedDuration: "2m 30s",
    parentAttemptId: null,
    ...overrides,
  };
}

/** Collect labels depth-first for easy assertions */
function collectLabels(nodes: ReturnType<typeof buildAttemptTree>): string[] {
  const result: string[] = [];
  function walk(nodeList: ReturnType<typeof buildAttemptTree>) {
    for (const n of nodeList) {
      result.push(n.label);
      walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

/** Collect ids depth-first */
function collectIds(nodes: ReturnType<typeof buildAttemptTree>): string[] {
  const result: string[] = [];
  function walk(nodeList: ReturnType<typeof buildAttemptTree>) {
    for (const n of nodeList) {
      result.push(n.attempt.id);
      walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

// ── tests ──────────────────────────────────────────────────────────────

describe("buildAttemptTree", () => {
  it("should return empty array for empty input", () => {
    expect(buildAttemptTree([])).toEqual([]);
  });

  it("should treat all attempts without parentAttemptId as roots", () => {
    const attempts = [
      makeAttempt({ id: "a", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({ id: "b", startedAt: "2026-01-02T00:00:00Z" }),
      makeAttempt({ id: "c", startedAt: "2026-01-03T00:00:00Z" }),
    ];
    const tree = buildAttemptTree(attempts);

    expect(tree).toHaveLength(3);
    // oldest-first
    expect(collectIds(tree)).toEqual(["a", "b", "c"]);
    // labels match chronological order
    expect(collectLabels(tree)).toEqual(["1", "2", "3"]);
  });

  it("should nest children under their parent", () => {
    const attempts = [
      makeAttempt({ id: "root", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({
        id: "child1",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "root",
      }),
      makeAttempt({
        id: "child2",
        startedAt: "2026-01-03T00:00:00Z",
        parentAttemptId: "root",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.attempt.id).toBe("root");
    expect(tree[0]!.children).toHaveLength(2);
    // children oldest-first
    expect(tree[0]!.children[0]!.attempt.id).toBe("child1");
    expect(tree[0]!.children[1]!.attempt.id).toBe("child2");
  });

  it("should assign labels based on chronological order, not traversal", () => {
    const attempts = [
      makeAttempt({ id: "root", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({
        id: "child1",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "root",
      }),
      makeAttempt({
        id: "child2",
        startedAt: "2026-01-03T00:00:00Z",
        parentAttemptId: "root",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    // chronological: root=1, child1=2, child2=3
    // traversal (oldest-first): root -> child1 -> child2
    expect(collectLabels(tree)).toEqual(["1", "2", "3"]);
  });

  it("should handle multi-level nesting (grandchildren)", () => {
    const attempts = [
      makeAttempt({ id: "root", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({
        id: "child",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "root",
      }),
      makeAttempt({
        id: "grandchild",
        startedAt: "2026-01-03T00:00:00Z",
        parentAttemptId: "child",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.children).toHaveLength(1);
    expect(tree[0]!.children[0]!.children).toHaveLength(1);
    // depth-first: root -> child -> grandchild
    expect(collectLabels(tree)).toEqual(["1", "2", "3"]);
  });

  it("should set correct depth values", () => {
    const attempts = [
      makeAttempt({ id: "root", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({
        id: "child",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "root",
      }),
      makeAttempt({
        id: "grandchild",
        startedAt: "2026-01-03T00:00:00Z",
        parentAttemptId: "child",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    expect(tree[0]!.depth).toBe(0);
    expect(tree[0]!.children[0]!.depth).toBe(1);
    expect(tree[0]!.children[0]!.children[0]!.depth).toBe(2);
  });

  it("should promote orphans (missing parent) to root", () => {
    const attempts = [
      makeAttempt({
        id: "orphan",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "nonexistent",
      }),
      makeAttempt({ id: "normal", startedAt: "2026-01-01T00:00:00Z" }),
    ];
    const tree = buildAttemptTree(attempts);

    expect(tree).toHaveLength(2);
    // Both are roots — orphan treated as root
    const ids = tree.map((n) => n.attempt.id);
    expect(ids).toContain("orphan");
    expect(ids).toContain("normal");
    // oldest-first: normal (Jan 1) before orphan (Jan 2)
    expect(tree[0]!.attempt.id).toBe("normal");
  });

  it("should break cycles by promoting one node to root", () => {
    // A -> B -> A (cycle)
    const attempts = [
      makeAttempt({
        id: "a",
        startedAt: "2026-01-01T00:00:00Z",
        parentAttemptId: "b",
      }),
      makeAttempt({
        id: "b",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "a",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    // Both should appear (no lost data), at least one as root
    expect(tree.length).toBeGreaterThanOrEqual(1);
    const allIds = collectIds(tree);
    expect(allIds).toContain("a");
    expect(allIds).toContain("b");
  });

  it("should handle self-referencing attempt (self-cycle)", () => {
    const attempts = [
      makeAttempt({
        id: "self",
        startedAt: "2026-01-01T00:00:00Z",
        parentAttemptId: "self",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.attempt.id).toBe("self");
    expect(tree[0]!.children).toHaveLength(0);
  });

  it("should handle multiple independent trees", () => {
    const attempts = [
      makeAttempt({ id: "r1", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({
        id: "c1",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "r1",
      }),
      makeAttempt({ id: "r2", startedAt: "2026-01-03T00:00:00Z" }),
      makeAttempt({
        id: "c2",
        startedAt: "2026-01-04T00:00:00Z",
        parentAttemptId: "r2",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    // 2 root nodes, oldest-first
    expect(tree).toHaveLength(2);
    expect(tree[0]!.attempt.id).toBe("r1");
    expect(tree[1]!.attempt.id).toBe("r2");
    expect(tree[0]!.children).toHaveLength(1);
    expect(tree[1]!.children).toHaveLength(1);

    // chronological: r1=1, c1=2, r2=3, c2=4
    expect(collectLabels(tree)).toEqual(["1", "2", "3", "4"]);
  });

  it("should handle a single attempt", () => {
    const tree = buildAttemptTree([
      makeAttempt({ id: "only", startedAt: "2026-01-01T00:00:00Z" }),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.label).toBe("1");
    expect(tree[0]!.depth).toBe(0);
    expect(tree[0]!.children).toHaveLength(0);
  });

  it("should order children oldest-first regardless of input order", () => {
    const attempts = [
      makeAttempt({ id: "root", startedAt: "2026-01-01T00:00:00Z" }),
      // Input in random order
      makeAttempt({
        id: "middle",
        startedAt: "2026-01-03T00:00:00Z",
        parentAttemptId: "root",
      }),
      makeAttempt({
        id: "newest",
        startedAt: "2026-01-04T00:00:00Z",
        parentAttemptId: "root",
      }),
      makeAttempt({
        id: "oldest",
        startedAt: "2026-01-02T00:00:00Z",
        parentAttemptId: "root",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    const childIds = tree[0]!.children.map((c) => c.attempt.id);
    expect(childIds).toEqual(["oldest", "middle", "newest"]);
  });

  it("should assign labels by chronological order even when traversal differs", () => {
    // r1 (Jan 1) -> child (Jan 4)   r2 (Jan 2)   r3 (Jan 3)
    // Chronological: r1=1, r2=2, r3=3, child=4
    // Traversal (oldest-first roots): r1 -> child -> r2 -> r3
    const attempts = [
      makeAttempt({ id: "r1", startedAt: "2026-01-01T00:00:00Z" }),
      makeAttempt({ id: "r2", startedAt: "2026-01-02T00:00:00Z" }),
      makeAttempt({ id: "r3", startedAt: "2026-01-03T00:00:00Z" }),
      makeAttempt({
        id: "child",
        startedAt: "2026-01-04T00:00:00Z",
        parentAttemptId: "r1",
      }),
    ];
    const tree = buildAttemptTree(attempts);

    // traversal order: r1, child, r2, r3
    expect(collectIds(tree)).toEqual(["r1", "child", "r2", "r3"]);
    // labels follow chronological order, NOT traversal position
    expect(collectLabels(tree)).toEqual(["1", "4", "2", "3"]);
  });
});
