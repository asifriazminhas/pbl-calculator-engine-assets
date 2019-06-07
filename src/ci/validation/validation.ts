import { IValidationInfo } from '../../validation/validation-info';
import { uniqBy } from 'lodash';
import { MarkdownBuilder } from 'md-builder';

export abstract class Validation {
    private static errors: IValidationInfo[] = [];
    private static warnings: IValidationInfo[] = [];

    static addError(error: IValidationInfo) {
        Validation.errors.push(error);
    }

    static addWarning(warning: IValidationInfo) {
        Validation.warnings.push(warning);
    }

    static prettifyValidation(): string {
        const algorithms = uniqBy(
            uniqBy(Validation.warnings, 'algorithm').concat(
                uniqBy(Validation.errors, 'algorithm'),
            ),
            'algorithm',
        ).map(({ algorithm }) => {
            return algorithm;
        });

        return algorithms
            .map(algorithm => {
                const warningsForAlgorithm = Validation.warnings.filter(
                    warning => {
                        return warning.algorithm === algorithm;
                    },
                );
                const errorsForAlgorithm = Validation.errors.filter(error => {
                    return error.algorithm === algorithm;
                });

                return MarkdownBuilder.h2(algorithm)
                    .h3(`Errors: ${errorsForAlgorithm.length}`)
                    .code(
                        errorsForAlgorithm
                            .map(error => {
                                return MarkdownBuilder.text(
                                    error.message,
                                ).toMarkdown();
                            })
                            .join('\n'),
                    )
                    .h3(`Warnings: ${warningsForAlgorithm.length}`)
                    .code(
                        warningsForAlgorithm
                            .map(warning => {
                                return MarkdownBuilder.text(
                                    warning.message,
                                ).toMarkdown();
                            })
                            .join('\n'),
                    )
                    .toMarkdown();
            })
            .join('\n');
    }

    static hasErrors(): boolean {
        return Validation.errors.length > 0;
    }
}
