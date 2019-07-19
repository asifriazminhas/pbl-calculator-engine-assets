import { IModelJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-model';
import { pmmlXmlStringsToJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml-to-json-parser/pmml';
import * as fs from 'fs';
import { IBinsData } from '@ottawamhealth/pbl-calculator-engine/lib/engine/algorithm/regression-algorithm/cox-survival-algorithm/bins/bins';
import {
    NegativeInfinityString,
    IBinsLookupJsonItem,
    PositiveInfinityString,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-bins';
import { isGenderedModel } from './util';
import csvParse from 'csv-parse/lib/sync';
import { IModelConfigJson } from '../reference-files';
import bluebird from 'bluebird';
import { parseString, convertableToString, OptionsV2 } from 'xml2js';
import {
    ICustomPmml,
    Pmml,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/pmml';
// xml2js has 2 types for the same function name (parseString) and we want the second type (the one with the options argument). But when promisifying the function the type returned will be the first type promisified, thus we have to explicitly set the type of the promisified parseString
const promisifiedParseXmlString = bluebird.promisify(parseString as (
    xml: convertableToString,
    options: OptionsV2,
    callback: (err: any, result: any) => void,
) => void);
import { parseDerivedFields } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml-to-json-parser/data_fields/derived_field/derived_field';
import { returnEmptyArrayIfUndefined } from '@ottawamhealth/pbl-calculator-engine/lib/util/undefined/undefined';
import { AlgorithmType } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/algorithm-type';
import { IJsonSimpleAlgorithm } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-simple-algorithm';
import { parseDefineFunction } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml-to-json-parser/define-function/define-function';
import { parseTaxonomy } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml-to-json-parser/taxonomy';

export async function buildModelJsonFromFolder(
    folderPath: string,
    algorithmName: string,
): Promise<IModelJson | IJsonSimpleAlgorithm> {
    const modelConfig: IModelConfigJson = require(`${folderPath}/model-config.json`);
    if (modelConfig.algorithmType === 'Simple') {
        const pmmlXml: {
            PMML: ICustomPmml;
        } = await promisifiedParseXmlString(
            fs.readFileSync(`${folderPath}/model.xml`, 'utf8'),
            {
                explicitArray: false,
                explicitChildren: true,
                preserveChildrenOrder: true,
            },
        );
        const pmml = new Pmml(pmmlXml);
        const allDefineFunctionNames = returnEmptyArrayIfUndefined(
            pmml.pmmlXml.PMML.LocalTransformations.DefineFunction,
        ).map(defineFunction => defineFunction.$.name);
        const algorithmJson = {
            algorithmType: AlgorithmType.SimpleAlgorithm,
            name: pmmlXml.PMML.Header.Extension.value,
            derivedFields: parseDerivedFields(pmml, allDefineFunctionNames),
            output: pmml.pmmlXml.PMML.Output!.OutputField.$.name,
            tables: parseTaxonomy(pmml.pmmlXml.PMML.Taxonomy),
            userFunctions: returnEmptyArrayIfUndefined(
                pmml.pmmlXml.PMML.LocalTransformations.DefineFunction,
            )
                .map(defineFunction =>
                    parseDefineFunction(defineFunction, allDefineFunctionNames),
                )
                .reduce((userFunctionObj, currentObject) => {
                    return Object.assign({}, userFunctionObj, currentObject);
                }, {}),
        } as IJsonSimpleAlgorithm;
        return algorithmJson;
    } else if (isGenderedModel(folderPath)) {
        const modelConfig: IModelConfigJson = require(`${folderPath}/model-config.json`);
        const sexVariable = modelConfig.sexVariable
            ? modelConfig.sexVariable
            : 'sex';
        const sexValues = modelConfig.sexValues
            ? modelConfig.sexValues
            : {
                  male: 'male',
                  female: 'female',
              };

        const model = await pmmlXmlStringsToJson(
            [
                [fs.readFileSync(`${folderPath}/male/model.xml`, 'utf8')],
                [fs.readFileSync(`${folderPath}/female/model.xml`, 'utf8')],
            ],
            [
                {
                    equation: `predicateResult = obj['${sexVariable}'] === '${
                        sexValues.male
                    }'`,
                    variables: [sexVariable],
                },
                {
                    equation: `predicateResult = obj['${sexVariable}'] === '${
                        sexValues.female
                    }'`,
                    variables: [sexVariable],
                },
            ],
        );
        model.algorithms[0].algorithm.name = `${algorithmName} male model`;
        model.algorithms[1].algorithm.name = `${algorithmName} female model`;

        return model;
    } else {
        const model = await pmmlXmlStringsToJson(
            [[fs.readFileSync(`${folderPath}/model.xml`, 'utf8')]],
            [
                {
                    equation: `predicateResult = true`,
                    variables: [],
                },
            ],
        );

        if (fs.existsSync(`${folderPath}/bins-data.csv`)) {
            model.algorithms[0].algorithm.bins = {
                //@ts-ignore
                binsData: convertBinsDataCsvToBinsData(
                    fs.readFileSync(`${folderPath}/bins-data.csv`, 'utf8'),
                ),
                //@ts-ignore
                binsLookup: convertBinsLookupCsvToBinsLookupJson(
                    fs.readFileSync(`${folderPath}/bin-lookup.csv`, 'utf8'),
                ),
            };
        }

        return model;
    }
}

type BinsDataCsv = IBinsDataCsvRow[];

interface IBinsDataCsvRow {
    Percent: string;
    [index: string]: string;
}

function convertBinsDataCsvToBinsData(binsDataCsvString: string): IBinsData {
    const binsDataCsv: BinsDataCsv = csvParse(binsDataCsvString, {
        columns: true,
    });

    /* This object has all the bins numbers as the field names but the actual
  values are just empty objects i.e. the data for each percent is not in there */
    const binsDataWithoutPercents: IBinsData =
        /* Start with getting all the column names in the first csv row */
        Object.keys(binsDataCsv[0])
            /* Remove the Percent column. All the other colums are the bin
          numbers as strings */
            .filter(binsDataCsvColumn => binsDataCsvColumn !== 'Percent')
            /* Convert them to a number */
            .map(Number)
            /* Convert it to the object */
            .reduce(
                (currentBinsData, currentBinDataCsvBinNumber) => {
                    /* Return an object which is a concatination of the
                  previous objects along with the current bin number */
                    return {
                        ...currentBinsData,
                        [currentBinDataCsvBinNumber]: [],
                    };
                },
                {} as IBinsData,
            );

    const binNumbers = Object.keys(binsDataCsv[0])
        .filter(binsDataCsvColumn => {
            return binsDataCsvColumn !== 'Percent';
        })
        .map(Number);

    binsDataCsv.forEach(binsDataCsvRow => {
        binNumbers.forEach(binNumber => {
            binsDataWithoutPercents[binNumber].push({
                survivalPercent: Number(binsDataCsvRow.Percent),
                time: isNaN(Number(binsDataCsvRow[String(binNumber)]))
                    ? undefined
                    : Number(binsDataCsvRow[String(binNumber)]),
            });
        });
    });

    return binsDataWithoutPercents;
}

interface IBinsLookupCsvRow {
    BinNumber: string;
    MinXscore: string;
    MaxXscore: string;
}

function convertBinsLookupCsvToBinsLookupJson(
    binsLookupCsvString: string,
): IBinsLookupJsonItem[] {
    const binsLookupCsv: IBinsLookupCsvRow[] = csvParse(binsLookupCsvString, {
        columns: true,
    });

    return binsLookupCsv.map((binsLookupCsvRow, index) => {
        const rowNumber = index + 2;

        if (!validateBinsLookupCsvRowScore(binsLookupCsvRow.MaxXscore)) {
            throw new Error(
                `Invalid MaxXscore value ${
                    binsLookupCsvRow.MaxXscore
                } in row ${rowNumber}`,
            );
        }

        if (!validateBinsLookupCsvRowScore(binsLookupCsvRow.MinXscore)) {
            throw new Error(
                `Invalid MinXscore value ${
                    binsLookupCsvRow.MinXscore
                } in row ${rowNumber}`,
            );
        }

        if (!validateBinsLookupCsvRowBinNumber(binsLookupCsvRow.BinNumber)) {
            throw new Error(
                `Invalid Bin Number value ${
                    binsLookupCsvRow.BinNumber
                } in row ${rowNumber}`,
            );
        }

        return {
            binNumber: Number(binsLookupCsvRow.BinNumber),
            minScore: isNaN(Number(binsLookupCsvRow.MinXscore))
                ? (binsLookupCsvRow.MinXscore as 'infinity')
                : Number(binsLookupCsvRow.MinXscore),
            maxScore: isNaN(Number(binsLookupCsvRow.MaxXscore))
                ? (binsLookupCsvRow.MaxXscore as 'infinity')
                : Number(binsLookupCsvRow.MaxXscore),
        };
    });
}

function validateBinsLookupCsvRowScore(score: string): boolean {
    return !isNaN(Number(score))
        ? true
        : score === PositiveInfinityString || score === NegativeInfinityString;
}

function validateBinsLookupCsvRowBinNumber(
    binNumber: IBinsLookupCsvRow['BinNumber'],
): boolean {
    return !isNaN(Number(binNumber));
}
