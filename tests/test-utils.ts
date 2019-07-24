import * as fs from 'fs';
import * as path from 'path';
import { IModelConfigJson } from '../reference-files';
import { Model } from '@ottawamhealth/pbl-calculator-engine/lib/engine/model/model';
import { Data } from '@ottawamhealth/pbl-calculator-engine/lib/engine/data';
import { CoxSurvivalAlgorithm } from '@ottawamhealth/pbl-calculator-engine/lib/engine/algorithm/regression-algorithm/cox-survival-algorithm/cox-survival-algorithm';
const createCsvParseStream = require('csv-parse');
import * as test from 'tape';
import { uniq } from 'lodash';

function getAlgorithmNamesToTest(): string[] {
    const config = require('../config.json');

    return uniq(
        config.models.map(({ name }: { name: string }) => {
            return name;
        }),
    );
}

async function getModelObjFromAlgorithmName(
    algorithmName: string,
): Promise<Model> {
    return new Model(require(`../${algorithmName}/model.json`));
}

export async function getModelsToTest(): Promise<
    Array<{ model: Model; name: string }>
> {
    const modelNames = getAlgorithmNamesToTest();

    const models = await Promise.all(
        modelNames.map(algorithmName => {
            return getModelObjFromAlgorithmName(algorithmName);
        }),
    );

    return models.map((model, index) => {
        model.name = modelNames[index];

        return {
            model,
            name: modelNames[index],
        };
    });
}

export function getRelativeDifference(num1: number, num2: number): number {
    if (!Number(num1) && !Number(num2)) {
        return 0;
    }

    if (Number(num1) === 0 && Number(num2) !== 0) {
        return 100;
    }

    return (Math.abs(num1 - num2) / Math.abs(num1)) * 100;
}

function streamValidationCsvFile(
    filePath: string,
    onData: (data: Data, index: number) => void,
    onEnd: () => void,
    onError: (err: Error) => void,
) {
    let index = 2;

    const readScoreTestingDataFileStream = fs.createReadStream(filePath);

    const readScoreTestingDataCsvStream = createCsvParseStream({
        columns: true,
    });

    const scoreTestingDataStream = readScoreTestingDataFileStream.pipe(
        readScoreTestingDataCsvStream,
    );

    scoreTestingDataStream.on('error', (error: Error) => {
        return onError(error);
    });

    scoreTestingDataStream.on('end', () => {
        return onEnd();
    });

    scoreTestingDataStream.on('data', (csvRow: { [index: string]: string }) => {
        onData(
            Object.keys(csvRow).map(currentColumnName => {
                return {
                    name: currentColumnName,
                    coefficent: csvRow[currentColumnName],
                };
            }),
            index,
        );
        index += 1;
    });
}

export async function runIntegrationTest(
    validationFilesFolderName: string,
    validationFileName: string,
    testType: string,
    _modelsToExclude: string[],
    runTestForDataAndAlgorithm: (
        algorithm: CoxSurvivalAlgorithm,
        data: Data,
        index: number,
    ) => void,
    t: test.Test,
) {
    validationFileName;

    const modelsToTest = await getModelsToTest();

    modelsToTest.forEach(({ model }) => {
        t.test(`Testing ${testType} for model ${model.name}`, t => {
            const validationCsvFilePaths: string[][] = [];
            const modelPredicateDatas: Data[] = [];

            const modelConfig: IModelConfigJson = require(`../${
                model.name
            }/model-config.json`);

            if (model.algorithms.length === 1) {
                validationCsvFilePaths.push(
                    getCsvFilePathsInFolder(
                        path.join(
                            __dirname,
                            `../${
                                modelConfig.extends
                                    ? modelConfig.extends
                                    : model.name
                            }/validation-data/${validationFilesFolderName}`,
                        ),
                    ),
                );
                modelPredicateDatas.push([]);
            } else {
                const sexVariable =
                    modelConfig.sexVariable === undefined
                        ? 'sex'
                        : modelConfig.sexVariable;

                validationCsvFilePaths.push(
                    getCsvFilePathsInFolder(
                        path.join(
                            __dirname,
                            `../${
                                modelConfig.extends
                                    ? modelConfig.extends
                                    : model.name
                            }/validation-data/${validationFilesFolderName}/male`,
                        ),
                    ),
                );
                modelPredicateDatas.push([
                    {
                        name: sexVariable,
                        coefficent:
                            modelConfig.sexValues !== undefined
                                ? modelConfig.sexValues.male
                                : 'male',
                    },
                ]);

                validationCsvFilePaths.push(
                    getCsvFilePathsInFolder(
                        path.join(
                            __dirname,
                            `../${
                                modelConfig.extends
                                    ? modelConfig.extends
                                    : model.name
                            }/validation-data/${validationFilesFolderName}/female`,
                        ),
                    ),
                );
                modelPredicateDatas.push([
                    {
                        name: sexVariable,
                        coefficent:
                            modelConfig.sexValues !== undefined
                                ? modelConfig.sexValues.female
                                : 'female',
                    },
                ]);
            }

            modelPredicateDatas.forEach((currentModelPredicateData, index) => {
                const algorithm = model.getAlgorithmForData(
                    currentModelPredicateData,
                );

                // tslint:disable-next-line:no-shadowed-variable
                t.test(
                    `Testing ${testType} for algorithm ${algorithm.name}`,
                    t => {
                        validationCsvFilePaths[index].forEach(
                            validationCsvFilePath => {
                                testValidationFile(
                                    validationCsvFilePath,
                                    algorithm,
                                    runTestForDataAndAlgorithm,
                                    testType,
                                    t,
                                );
                            },
                        );
                    },
                );
            });
        });
    });
}

function getCsvFilePathsInFolder(folderPath: string): string[] {
    return fs
        .readdirSync(folderPath)
        .filter(fileOrFolderName => {
            const fileOrFolderPath = `${folderPath}/${fileOrFolderName}`;

            if (fs.statSync(`${folderPath}/${fileOrFolderName}`).isFile()) {
                if (path.parse(fileOrFolderPath).ext === '.csv') {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        })
        .map(csvFileName => {
            return `${folderPath}/${csvFileName}`;
        });
}

function testValidationFile(
    validationCsvFilePath: string,
    algorithm: CoxSurvivalAlgorithm,
    runTestForDataAndAlgorithm: (
        algorithm: CoxSurvivalAlgorithm,
        data: Data,
        index: number,
    ) => void,
    testType: string,
    t: test.Test,
) {
    const fileName = path.parse(validationCsvFilePath).name;

    t.test(
        `Testing algorithm ${
            algorithm.name
        } for ${testType} for file ${fileName}`,
        t => {
            streamValidationCsvFile(
                validationCsvFilePath,
                (data, currentIndex) => {
                    return runTestForDataAndAlgorithm(
                        algorithm,
                        data,
                        currentIndex,
                    );
                },
                () => {
                    t.pass(
                        `${testType} validated for algorithm ${
                            algorithm.name
                        } for file ${fileName}`,
                    );
                    t.end();
                },
                err => {
                    t.end(err);
                },
            );
        },
    );
}
