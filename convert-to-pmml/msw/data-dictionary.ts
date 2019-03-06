import csvParse from 'csv-parse/lib/sync';
import {
    IDataField,
    ICategoricalDataField,
    IContinuousDataField,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import {
    VariableDetailsSheet,
    VariablesSheet,
    CatValue,
    IVariablesSheetRow,
    VariableTypeValues,
    IVariableDetailsSheetRow,
} from '../../reference-files/msw';
import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { parseString } from 'xml2js';
import { promisify } from 'bluebird';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
const promisifiedParseString = promisify(parseString);
import { getDataFieldNamesFromLocalTransformationsNode } from '../../util/local-transformations';
import { findVariableSheetRowForFinalVariableName } from '../../util/msw/variable-sheet';

export async function constructDataDictionaryNode(
    betasCsvString: string,
    variablesCsvString: string,
    variableDetailsCsvString: string,
    localTransformationsXMLString: string,
): Promise<IDataDictionary> {
    const betasCsv: { [variableName: string]: string } = csvParse(
        betasCsvString,
        {
            columns: true,
        },
    );
    const variablesSheet: VariablesSheet = csvParse(variablesCsvString, {
        columns: true,
    });
    const variableDetailsSheet: VariableDetailsSheet = csvParse(
        variableDetailsCsvString,
        {
            columns: true,
        },
    );

    const InteractionFinalVariableRegex = /interaction[0-9]+/;
    const finalVariablesDataDicNodes: IDataField[] = Object.keys(betasCsv[0])
        .filter(finalVariableName => {
            return (
                InteractionFinalVariableRegex.test(finalVariableName) ===
                    false && finalVariableName !== 'H0_5YR'
            );
        })
        .map(finalVariableName => {
            const variableSheetRow = findVariableSheetRowForFinalVariableName(
                finalVariableName,
                variablesSheet,
                variableDetailsSheet,
            );

            if (!variableSheetRow) {
                throw new Error(
                    `No row found in variable sheet for variable ${finalVariableName}`,
                );
            }

            const baseDataField = {
                $: {
                    name: finalVariableName,
                    displayName: variableSheetRow.labelLong,
                    dataType: 'integer',
                    'X-shortLabel': variableSheetRow.label,
                    optype:
                        variableSheetRow.variableType === CatValue
                            ? ('categorical' as 'categorical')
                            : ('continuous' as 'continuous'),
                },
                Extension: [],
            };

            if (baseDataField.$.optype === 'categorical') {
                return Object.assign({}, baseDataField, {
                    Value: [],
                }) as ICategoricalDataField;
            } else {
                return Object.assign({}, baseDataField, {
                    Interval: {
                        $: {
                            closure: 'closedClosed',
                        },
                    },
                }) as IContinuousDataField;
            }
        });

    const localTransformations: {
        PMML: { LocalTransformations: ILocalTransformations };
    } = await promisifiedParseString(localTransformationsXMLString, {
        explicitArray: false,
        explicitChildren: true,
        preserveChildrenOrder: true,
    });
    const localTransformationDataFields: IDataField[] = getDataFieldNamesFromLocalTransformationsNode(
        localTransformations.PMML.LocalTransformations,
    ).map(dataFieldName => {
        const variablesRow = variablesSheet.find(({ variable }) => {
            return variable === dataFieldName;
        });
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
                    optype: 'continuous',
                    dataType: 'integer',
                    'X-shortLabel': '',
                },
                Interval: {
                    $: {
                        closure: 'closedClosed' as 'closedClosed',
                    },
                },
                Extension: [],
            } as IContinuousDataField;
        } else if (baseDataField.$.optype === 'categorical') {
            return Object.assign(
                {},
                baseDataField,
                constructValuesNodeForVariable(
                    dataFieldName,
                    variableDetailsSheet,
                ),
            ) as ICategoricalDataField;
        } else {
            //@ts-ignore
            return Object.assign(
                {},
                baseDataField,
                //constructIntervalNode(dataFieldName, referenceCsv),
            ) as IContinuousDataField;
        }
    });

    return {
        DataField: finalVariablesDataDicNodes.concat(
            localTransformationDataFields,
        ),
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
            return (
                variableDetailsSheetRow.variable === variable ||
                variableDetailsSheetRow.variableStart === variable
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

function constructBaseDataFieldNodeFromVariableSheetRow(
    variableSheetRow: IVariablesSheetRow,
) {
    return {
        $: {
            name: variableSheetRow.variable,
            displayName: variableSheetRow.labelLong,
            optype: getOpTypeForVariableType(variableSheetRow.variableType),
            dataType: 'integer',
            'X-shortLabel': variableSheetRow.label,
        },
        Extension: [],
    };
}

function constructBaseDataFieldNodeFromVariableDetails(
    variableDetails: IVariableDetailsSheetRow,
    isStartVariable: boolean,
) {
    return isStartVariable
        ? {
              $: {
                  name: variableDetails.variableStart,
                  displayName: variableDetails.variableStartLabel,
                  optype: getOpTypeForVariableType(
                      variableDetails.variableStartType,
                  ),
                  dataType: 'integer',
                  'X-shortLabel': variableDetails.variableStartShortLabel,
              },
          }
        : {
              $: {
                  name: variableDetails.variable,
                  displayName: variableDetails.variableStartLabel,
                  optype: getOpTypeForVariableType(
                      variableDetails.variableType,
                  ),
                  dataType: 'integer',
                  'X-shortLabel': variableDetails.variableStartShortLabel,
              },
              Extension: [],
          };
}

function getOpTypeForVariableType(
    variableType: VariableTypeValues,
): 'categorical' | 'continuous' {
    return variableType === CatValue ? 'categorical' : 'continuous';
}
