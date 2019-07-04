import { IVariableDetailsSheetRow } from '../../reference-files/msw';
import { VariableDetails } from '../../src/ci/model-assets/web-spec/msw/variable-details';
import { MSW } from '../../src/ci/model-assets/web-spec/msw/msw';
import { IInterval } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { MSWRow } from '../../src/ci/model-assets/web-spec/msw/msw-row';

export class IntervalFactory {
    static fromVariableName(
        variableName: string,
        variablesSheet: MSW,
    ): {
        Interval: IInterval | IInterval[];
    } {
        const variableDetails = VariableDetails.findRowsForContVariable(
            variableName,
        );
        const variableSheetRow = variablesSheet.findRowForContVariable(
            variableName,
        );

        // Don't use intervals from the variables sheet if the variable comes directly from the start variable since these interval values apply only to the final variable. Instead we will use rows from the variable details sheet
        if (
            variableSheetRow &&
            variableSheetRow.isOnlyStartVariable() === false
        ) {
            return IntervalFactory.fromVariablesSheetRow(variableSheetRow);
        }

        if (variableDetails.length > 0) {
            return IntervalFactory.fromVariablesDetailsRows(
                variableName,
                variableDetails,
            );
        }

        return IntervalFactory.emptyInterval();
    }

    static fromVariablesSheetRow(
        variablesSheetRow: MSWRow,
    ): {
        Interval: IInterval | IInterval[];
    } {
        return {
            Interval: [
                {
                    $: {
                        closure: 'closedClosed',
                        leftMargin: variablesSheetRow.row.min,
                        rightMargin: variablesSheetRow.row.max,
                        'X-description': '',
                    },
                },
            ],
        };
    }

    static fromVariablesDetailsRows(
        variableName: string,
        variableDetails: IVariableDetailsSheetRow[],
    ): {
        Interval: IInterval | IInterval[];
    } {
        return {
            Interval: variableDetails
                .filter(({ low, high }) => {
                    return low !== high;
                })
                .map(
                    ({
                        low,
                        high,
                        catStartLabel,
                        catLabelLong,
                        variableStart,
                    }) => {
                        return {
                            $: {
                                closure: 'closedClosed',
                                leftMargin: low,
                                rightMargin: high,
                                'X-description':
                                    variableName === variableStart
                                        ? catStartLabel
                                        : catLabelLong,
                            },
                        };
                    },
                ),
        };
    }

    static emptyInterval(): {
        Interval: IInterval | IInterval[];
    } {
        return {
            Interval: {
                $: {
                    closure: 'closedClosed',
                    'X-description': '',
                },
            },
        };
    }
}
