import {
  BILITERAL_CELLS,
  type BiliteralCell,
  type BiliteralDiagramState,
} from "../domain/conclusion";
import type {
  ConclusionCounterPlacementResult,
  ConclusionDisplayStateResult,
} from "../domain/counterPlacement";
import type { PropositionForm } from "../domain/proposition";
import { abstractTerm, type AbstractTermOccurrence } from "../domain/term";
import { createBiliteralCounterPlacements } from "./counterPlacements";
import { conclusionCells } from "./conclusionCells";

function hasExactExistence(
  state: BiliteralDiagramState,
  cell: BiliteralCell,
): boolean {
  return state.existentials.some(
    (existential) =>
      existential.possibleCells.length === 1 &&
      existential.possibleCells[0] === cell,
  );
}

export function createConclusionDisplayState(
  state: BiliteralDiagramState,
  entailedForms: readonly PropositionForm[],
  subject: AbstractTermOccurrence = abstractTerm("S"),
  predicate: AbstractTermOccurrence = abstractTerm("P"),
): ConclusionDisplayStateResult {
  const forms = new Set(entailedForms);
  const sourceEmptyCells = new Set(state.emptyCells);
  const requiredEmptyCells = new Set<BiliteralCell>();
  const cells = conclusionCells(subject, predicate);

  if (forms.has("A")) {
    if (!sourceEmptyCells.has(cells.negative)) {
      return {
        ok: false,
        reason: "entailed-form-not-supported-by-state",
        form: "A",
      };
    }
    requiredEmptyCells.add(cells.negative);
  }

  if (forms.has("E")) {
    if (!sourceEmptyCells.has(cells.positive)) {
      return {
        ok: false,
        reason: "entailed-form-not-supported-by-state",
        form: "E",
      };
    }
    requiredEmptyCells.add(cells.positive);
  }

  if (forms.has("I") && !hasExactExistence(state, cells.positive)) {
    return {
      ok: false,
      reason: "entailed-form-not-supported-by-state",
      form: "I",
    };
  }

  if (forms.has("O") && !hasExactExistence(state, cells.negative)) {
    return {
      ok: false,
      reason: "entailed-form-not-supported-by-state",
      form: "O",
    };
  }

  const displayCells = new Set<BiliteralCell>();
  if (forms.has("I")) {
    displayCells.add(cells.positive);
  }
  if (forms.has("O")) {
    displayCells.add(cells.negative);
  }

  return {
    ok: true,
    state: {
      emptyCells: BILITERAL_CELLS.filter((cell) =>
        requiredEmptyCells.has(cell),
      ),
      existentials: state.existentials
        .filter(
          (existential) =>
            existential.possibleCells.length === 1 &&
            displayCells.has(existential.possibleCells[0]!),
        )
        .map((existential) => ({
          sourceId: existential.sourceId,
          possibleCells: [...existential.possibleCells],
        })),
    },
  };
}

export function createConclusionCounterPlacements(
  state: BiliteralDiagramState,
  entailedForms: readonly PropositionForm[],
  subject: AbstractTermOccurrence = abstractTerm("S"),
  predicate: AbstractTermOccurrence = abstractTerm("P"),
): ConclusionCounterPlacementResult {
  const displayResult = createConclusionDisplayState(
    state,
    entailedForms,
    subject,
    predicate,
  );

  if (!displayResult.ok) {
    return {
      ok: false,
      stage: "conclusion-display",
      reason: displayResult.reason,
      form: displayResult.form,
    };
  }

  const placementResult = createBiliteralCounterPlacements(
    displayResult.state,
  );

  if (!placementResult.ok) {
    return {
      ok: false,
      stage: "counter-placement",
      reason: placementResult.reason,
      sourceId: placementResult.sourceId,
      possibleCells: placementResult.possibleCells,
    };
  }

  return {
    ok: true,
    displayState: displayResult.state,
    placements: placementResult.placements,
  };
}
