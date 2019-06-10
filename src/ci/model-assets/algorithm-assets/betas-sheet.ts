import { readFileSync } from 'fs';
import csvParse from 'csv-parse/lib/sync';

export class BetasSheet {
    sheet: Array<{ [index: string]: string; H0_5YR: string }>;

    constructor(algorithmFolderPath: string) {
        this.sheet = csvParse(
            readFileSync(`${algorithmFolderPath}/betas.csv`, 'utf8'),
            {
                columns: true,
            },
        );
    }
}
