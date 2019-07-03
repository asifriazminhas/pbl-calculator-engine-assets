import { VariableType } from './variable-type';
import { MswBoolean, TrueColumnValue } from './msw-boolean';
import { AssetsUtil } from '../../assets-util';
import { VariableDetails } from './variable-details';
import { trim } from 'lodash';

export class MSW {
    sheet: IMswSheetRow[];

    constructor(algorithmFolderPath: string) {
        this.sheet = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/variables.csv`,
        );
    }

    findRowForCovariateName(covariateName: string) {
        return this.sheet.find(variableSheetRow => {
            return (
                this.getCovariateNamesForRow(variableSheetRow).indexOf(
                    covariateName,
                ) > -1
            );
        });
    }

    findRowForVariable(variableName: string) {
        return this.sheet.find(({ variable }) => {
            return variable === variableName;
        });
    }

    findRowForContVariable(variableName: string) {
        const row = this.findRowForVariable(variableName);

        if (row && row.variableType === 'cont') {
            return row;
        }

        return undefined;
    }

    isStartVariable(row: IMswSheetRow): boolean {
        return row.variable !== row.variableStart.split(',').map(trim)[0];
    }

    private getCovariateNamesForRow(variableSheetRow: IMswSheetRow) {
        const variableDetailsRows = VariableDetails.findRowsForVariable(
            variableSheetRow.variable,
        );

        if (variableDetailsRows.length === 0) {
            throw new Error(
                `No row found in variables details sheet for variable ${
                    variableSheetRow.variable
                }`,
            );
        }

        const covariateNames: string[] = [];

        if (variableSheetRow.dummy === TrueColumnValue) {
            variableDetailsRows.forEach(({ dummyVariable }) => {
                covariateNames.push(dummyVariable);
            });
        } else {
            covariateNames.push(variableSheetRow.variable);
        }

        if (variableSheetRow.centre === TrueColumnValue) {
            for (
                let variableIndex = 0;
                variableIndex < covariateNames.length;
                variableIndex++
            ) {
                covariateNames[variableIndex] += '_C';
            }
        }

        if (variableSheetRow.rcs !== '0') {
            const variableNameAfterCentering = covariateNames[0];

            const numOfKnots = Number(variableSheetRow.rcs);

            for (let knotNumber = 1; knotNumber < numOfKnots; knotNumber++) {
                covariateNames[
                    knotNumber - 1
                ] = `${variableNameAfterCentering}_rcs${knotNumber}`;
            }
        }

        return covariateNames;
    }
}

export interface IMswSheetRow {
    variable: string;
    variableType: VariableType;
    catLabel: string;
    centre: MswBoolean;
    rcs: string;
    dummy: MswBoolean;
    min: string;
    max: string;
    labelLong: string;
    label: string;
    variableStart: string;
    required: MswBoolean;
    recommended: MswBoolean;
}
