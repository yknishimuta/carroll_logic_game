import type { BiliteralDiagramState } from "../domain/conclusion";
import type { ConclusionCounterPlacementResult } from "../domain/counterPlacement";
import { createBiliteralCounterPlacements } from "./counterPlacements";

export function createConclusionDisplayState(
  state: BiliteralDiagramState,
): BiliteralDiagramState {
  return state;
}

export function createConclusionCounterPlacements(
  state: BiliteralDiagramState,
): ConclusionCounterPlacementResult {
  const displayState = createConclusionDisplayState(state);
  const placementResult = createBiliteralCounterPlacements(displayState);

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
    displayState,
    placements: placementResult.placements,
  };
}
