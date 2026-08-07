import { BILITERAL_CELLS, type BiliteralCell } from "../domain/conclusion";
import type {
  BiliteralCounterAnchor,
  BiliteralCounterPlacements,
  BiliteralPartitionRole,
  CounterKind,
  TriliteralCounterAnchor,
  TriliteralCounterPlacements,
} from "../domain/counterPlacement";
import { DIAGRAM_CELL_IDS, type DiagramCellId } from "../domain/diagram";
import type { TermRole } from "../domain/term";
import {
  resolveBiliteralCounterPosition,
  resolveTriliteralCounterPosition,
  type Point,
} from "../diagram/layout";

export type CounterPlacementMode = "automatic" | "manual";
export type CounterTool = CounterKind | "erase";

export function isCounterPlacementMode(
  value: string,
): value is CounterPlacementMode {
  return value === "automatic" || value === "manual";
}

export function isCounterTool(value: string): value is CounterTool {
  return value === "emptiness" || value === "existence" || value === "erase";
}

export interface UserTriliteralCounterPlacement {
  readonly kind: CounterKind;
  readonly anchor: TriliteralCounterAnchor;
}

export interface UserBiliteralCounterPlacement {
  readonly kind: CounterKind;
  readonly anchor: BiliteralCounterAnchor;
}

export interface CounterAttemptDifferenceSummary {
  readonly missingCount: number;
  readonly extraCount: number;
  readonly wrongKindCount: number;
}

export type CounterAttemptValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly summary: CounterAttemptDifferenceSummary;
    };

export type CounterAttemptCheckState =
  | { readonly kind: "not-checked" }
  | {
      readonly kind: "incorrect";
      readonly summary: CounterAttemptDifferenceSummary;
    }
  | { readonly kind: "correct" };

export interface TriliteralCounterAttemptState {
  readonly placements: readonly UserTriliteralCounterPlacement[];
  readonly check: CounterAttemptCheckState;
}

export interface BiliteralCounterAttemptState {
  readonly placements: readonly UserBiliteralCounterPlacement[];
  readonly check: CounterAttemptCheckState;
}

export interface CounterPracticeState {
  readonly mode: CounterPlacementMode;
  readonly selectedTool: CounterTool;
  readonly firstPremise: TriliteralCounterAttemptState;
  readonly combinedPremises: TriliteralCounterAttemptState;
  readonly conclusion: BiliteralCounterAttemptState;
}

function emptyTriliteralAttempt(): TriliteralCounterAttemptState {
  return { placements: [], check: { kind: "not-checked" } };
}

function emptyBiliteralAttempt(): BiliteralCounterAttemptState {
  return { placements: [], check: { kind: "not-checked" } };
}

export function createInitialCounterPracticeState(
  mode: CounterPlacementMode = "automatic",
): CounterPracticeState {
  return {
    mode,
    selectedTool: "emptiness",
    firstPremise: emptyTriliteralAttempt(),
    combinedPremises: emptyTriliteralAttempt(),
    conclusion: emptyBiliteralAttempt(),
  };
}

const triliteralIndex = new Map(
  DIAGRAM_CELL_IDS.map((cell, index) => [cell, index]),
);
const biliteralIndex = new Map(
  BILITERAL_CELLS.map((cell, index) => [cell, index]),
);
const roleIndex: Readonly<Record<TermRole, number>> = { S: 0, M: 1, P: 2 };
const biliteralRoleIndex: Readonly<Record<BiliteralPartitionRole, number>> = {
  S: 0,
  P: 1,
};

function orderedPair<T extends string>(
  cells: readonly [T, T],
  index: ReadonlyMap<T, number>,
): readonly [T, T] {
  return (index.get(cells[0]) ?? -1) <= (index.get(cells[1]) ?? -1)
    ? [cells[0], cells[1]]
    : [cells[1], cells[0]];
}

function triliteralAnchorKey(anchor: TriliteralCounterAnchor): string {
  if (anchor.type === "cell") return `cell:${anchor.cell}`;
  const cells = orderedPair(anchor.cells, triliteralIndex);
  return `boundary:${anchor.partitionRole}:${cells[0]}:${cells[1]}`;
}

