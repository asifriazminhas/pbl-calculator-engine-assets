import { IValidationInfo } from '../../validation/validation-info';

export abstract class Errors {
    private static errors: IValidationInfo[] = [];

    static addError(error: IValidationInfo) {
        Errors.addError(error);
    }
}
