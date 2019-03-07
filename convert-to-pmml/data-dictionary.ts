import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import {
    IDataField,
    IValue,
    IContinuousDataField,
    ICategoricalDataField,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { uniqBy } from 'lodash';
import { parseString } from 'xml2js';
import { promisify } from 'bluebird';
const promisifiedParseString = promisify(parseString);
import csvParse from 'csv-parse/lib/sync';
import { getDataFieldNamesFromLocalTransformationsNode } from '../util/local-transformations';

export async function makeDataDictionaryNode(
    betasCsvString: string,
    localTransformationsXMLString: string,
    webSpecCsv: string,
    referenceCsvString: string,
    webSpecCategoriesCsv?: string,
): Promise<IDataDictionary> {
    const webSpec: WebSpecV2Csv = csvParse(webSpecCsv, {
        columns: true,
    });
    const webSpecCategories:
        | Array<{
              Variable: string;
              'Category Value': string;
              'Category Label': string;
              'Category Description': string;
          }>
        | undefined = webSpecCategoriesCsv
        ? csvParse(webSpecCategoriesCsv, {
              columns: true,
          })
        : undefined;

    const referenceCsv: Array<{
        Variable: string;
        Minimum: string;
        Maximum: string;
    }> = csvParse(referenceCsvString, {
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

            const baseDataField = {
                $: {
                    name: covariateName,
                    displayName: webSpecRow ? webSpecRow.displayName : '',
                    dataType: 'integer',
                    optype: webSpecRow ? webSpecRow.variableType : 'continuous',
                    // TODO Fix this
                    'X-shortLabel': '',
                    'X-required': 'false',
                    'X-recommended': 'false',
                },
                Extension: [],
            };

            if (
                baseDataField.$.optype === 'categorical' &&
                webSpecRow &&
                webSpecCategories
            ) {
                return Object.assign(
                    {},
                    baseDataField,
                    constructValuesNodeForVariable(
                        webSpecRow,
                        webSpecCategories,
                    ),
                ) as ICategoricalDataField;
            } else {
                return Object.assign(
                    {},
                    baseDataField,
                    constructIntervalNode(covariateName, referenceCsv),
                ) as IContinuousDataField;
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
        const webSpecRow = webSpec.find(({ Name }) => {
            return Name === dataFieldName;
        });

        const baseDataField = {
            $: {
                name: dataFieldName,
                displayName: webSpecRow ? webSpecRow.displayName : '',
                optype: webSpecRow ? webSpecRow.variableType : 'continuous',
                dataType: 'integer',
                // TODO Fix this
                'X-shortLabel': '',
                'X-required': 'false',
                'X-recommended': 'false',
            },
            Extension: [],
        };

        if (
            baseDataField.$.optype === 'categorical' &&
            webSpecRow &&
            webSpecCategories
        ) {
            return Object.assign(
                {},
                baseDataField,
                constructValuesNodeForVariable(webSpecRow, webSpecCategories),
            ) as ICategoricalDataField;
        } else {
            return Object.assign(
                {},
                baseDataField,
                constructIntervalNode(dataFieldName, referenceCsv),
            ) as IContinuousDataField;
        }
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

interface WebSpecV2CsvRow {
    Name: string;
    UserMin_male: string;
    UserMin_female: string;
    UserMax_male: string;
    UserMax_female: string;
    displayName: string;
    variableType: 'continuous' | 'categorical';
}
type WebSpecV2Csv = WebSpecV2CsvRow[];

interface IWebSpecCategories {
    Variable: string;
    'Category Value': string;
    'Category Label': string;
    'Category Description': string;
}
type WebSpecCategories = IWebSpecCategories[];

function constructValuesNodeForVariable(
    webSpecRow: WebSpecV2CsvRow,
    webSpecCategories: WebSpecCategories,
):
    | {
          Value: IValue[];
      }
    | undefined {
    if (webSpecRow.variableType === 'continuous') {
        return undefined;
    }

    const variableName = webSpecRow.Name;

    const categoriesFound = [];
    // The web spec categories Variable columns are not all filled. The first category for a variable has it's Variable column filled but the remaining ones are empty until the categories for the next variable starts
    for (const category of webSpecCategories) {
        // Found start category for this variable
        if (category.Variable === variableName) {
            categoriesFound.push(category);
        } else if (categoriesFound.length >= 1 && category.Variable === '') {
            //If we have already added a category and the Variable is empty then this is still a category for the variable we are looking for
            categoriesFound.push(category);
        } else if (categoriesFound.length !== 0) {
            // Otherwise we have reached the categories for the next variable so break
            break;
        }
    }

    if (categoriesFound.length === 0) {
        console.warn(`No categories found for variable ${variableName}`);
    }

    return {
        Value: categoriesFound.map(category => {
            return {
                $: {
                    value: category['Category Value'],
                    displayName: category['Category Label'],
                    description: category['Category Description'],
                },
            };
        }),
    };
}

function constructIntervalNode(
    variableName: string,
    referenceCsv: Array<{
        Variable: string;
        Minimum: string;
        Maximum: string;
    }>,
) {
    const referenceCsvRow = referenceCsv.find(({ Variable }) => {
        return variableName === Variable;
    });

    if (!referenceCsvRow) {
        console.warn(
            `No reference row found for variable ${variableName}. Interval margins being set infinity`,
        );
        return {
            Interval: {
                $: {
                    'X-description': '',
                    closure: 'closedClosed',
                },
            },
        };
    } else {
        return {
            Interval: {
                $: {
                    closure: 'openOpen',
                    leftMargin: referenceCsvRow.Minimum,
                    rightMargin: referenceCsvRow.Maximum,
                },
            },
        };
    }
}