export function isSameTriliteralCounterAnchor(
  left: TriliteralCounterAnchor,
  right: TriliteralCounterAnchor,
): boolean {
  return triliteralAnchorKey(left) === triliteralAnchorKey(right);
}

function biliteralAnchorKey(anchor: BiliteralCounterAnchor): string {
  if (anchor.type === "cell") return `cell:${anchor.cell}`;
  const cells = orderedPair(anchor.cells, biliteralIndex);
  return `boundary:${anchor.partitionRole}:${cells[0]}:${cells[1]}`;
}

function compareTriliteralAnchors(
  left: TriliteralCounterAnchor,
  right: TriliteralCounterAnchor,
): number {
  if (left.type !== right.type) return left.type === "cell" ? -1 : 1;
  if (left.type === "cell" && right.type === "cell") {
    return triliteralIndex.get(left.cell)! - triliteralIndex.get(right.cell)!;
  }
  if (left.type === "boundary" && right.type === "boundary") {
    const roleDifference =
      roleIndex[left.partitionRole] - roleIndex[right.partitionRole];
    if (roleDifference !== 0) return roleDifference;
    const leftCells = orderedPair(left.cells, triliteralIndex);
    const rightCells = orderedPair(right.cells, triliteralIndex);
    return triliteralIndex.get(leftCells[0])! -
      triliteralIndex.get(rightCells[0])!;
  }
  return 0;
}

function compareBiliteralAnchors(
  left: BiliteralCounterAnchor,
  right: BiliteralCounterAnchor,
): number {
  if (left.type !== right.type) return left.type === "cell" ? -1 : 1;
  if (left.type === "cell" && right.type === "cell") {
    return biliteralIndex.get(left.cell)! - biliteralIndex.get(right.cell)!;
  }
  if (left.type === "boundary" && right.type === "boundary") {
    const roleDifference =
      biliteralRoleIndex[left.partitionRole] -
      biliteralRoleIndex[right.partitionRole];
    if (roleDifference !== 0) return roleDifference;
    const leftCells = orderedPair(left.cells, biliteralIndex);
    const rightCells = orderedPair(right.cells, biliteralIndex);
    return biliteralIndex.get(leftCells[0])! -
      biliteralIndex.get(rightCells[0])!;
  }
  return 0;
}

function applyTool<P extends { readonly kind: CounterKind; readonly anchor: A }, A>(
  placements: readonly P[],
  anchor: A,
  tool: CounterTool,
  key: (anchor: A) => string,
  compare: (left: A, right: A) => number,
): readonly P[] {
  const targetKey = key(anchor);
  const existing = placements.find(
    (placement) => key(placement.anchor) === targetKey,
  );
  if (
    (tool === "erase" && existing === undefined) ||
    (tool !== "erase" && existing?.kind === tool)
  ) {
    return placements;
  }
  const remaining = placements.filter(
    (placement) => key(placement.anchor) !== targetKey,
  );
  if (tool === "erase") return remaining;
  return [
    ...remaining,
    { kind: tool, anchor } as P,
  ].sort((left, right) => compare(left.anchor, right.anchor));
}

export function applyTriliteralCounterTool(
  placements: readonly UserTriliteralCounterPlacement[],
  anchor: TriliteralCounterAnchor,
  tool: CounterTool,
): readonly UserTriliteralCounterPlacement[] {
  return applyTool(
    placements,
    anchor,
    tool,
    triliteralAnchorKey,
    compareTriliteralAnchors,
  );
}

export function applyBiliteralCounterTool(
  placements: readonly UserBiliteralCounterPlacement[],
  anchor: BiliteralCounterAnchor,
  tool: CounterTool,
): readonly UserBiliteralCounterPlacement[] {
  return applyTool(
    placements,
    anchor,
    tool,
    biliteralAnchorKey,
    compareBiliteralAnchors,
  );
}

