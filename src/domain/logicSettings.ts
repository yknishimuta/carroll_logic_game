export type ExistentialImportMode = "carroll" | "modern";

export interface LogicSettings {
  readonly existentialImport: ExistentialImportMode;
}

export const DEFAULT_LOGIC_SETTINGS: LogicSettings = {
  existentialImport: "carroll",
};
