import type {
  ConstraintSourceId,
  DiagramCellId,
  DiagramConstraints,
} from "../domain/diagram";
import { DIAGRAM_CELL_IDS } from "../domain/diagram";
import {
  DEFAULT_LOGIC_SETTINGS,
  type LogicSettings,
} from "../domain/logicSettings";
import type { AbstractProposition } from "../domain/proposition";
import type { AbstractTermOccurrence, TermRole } from "../domain/term";

function belongsTo(cell: DiagramCellId, role: TermRole): boolean {
  return cell.includes(role);
}

function matchesOccurrence(
  cell: DiagramCellId,
  occurrence: AbstractTermOccurrence,
): boolean {
  const belongsToBaseTerm = belongsTo(cell, occurrence.role);
  return occurrence.complemented ? !belongsToBaseTerm : belongsToBaseTerm;
}

function cellsMatching(
  subject: AbstractTermOccurrence,
  subjectValue: boolean,
  predicate: AbstractTermOccurrence,
  predicateValue: boolean,
): readonly DiagramCellId[] {
  return DIAGRAM_CELL_IDS.filter(
    (cell) =>
      matchesOccurrence(cell, subject) === subjectValue &&
      matchesOccurrence(cell, predicate) === predicateValue,
  );
}

function ensureDistinctTerms(proposition: AbstractProposition): void {
  if (proposition.subject.role === proposition.predicate.role) {
    throw new Error(
      "A proposition constraint requires distinct subject and predicate terms.",
    );
  }
}

export function propositionToConstraints(
  proposition: AbstractProposition,
  sourceId: ConstraintSourceId = "proposition",
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): DiagramConstraints {
  ensureDistinctTerms(proposition);

  switch (proposition.form) {
    case "A": {
      const positiveCells = cellsMatching(
        proposition.subject,
        true,
        proposition.predicate,
        true,
      );

      return {
        emptyCells: cellsMatching(
          proposition.subject,
          true,
          proposition.predicate,
          false,
        ),
        existentials:
          settings.existentialImport === "carroll"
            ? [{ sourceId, possibleCells: positiveCells }]
            : [],
      };
    }
    case "E":
      return {
        emptyCells: cellsMatching(
          proposition.subject,
          true,
          proposition.predicate,
          true,
        ),
        existentials: [],
      };
    case "I":
      return {
        emptyCells: [],
        existentials: [
          {
            sourceId,
            possibleCells: cellsMatching(
              proposition.subject,
              true,
              proposition.predicate,
              true,
            ),
          },
        ],
      };
    case "O":
      return {
        emptyCells: [],
        existentials: [
          {
            sourceId,
            possibleCells: cellsMatching(
              proposition.subject,
              true,
              proposition.predicate,
              false,
            ),
          },
        ],
      };
  }
}
