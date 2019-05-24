import { IWarning } from "./warning";

export abstract class NoLabelFoundWarning {
  static ForCategory(
    algorithm: string,
    variable: string,
    categoryValue: string
  ): IWarning {
    return {
      algorithm,
      warning: `No label found for category ${categoryValue} for variable ${variable}`
    };
  }

  static ForVariable(algorithm: string, variable: string): IWarning {
    return {
      algorithm,
      warning: `No label found for variable ${variable}`
    };
  }
}
