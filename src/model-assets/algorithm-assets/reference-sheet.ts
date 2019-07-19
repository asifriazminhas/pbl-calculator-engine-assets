import { AssetsUtil } from '../assets-util';

export class ReferenceSheet {
    private static BaselineHazardVariableName = 'H0_5YR';

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

    get baselineHazard(): number {
        const baselineHazardRow = this.findRowForVariable(
            ReferenceSheet.BaselineHazardVariableName,
        );
        if (!baselineHazardRow) {
            throw new Error(`No baseline hazard found in reference sheet`);
        }

        return Number(baselineHazardRow.Minimum);
    }
}
