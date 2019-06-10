import * as path from 'path';
import { readFileSync } from 'fs';
import csvParse from 'csv-parse/lib/sync';

export abstract class AssetsUtil {
    static getAssetsFolderPath(modelName: string) {
        return path.join(__dirname, `../../../../${modelName}`);
    }

    static parseCsvFile(filePath: string) {
        return csvParse(readFileSync(filePath, 'utf8'), {
            columns: true,
        });
    }
}
