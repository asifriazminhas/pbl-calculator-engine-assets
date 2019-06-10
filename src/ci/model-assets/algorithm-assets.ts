import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { ITaxonomy } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/taxonomy';
import { readFileSync } from 'fs';
import csvParse from 'csv-parse/lib/sync';
import { promisify } from 'bluebird';
import { parseString, convertableToString, OptionsV2 } from 'xml2js';
import { WebSpecV1 } from './web-spec/web-spec-v1/web-spec-v1';
import { MSW } from './web-spec/msw/msw';
// xml2js has 2 types for the same function name (parseString) and we want the second type (the one with the options argument). But when promisifying the function the type returned will be the first type promisified, thus we have to explicitly set the type of the promisified parseString
const promisifiedParseString = promisify(parseString as (
    xml: convertableToString,
    options: OptionsV2,
    callback: (err: any, result: any) => void,
) => void);

export class AlgorithmAssets {
    algorithmName: string;
    betasCsv: Array<{ [index: string]: string }>;
    referenceCsv: Array<{
        Variable: string;
        Mean: string;
        Minimum: string;
        Maximum: string;
        [index: string]: string;
    }>;
    localTransformations!: {
        PMML: {
            LocalTransformations: ILocalTransformations;
            Taxonomy: ITaxonomy;
        };
    }; // This is initialized in the finishConstruction method. Because the method to parse the XML is async it cannot be done in the constructor
    webSpec: MSW | WebSpecV1;
    algorithmFolder: string; // Store this because we cannot finish the construction in the constructor and we need it for the finishConstruction method

    constructor(
        algorithmName: string,
        algorithmFolder: string,
        useMsw: boolean,
        modelFolderPath: string,
        parentAlgorithmFolder?: string,
    ) {
        const csvParseOptions = {
            columns: true,
        };

        this.algorithmName = algorithmName;
        this.betasCsv = csvParse(
            readFileSync(
                `${
                    parentAlgorithmFolder
                        ? parentAlgorithmFolder
                        : algorithmFolder
                }/betas.csv`,
                'utf8',
            ),
            csvParseOptions,
        );
        this.referenceCsv = csvParse(
            readFileSync(
                `${
                    parentAlgorithmFolder
                        ? parentAlgorithmFolder
                        : algorithmFolder
                }/reference.csv`,
                'utf8',
            ),
            csvParseOptions,
        );
        this.algorithmFolder = algorithmFolder;
        this.webSpec = useMsw
            ? new MSW(algorithmFolder)
            : new WebSpecV1(modelFolderPath);
    }

    async finishConstruction(): Promise<AlgorithmAssets> {
        this.localTransformations = await promisifiedParseString(
            readFileSync(
                `${this.algorithmFolder}/local-transformations.xml`,
                'utf8',
            ),
            {
                explicitArray: false,
                explicitChildren: true,
                preserveChildrenOrder: true,
            },
        );

        return this;
    }
}
