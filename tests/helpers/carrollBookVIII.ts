import type {
  BiliteralCell,
  BiliteralDiagramState,
  SyllogismConclusion,
} from "../../src/domain/conclusion";
import {
  DIAGRAM_CELL_IDS,
  type DiagramCellId,
} from "../../src/domain/diagram";
import type {
  AbstractProposition,
  PropositionForm,
} from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import {
  abstractTerm,
  type AbstractTermOccurrence,
} from "../../src/domain/term";
import type { TriliteralCounterPlacementResult } from "../../src/domain/counterPlacement";

export const CARROLL_BOOK_VIII_SOURCE = {
  work: "Symbolic Logic, Part I: Elementary",
  edition: 4,
  year: 1897,
  book: 8,
  chapter: 1,
} as const;

export type CarrollLiteral = "x" | "x′" | "y" | "y′" | "m" | "m′";

const CARROLL_LITERAL_OCCURRENCES: Readonly<
  Record<CarrollLiteral, AbstractTermOccurrence>
> = {
  x: abstractTerm("S"),
  "x′": abstractTerm("S", true),
  y: abstractTerm("P"),
  "y′": abstractTerm("P", true),
  m: abstractTerm("M"),
  "m′": abstractTerm("M", true),
};

export function carrollProposition(
  form: PropositionForm,
  subject: CarrollLiteral,
  predicate: CarrollLiteral,
): AbstractProposition {
  return {
    form,
    subject: CARROLL_LITERAL_OCCURRENCES[subject],
    predicate: CARROLL_LITERAL_OCCURRENCES[predicate],
  };
}

export function carrollSyllogism(
  firstPremise: AbstractProposition,
  secondPremise: AbstractProposition,
): AbstractSyllogism {
  return { firstPremise, secondPremise };
}

export function carrollConclusion(
  form: PropositionForm,
  subject: "x" | "x′" | "y" | "y′",
  predicate: "x" | "x′" | "y" | "y′",
): SyllogismConclusion {
  return {
    form,
    subject: CARROLL_LITERAL_OCCURRENCES[subject],
    predicate: CARROLL_LITERAL_OCCURRENCES[predicate],
  };
}

export interface CarrollSourceMetadata {
  readonly work: typeof CARROLL_BOOK_VIII_SOURCE.work;
  readonly edition: typeof CARROLL_BOOK_VIII_SOURCE.edition;
  readonly year: typeof CARROLL_BOOK_VIII_SOURCE.year;
  readonly book: typeof CARROLL_BOOK_VIII_SOURCE.book;
  readonly chapter: typeof CARROLL_BOOK_VIII_SOURCE.chapter;
  readonly section: 2 | 3 | 4 | 5 | 6;
  readonly example: number;
}

export interface CarrollAnswerSourceMetadata {
  readonly work: typeof CARROLL_BOOK_VIII_SOURCE.work;
  readonly edition: typeof CARROLL_BOOK_VIII_SOURCE.edition;
  readonly year: typeof CARROLL_BOOK_VIII_SOURCE.year;
  readonly book: typeof CARROLL_BOOK_VIII_SOURCE.book;
  readonly chapter: 2;
  readonly section: 4 | 5 | 6;
  readonly example: number;
  readonly printedPages: readonly [number, number];
}

export function carrollSource(
  section: 2 | 3 | 4 | 5 | 6,
  example: number,
): CarrollSourceMetadata {
  return { ...CARROLL_BOOK_VIII_SOURCE, section, example };
}

export function carrollAnswerSource(
  section: 4 | 5 | 6,
  example: number,
): CarrollAnswerSourceMetadata {
  const printedPages = section === 4
    ? [127, 128] as const
    : section === 5
    ? [128, 130] as const
    : [130, 131] as const;
  return {
    ...CARROLL_BOOK_VIII_SOURCE,
    chapter: 2,
    section,
    example,
    printedPages,
  };
}

export type CarrollTriliteralExistence =
  | { readonly type: "cell"; readonly cell: DiagramCellId }
  | {
      readonly type: "boundary";
      readonly cells: readonly [DiagramCellId, DiagramCellId];
    };

export interface CarrollTriliteralDiagram {
  readonly emptyCells: readonly DiagramCellId[];
  readonly existence: readonly CarrollTriliteralExistence[];
}

function cellIndex(cell: DiagramCellId): number {
  return DIAGRAM_CELL_IDS.indexOf(cell);
}

function sortedCells(
  cells: readonly DiagramCellId[],
): readonly DiagramCellId[] {
  return [...cells].sort((left, right) => cellIndex(left) - cellIndex(right));
}

function normalizedExistenceKey(
  existence: CarrollTriliteralExistence,
): string {
  return existence.type === "cell"
    ? `cell:${existence.cell}`
    : `boundary:${existence.cells.join("/")}`;
}

