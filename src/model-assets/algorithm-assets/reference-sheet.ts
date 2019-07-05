import { AssetsUtil } from '../assets-util';

export class ReferenceSheet {
    sheet: Array<{
        Variable: string;
        Mean: string;
        Minimum: string;
        Maximum: string;
        [index: string]: string;
    }>;

    constructor(algorithmFolderPath: string) {
        this.sheet = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/reference.csv`,
        );
    }

    findRowForVariable(variableName: string) {
        return this.sheet.find(({ Variable }) => {
            return Variable === variableName;
        });
    }
}
