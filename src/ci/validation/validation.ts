import { IValidationInfo } from '../../validation/validation-info';

export abstract class Validation {
    private static errors: IValidationInfo[] = [];

    static addError(error: IValidationInfo) {
        Validation.errors.push(error);
    }
}