function validateAttempt<A>(
  attempt: readonly { readonly kind: CounterKind; readonly anchor: A }[],
  expected: readonly { readonly kind: CounterKind; readonly anchor: A }[],
  key: (anchor: A) => string,
): CounterAttemptValidationResult {
  const attemptByAnchor = new Map<string, CounterKind>();
  for (const placement of attempt) {
    const anchorKey = key(placement.anchor);
    if (attemptByAnchor.has(anchorKey)) {
      throw new Error(`Duplicate counter anchor: "${anchorKey}".`);
    }
    attemptByAnchor.set(anchorKey, placement.kind);
  }
  const expectedByAnchor = new Map(
    expected.map((placement) => [key(placement.anchor), placement.kind]),
  );
  let missingCount = 0;
  let extraCount = 0;
  let wrongKindCount = 0;
  for (const [anchorKey, kind] of expectedByAnchor) {
    const actual = attemptByAnchor.get(anchorKey);
    if (actual === undefined) missingCount += 1;
    else if (actual !== kind) wrongKindCount += 1;
  }
  for (const anchorKey of attemptByAnchor.keys()) {
    if (!expectedByAnchor.has(anchorKey)) extraCount += 1;
  }
  return missingCount === 0 && extraCount === 0 && wrongKindCount === 0
    ? { ok: true }
    : { ok: false, summary: { missingCount, extraCount, wrongKindCount } };
}

export function validateTriliteralCounterAttempt(
  attempt: readonly UserTriliteralCounterPlacement[],
  expected: TriliteralCounterPlacements,
): CounterAttemptValidationResult {
  return validateAttempt(
    attempt,
    [...expected.emptinessCounters, ...expected.existenceCounters],
    triliteralAnchorKey,
  );
}

export function validateBiliteralCounterAttempt(
  attempt: readonly UserBiliteralCounterPlacement[],
  expected: BiliteralCounterPlacements,
): CounterAttemptValidationResult {
  return validateAttempt(
    attempt,
    [...expected.emptinessCounters, ...expected.existenceCounters],
    biliteralAnchorKey,
  );
}

export function createTriliteralAttemptPlacements(
  placements: readonly UserTriliteralCounterPlacement[],
): TriliteralCounterPlacements {
  const sorted = [...placements].sort((left, right) =>
    compareTriliteralAnchors(left.anchor, right.anchor)
  );
  return {
    emptinessCounters: sorted
      .filter(({ kind }) => kind === "emptiness")
      .map(({ anchor }) => ({ kind: "emptiness", anchor })),
    existenceCounters: sorted
      .filter(({ kind }) => kind === "existence")
      .map(({ anchor }) => ({ kind: "existence", anchor, sourceIds: [] })),
  };
}

export function createUserTriliteralCounterPlacements(
  placements: TriliteralCounterPlacements,
): readonly UserTriliteralCounterPlacement[] {
  return [
    ...placements.emptinessCounters.map(({ anchor }) => ({
      kind: "emptiness" as const,
      anchor,
    })),
    ...placements.existenceCounters.map(({ anchor }) => ({
      kind: "existence" as const,
      anchor,
    })),
  ].sort((left, right) => compareTriliteralAnchors(left.anchor, right.anchor));
}

export function createBiliteralAttemptPlacements(
  placements: readonly UserBiliteralCounterPlacement[],
): BiliteralCounterPlacements {
  const sorted = [...placements].sort((left, right) =>
    compareBiliteralAnchors(left.anchor, right.anchor)
  );
  return {
    emptinessCounters: sorted
      .filter(({ kind }) => kind === "emptiness")
      .map(({ anchor }) => ({ kind: "emptiness", anchor })),
    existenceCounters: sorted
      .filter(({ kind }) => kind === "existence")
      .map(({ anchor }) => ({ kind: "existence", anchor, sourceIds: [] })),
  };
}

export type TriliteralCounterTargetKey =
  | `triliteral:cell:${DiagramCellId}`
  | `triliteral:boundary:${TermRole}:${DiagramCellId}:${DiagramCellId}`;

export interface TriliteralCounterTarget {
  readonly key: TriliteralCounterTargetKey;
  readonly anchor: TriliteralCounterAnchor;
  readonly position: Point;
}

export type BiliteralCounterTargetKey =
  | `biliteral:cell:${BiliteralCell}`
  | `biliteral:boundary:${BiliteralPartitionRole}:${BiliteralCell}:${BiliteralCell}`;

