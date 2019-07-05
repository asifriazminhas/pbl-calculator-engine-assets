import { TrueColumnValue } from '../../../reference-files/msw';
import {
    IDataField,
    IContinuousDataField,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ValueFactory } from './value';
import { IntervalFactory } from './interval';
import { VariableDetails } from '../../model-assets/web-spec/msw/variable-details';
import { MSWRow } from '../../model-assets/web-spec/msw/msw-row';

export class DataFieldFactory {
    static forCovariate(covariateName: string, mswRow: MSWRow): IDataField {
        return {
            $: {
                name: covariateName,
                displayName: mswRow.row.label,
                optype: 'continuous',
                dataType: 'integer',
                'X-shortLabel': '',
                'X-required': 'false',
                'X-recommended': 'false',
            },
            Extension: [],
            ...IntervalFactory.emptyInterval(),
        };
    }

    static forStartVariable(
        variableName: string,
        variableSheetRow: MSWRow,
    ): IDataField {
        const variableDetailsRows = VariableDetails.findRowsForVariable(
            variableName,
            true,
        ).filter(({ variableStart }) => {
            return variableStart === variableName;
        });

        const dollarProperties = {
            name: variableName,
            displayName: variableDetailsRows[0].variableStartLabel,
            dataType: 'integer',
            'X-shortLabel': variableDetailsRows[0].variableStartShortLabel,
            'X-required': DataFieldFactory.getXRequired(
                variableName,
                variableSheetRow,
            ),
            'X-recommended': DataFieldFactory.getXRecommended(
                variableName,
                variableSheetRow,
            ),
        };

        if (variableDetailsRows[0].variableStartType === 'cat') {
            return {
                $: {
                    optype: 'categorical',
                    ...dollarProperties,
                },
                ...IntervalFactory.fromVariablesDetailsRows(
                    variableName,
                    variableDetailsRows,
                ),
                ...ValueFactory.fromVariableName(variableName, true),
                Extension: [],
            };
        } else {
            return {
                $: {
                    optype: 'continuous',
                    ...dollarProperties,
                },
                ...IntervalFactory.fromVariablesDetailsRows(
                    variableName,
                    variableDetailsRows,
                ),
                ...ValueFactory.fromVariableName(variableName, true),
                Extension: [],
            };
        }
    }

    static forDerivedVariable(
        variableName: string,
        variableSheetRow: MSWRow,
    ): IDataField {
        const dollarProperties = {
            name: variableName,
            displayName: variableSheetRow.row.labelLong,
            dataType: 'integer',
            'X-shortLabel': variableSheetRow.row.label,
            'X-required': DataFieldFactory.getXRequired(
                variableName,
                variableSheetRow,
            ),
            'X-recommended': DataFieldFactory.getXRecommended(
                variableName,
                variableSheetRow,
            ),
        };

        if (variableSheetRow.row.variableType === 'cat') {
            return {
                $: {
                    optype: 'categorical',
                    ...dollarProperties,
                },
                Extension: [],
                ...ValueFactory.fromVariableName(variableName, false),
            };
        } else {
            return {
                $: {
                    optype: 'continuous',
                    ...dollarProperties,
                },
                Extension: [],
                ...IntervalFactory.fromVariablesSheetRow(variableSheetRow),
            };
        }
    }

    static fromVariableName(variableName: string): IContinuousDataField {
        return {
            $: {
                name: variableName,
                displayName: '',
                optype: 'continuous' as 'continuous',
                dataType: 'integer',
                'X-shortLabel': '',
                'X-required': 'false',
                'X-recommended': 'false',
            },
            Extension: [],
            ...IntervalFactory.emptyInterval(),
        };
    }

    private static getXRecommended(
        variableName: string,
        variablesSheetRow: MSWRow,
    ): 'true' | 'false' {
        if (
            variablesSheetRow &&
            variablesSheetRow.row.recommended === TrueColumnValue
        ) {
            if (variablesSheetRow.isOnlyStartVariable()) {
                return 'true';
            } else if (variablesSheetRow.isStartVariable(variableName)) {
                return 'true';
            }
        }

        return 'false';
    }

    private static getXRequired(
        variableName: string,
        variablesSheetRow: MSWRow,
    ): 'true' | 'false' {
        if (variablesSheetRow.row.required === TrueColumnValue) {
            if (variablesSheetRow.isOnlyStartVariable()) {
                return 'true';
            } else if (variablesSheetRow.isStartVariable(variableName)) {
                return 'true';
            }
        }

        return 'false';
    }
}
