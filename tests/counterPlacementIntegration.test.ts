import { describe, expect, it } from "vitest";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import {
  createTriliteralCounterPlacements,
} from "../src/logic/counterPlacements";
import { createConclusionCounterPlacements } from "../src/logic/conclusionDisplay";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";

const carroll: LogicSettings = { existentialImport: "carroll" };
const modern: LogicSettings = { existentialImport: "modern" };

const syllogisms = {
  barbara: {
    firstPremise: { form: "A", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "A", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  celarent: {
    firstPremise: { form: "E", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "A", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  darii: {
    firstPremise: { form: "A", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "I", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  ferio: {
    firstPremise: { form: "E", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "I", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  invalid: {
    firstPremise: { form: "A", subject: { role: "P", complemented: false }, predicate: { role: "M", complemented: false } },
    secondPremise: { form: "A", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
} as const satisfies Record<string, AbstractSyllogism>;

function inferPlacements(
  syllogism: AbstractSyllogism,
  settings: LogicSettings,
) {
  const inference = inferSyllogismConclusion(syllogism, settings);
  expect(inference.ok).toBe(true);
  if (!inference.ok) {
    throw new Error(inference.reason);
  }

  const triliteral = createTriliteralCounterPlacements(
    inference.triliteralState,
  );
  const conclusion = createConclusionCounterPlacements(
    inference.biliteralState,
    inference.entailedForms,
  );

  expect(triliteral.ok).toBe(true);
  expect(conclusion.ok).toBe(true);

  if (!triliteral.ok || !conclusion.ok) {
    throw new Error("Expected successful counter placement.");
  }

  return { inference, triliteral, conclusion };
}

describe("counter placement integration", () => {
  it("creates Barbara Carroll conclusion counters only", () => {
    const { conclusion } = inferPlacements(syllogisms.barbara, carroll);

    expect(conclusion.placements).toEqual({
      emptinessCounters: [
        { kind: "emptiness", anchor: { type: "cell", cell: "Sp" } },
      ],
      existenceCounters: [
        {
          kind: "existence",
          sourceIds: ["second-premise"],
          anchor: { type: "cell", cell: "SP" },
        },
      ],
    });
  });

  it("creates Celarent Carroll conclusion counters", () => {
    const { conclusion } = inferPlacements(syllogisms.celarent, carroll);

    expect(conclusion.placements).toEqual({
      emptinessCounters: [
        { kind: "emptiness", anchor: { type: "cell", cell: "SP" } },
      ],
      existenceCounters: [
        {
          kind: "existence",
          sourceIds: ["second-premise"],
          anchor: { type: "cell", cell: "Sp" },
        },
      ],
    });
  });

  it("creates only an SP existence counter for Darii", () => {
    const { conclusion } = inferPlacements(syllogisms.darii, carroll);

    expect(conclusion.placements).toEqual({
      emptinessCounters: [],
      existenceCounters: [
        {
          kind: "existence",
          sourceIds: ["second-premise"],
          anchor: { type: "cell", cell: "SP" },
        },
      ],
    });
  });

  it("creates only an Sp existence counter for Ferio", () => {
    const { conclusion } = inferPlacements(syllogisms.ferio, carroll);

    expect(conclusion.placements).toEqual({
      emptinessCounters: [],
      existenceCounters: [
        {
          kind: "existence",
          sourceIds: ["second-premise"],
          anchor: { type: "cell", cell: "Sp" },
        },
      ],
    });
  });

  it("creates empty conclusion placements for an invalid form", () => {
    const { conclusion } = inferPlacements(syllogisms.invalid, carroll);

    expect(conclusion.displayState).toEqual({
      emptyCells: [],
      existentials: [],
    });
    expect(conclusion.placements).toEqual({
      emptinessCounters: [],
      existenceCounters: [],
    });
  });

  it.each([
    ["Barbara", syllogisms.barbara, "Sp"],
    ["Celarent", syllogisms.celarent, "SP"],
  ] as const)(
    "omits existence counters for modern %s",
    (_name, syllogism, emptyCell) => {
      const { conclusion } = inferPlacements(syllogism, modern);

      expect(conclusion.placements).toEqual({
        emptinessCounters: [
          {
            kind: "emptiness",
            anchor: { type: "cell", cell: emptyCell },
          },
        ],
        existenceCounters: [],
      });
    },
  );
});
