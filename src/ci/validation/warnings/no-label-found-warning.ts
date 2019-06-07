import { IValidationInfo } from '../../../validation/validation-info';

export abstract class NoLabelFoundWarning {
    static ForCategory(
        algorithm: string,
        variable: string,
        categoryValue: string,
    ): IValidationInfo {
        return {
            algorithm,
            message: `No label found for category ${categoryValue} for variable ${variable}`,
        };
    }

    static ForVariable(algorithm: string, variable: string): IValidationInfo {
        return {
            algorithm,
            message: `No label found for variable ${variable}`,
        };
    }
}
