// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserTextFileTransfer } from "../src/app/browserFileTransfer";
import { mountApp } from "../src/app";

describe("browser API compatibility", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses File.text when available", async () => {
    const file = new File(["native"], "data.json");
    const text = vi.fn(async () => "from-text");
    Object.defineProperty(file, "text", { value: text });
    await expect(createBrowserTextFileTransfer().readText(file))
      .resolves.toBe("from-text");
    expect(text).toHaveBeenCalledOnce();
  });

  it("falls back to FileReader when File.text is unavailable", async () => {
    const file = new File(["fallback"], "data.json");
    Object.defineProperty(file, "text", { value: undefined });
    await expect(createBrowserTextFileTransfer().readText(file))
      .resolves.toBe("fallback");
  });

  it("rejects FileReader errors and aborts", async () => {
    class FailingReader {
      result: string | ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsText(): void {
        this.onerror?.();
      }
    }
    vi.stubGlobal("FileReader", FailingReader as unknown as typeof FileReader);
    const file = new File(["x"], "x.json");
    Object.defineProperty(file, "text", { value: undefined });
    await expect(createBrowserTextFileTransfer().readText(file)).rejects
      .toThrow("failed");

    class AbortingReader extends FailingReader {
      override readAsText(): void {
        this.onabort?.();
      }
    }
    vi.stubGlobal("FileReader", AbortingReader as unknown as typeof FileReader);
    await expect(createBrowserTextFileTransfer().readText(file)).rejects
      .toThrow("aborted");
    vi.unstubAllGlobals();
  });

  it("downloads with filename and MIME and revokes the object URL", () => {
    const create = vi.fn((value: Blob) => {
      return "blob:test";
    });
    const revoke = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    createBrowserTextFileTransfer().downloadText(
      "backup.json",
      "{\"version\":1}",
      "application/json",
    );
    expect(click).toHaveBeenCalledOnce();
    expect(create.mock.calls[0]?.[0].type).toBe("application/json");
    expect(revoke).toHaveBeenCalledWith("blob:test");
    expect(document.querySelector('a[download="backup.json"]')).toBeNull();
  });

  it("cleans up and throws when click fails or download APIs are missing", () => {
    const revoke = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => "blob:test",
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revoke,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("click failed");
    });
    expect(() => createBrowserTextFileTransfer().downloadText(
      "backup.json",
      "x",
      "application/json",
    )).toThrow("click failed");
    expect(revoke).toHaveBeenCalledWith("blob:test");
    expect(document.querySelector("a[download]")).toBeNull();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: undefined,
    });
    expect(() => createBrowserTextFileTransfer().downloadText(
      "backup.json",
      "x",
      "application/json",
    )).toThrow("unavailable");
  });

  it("starts and remains playable with null storage", () => {
    const container = document.createElement("div");
    mountApp(container, null, {
      readText: async () => "",
      downloadText: () => undefined,
    });
    expect(container.querySelector("h1")?.textContent).toContain(
      "ルイス・キャロル",
    );
    const source = container.querySelector<HTMLSelectElement>(
      '[data-action="problem-source"]',
    )!;
    source.value = "custom";
    source.dispatchEvent(new Event("change"));
    expect(container.textContent).toContain("読み込めませんでした");
    const restoredSource = container.querySelector<HTMLSelectElement>(
      '[data-action="problem-source"]',
    )!;
    restoredSource.value = "built-in";
    restoredSource.dispatchEvent(new Event("change"));
    container.querySelector<HTMLButtonElement>('[data-action="next"]')!.click();
    expect(container.querySelector("article")?.dataset.phase)
      .toBe("first-premise");
  });
});
