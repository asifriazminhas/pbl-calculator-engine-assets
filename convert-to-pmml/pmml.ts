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
import {
    IDataField,
    ICategoricalDataField,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml';
import { Strings } from '../src/util/strings';
import { Validation } from '../src/ci/validation/validation';
import { NoLabelFoundWarning } from '../src/ci/validation/warnings/no-label-found-warning';
import { IValue } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ModelAssetsFactory } from '../src/ci/model-assets/model-assets-factory';
const formatXml = require('xml-formatter');

export async function writePMMLFilesForModel(modelName: string) {
    const modelAssets = await ModelAssetsFactory.createFromModelName(modelName);

    const modelConfig = modelAssets.modelConfig.config;
    const modelFolderPath = modelAssets.modelAssetsFolder;

    const algorithmNamesAndFolderPaths = getAlgorithmNamesAndFolderPathsForModel(
        modelName,
    );
    const parentAlgorithmNamesAndFolderPaths = modelConfig.extends
        ? getAlgorithmNamesAndFolderPathsForModel(modelConfig.extends)
        : [];

    modelAssets.forEachAlgorithmAssets((algorithmAssets, algorithmIndex) => {
        const { name, folderPath } = {
            name: algorithmAssets.algorithmName,
            folderPath: algorithmAssets.algorithmFolder,
        };
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

        const localTransformationsAndTaxonomy: {
            PMML: {
                LocalTransformations: ILocalTransformations;
                Taxonomy: ITaxonomy;
            };
        } = algorithmAssets.localTransformations;

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
                    ? constructDataDictionaryNodeForMSW(
                          betasCsvString,
                          webSpecificationsCsvString,
                          fs.readFileSync(
                              path.join(
                                  __dirname,
                                  '../master-reference-files/MSW/variable-details.csv',
                              ),
                              'utf8',
                          ),
                          algorithmAssets.localTransformations,
                      )
                    : makeDataDictionaryNode(
                          betasCsvString,
                          algorithmAssets.localTransformations,
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
    });
}

function addWarningsForDataFields(algorithm: string, dataFields: IDataField[]) {
    return dataFields
        .filter(dataField => {
            return (
                !isInteractionField(dataField) &&
                !isMutatedField(dataField) &&
                !isDummyField(dataField) &&
                !isCenteredField(dataField) &&
                !isRcsVariable(dataField)
            );
        })
        .forEach(dataField => {
            if (Strings.isEmpty(dataField.$.displayName)) {
                Validation.addWarning(
                    NoLabelFoundWarning.ForVariable(
                        algorithm,
                        dataField.$.name,
                    ),
                );
            }

            if (dataField.$.optype === 'categorical') {
                const categoricalDataField = dataField as ICategoricalDataField;

                if (categoricalDataField.Value) {
                    if (categoricalDataField.Value instanceof Array) {
                        categoricalDataField.Value.forEach(value => {
                            addWarningsForValue(
                                algorithm,
                                categoricalDataField.$.name,
                                value,
                            );
                        });
                    } else {
                        addWarningsForValue(
                            algorithm,
                            categoricalDataField.$.name,
                            categoricalDataField.Value,
                        );
                    }
                }
            }
        });
}

function isInteractionField(dataField: IDataField) {
    return /interaction[0-9]+/.test(dataField.$.name);
}

function isMutatedField(dataField: IDataField) {
    return /.*_Mutated_[0-9]+$/.test(dataField.$.name);
}

function isDummyField(dataField: IDataField) {
    return /.*_cat[0-9]+_([0-9]+|NA)$/.test(dataField.$.name);
}

function isCenteredField(dataField: IDataField) {
    return /.*_C$/.test(dataField.$.name);
}

function isRcsVariable(dataField: IDataField) {
    return /.*_rcs[0-9]+$/.test(dataField.$.name);
}

function addWarningsForValue(
    algorithm: string,
    variable: string,
    value: IValue,
) {
    if (Strings.isEmpty(value.$.displayName)) {
        Validation.addWarning(
            NoLabelFoundWarning.ForCategory(algorithm, variable, value.$.value),
        );
    }
}
