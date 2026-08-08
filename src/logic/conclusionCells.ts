import {
  BILITERAL_CELLS,
  type BiliteralCell,
} from "../domain/conclusion";
import type { AbstractTermOccurrence } from "../domain/term";

function belongsToBaseTerm(
  cell: BiliteralCell,
  occurrence: AbstractTermOccurrence,
): boolean {
  const symbol = occurrence.role === "S" ? cell[0] : cell[1];
  const belongs = symbol === occurrence.role;
  return occurrence.complemented ? !belongs : belongs;
}

export function conclusionCells(
  subject: AbstractTermOccurrence,
  predicate: AbstractTermOccurrence,
): { readonly positive: BiliteralCell; readonly negative: BiliteralCell } {
  if (subject.role !== "S" || predicate.role !== "P") {
    throw new Error("A conclusion requires S as subject and P as predicate.");
  }
  const positive = BILITERAL_CELLS.find((cell) =>
    belongsToBaseTerm(cell, subject) && belongsToBaseTerm(cell, predicate)
  );
  const negative = BILITERAL_CELLS.find((cell) =>
    belongsToBaseTerm(cell, subject) && !belongsToBaseTerm(cell, predicate)
  );
  if (positive === undefined || negative === undefined) {
    throw new Error("The biliteral conclusion cells could not be determined.");
  }
  return { positive, negative };
}
