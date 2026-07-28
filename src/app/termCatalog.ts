import { BUILT_IN_TERMS } from "../data/terms";
import type { CustomTermDefinition } from "../domain/customTerm";
import type { TermDefinition, TermId } from "../domain/term";

export function createAvailableTermCatalog(
  customTerms: readonly CustomTermDefinition[],
): readonly TermDefinition[] {
  const catalog = [...BUILT_IN_TERMS, ...customTerms];
  const ids = catalog.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Available term catalog contains duplicate IDs.");
  }
  return catalog;
}

export function resolveAvailableTerm(
  termId: TermId,
  customTerms: readonly CustomTermDefinition[],
): TermDefinition {
  const term = createAvailableTermCatalog(customTerms)
    .find(({ id }) => id === termId);
  if (term === undefined) {
    throw new Error(`Unknown available term: "${termId}".`);
  }
  return term;
}

export function isAvailableTermId(
  value: string,
  customTerms: readonly CustomTermDefinition[],
): value is TermId {
  return createAvailableTermCatalog(customTerms)
    .some(({ id }) => id === value);
}
