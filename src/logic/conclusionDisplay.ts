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
import { createBiliteralCounterPlacements } from "./counterPlacements";

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
): ConclusionDisplayStateResult {
  const forms = new Set(entailedForms);
  const sourceEmptyCells = new Set(state.emptyCells);
  const requiredEmptyCells = new Set<BiliteralCell>();

  if (forms.has("A")) {
    if (!sourceEmptyCells.has("Sp")) {
      return {
        ok: false,
        reason: "entailed-form-not-supported-by-state",
        form: "A",
      };
    }
    requiredEmptyCells.add("Sp");
  }

  if (forms.has("E")) {
    if (!sourceEmptyCells.has("SP")) {
      return {
        ok: false,
        reason: "entailed-form-not-supported-by-state",
        form: "E",
      };
    }
    requiredEmptyCells.add("SP");
  }

  if (forms.has("I") && !hasExactExistence(state, "SP")) {
    return {
      ok: false,
      reason: "entailed-form-not-supported-by-state",
      form: "I",
    };
  }

  if (forms.has("O") && !hasExactExistence(state, "Sp")) {
    return {
      ok: false,
      reason: "entailed-form-not-supported-by-state",
      form: "O",
    };
  }

  const displayCells = new Set<BiliteralCell>();
  if (forms.has("I")) {
    displayCells.add("SP");
  }
  if (forms.has("O")) {
    displayCells.add("Sp");
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
): ConclusionCounterPlacementResult {
  const displayResult = createConclusionDisplayState(
    state,
    entailedForms,
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
