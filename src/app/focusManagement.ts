export interface FocusSnapshot {
  readonly key: string;
  readonly selectionStart: number | null;
  readonly selectionEnd: number | null;
}

function keyedElements(root: HTMLElement): readonly HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[data-focus-key]")];
}

export function getActiveFocusKey(root: HTMLElement): string | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) return null;
  return active.dataset.focusKey ?? null;
}

export function captureFocus(root: HTMLElement): FocusSnapshot | null {
  const key = getActiveFocusKey(root);
  if (key === null) return null;
  const active = document.activeElement;
  return {
    key,
    selectionStart: active instanceof HTMLInputElement &&
        active.type === "text"
      ? active.selectionStart
      : null,
    selectionEnd: active instanceof HTMLInputElement &&
        active.type === "text"
      ? active.selectionEnd
      : null,
  };
}

export function restoreFocusByKey(root: HTMLElement, key: string): boolean {
  const matches = keyedElements(root).filter(
    (element) => element.dataset.focusKey === key,
  );
  if (matches.length > 1) {
    throw new Error(`Duplicate focus key: "${key}".`);
  }
  const target = matches[0];
  if (target === undefined) return false;
  target.focus({ preventScroll: true });
  return true;
}

export function restoreFocus(
  root: HTMLElement,
  snapshot: FocusSnapshot,
): boolean {
  if (!restoreFocusByKey(root, snapshot.key)) return false;
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement &&
    active.type === "text" &&
    snapshot.selectionStart !== null &&
    snapshot.selectionEnd !== null
  ) {
    active.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
  }
  return true;
}

export function focusPhaseHeading(root: HTMLElement): boolean {
  const heading = root.querySelector<HTMLElement>("[data-phase-heading]");
  if (heading === null) return false;
  heading.focus({ preventScroll: true });
  return true;
}
