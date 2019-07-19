import { AssetsUtil } from '../../assets-util';
import { MSWRow, IMswSheetRow } from './msw-row';
import { CovariateNameGenError } from './msw-errors';
import { tryCatch } from 'ramda';
import { InteractionUtil } from '../../../util/interaction';
import { RiskFactor } from '@ottawamhealth/pbl-calculator-engine/lib/risk-factors';

export class MSW {
    sheet: MSWRow[];

    constructor(algorithmFolderPath: string) {
        this.sheet = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/variables.csv`,
        ).map((row: IMswSheetRow) => {
            return new MSWRow(row);
        });
    }

    findRowForCovariateName(covariateName: string) {
        // For each variable sheet row, check if it's the covariate with name passed in the covariateName argument
        return this.sheet.find(variableSheetRow => {
            return tryCatch(
                (covariateName: string) => {
                    return (
                        variableSheetRow
                            .getCovariateNames()
                            .indexOf(covariateName) > -1
                    );
                },
                err => {
                    if (err instanceof CovariateNameGenError) {
                        return false;
                    }

                    throw err;
                },
            )(covariateName);
        });
    }

    findRowForVariable(variableName: string, includeStartVariable: boolean) {
        return this.sheet.find(row => {
            const isVariable = row.row.variable === variableName;

            if (includeStartVariable) {
                return row.isStartVariable(variableName) || isVariable;
            } else {
                return isVariable;
            }
        });
    }

    findRowForContVariable(variableName: string) {
        const row = this.findRowForVariable(variableName, false);

        if (row && row.row.variableType === 'cont') {
            return row;
        }

        return undefined;
    }

    isStartVariable(variableName: string) {
        const mswRow = this.findRowForVariable(variableName, true);

        if (!mswRow) {
            return false;
        }

        return mswRow.isStartVariable(variableName);
    }

    getGroupsForCovariate(
        covariateName: string,
        mapVariable: (varName: string) => string = (varName: string) => {
            return varName;
        },
    ): RiskFactor[] {
        let covariates: string[] = [];
        if (InteractionUtil.isInteractionVar(covariateName)) {
            covariates = InteractionUtil.getInteractingVars(covariateName).map(
                interactingVar => {
                    return mapVariable(interactingVar);
                },
            );
        } else {
            covariates = [mapVariable(covariateName)];
        }

        return covariates.map(covariate => {
            const mswRow = this.findRowForCovariateName(covariate);

            if (!mswRow) {
                throw new Error(
                    `No row found in MSW for variable ${covariate}`,
                );
            }

            return mswRow.row.subject;
        });
    }
}
