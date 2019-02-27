import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { IDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { IDerivedField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/derived_field';
import { IFieldRef } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/common';
import { IApply } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/common';
import { flatten, uniqBy } from 'lodash';
import { parseString } from 'xml2js';
import { promisify } from 'bluebird';
import { VariableDetailsSheet } from '../reference-files/msw';
const promisifiedParseString = promisify(parseString);
import csvParse from 'csv-parse/lib/sync';

export async function makeDataDictionaryNode(
    betasCsvString: string,
    localTransformationsXMLString: string,
    webSpecCsv: string,
    isMsw: boolean,
): Promise<IDataDictionary> {
    if (isMsw) {
        const webSpec: VariableDetailsSheet = csvParse(webSpecCsv, {
            columns: true,
        });

        const betasCsv: Array<{
            [index: string]: string;
        }> = csvParse(betasCsvString, {
            columns: true,
        });
        const betaDataFields: IDataField[] = Object.keys(betasCsv[0])
            .filter(columnName => {
                return columnName !== 'H0_5YR';
            })
            .map(covariateName => {
                const webSpecRow = webSpec.find(webSpecRow => {
                    return webSpecRow.variable_start === covariateName;
                });

                return {
                    $: {
                        name: covariateName,
                        displayName: webSpecRow
                            ? webSpecRow.variable_short_label_start
                            : '',
                        optype: 'continuous' as 'continuous',
                        dataType: 'integer',
                        // TODO Fix this
                        'X-shortLabel': webSpecRow
                            ? webSpecRow.variable_short_label_start
                            : '',
                    },
                    Extension: [],
                };
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
            const webSpecRow = webSpec.find(({ variable }) => {
                return variable === dataFieldName;
            });

            return {
                $: {
                    name: dataFieldName,
                    displayName: webSpecRow
                        ? webSpecRow.variable_short_label_start
                        : '',
                    optype: 'continuous' as 'continuous',
                    dataType: 'integer',
                    // TODO Fix this
                    'X-shortLabel': webSpecRow
                        ? webSpecRow.variable_short_label_start
                        : '',
                },
                Extension: [],
            };
        });

        const dataFields = uniqBy(
            betaDataFields.concat(localTransformationDataFields),
            dataField => {
                return dataField.$.name;
            },
        );

        return {
            DataField: dataFields,
            $: {
                numberOfFields: `${dataFields.length}`,
            },
        };
    } else {
        const webSpec: WebSpecV2Csv = csvParse(webSpecCsv, {
            columns: true,
        });

        const betasCsv: Array<{
            [index: string]: string;
        }> = csvParse(betasCsvString, {
            columns: true,
        });
        const betaDataFields: IDataField[] = Object.keys(betasCsv[0])
            .filter(columnName => {
                return columnName !== 'H0_5YR';
            })
            .map(covariateName => {
                const webSpecRow = webSpec.find(({ Name }) => {
                    return Name === covariateName;
                });

                return {
                    $: {
                        name: covariateName,
                        displayName: webSpecRow ? webSpecRow.displayName : '',
                        optype: 'continuous' as 'continuous',
                        dataType: 'integer',
                        // TODO Fix this
                        'X-shortLabel': '',
                    },
                    Extension: [],
                };
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
            const webSpecRow = webSpec.find(({ Name }) => {
                return Name === dataFieldName;
            });

            return {
                $: {
                    name: dataFieldName,
                    displayName: webSpecRow ? webSpecRow.displayName : '',
                    optype: 'continuous' as 'continuous',
                    dataType: 'integer',
                    // TODO Fix this
                    'X-shortLabel': '',
                },
                Extension: [],
            };
        });

        const dataFields = uniqBy(
            betaDataFields.concat(localTransformationDataFields),
            dataField => {
                return dataField.$.name;
            },
        );

        return {
            DataField: dataFields,
            $: {
                numberOfFields: `${dataFields.length}`,
            },
        };
    }
}

function getDataFieldNamesFromLocalTransformationsNode(
    localTransformations: ILocalTransformations,
): string[] {
    return flatten(
        localTransformations.DerivedField instanceof Array
            ? localTransformations.DerivedField.map(derivedField => {
                  return getDataFieldNamesFromDerivedFieldNode(derivedField);
              })
            : getDataFieldNamesFromDerivedFieldNode(
                  localTransformations.DerivedField,
              ),
    );
}

function getDataFieldNamesFromDerivedFieldNode(
    derivedField: IDerivedField,
): string[] {
    const fieldRefNodeFieldNames = derivedField.FieldRef
        ? getDataFieldNamesFromFieldRefNode(derivedField.FieldRef)
        : [];
    const applyNodeFieldNames = derivedField.Apply
        ? getDataFieldNamesFromApplyNode(derivedField.Apply)
        : [];

    return [derivedField.$.name]
        .concat(fieldRefNodeFieldNames)
        .concat(applyNodeFieldNames);
}

function getDataFieldNamesFromFieldRefNode(fieldRef: IFieldRef): string[] {
    return [fieldRef.$.field];
}

function getDataFieldNamesFromApplyNode(apply: IApply): string[] {
    return apply.$$
        ? flatten(
              apply.$$.filter(applyChildNode => {
                  return (
                      applyChildNode['#name'] === 'FieldRef' ||
                      applyChildNode['#name'] === 'Apply'
                  );
              }).map(applyChildNode => {
                  return applyChildNode['#name'] === 'FieldRef'
                      ? getDataFieldNamesFromFieldRefNode(
                            applyChildNode as IFieldRef,
                        )
                      : getDataFieldNamesFromApplyNode(
                            applyChildNode as IApply,
                        );
              }),
          )
        : [];
}

interface WebSpecV2CsvRow {
    Name: string;
    UserMin_male: string;
    UserMin_female: string;
    UserMax_male: string;
    UserMax_female: string;
    displayName: string;
    variableType: 'Continuous' | 'Categorical';
}
type WebSpecV2Csv = WebSpecV2CsvRow[];
