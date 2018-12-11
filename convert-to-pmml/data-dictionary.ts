import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { IDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { IDerivedField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/derived_field';
import { IFieldRef } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/common';
import { IApply } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/common';
import { flatten, uniqBy } from 'lodash';
import { parseString } from 'xml2js';
import { promisify } from 'bluebird';
const promisifiedParseString = promisify(parseString);

const csvParse = require('csv-parse/lib/sync');

export async function makeDataDictionaryNode(
    betasCsvString: string,
    localTransformationsXMLString: string,
    webSpecCsv: string,
): Promise<IDataDictionary> {
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
            const webSpecRow = findWebSpecRowForName(webSpec, covariateName);

            return {
                $: {
                    name: covariateName,
                    displayName: webSpecRow ? webSpecRow.displayName : '',
                    optype: 'continuous' as 'continuous',
                    dataType: 'integer',
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
        const webSpecRow = findWebSpecRowForName(webSpec, dataFieldName);

        return {
            $: {
                name: dataFieldName,
                displayName: webSpecRow ? webSpecRow.displayName : '',
                optype: 'continuous' as 'continuous',
                dataType: 'integer',
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

function findWebSpecRowForName(webSpec: WebSpecV2Csv, name: string) {
    return webSpec.find(webSpecRow => {
        return webSpecRow.Name === name;
    });
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