export interface BiliteralCounterTarget {
  readonly key: BiliteralCounterTargetKey;
  readonly anchor: BiliteralCounterAnchor;
  readonly position: Point;
}

const TRILITERAL_BOUNDARIES: readonly Extract<
  TriliteralCounterAnchor,
  { readonly type: "boundary" }
>[] = [
  { type: "boundary", partitionRole: "S", cells: ["SMP", "sMP"] },
  { type: "boundary", partitionRole: "S", cells: ["SMp", "sMp"] },
  { type: "boundary", partitionRole: "S", cells: ["SmP", "smP"] },
  { type: "boundary", partitionRole: "S", cells: ["Smp", "smp"] },
  { type: "boundary", partitionRole: "M", cells: ["SMP", "SmP"] },
  { type: "boundary", partitionRole: "M", cells: ["SMp", "Smp"] },
  { type: "boundary", partitionRole: "M", cells: ["sMP", "smP"] },
  { type: "boundary", partitionRole: "M", cells: ["sMp", "smp"] },
  { type: "boundary", partitionRole: "P", cells: ["SMP", "SMp"] },
  { type: "boundary", partitionRole: "P", cells: ["sMP", "sMp"] },
  { type: "boundary", partitionRole: "P", cells: ["SmP", "Smp"] },
  { type: "boundary", partitionRole: "P", cells: ["smP", "smp"] },
];

const BILITERAL_BOUNDARIES: readonly Extract<
  BiliteralCounterAnchor,
  { readonly type: "boundary" }
>[] = [
  { type: "boundary", partitionRole: "S", cells: ["SP", "sP"] },
  { type: "boundary", partitionRole: "S", cells: ["Sp", "sp"] },
  { type: "boundary", partitionRole: "P", cells: ["SP", "Sp"] },
  { type: "boundary", partitionRole: "P", cells: ["sP", "sp"] },
];

export function createTriliteralCounterTargets():
  readonly TriliteralCounterTarget[] {
  return [
    ...DIAGRAM_CELL_IDS.map((cell) => {
      const anchor = { type: "cell" as const, cell };
      return {
        key: `triliteral:cell:${cell}` as const,
        anchor,
        position: resolveTriliteralCounterPosition(anchor),
      };
    }),
    ...TRILITERAL_BOUNDARIES.map((anchor) => {
      const cells = orderedPair(anchor.cells, triliteralIndex);
      return {
        key:
          `triliteral:boundary:${anchor.partitionRole}:${cells[0]}:${cells[1]}` as TriliteralCounterTargetKey,
        anchor: { ...anchor, cells },
        position: resolveTriliteralCounterPosition(anchor),
      };
    }),
  ];
}

export function createBiliteralCounterTargets():
  readonly BiliteralCounterTarget[] {
  return [
    ...BILITERAL_CELLS.map((cell) => {
      const anchor = { type: "cell" as const, cell };
      return {
        key: `biliteral:cell:${cell}` as const,
        anchor,
        position: resolveBiliteralCounterPosition(anchor),
      };
    }),
    ...BILITERAL_BOUNDARIES.map((anchor) => {
      const cells = orderedPair(anchor.cells, biliteralIndex);
      return {
        key:
          `biliteral:boundary:${anchor.partitionRole}:${cells[0]}:${cells[1]}` as BiliteralCounterTargetKey,
        anchor: { ...anchor, cells },
        position: resolveBiliteralCounterPosition(anchor),
      };
    }),
  ];
}

export function findTriliteralCounterTarget(
  key: string,
): TriliteralCounterTarget {
  const target = createTriliteralCounterTargets().find(
    (candidate) => candidate.key === key,
  );
  if (target === undefined) {
    throw new Error(`Unknown triliteral counter target: "${key}".`);
  }
  return target;
}

export function findBiliteralCounterTarget(
  key: string,
): BiliteralCounterTarget {
  const target = createBiliteralCounterTargets().find(
    (candidate) => candidate.key === key,
  );
  if (target === undefined) {
    throw new Error(`Unknown biliteral counter target: "${key}".`);
  }
  return target;
}
