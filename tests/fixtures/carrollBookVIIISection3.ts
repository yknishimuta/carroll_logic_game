import type { BiliteralCell } from "../../src/domain/conclusion";
import type {
  DiagramCellId,
  TriliteralDiagramState,
} from "../../src/domain/diagram";
import {
  carrollSource,
  type CarrollBiliteralInformation,
  type CarrollSourceMetadata,
} from "../helpers/carrollBookVIII";

export interface CarrollBookVIIISection3Case {
  readonly section: 3;
  readonly number: number;
  readonly source: CarrollSourceMetadata;
  readonly sourceDiagram: TriliteralDiagramState;
  readonly sourceAnswerText: string;
  readonly expectedBiliteralInformation: CarrollBiliteralInformation;
}

type ExistenceAnchor =
  | DiagramCellId
  | readonly [DiagramCellId, DiagramCellId];

function section3Case(
  number: number,
  emptyCells: readonly DiagramCellId[],
  existenceAnchors: readonly ExistenceAnchor[],
  sourceAnswerText: string,
  expectedEmptyCells: readonly BiliteralCell[],
  expectedOccupiedCells: readonly BiliteralCell[],
): CarrollBookVIIISection3Case {
  return {
    section: 3,
    number,
    source: carrollSource(3, number),
    sourceDiagram: {
      emptyCells,
      existentials: existenceAnchors.map((anchor, index) => ({
        sourceId: `carroll-viii-3-${String(number).padStart(2, "0")}-i${index + 1}`,
        possibleCells: typeof anchor === "string" ? [anchor] : anchor,
      })),
    },
    sourceAnswerText,
    expectedBiliteralInformation: {
      emptyCells: expectedEmptyCells,
      occupiedCells: expectedOccupiedCells,
    },
  };
}

// Source diagrams were transcribed visually from Book VIII, Chapter I, §3,
// printed page 99. Expected information is a fixed transcription of
// Chapter II, “Answers to §3”, printed page 127.
export const CARROLL_BOOK_VIII_SECTION_3 = [
  section3Case(1, ["SMp", "SmP", "sMp", "smP"], ["SMP"],
    "Some xy exist, or some x are y, or some y are x.", [], ["SP"]),
  section3Case(2, ["SMp", "SmP", "sMp", "smP"], [["SMp", "sMp"]],
    "No information.", [], []),
  section3Case(3, ["SMP", "SMp", "Smp", "smp"], ["sMp"],
    "All y′ are x′.", ["Sp"], ["sp"]),
  section3Case(4, ["SMP", "SmP", "Smp", "sMP"], [["SMp", "sMp"]],
    "No xy exist, &c.", ["SP"], []),
  section3Case(5, ["SMp", "sMp", "smP", "smp"], ["Smp"],
    "All y′ are x.", ["sp"], ["Sp"]),
  section3Case(6, ["SmP", "Smp", "sMp", "smp"], ["smP"],
    "All x′ are y.", ["sp"], ["sP"]),
  section3Case(7, ["SMp", "SmP", "Smp", "sMp"], ["SMP"],
    "All x are y.", ["Sp"], ["SP"]),
  section3Case(8, ["SMP", "sMP", "smP"], ["SmP", "sMp"],
    "All x′ are y′, and all y are x.", ["sP"], ["SP", "sp"]),
  section3Case(9, ["SMP", "sMP", "smP", "smp"], ["sMp"],
    "All x′ are y′.", ["sP"], ["sp"]),
  section3Case(10, ["SMP", "SmP", "Smp", "sMP"], ["SMp"],
    "All x are y′.", ["SP"], ["Sp"]),
  section3Case(11, ["SmP", "Smp", "sMP", "smp"], [["SMP", "SMp"]],
    "No information.", [], []),
  section3Case(12, ["SmP", "smP"], [["SMP", "sMP"], "smp"],
    "Some x′y′ exist, &c.", [], ["sp"]),
  section3Case(13, ["SMp", "sMp", "SmP", "smP"], ["Smp"],
    "Some xy′ exist, &c.", [], ["Sp"]),
  section3Case(14, ["SMp", "sMp", "SmP", "Smp"], [["smP", "smp"]],
    "No xy′ exist, &c.", ["Sp"], []),
  section3Case(15, ["sMP", "sMp"], ["SMP"],
    "Some xy exist, &c.", [], ["SP"]),
  section3Case(16, ["sMP", "smP", "smp"], ["SmP"],
    "All y are x.", ["sP"], ["SP"]),
  section3Case(17, ["Smp", "sMP", "sMp", "smp"], ["SMp", "smP"],
    "All x′ are y, and all y′ are x.", ["sp"], ["Sp", "sP"]),
  section3Case(18, ["SMP", "SmP", "Smp", "sMP"], ["SMp", "smP"],
    "All x are y′, and all y are x′.", ["SP"], ["Sp", "sP"]),
  section3Case(19, ["SMp", "SmP", "Smp", "sMp"], ["SMP", "smp"],
    "All x are y, and all y′ are x′.", ["Sp"], ["SP", "sp"]),
  section3Case(20, ["SMP", "SMp", "SmP", "smP"], ["sMP"],
    "All y are x′.", ["SP"], ["sP"]),
] as const satisfies readonly CarrollBookVIIISection3Case[];
