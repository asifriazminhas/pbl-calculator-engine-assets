import { VariableType } from './variable-type';
import { existsSync } from 'fs';
import { InvalidValueTreatment } from './invalid-value-treatment';
import { MissingValueReplacement } from './missing-value-replacement';
import { AssetsUtil } from '../../assets-util';

export class WebSpecV1 {
    sheet: WebSpecV1SheetRow[];
    categoriesSheet?: WebSpecCategoriesSheetRow[];

    constructor(modelFolderPath: string) {
        const csvParseOptions = {
            columns: true,
        };

        this.sheet = AssetsUtil.parseCsvFile(
            `${modelFolderPath}/web-specifications.csv`,
        );

        const categoriesSheetPath = `${modelFolderPath}/web-specifications-categories.csv`;
        if (existsSync(categoriesSheetPath)) {
            this.categoriesSheet = AssetsUtil.parseCsvFile(categoriesSheetPath);
        }
    }
}

interface WebSpecV1SheetRow {
    Name: string;
    UserMin_male: string;
    UserMin_female: string;
    UserMax_male: string;
    UserMax_female: string;
    displayName: string;
    variableType: VariableType;
    InvalidValueTreatment: InvalidValueTreatment;
    MissingValueReplacement: MissingValueReplacement;
}

interface WebSpecCategoriesSheetRow {
    Variable: string;
    'Category Value': string;
    'Category Label': string;
    'Category Description': string;
}
