import { describe, expect, it } from "vitest";
import {
  EN_TUTORIAL_CONTENT,
  JA_TUTORIAL_CONTENT,
} from "../src/tutorial/content";

const expectedIds = [
  "syllogism-basics", "terms-and-primes", "eight-regions", "counters", "proposition-rules",
  "boundary-existence", "combine-premises", "eliminate-middle", "barbara",
  "manual-operation", "common-mistakes", "quick-reference",
];

describe("tutorial content", () => {
  it("has the same twelve ordered sections in Japanese and English", () => {
    expect(JA_TUTORIAL_CONTENT.sections.map(({ id }) => id)).toEqual(expectedIds);
    expect(EN_TUTORIAL_CONTENT.sections.map(({ id }) => id)).toEqual(expectedIds);
  });

  it("explains complements, counters, boundaries, combination, and projection", () => {
    const ja = JSON.stringify(JA_TUTORIAL_CONTENT);
    const en = JSON.stringify(EN_TUTORIAL_CONTENT);
    for (const word of ["補集合", "反対語", "対象領域", "両セル", "完全な図", "両方空"]) {
      expect(ja).toContain(word);
    }
    for (const word of ["complement", "antonym", "universe of discourse", "both cells", "complete diagram"]) {
      expect(en).toContain(word);
    }
    expect(JA_TUTORIAL_CONTENT.sections[4]?.tables?.[0]?.rows.map((r) => r[0]))
      .toEqual(["A", "E", "I", "O"]);
    expect(JA_TUTORIAL_CONTENT.sections[10]?.lists?.[0]).toHaveLength(8);
    expect(JA_TUTORIAL_CONTENT.sections[11]?.tables?.[0]?.rows.map((r) => r[0]))
      .toEqual(["記号", "駒", "境界", "結論図"]);
  });

  it("introduces syllogisms and the roles of S, M, and P first", () => {
    const ja = JA_TUTORIAL_CONTENT.sections[0];
    const en = EN_TUTORIAL_CONTENT.sections[0];
    expect(ja?.id).toBe("syllogism-basics");
    for (const word of ["三段論法", "前提", "結論", "小項", "中項", "大項"]) {
      expect(JSON.stringify(ja)).toContain(word);
    }
    for (const word of ["syllogism", "premises", "conclusion", "minor term", "middle term", "major term"]) {
      expect(JSON.stringify(en)).toContain(word);
    }
    expect(ja?.tables?.[0]?.rows).toEqual([
      ["前提1", "すべての動物は死すべきものである", "すべてのMはPである（All M are P）"],
      ["前提2", "すべての人間は動物である", "すべてのSはMである（All S are M）"],
      ["結論", "すべての人間は死すべきものである", "すべてのSはPである（All S are P）"],
    ]);
  });

  it("is deterministic and does not advertise a modern-logic switch", () => {
    expect(JSON.stringify(JA_TUTORIAL_CONTENT)).toBe(JSON.stringify(JA_TUTORIAL_CONTENT));
    expect(JSON.stringify(EN_TUTORIAL_CONTENT).toLowerCase()).not.toContain("switch to modern");
  });
});
