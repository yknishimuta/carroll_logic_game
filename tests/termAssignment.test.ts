import { describe, expect, it } from "vitest";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import { assignTermRoles } from "../src/logic/termAssignment";

describe("assignTermRoles", () => {
  it("assigns M, S, and P from the two premises", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: {
        form: "A",
        subject: "動物",
        predicate: "死すべきもの",
      },
      secondPremise: {
        form: "A",
        subject: "人間",
        predicate: "動物",
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
        subject: "P-term",
        predicate: "M-term",
      },
      secondPremise: {
        form: "I",
        subject: "M-term",
        predicate: "S-term",
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
      firstPremise: { form: "A", subject: "a", predicate: "b" },
      secondPremise: { form: "A", subject: "c", predicate: "d" },
    };

    expect(() => assignTermRoles(syllogism)).toThrow(
      "exactly one term shared",
    );
  });

  it("rejects a structure containing fewer than three distinct terms", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: { form: "A", subject: "a", predicate: "b" },
      secondPremise: { form: "A", subject: "a", predicate: "b" },
    };

    expect(() => assignTermRoles(syllogism)).toThrow(
      "exactly one term shared",
    );
  });
});
