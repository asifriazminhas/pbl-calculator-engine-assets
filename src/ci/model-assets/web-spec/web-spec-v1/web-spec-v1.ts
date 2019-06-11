import { VariableType } from './variable-type';
import { existsSync } from 'fs';
import { InvalidValueTreatment } from './invalid-value-treatment';
import { MissingValueReplacement } from './missing-value-replacement';
import { AssetsUtil } from '../../assets-util';

export class WebSpecV1 {
    sheet: WebSpecV1SheetRow[];
    categoriesSheet?: WebSpecCategoriesSheetRow[];

    constructor(modelFolderPath: string) {
        this.sheet = AssetsUtil.parseCsvFile(
            `${modelFolderPath}/web-specifications.csv`,
        );

        const categoriesSheetPath = `${modelFolderPath}/web-specifications-categories.csv`;
        if (existsSync(categoriesSheetPath)) {
            this.categoriesSheet = AssetsUtil.parseCsvFile(categoriesSheetPath);
        }
    }

    findRowForVariable(variableName: string) {
        return this.sheet.find(({ Name }) => {
            return Name === variableName;
        });
    }

    getVariableType(variableName: string) {
        const foundRow = this.findRowForVariable(variableName);
        if (foundRow) {
            return foundRow.variableType;
        } else {
            return 'continuous';
        }
    }

    getCategoryRowsForVariable(variableName: string) {
        if (!this.categoriesSheet) {
            return [];
        }

        const categoriesFound = [];
        // The web spec categories Variable columns are not all filled. The first category for a variable has it's Variable column filled but the remaining ones are empty until the categories for the next variable starts
        for (const category of this.categoriesSheet) {
            // Found start category for this variable
            if (category.Variable === variableName) {
                categoriesFound.push(category);
            } else if (
                categoriesFound.length >= 1 &&
                category.Variable === ''
            ) {
                //If we have already added a category and the Variable is empty then this is still a category for the variable we are looking for
                categoriesFound.push(category);
            } else if (categoriesFound.length !== 0) {
                // Otherwise we have reached the categories for the next variable so break
                break;
            }
        }

        return categoriesFound;
    }
}

export interface WebSpecV1SheetRow {
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
