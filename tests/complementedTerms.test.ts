import { describe, expect, it } from "vitest";
import { computeProblem } from "../src/app/problemComputation";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import {
  oracleConclusionIsEntailed,
  oracleEntailedForms,
} from "./helpers/semanticOracle";
import { projectToBiliteralDiagram } from "../src/logic/biliteralProjection";

function compute(id: string, premises: ConcreteSyllogism) {
  return computeProblem({ id, premises });
}

describe("complemented terms in syllogisms", () => {
  it("derives Some S are P from Some M are P and No M are S′", () => {
    // Carroll, Symbolic Logic, Part I, Book VIII, Chapter I, §6, No. 1.
    const result = compute("carroll-viii-i-6-1", {
      firstPremise: {
        form: "I",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "student", complemented: false },
      },
      secondPremise: {
        form: "E",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "human", complemented: true },
      },
    });

    expect(result.combinedState.emptyCells).toEqual(["sMP", "sMp"]);
    expect(result.combinedState.existentials).toContainEqual({
      sourceId: "first-premise",
      possibleCells: ["SMP"],
    });
    expect(projectToBiliteralDiagram(result.combinedState).existentials)
      .toContainEqual({ sourceId: "first-premise", possibleCells: ["SP"] });
    expect(result.abstractConclusion).toEqual({
      form: "I",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    });
    expect(result.concreteConclusion).toEqual({
      form: "I",
      subject: { termId: "human", complemented: false },
      predicate: { termId: "student", complemented: false },
    });
    expect(result.conclusionPlacements.existenceCounters).toEqual([{
      kind: "existence",
      sourceIds: ["first-premise"],
      anchor: { type: "cell", cell: "SP" },
    }]);
    expect(oracleEntailedForms(result.abstractPremises, DEFAULT_LOGIC_SETTINGS))
      .toContain("I");
    expect(oracleConclusionIsEntailed(
      result.abstractPremises,
      {
        form: "I",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      DEFAULT_LOGIC_SETTINGS,
    )).toBe(true);
    expect(oracleConclusionIsEntailed(
      result.abstractPremises,
      {
        form: "I",
        subject: { role: "S", complemented: true },
        predicate: { role: "P", complemented: false },
      },
      DEFAULT_LOGIC_SETTINGS,
    )).toBe(false);
  });

  it("keeps S′ in Some S′ are P when No M are S excludes S", () => {
    const result = compute("opposite-polarity", {
      firstPremise: {
        form: "I",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "student", complemented: false },
      },
      secondPremise: {
        form: "E",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "human", complemented: false },
      },
    });

    expect(result.combinedState.existentials).toContainEqual({
      sourceId: "first-premise",
      possibleCells: ["sMP"],
    });
    expect(projectToBiliteralDiagram(result.combinedState).existentials)
      .toContainEqual({ sourceId: "first-premise", possibleCells: ["sP"] });
    expect(result.abstractConclusion).toEqual({
      form: "I",
      subject: { role: "S", complemented: true },
      predicate: { role: "P", complemented: false },
    });
    expect(result.conclusionPlacements.existenceCounters[0]?.anchor)
      .toEqual({ type: "cell", cell: "sP" });
  });

  it("projects Carroll Book VIII §6 No. 11 to the correct Sp quarter", () => {
    const result = compute("carroll-viii-i-6-11", {
      firstPremise: {
        form: "A",
        subject: { termId: "student", complemented: false },
        predicate: { termId: "animal", complemented: true },
      },
      secondPremise: {
        form: "I",
        subject: { termId: "human", complemented: false },
        predicate: { termId: "animal", complemented: false },
      },
    });

    expect(result.abstractConclusion).toEqual({
      form: "O",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    });
    expect(result.conclusionPlacements.existenceCounters[0]?.anchor)
      .toEqual({ type: "cell", cell: "Sp" });
  });

  it("keeps P′ in All S are P′ for Carroll Book VIII §6 No. 30", () => {
    const result = compute("carroll-viii-i-6-30", {
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

    expect(result.abstractConclusion).toEqual({
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    });
    expect(result.conclusionPlacements.emptinessCounters[0]?.anchor)
      .toEqual({ type: "cell", cell: "SP" });
    expect(result.conclusionPlacements.existenceCounters[0]?.anchor)
      .toEqual({ type: "cell", cell: "Sp" });
  });

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
