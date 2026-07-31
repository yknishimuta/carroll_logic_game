export function bindCompositionAwareTextInput(
  input: HTMLInputElement,
  onValueCommit: (value: string) => void,
): void {
  let composing = false;
  let lastCommittedValue = input.value;

  const commitChangedValue = (): void => {
    if (input.value === lastCommittedValue) return;
    lastCommittedValue = input.value;
    onValueCommit(input.value);
  };

  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("input", () => {
    if (!composing) commitChangedValue();
  });
  input.addEventListener("compositionend", () => {
    if (!composing) return;
    composing = false;
    commitChangedValue();
  });
}
