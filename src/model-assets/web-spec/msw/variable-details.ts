import { VariableType } from './variable-type';
import * as path from 'path';
import { AssetsUtil } from '../../assets-util';
const sheet = AssetsUtil.parseCsvFile(
    path.join(
        __dirname,
        '../../../../../master-reference-files/MSW/variable-details.csv',
    ),
);

export abstract class VariableDetails {
    static sheet: IVariableDetailsSheetRow[] = sheet;

    static findRowsForVariable(
        variableName: string,
        includeStartVariable: boolean,
    ) {
        return this.sheet.filter(({ variable, variableStart }) => {
            const isVariable = variable === variableName;

            if (includeStartVariable) {
                return isVariable || variableStart === variableName;
            } else {
                return isVariable;
            }
        });
    }

    static findRowsForContVariable(variableName: string) {
        return this.sheet.filter(({ low, high, variable, variableStart }) => {
            return (
                low !== high &&
                (variable === variableName || variableStart === variableName)
            );
        });
    }

    static findRowForCatVariable(
        variableName: string,
        includeStartVariable: boolean,
    ) {
        return this.findRowsForVariable(
            variableName,
            includeStartVariable,
        ).filter(({ variableStartType, variableType }) => {
            return includeStartVariable
                ? variableStartType === 'cat'
                : variableType === 'cat';
        });
    }
}

interface IVariableDetailsSheetRow {
    variableStartLabel: string;
    variableStartShortLabel: string;
    variable: string;
    dummyVariable: string;
    catValues: string;
    catLabel: string;
    catLabelLong: string;
    low: string;
    high: string;
    variableType: VariableType;
    variableStart: string;
    variableStartType: VariableType;
    catStartLabel: string;
}
