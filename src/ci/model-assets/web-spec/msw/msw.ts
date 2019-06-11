import { VariableType } from './variable-type';
import { MswBoolean } from './msw-boolean';
import { AssetsUtil } from '../../assets-util';

export class MSW {
    sheet: IMswSheetRow[];

    constructor(algorithmFolderPath: string) {
        this.sheet = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/variables.csv`,
        );
    }
}

interface IMswSheetRow {
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