export function normalizeCarrollTriliteralDiagram(
  result: TriliteralCounterPlacementResult,
): CarrollTriliteralDiagram {
  if (!result.ok) {
    throw new Error(`Cannot normalize invalid placements: ${result.reason}`);
  }
  const existence = result.placements.existenceCounters.map(({ anchor }) =>
    anchor.type === "cell"
      ? { type: "cell" as const, cell: anchor.cell }
      : {
          type: "boundary" as const,
          cells: sortedCells(anchor.cells) as readonly [
            DiagramCellId,
            DiagramCellId,
          ],
        }
  ).sort((left, right) =>
    normalizedExistenceKey(left).localeCompare(normalizedExistenceKey(right))
  );
  return {
    emptyCells: sortedCells(
      result.placements.emptinessCounters.map(({ anchor }) => {
        if (anchor.type !== "cell") {
          throw new Error("An emptiness counter must use a cell anchor.");
        }
        return anchor.cell;
      }),
    ),
    existence,
  };
}

export function normalizedCarrollExpectedDiagram(
  diagram: CarrollTriliteralDiagram,
): CarrollTriliteralDiagram {
  return {
    emptyCells: sortedCells(diagram.emptyCells),
    existence: [...diagram.existence].map((existence) =>
      existence.type === "cell"
        ? existence
        : {
            ...existence,
            cells: sortedCells(existence.cells) as readonly [
              DiagramCellId,
              DiagramCellId,
            ],
          }
    ).sort((left, right) =>
      normalizedExistenceKey(left).localeCompare(normalizedExistenceKey(right))
    ),
  };
}

export function certainBiliteralExistenceCells(
  state: BiliteralDiagramState,
): readonly string[] {
  return state.existentials
    .filter(({ possibleCells }) => possibleCells.length === 1)
    .map(({ possibleCells }) => possibleCells[0]!)
    .filter((cell, index, cells) => cells.indexOf(cell) === index)
    .sort();
}

export interface CarrollBiliteralInformation {
  readonly emptyCells: readonly BiliteralCell[];
  readonly occupiedCells: readonly BiliteralCell[];
}

const BILITERAL_CELL_ORDER: readonly BiliteralCell[] = [
  "SP",
  "Sp",
  "sP",
  "sp",
];

function sortedBiliteralCells(
  cells: readonly BiliteralCell[],
): readonly BiliteralCell[] {
  return [...new Set(cells)].sort((left, right) =>
    BILITERAL_CELL_ORDER.indexOf(left) - BILITERAL_CELL_ORDER.indexOf(right)
  );
}

export function normalizeCarrollBiliteralInformation(
  state: BiliteralDiagramState,
): CarrollBiliteralInformation {
  return {
    emptyCells: sortedBiliteralCells(state.emptyCells),
    occupiedCells: sortedBiliteralCells(
      state.existentials.flatMap(({ possibleCells }) =>
        possibleCells.length === 1 ? [possibleCells[0]!] : []
      ),
    ),
  };
}

export function normalizedCarrollExpectedBiliteralInformation(
  information: CarrollBiliteralInformation,
): CarrollBiliteralInformation {
  return {
    emptyCells: sortedBiliteralCells(information.emptyCells),
    occupiedCells: sortedBiliteralCells(information.occupiedCells),
  };
}

function biliteralBelongs(
  cell: "SP" | "Sp" | "sP" | "sp",
  occurrence: AbstractTermOccurrence,
): boolean {
  const symbol = occurrence.role === "S" ? cell[0] : cell[1];
  const belongs = symbol === occurrence.role;
  return occurrence.complemented ? !belongs : belongs;
}

export function isCarrollConclusionEntailedByBiliteralState(
  state: BiliteralDiagramState,
  conclusion: SyllogismConclusion,
): boolean {
  const cells = ["SP", "Sp", "sP", "sp"] as const;
  const positive = cells.find((cell) =>
    biliteralBelongs(cell, conclusion.subject) &&
    biliteralBelongs(cell, conclusion.predicate)
  );
  const negative = cells.find((cell) =>
    biliteralBelongs(cell, conclusion.subject) &&
    !biliteralBelongs(cell, conclusion.predicate)
  );
  if (positive === undefined || negative === undefined) {
    throw new Error("Carroll conclusion cells could not be determined.");
  }
  const empty = new Set(state.emptyCells);
  const certain = new Set(certainBiliteralExistenceCells(state));
  switch (conclusion.form) {
    case "A":
      return empty.has(negative) && certain.has(positive);
    case "E":
      return empty.has(positive);
    case "I":
      return certain.has(positive);
    case "O":
      return certain.has(negative);
  }
}

export function carrollConclusionEvidence(
  conclusion: SyllogismConclusion,
): readonly string[] {
  const cells = ["SP", "Sp", "sP", "sp"] as const;
  const positive = cells.find((cell) =>
    biliteralBelongs(cell, conclusion.subject) &&
    biliteralBelongs(cell, conclusion.predicate)
  );
  const negative = cells.find((cell) =>
    biliteralBelongs(cell, conclusion.subject) &&
    !biliteralBelongs(cell, conclusion.predicate)
  );
  if (positive === undefined || negative === undefined) {
    throw new Error("Carroll conclusion evidence could not be determined.");
  }
  switch (conclusion.form) {
    case "A":
      return [`empty:${negative}`, `existence:${positive}`].sort();
    case "E":
      return [`empty:${positive}`];
    case "I":
      return [`existence:${positive}`];
    case "O":
      return [`existence:${negative}`];
  }
}
