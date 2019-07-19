import { getModelBuildData } from '../util';
import * as fs from 'fs';
import { convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm } from '@ottawamhealth/pbl-calculator-engine/lib/scripts/cause-effect-csv-to-json';
import { IModelJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-model';

export function buildCauseEffectFiles(modelJsons: IModelJson[]) {
    const algorithmNamesAndFolderPaths = getModelBuildData();

    const causeEffectRefJsons = algorithmNamesAndFolderPaths
        .filter(({ folderPath }) => {
            return fs.existsSync(`${folderPath}/cause-effect-ref.csv`);
        })
        .map((algorithmDirectoryPath, index) => {
            return convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm(
                modelJsons[index],
                algorithmNamesAndFolderPaths[index].modelName,
                fs.readFileSync(
                    `${algorithmDirectoryPath}/cause-effect-ref.csv`,
                    'utf8',
                ),
            );
        });

    causeEffectRefJsons.forEach((causeEffectRefJson, index) => {
        fs.writeFileSync(
            `${
                algorithmNamesAndFolderPaths[index].folderPath
            }/cause-effect-ref.json`,
            JSON.stringify(causeEffectRefJson),
        );
    });
}
