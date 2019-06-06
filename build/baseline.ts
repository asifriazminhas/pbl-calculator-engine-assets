import { BaselineJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-baseline';
import csvParse from 'csv-parse/lib/sync';
import {
    IModelJson,
    getAlgorithmJsonForPredicateData,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-model';
import { getModelBuildData } from './util';
import * as fs from 'fs';

export function addBaselinesToModelJsons(modelJsons: IModelJson[]) {
    const modelNamesAndFolderPaths = getModelBuildData();

    modelJsons.forEach((modelJson, index) => {
        const currentModelFolderPath = modelNamesAndFolderPaths[index];

        if (fs.existsSync(`${currentModelFolderPath}/baseline-references`)) {
            const baselineJson = getBaselineJson({
                male: fs.readFileSync(
                    `${currentModelFolderPath}/baseline-references/male.csv`,
                    'utf8',
                ),
                female: fs.readFileSync(
                    `${currentModelFolderPath}/baseline-references/female.csv`,
                    'utf8',
                ),
            });

            if (modelJson.algorithms.length > 1) {
                const predicateData = [
                    [
                        {
                            name: 'sex',
                            coefficent: 'male',
                        },
                    ],
                    [
                        {
                            name: 'sex',
                            coefficent: 'female',
                        },
                    ],
                ];
                getAlgorithmJsonForPredicateData(
                    modelJson,
                    predicateData[0],
                ).baseline = baselineJson.male;
                getAlgorithmJsonForPredicateData(
                    modelJson,
                    predicateData[1],
                ).baseline = baselineJson.female;
            }
        }
    });
}

export function getBaselineJson(baselineCsvStrings: {
    male: string;
    female: string;
}): {
    male: BaselineJson;
    female: BaselineJson;
} {
    const baselineCsv: {
        male: BaselineCsv;
        female: BaselineCsv;
    } = {
        male: csvParse(baselineCsvStrings.male, {
            columns: true,
        }),
        female: csvParse(baselineCsvStrings.female, {
            columns: true,
        }),
    };

    return {
        male: getBaselineJsonFromBaselineCsv(baselineCsv.male),
        female: getBaselineJsonFromBaselineCsv(baselineCsv.female),
    };
}

interface IBaselineCsvRow {
    age: string;
    baseline: string;
}

type BaselineCsv = IBaselineCsvRow[];

function getBaselineJsonFromBaselineCsv(
    baselineCsv: BaselineCsv,
): BaselineJson {
    return baselineCsv.reduce(
        (
            baselineJson: Array<{ age: number; baseline: number }>,
            currentBaselineCsvRow,
        ) => {
            return baselineJson.concat({
                age: Number(currentBaselineCsvRow.age),
                baseline: Number(currentBaselineCsvRow.baseline),
            });
        },
        [],
    );
}
