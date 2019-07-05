import { VariableType } from './variable-type';
import { MswBoolean } from './msw-boolean';
import { AssetsUtil } from '../../assets-util';
import { MSWRow } from './msw-row';

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
        return this.sheet.find(variableSheetRow => {
            return (
                variableSheetRow.getCovariateNames().indexOf(covariateName) > -1
            );
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
