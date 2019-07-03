import {
    IDataField,
    ICategoricalDataField,
    IContinuousDataField,
    IBaseDataField,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import {
    VariableDetailsSheet,
    TrueColumnValue,
} from '../../reference-files/msw';
import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { getDataFieldNamesFromApplyNode } from '../../util/local-transformations';
import { trim, flatten, uniq } from 'lodash';
import { IDerivedField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/derived_field';
import {
    constructBaseDataFieldNodeFromVariableSheetRow,
    constructBaseDataFieldNodeFromVariableDetails,
} from './data-field';
import { MSW } from '../../src/ci/model-assets/web-spec/msw/msw';
import { AlgorithmAssets } from '../../src/ci/model-assets/algorithm-assets/algorithm-assets';
import { VariableDetails } from '../../src/ci/model-assets/web-spec/msw/variable-details';
import { IntervalFactory } from './interval';

export function constructDataDictionaryNode(
    algorithmAssets: AlgorithmAssets,
): IDataDictionary {
    const msw = algorithmAssets.webSpec as MSW;
    const variableDetailsSheet = VariableDetails.sheet;

    const finalVariablesDataDicNodes: IDataField[] = algorithmAssets.betasSheet.covariates
        .filter(covariate => {
            return !covariate.isInteractionVariable();
        })
        .map(covariate => {
            const variableSheetRow = msw.findRowForCovariateName(
                covariate.name,
            );

            if (!variableSheetRow) {
                throw new Error(
                    `No row found in variable sheet for variable ${
                        covariate.name
                    }`,
                );
            }

            return constructBaseDataFieldNodeFromVariableSheetRow(
                variableSheetRow,
                {
                    name: covariate.name,
                },
            );
        });

    const localTransformationDataFields: IDataField[] = algorithmAssets.localTransformations
        .getFieldNames()
        .map(dataFieldName => {
            const variablesRow = msw.findRowForVariable(dataFieldName);
            const variablesDetailsRow = variableDetailsSheet.find(
                ({ variable, variableStart }) => {
                    return (
                        variable === dataFieldName ||
                        variableStart === dataFieldName
                    );
                },
            );

            const baseDataField = variablesRow
                ? constructBaseDataFieldNodeFromVariableSheetRow(variablesRow)
                : variablesDetailsRow
                ? variablesDetailsRow.variable === dataFieldName
                    ? constructBaseDataFieldNodeFromVariableDetails(
                          variablesDetailsRow,
                          false,
                      )
                    : variablesDetailsRow.variableStart === dataFieldName
                    ? constructBaseDataFieldNodeFromVariableDetails(
                          variablesDetailsRow,
                          true,
                      )
                    : undefined
                : undefined;

            if (!baseDataField) {
                return {
                    $: {
                        name: dataFieldName,
                        displayName: '',
                        optype: '',
                        dataType: 'integer',
                        'X-shortLabel': '',
                        'X-required': 'false',
                        'X-recommended': 'false',
                    },
                    Extension: [],
                } as IBaseDataField<any>;
            } else if (baseDataField.$.optype === 'categorical') {
                return Object.assign(
                    {},
                    baseDataField,
                    constructValuesNodeForVariable(
                        dataFieldName,
                        variableDetailsSheet,
                    ),
                    IntervalFactory.fromVariableName(dataFieldName, msw),
                ) as ICategoricalDataField;
            } else {
                return Object.assign(
                    {},
                    baseDataField,
                    IntervalFactory.fromVariableName(dataFieldName, msw),
                    constructValuesNodeForVariable(
                        dataFieldName,
                        variableDetailsSheet,
                    ),
                ) as IContinuousDataField;
            }
        });

    const dataFields = finalVariablesDataDicNodes.concat(
        localTransformationDataFields,
    );

    msw.sheet
        .filter(({ recommended }) => {
            return recommended === TrueColumnValue;
        })
        .forEach(({ variable, variableStart, required }) => {
            const dataField = dataFields.find(dataField => {
                return dataField.$.name === variable;
            });

            const localTransformationsNode = algorithmAssets.localTransformations.getLocalTransformationsNode();

            if (dataField) {
                if (localTransformationsNode.DerivedField instanceof Array) {
                    const derivedField = localTransformationsNode.DerivedField.find(
                        derivedField => {
                            return derivedField.$.name === dataField.$.name;
                        },
                    );

                    if (!derivedField) {
                        if (required === TrueColumnValue) {
                            dataField.$['X-required'] = 'true';
                        } else {
                            dataField.$['X-recommended'] = 'true';
                        }
                    } else {
                        const recommendedOrRequiredFields = uniq(
                            getRecommendedDataFields(
                                dataField,
                                localTransformationsNode.DerivedField,
                                variableStart.split(',').map(trim),
                            ),
                        );

                        recommendedOrRequiredFields.forEach(
                            recommendedOrRequiredField => {
                                const foundDataField = dataFields.find(
                                    dataField => {
                                        return (
                                            dataField.$.name ===
                                            recommendedOrRequiredField
                                        );
                                    },
                                );

                                if (foundDataField) {
                                    if (required === TrueColumnValue) {
                                        foundDataField.$['X-required'] = 'true';
                                    } else {
                                        foundDataField.$['X-recommended'] =
                                            'true';
                                    }
                                }
                            },
                        );
                    }
                }
            }
        });

    msw.sheet
        .filter(({ variable }) => {
            return (
                dataFields.find(dataField => {
                    return dataField.$.name === variable;
                }) === undefined
            );
        })
        .forEach(variablesSheetRow => {
            const baseDataField = constructBaseDataFieldNodeFromVariableSheetRow(
                variablesSheetRow,
            );
            baseDataField.$['X-required'] =
                variablesSheetRow.required === TrueColumnValue
                    ? 'true'
                    : 'false';

            if (baseDataField.$.optype === 'categorical') {
                return dataFields.push(Object.assign(
                    {},
                    baseDataField,
                    constructValuesNodeForVariable(
                        variablesSheetRow.variable,
                        variableDetailsSheet,
                    ),
                    IntervalFactory.fromVariableName(
                        variablesSheetRow.variable,
                        msw,
                    ),
                ) as ICategoricalDataField);
            }

            return dataFields.push(Object.assign(
                {},
                baseDataField,
                constructValuesNodeForVariable(
                    variablesSheetRow.variable,
                    variableDetailsSheet,
                ),
                IntervalFactory.fromVariableName(
                    variablesSheetRow.variable,
                    msw,
                ),
            ) as IContinuousDataField);
        });

    return {
        DataField: dataFields,
        $: {
            numberOfFields: `${finalVariablesDataDicNodes.length}`,
        },
    };
}

function constructValuesNodeForVariable(
    variable: string,
    variableDetailsSheet: VariableDetailsSheet,
) {
    const variableDetails = variableDetailsSheet.filter(
        variableDetailsSheetRow => {
            const hasSameLowAndHighValues =
                variableDetailsSheetRow.low === variableDetailsSheetRow.high;

            return (
                (variableDetailsSheetRow.variable === variable ||
                    variableDetailsSheetRow.variableStart === variable) &&
                hasSameLowAndHighValues
            );
        },
    );

    return {
        Value: variableDetails
            .filter(({ low }) => {
                return low.trim().length !== 0;
            })
            .map(({ low, catLabel, catLabelLong }) => {
                return {
                    $: {
                        value: low,
                        displayName: catLabel,
                        description: catLabelLong,
                    },
                };
            }),
    };
}

function getRecommendedDataFields(
    dataField: IDataField | IDerivedField,
    derivedFields: IDerivedField[],
    startVariables: string[],
): string[] {
    // If there is only one start variable then  that's the recommended variable
    if (startVariables.length === 1) {
        return [startVariables[0]];
    } else {
        const derivedField = derivedFields.find(derivedField => {
            return derivedField.$.name === dataField.$.name;
        });

        if (derivedField) {
            if (derivedField.FieldRef) {
                const fieldRefField = derivedField.FieldRef.$.field;

                if (startVariables.indexOf(fieldRefField) > -1) {
                    return [fieldRefField];
                }

                const derivedFieldForFieldRef = derivedFields.find(
                    currentDerivedField => {
                        return currentDerivedField.$.name === fieldRefField;
                    },
                );

                if (!derivedFieldForFieldRef) {
                    throw new Error(
                        `FieldRef ${fieldRefField} has no derived field and is not a recommended field. Perhaps it should be added to the variableStart column?`,
                    );
                }

                return getRecommendedDataFields(
                    derivedFieldForFieldRef,
                    derivedFields,
                    startVariables,
                );
            } else if (derivedField.Apply) {
                const childFields = getDataFieldNamesFromApplyNode(
                    derivedField.Apply,
                );

                const recommendedFields = childFields.map(childField => {
                    if (startVariables.indexOf(childField) > -1) {
                        return [childField];
                    }

                    const derivedFieldForChildField = derivedFields.find(
                        derivedField => {
                            return derivedField.$.name === childField;
                        },
                    );

                    if (!derivedFieldForChildField) {
                        throw new Error(
                            `Child "${childField}" of field "${
                                derivedField.$.name
                            }" has no derived field and is not a recommended field. Perhaps it should be added to the variableStart column?`,
                        );
                    }

                    return getRecommendedDataFields(
                        derivedFieldForChildField,
                        derivedFields,
                        startVariables,
                    );
                });

                return flatten(recommendedFields);
            }
        }

        return [];
    }
}
