import { AssetsUtil } from '../../assets-util';
import { BetasSheetCovariate } from './betas-sheet-covariate';

export class BetasSheet {
    covariates: BetasSheetCovariate[];

    constructor(algorithmFolderPath: string) {
        const sheet: IBetasSheetCsvRow[] = AssetsUtil.parseCsvFile(
            `${algorithmFolderPath}/betas.csv`,
        );

        this.covariates = sheet.map(({ Covariate, Beta }) => {
            return new BetasSheetCovariate(Covariate, Beta);
        });
    }
}

interface IBetasSheetCsvRow {
    Covariate: string;
    Beta: string;
}
