import { describe, expect, it } from "vitest";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import { assignTermRoles } from "../src/logic/termAssignment";

describe("assignTermRoles", () => {
  it("assigns M, S, and P from the two premises", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: {
        form: "A",
        subject: { termId: "動物", complemented: false },
        predicate: { termId: "死すべきもの", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "人間", complemented: false },
        predicate: { termId: "動物", complemented: false },
      },
    };

    expect(assignTermRoles(syllogism)).toEqual({
      M: "動物",
      S: "人間",
      P: "死すべきもの",
    });
  });

  it("uses premise membership rather than term position", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: {
        form: "E",
        subject: { termId: "P-term", complemented: false },
        predicate: { termId: "M-term", complemented: false },
      },
      secondPremise: {
        form: "I",
        subject: { termId: "M-term", complemented: false },
        predicate: { termId: "S-term", complemented: false },
      },
    };

    expect(assignTermRoles(syllogism)).toEqual({
      M: "M-term",
      S: "S-term",
      P: "P-term",
    });
  });

  it("rejects premises with no shared term", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: { form: "A", subject: { termId: "a", complemented: false }, predicate: { termId: "b", complemented: false } },
      secondPremise: { form: "A", subject: { termId: "c", complemented: false }, predicate: { termId: "d", complemented: false } },
    };

    expect(() => assignTermRoles(syllogism)).toThrow(
      "exactly one term shared",
    );
  });

  it("rejects a structure containing fewer than three distinct terms", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: { form: "A", subject: { termId: "a", complemented: false }, predicate: { termId: "b", complemented: false } },
      secondPremise: { form: "A", subject: { termId: "a", complemented: false }, predicate: { termId: "b", complemented: false } },
    };

    expect(() => assignTermRoles(syllogism)).toThrow(
      "exactly one term shared",
    );
  });

  it("treats a term and its complement as the same base middle term", () => {
    expect(assignTermRoles({
      firstPremise: {
        form: "A",
        subject: { termId: "animal", complemented: true },
        predicate: { termId: "mortal", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "human", complemented: false },
        predicate: { termId: "animal", complemented: false },
      },
    })).toEqual({ M: "animal", S: "human", P: "mortal" });
  });

  it("does not count normal and complemented occurrences as distinct terms", () => {
    expect(() => assignTermRoles({
      firstPremise: {
        form: "A",
        subject: { termId: "animal", complemented: false },
        predicate: { termId: "animal", complemented: true },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "human", complemented: false },
        predicate: { termId: "animal", complemented: false },
      },
    })).toThrow("distinct terms");
  });
});
