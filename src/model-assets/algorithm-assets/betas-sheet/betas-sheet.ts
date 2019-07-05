import { AssetsUtil } from '../../assets-util';
import { BetasSheetCovariate } from './betas-sheet-covariate';

export class BetasSheet {
    static BaselineHazardColumnName = 'H0_5YR';

    covariates: BetasSheetCovariate[];
    baselineHazard: string;

    constructor(algorithmFolderPath: string) {
        const sheet: Array<{
            [index: string]: string;
        }> = AssetsUtil.parseCsvFile(`${algorithmFolderPath}/betas.csv`);

        this.covariates = Object.keys(sheet[0])
            .filter(columnName => {
                return columnName !== BetasSheet.BaselineHazardColumnName;
            })
            .map(covariateName => {
                return new BetasSheetCovariate(
                    covariateName,
                    sheet[0][covariateName],
                );
            });
        this.baselineHazard = sheet[0][BetasSheet.BaselineHazardColumnName];
    }
}
