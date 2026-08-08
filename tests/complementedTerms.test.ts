import { describe, expect, it } from "vitest";
import { computeProblem } from "../src/app/problemComputation";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { oracleEntailedForms } from "./helpers/semanticOracle";

function compute(id: string, premises: ConcreteSyllogism) {
  return computeProblem({ id, premises });
}

describe("complemented terms in syllogisms", () => {
  it("infers All S′ are P and places O in sp and I in sP", () => {
    const result = compute("prime-subject", {
      firstPremise: {
        form: "A",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "mortal", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "human", complemented: true },
        predicate: { termId: "animal", complemented: false },
      },
    });

    expect(result.conclusionForms).toEqual(["A"]);
    expect(oracleEntailedForms(
      result.abstractPremises,
      DEFAULT_LOGIC_SETTINGS,
    )).toEqual(["A", "I"]);
    expect(result.abstractConclusion).toEqual({
      form: "A",
      subject: { role: "S", complemented: true },
      predicate: { role: "P", complemented: false },
    });
    expect(result.concreteConclusion).toEqual({
      form: "A",
      subject: { termId: "human", complemented: true },
      predicate: { termId: "mortal", complemented: false },
    });
    expect(result.conclusionPlacements).toEqual({
      emptinessCounters: [{ kind: "emptiness", anchor: { type: "cell", cell: "sp" } }],
      existenceCounters: [{
        kind: "existence",
        sourceIds: ["second-premise"],
        anchor: { type: "cell", cell: "sP" },
      }],
    });
  });

  it("infers All S are P′ and places O in SP and I in Sp", () => {
    const result = compute("prime-predicate", {
      firstPremise: {
        form: "A",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "mortal", complemented: true },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "human", complemented: false },
        predicate: { termId: "animal", complemented: false },
      },
    });

    expect(result.conclusionForms).toEqual(["A"]);
    expect(result.abstractConclusion).toEqual({
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    });
    expect(result.conclusionPlacements).toEqual({
      emptinessCounters: [{ kind: "emptiness", anchor: { type: "cell", cell: "SP" } }],
      existenceCounters: [{
        kind: "existence",
        sourceIds: ["second-premise"],
        anchor: { type: "cell", cell: "Sp" },
      }],
    });
  });

  it("treats complemented middle occurrences as the same middle term", () => {
    const result = compute("prime-middle", {
      firstPremise: {
        form: "A",
        subject: { termId: "animal", complemented: true },
        predicate: { termId: "mortal", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "human", complemented: false },
        predicate: { termId: "animal", complemented: true },
      },
    });

    expect(result.assignment).toEqual({ M: "animal", S: "human", P: "mortal" });
    expect(result.abstractPremises.firstPremise.subject).toEqual({
      role: "M",
      complemented: true,
    });
    expect(result.abstractPremises.secondPremise.predicate).toEqual({
      role: "M",
      complemented: true,
    });
    expect(result.abstractConclusion).toEqual({
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    });
  });
});
