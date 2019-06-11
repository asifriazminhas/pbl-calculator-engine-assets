import * as path from 'path';
import { readFileSync } from 'fs';
import csvParse from 'csv-parse/lib/sync';
import { promisify } from 'bluebird';
import { parseString, convertableToString, OptionsV2 } from 'xml2js';
// xml2js has 2 types for the same function name (parseString) and we want the second type (the one with the options argument). But when promisifying the function the type returned will be the first type promisified, thus we have to explicitly set the type of the promisified parseString
const promisifiedParseString = promisify(parseString as (
    xml: convertableToString,
    options: OptionsV2,
    callback: (err: any, result: any) => void,
) => void);

export abstract class AssetsUtil {
    static getAssetsFolderPath(modelName: string) {
        return path.join(__dirname, `../../../../${modelName}`);
    }

    static parseCsvFile(filePath: string) {
        return csvParse(readFileSync(filePath, 'utf8'), {
            columns: true,
        });
    }

    static parseXmlFile(filePath: string) {
        return promisifiedParseString(readFileSync(filePath, 'utf8'), {
            explicitArray: false,
            explicitChildren: true,
            preserveChildrenOrder: true,
        });
    }
}
