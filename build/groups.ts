import { IModelJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-model';
import { getModelBuildData } from './util';
import * as fs from 'fs';
import * as path from 'path';
import { ICovariateJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-covariate';
import { DataFieldType } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/data-field-type';
import { WebSpec } from '../src/web-spec/web-spec';
import { RiskFactor } from '@ottawamhealth/pbl-calculator-engine/lib/risk-factors';

/**
 * Populates the group field for each covariate for each algorithm for each
 *  model in the models argument using the TYPE and Name column from the web
 * specifications CSV for each model
 * @param models
 */
export function addGroupsToModelsCovariates(models: IModelJson[]) {
    const modelNamesAndFolderPaths = getModelBuildData();

    models.forEach((model, index) => {
        const webSpecPathForCurrentModel = path.join(
            modelNamesAndFolderPaths[index].folderPath,
            '/web-specifications.csv',
        );

        if (fs.existsSync(webSpecPathForCurrentModel)) {
            const webSpec = new WebSpec(
                fs.readFileSync(webSpecPathForCurrentModel, 'utf8'),
            );

            model.algorithms.forEach(({ algorithm }) => {
                algorithm.covariates.forEach(
                    (currentCovariate: ICovariateJson) => {
                        if (
                            currentCovariate.dataFieldType ===
                            DataFieldType.NonInteractionCovariate
                        ) {
                            if (!currentCovariate.customFunction) {
                                addGroupToCovariate_mutate(
                                    currentCovariate,
                                    webSpec,
                                    currentCovariate.name,
                                );
                            } else {
                                const firstVariableCovariate = algorithm.covariates.find(
                                    covariate => {
                                        return (
                                            covariate.name ===
                                            currentCovariate.customFunction!
                                                .firstVariableCovariate
                                        );
                                    },
                                );

                                addGroupToCovariate_mutate(
                                    currentCovariate,
                                    webSpec,
                                    firstVariableCovariate!.name,
                                );
                            }
                        } else if (
                            currentCovariate.dataFieldType ===
                            DataFieldType.InteractionCovariate
                        ) {
                            const derivedFieldForInteractionCovariate = algorithm.derivedFields.find(
                                derivedField => {
                                    return (
                                        derivedField.name ===
                                        currentCovariate.name
                                    );
                                },
                            );

                            if (!derivedFieldForInteractionCovariate) {
                                throw new Error(
                                    `No derived field found for interaction covariate ${
                                        currentCovariate.name
                                    }`,
                                );
                            }

                            derivedFieldForInteractionCovariate.derivedFrom.forEach(
                                derivedFromItem => {
                                    addGroupToCovariate_mutate(
                                        currentCovariate,
                                        webSpec,
                                        typeof derivedFromItem === 'string'
                                            ? derivedFromItem
                                            : derivedFromItem.name,
                                    );
                                },
                            );
                        }
                    },
                );
            });
        }
    });
}

function addGroupToCovariate_mutate(
    covariateToAddGroupTo: ICovariateJson,
    webSpec: WebSpec,
    covariateNameToMatchRowTo: string,
) {
    const rowForCurrentCovariate = webSpec.findSpecForVariable(
        covariateNameToMatchRowTo,
    );

    if (!rowForCurrentCovariate) {
        throw new Error(
            `No web spec row found for covariate ${covariateNameToMatchRowTo}`,
        );
    }

    covariateToAddGroupTo.groups.push(
        rowForCurrentCovariate.TYPE as RiskFactor,
    );
}
