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

    static findRowsForVariable(variableName: string) {
        return this.sheet.filter(({ variable }) => {
            return variable === variableName;
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
