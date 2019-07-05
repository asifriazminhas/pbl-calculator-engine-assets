import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { DataFieldFactory } from './data-field';
import { MSW } from '../../model-assets/web-spec/msw/msw';
import { AlgorithmAssets } from '../../model-assets/algorithm-assets/algorithm-assets';
import { IDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml';

export function constructDataDictionaryNode(
    algorithmAssets: AlgorithmAssets,
): IDataDictionary {
    const msw = algorithmAssets.webSpec as MSW;
    let dataFields: IDataField[] = [];

    const covariates = algorithmAssets.betasSheet.covariates;
    const covariateFields = covariates
        .filter(covariate => {
            return covariate.isInteractionVariable() === false;
        })
        .map(covariate => {
            const variableSheetRow = msw.findRowForCovariateName(
                covariate.name,
            );

            if (!variableSheetRow) {
                throw new Error(
                    `No row found in variable sheet for covariate ${
                        covariate.name
                    }`,
                );
            }

            return DataFieldFactory.forCovariate(
                covariate.name,
                variableSheetRow,
            );
        })
        .concat(
            covariates
                .filter(covariate => {
                    return covariate.isInteractionVariable() === true;
                })
                .map(interactionCovariate => {
                    return DataFieldFactory.fromVariableName(
                        interactionCovariate.name,
                    );
                }),
        );
    dataFields = dataFields.concat(covariateFields);

    const covariateNames = covariateFields.map(({ $ }) => {
        return $.name;
    });
    const localTransformationDataFields = algorithmAssets.localTransformations
        .getFieldNames()
        .filter(fieldName => {
            return covariateNames.indexOf(fieldName) === -1;
        })
        .map(dataFieldName => {
            const mswRow = msw.findRowForVariable(dataFieldName, true);

            if (!mswRow) {
                // Don't know what this variable is so return an empty data field
                return DataFieldFactory.fromVariableName(dataFieldName);
            }

            // This variable is the starting point for an algorithm variable
            if (mswRow.isStartVariable(dataFieldName)) {
                return DataFieldFactory.forStartVariable(
                    dataFieldName,
                    msw.findRowForVariable(dataFieldName, true)!,
                );
            }

            // This variable is one of the predictors for making the algorithm before dummying, centering etc.
            if (mswRow.row.variable === dataFieldName) {
                return DataFieldFactory.forDerivedVariable(
                    dataFieldName,
                    mswRow,
                );
            }

            // Don't know what this variable is so return an empty data field
            return DataFieldFactory.fromVariableName(dataFieldName);
        });
    dataFields = dataFields.concat(localTransformationDataFields);

    const covariateAndTransformationFields = dataFields.map(({ $ }) => {
        return $.name;
    });
    const notIncludedMswVariables = msw.sheet
        .filter(row => {
            covariateAndTransformationFields.indexOf(row.row.variable) === -1;
        })
        .map(variablesSheetRow => {
            return DataFieldFactory.forDerivedVariable(
                variablesSheetRow.row.variable,
                variablesSheetRow,
            );
        });
    dataFields = dataFields.concat(notIncludedMswVariables);

    return {
        DataField: dataFields,
        $: {
            numberOfFields: `${dataFields.length}`,
        },
    };
}
