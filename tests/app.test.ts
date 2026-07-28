import { describe, expect, it } from "vitest";
import { createInitialAppState } from "../src/app/state";
import { createGameViewModel } from "../src/app/viewModel";

describe("initial application model", () => {
  it("creates the problem phase with visible content", () => {
    const model = createGameViewModel(createInitialAppState());

    expect(model.phase).toBe("problem");
    expect(model.locale).toBe("ja");
    expect(model.problemSelector.selectedValue).toBe("barbara-aaa1");
    expect(model.title).not.toBe("");
    expect(model.concretePremises).toHaveLength(2);
    expect(model.diagram.kind).toBe("triliteral");
  });

  it("returns the expected Japanese title", () => {
    expect(createGameViewModel(createInitialAppState()).title).toBe(
      "ルイス・キャロルの論理ゲーム",
    );
  });

  it("returns the same content on every call", () => {
    expect(createGameViewModel(createInitialAppState())).toEqual(
      createGameViewModel(createInitialAppState()),
    );
  });
});
