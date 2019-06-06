import { makeHeaderNode } from './header';
import * as fs from 'fs';
import { IPmml } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/pmml';
import { makeGeneralRegressionModelNode } from './general-regression-model';
import { makeDataDictionaryNode } from './data-dictionary';
import { parseString, convertableToString, OptionsV2 } from 'xml2js';
import { promisify } from 'bluebird';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { ITaxonomy } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/taxonomy';
import { makeCustomPmmlNode } from './custom-pmml';
import { constructMiningSchemaNode } from './mining-schema';
import {
    getAlgorithmNamesAndFolderPathsForModel,
    getConfigForModel,
} from './util';
// xml2js has 2 types for the same function name (parseString) and we want the second type (the one with the options argument). But when promisifying the function the type returned will be the first type promisified, thus we have to explicitly set the type of the promisified parseString
const promisifiedParseString = promisify(parseString as (
    xml: convertableToString,
    options: OptionsV2,
    callback: (err: any, result: any) => void,
) => void);
import * as path from 'path';
import { buildXmlFromXml2JsObject } from '@ottawamhealth/pbl-calculator-engine/lib/util/xmlbuilder';
import { constructDataDictionaryNode as constructDataDictionaryNodeForMSW } from './msw/data-dictionary';
import { addWarningsForDataFields } from '../src/singletons/warnings/warnings';
const formatXml = require('xml-formatter');

export async function writePMMLFilesForModel(modelName: string) {
    const modelConfig = getConfigForModel(modelName);
    const modelFolderPath = path.join(__dirname, `../${modelConfig.modelName}`);

    const algorithmNamesAndFolderPaths = getAlgorithmNamesAndFolderPathsForModel(
        modelName,
    );
    const parentAlgorithmNamesAndFolderPaths = modelConfig.extends
        ? getAlgorithmNamesAndFolderPathsForModel(modelConfig.extends)
        : [];

    for (
        let algorithmIndex = 0;
        algorithmIndex < algorithmNamesAndFolderPaths.length;
        algorithmIndex++
    ) {
        const { name, folderPath } = algorithmNamesAndFolderPaths[
            algorithmIndex
        ];
        const parentAlgorithmFolderPath = parentAlgorithmNamesAndFolderPaths[
            algorithmIndex
        ]
            ? parentAlgorithmNamesAndFolderPaths[algorithmIndex].folderPath
            : undefined;

        const betasCsvString = fs.readFileSync(
            `${
                parentAlgorithmFolderPath
                    ? parentAlgorithmFolderPath
                    : folderPath
            }/betas.csv`,
            'utf8',
        );

        const referenceCsvPath = `${
            parentAlgorithmFolderPath ? parentAlgorithmFolderPath : folderPath
        }/reference.csv`;
        const referenceCsvString = fs.readFileSync(referenceCsvPath, 'utf8');

        const localTransformationsXmlString = fs.readFileSync(
            `${folderPath}/local-transformations.xml`,
            'utf8',
        );
        const localTransformationsAndTaxonomy: {
            PMML: {
                LocalTransformations: ILocalTransformations;
                Taxonomy: ITaxonomy;
            };
        } = await promisifiedParseString(localTransformationsXmlString, {
            explicitArray: false,
            explicitChildren: true,
            preserveChildrenOrder: true,
        });

        const generalRegressionModel = makeGeneralRegressionModelNode(
            betasCsvString,
            modelConfig,
            referenceCsvString,
        );

        const webSpecificationsCsvString = modelConfig.useMsw
            ? fs.readFileSync(`${folderPath}/variables.csv`, 'utf8')
            : fs.readFileSync(
                  `${modelFolderPath}/web-specifications.csv`,
                  'utf8',
              );

        const webSpecCategoriesPath = `${modelFolderPath}/web-specifications-categories.csv`;
        const webSpecificationCategoriesCsvString = fs.existsSync(
            webSpecCategoriesPath,
        )
            ? fs.readFileSync(webSpecCategoriesPath, 'utf8')
            : undefined;

        const pmml: IPmml = Object.assign(
            {
                Header: makeHeaderNode(name),
                DataDictionary: modelConfig.useMsw
                    ? await constructDataDictionaryNodeForMSW(
                          betasCsvString,
                          webSpecificationsCsvString,
                          fs.readFileSync(
                              path.join(
                                  __dirname,
                                  '../master-reference-files/MSW/variable-details.csv',
                              ),
                              'utf8',
                          ),
                          fs.readFileSync(
                              `${folderPath}/local-transformations.xml`,
                              'utf8',
                          ),
                      )
                    : await makeDataDictionaryNode(
                          betasCsvString,
                          localTransformationsXmlString,
                          webSpecificationsCsvString,
                          referenceCsvString,
                          webSpecificationCategoriesCsvString,
                      ),
                LocalTransformations:
                    localTransformationsAndTaxonomy.PMML.LocalTransformations,
                GeneralRegressionModel: generalRegressionModel,
                MiningSchema: modelConfig.useMsw
                    ? {
                          MiningField: [],
                      }
                    : constructMiningSchemaNode(webSpecificationsCsvString),
                ...makeCustomPmmlNode(
                    generalRegressionModel,
                    referenceCsvString,
                ),
            },
            localTransformationsAndTaxonomy.PMML.Taxonomy
                ? { Taxonomy: localTransformationsAndTaxonomy.PMML.Taxonomy }
                : undefined,
        );

        addWarningsForDataFields(
            algorithmNamesAndFolderPaths[algorithmIndex].name,
            pmml.DataDictionary.DataField,
        );

        fs.writeFileSync(
            `${folderPath}/model.xml`,
            formatXml(
                '<?xml version="1.0" encoding="UTF-8"?>' +
                    buildXmlFromXml2JsObject({
                        PMML: pmml,
                    }),
                {
                    collapseContent: true,
                },
            ),
        );
    }
}
