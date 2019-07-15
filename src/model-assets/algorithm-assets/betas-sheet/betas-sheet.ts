import { AssetsUtil } from '../../assets-util';
import { VariableBeta } from '../variable-beta';

export class BetasSheet {
    covariates: VariableBeta[];

    constructor(algorithmFolderPath: string) {
        const sheet: IBetasSheetCsvRow[] = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/predictive-betas.csv`,
        );

        this.covariates = sheet.map(({ Covariate, Beta }) => {
            return new VariableBeta(Covariate, Beta);
        });
    }
}

interface IBetasSheetCsvRow {
    Covariate: string;
    Beta: string;
}
