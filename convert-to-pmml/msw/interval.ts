import { IVariableDetailsSheetRow } from '../../reference-files/msw';
import { VariableDetails } from '../../src/ci/model-assets/web-spec/msw/variable-details';
import { MSW, IMswSheetRow } from '../../src/ci/model-assets/web-spec/msw/msw';

export class IntervalFactory {
    static fromVariableName(variableName: string, variablesSheet: MSW) {
        const variableDetails = VariableDetails.findRowsForContVariable(
            variableName,
        );
        const variableSheetRow = variablesSheet.findRowForContVariable(
            variableName,
        );

        // Don't use intervals from the variables sheet if the variable comes directly from the start variable since these interval values apply only to the final variable. Instead we will use rows from the variable details sheet
        if (
            variableSheetRow &&
            variablesSheet.isStartVariable(variableSheetRow) === false
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

    private static fromVariablesSheetRow(variablesSheetRow: IMswSheetRow) {
        return {
            Interval: [
                {
                    $: {
                        closure: 'closedClosed',
                        leftMargin: variablesSheetRow.min,
                        rightMargin: variablesSheetRow.max,
                        'X-description': '',
                    },
                },
            ],
        };
    }

    private static fromVariablesDetailsRows(
        variableName: string,
        variableDetails: IVariableDetailsSheetRow[],
    ) {
        return variableDetails.map(
            ({ low, high, catStartLabel, catLabelLong, variableStart }) => {
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
        );
    }

    private static emptyInterval() {
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
