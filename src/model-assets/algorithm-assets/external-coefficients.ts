import { AssetsUtil } from '../assets-util';
import { VariableBeta } from './variable-beta';
import { existsSync } from 'fs';

export class ExternalCoefficients {
    betaSetName: string;
    variableBetas: VariableBeta[];

    constructor(
        betaSetName: string,
        externalCoefficientsCsv: IExternalCoefficientsCsvRow[],
    ) {
        this.betaSetName = betaSetName;
        this.variableBetas = externalCoefficientsCsv.map(csvRow => {
            return new VariableBeta(csvRow.Variable, csvRow[betaSetName]);
        });
    }

    static create(
        algorithmFolderPath: string,
    ): ExternalCoefficients[] | undefined {
        const csvFilePath = `${algorithmFolderPath}/external-coefficients.csv`;
        if (!existsSync(csvFilePath)) {
            return undefined;
        }

        const externalCoefficientsCsv: IExternalCoefficientsCsvRow[] = AssetsUtil.parseCsvFile(
            csvFilePath,
        );
        const betaSetNames = Object.keys(externalCoefficientsCsv[0]).filter(
            columnName => {
                return columnName !== 'Variable';
            },
        );

        return betaSetNames.map(betaSetName => {
            return new ExternalCoefficients(
                betaSetName,
                externalCoefficientsCsv,
            );
        });
    }
}

interface IExternalCoefficientsCsvRow {
    Variable: string;
    [betaSetName: string]: string;
}
