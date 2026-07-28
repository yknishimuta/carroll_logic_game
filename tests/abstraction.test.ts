import { describe, expect, it } from "vitest";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import { abstractProposition, abstractSyllogism } from "../src/logic/abstraction";

describe("abstractProposition", () => {
  it("replaces concrete terms with their assigned roles", () => {
    expect(
      abstractProposition(
        { form: "A", subject: "動物", predicate: "死すべきもの" },
        { M: "動物", S: "人間", P: "死すべきもの" },
      ),
    ).toEqual({
      form: "A",
      subject: "M",
      predicate: "P",
    });
  });

  it("rejects a term absent from the assignment", () => {
    expect(() =>
      abstractProposition(
        { form: "A", subject: "未知", predicate: "動物" },
        { M: "動物", S: "人間", P: "死すべきもの" },
      ),
    ).toThrow('Term "未知" is not present');
  });
});

describe("abstractSyllogism", () => {
  it("automatically assigns and abstracts both premises", () => {
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

    expect(abstractSyllogism(syllogism)).toEqual({
      firstPremise: {
        form: "A",
        subject: "M",
        predicate: "P",
      },
      secondPremise: {
        form: "A",
        subject: "S",
        predicate: "M",
      },
    });
  });

  it("preserves proposition forms", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: { form: "E", subject: "P-term", predicate: "M-term" },
      secondPremise: { form: "O", subject: "M-term", predicate: "S-term" },
    };

    expect(abstractSyllogism(syllogism)).toEqual({
      firstPremise: { form: "E", subject: "P", predicate: "M" },
      secondPremise: { form: "O", subject: "M", predicate: "S" },
    });
  });
});
