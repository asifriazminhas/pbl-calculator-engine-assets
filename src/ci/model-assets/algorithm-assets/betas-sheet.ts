import { AssetsUtil } from '../assets-util';

export class BetasSheet {
    static BaselineHazardColumnName = 'H0_5YR';

    sheet: Array<{
        [index: string]: string;
    }>;

    constructor(algorithmFolderPath: string) {
        this.sheet = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/betas.csv`,
        );
    }

    getCovariateNames(): string[] {
        return Object.keys(this.sheet[0]).filter(columnName => {
            return columnName !== BetasSheet.BaselineHazardColumnName;
        });
    }

    getBeta(covariateName: string): string {
        return this.sheet[0][covariateName];
    }

    getBaselineHazard(): string {
        return this.sheet[0][BetasSheet.BaselineHazardColumnName];
    }
}
