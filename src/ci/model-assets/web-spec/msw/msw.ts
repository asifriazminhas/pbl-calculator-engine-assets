import { VariableType } from './variable-type';
import { MswBoolean } from './msw-boolean';
import csvParse from 'csv-parse/lib/sync';
import { readFileSync } from 'fs';

export class MSW {
    sheet: IMswSheetRow[];

    constructor(algorithmFolderPath: string) {
        this.sheet = csvParse(
            readFileSync(`${algorithmFolderPath}/variables.csv`, 'utf8'),
            {
                columns: true,
            },
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
