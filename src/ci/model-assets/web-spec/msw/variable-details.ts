import { VariableType } from './variable-type';
import csvParse from 'csv-parse/lib/sync';
import { readFileSync } from 'fs';
import * as path from 'path';
const sheet = csvParse(
    readFileSync(
        path.join(
            __dirname,
            '../../../../../master-reference-files/MSW/variable-details.csv',
        ),
        'utf8',
    ),
    {
        columns: true,
    },
);

export abstract class VariableDetails {
    static sheet: IVariableDetailsSheetRow[] = sheet;
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
