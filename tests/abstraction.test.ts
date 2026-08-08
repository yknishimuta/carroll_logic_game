import { describe, expect, it } from "vitest";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import { abstractProposition, abstractSyllogism } from "../src/logic/abstraction";

describe("abstractProposition", () => {
  it("replaces concrete terms with their assigned roles", () => {
    expect(
      abstractProposition(
        { form: "A", subject: { termId: "動物", complemented: false }, predicate: { termId: "死すべきもの", complemented: false } },
        { M: "動物", S: "人間", P: "死すべきもの" },
      ),
    ).toEqual({
      form: "A",
      subject: { role: "M", complemented: false },
      predicate: { role: "P", complemented: false },
    });
  });

  it("rejects a term absent from the assignment", () => {
    expect(() =>
      abstractProposition(
        { form: "A", subject: { termId: "未知", complemented: false }, predicate: { termId: "動物", complemented: false } },
        { M: "動物", S: "人間", P: "死すべきもの" },
      ),
    ).toThrow('Term "未知" is not present');
  });

  it("preserves complemented occurrences while replacing the base term", () => {
    expect(
      abstractProposition(
        {
          form: "A",
          subject: { termId: "human", complemented: false },
          predicate: { termId: "animal", complemented: true },
        },
        { S: "human", M: "animal", P: "mortal" },
      ),
    ).toEqual({
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "M", complemented: true },
    });
  });
});

describe("abstractSyllogism", () => {
  it("automatically assigns and abstracts both premises", () => {
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

    expect(abstractSyllogism(syllogism)).toEqual({
      firstPremise: {
        form: "A",
        subject: { role: "M", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "M", complemented: false },
      },
    });
  });

  it("preserves proposition forms", () => {
    const syllogism: ConcreteSyllogism = {
      firstPremise: { form: "E", subject: { termId: "P-term", complemented: false }, predicate: { termId: "M-term", complemented: false } },
      secondPremise: { form: "O", subject: { termId: "M-term", complemented: false }, predicate: { termId: "S-term", complemented: false } },
    };

    expect(abstractSyllogism(syllogism)).toEqual({
      firstPremise: { form: "E", subject: { role: "P", complemented: false }, predicate: { role: "M", complemented: false } },
      secondPremise: { form: "O", subject: { role: "M", complemented: false }, predicate: { role: "S", complemented: false } },
    });
  });
});
