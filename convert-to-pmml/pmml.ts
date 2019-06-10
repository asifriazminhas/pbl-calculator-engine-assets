import { makeHeaderNode } from './header';
import * as fs from 'fs';
import { IPmml } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/pmml';
import { makeGeneralRegressionModelNode } from './general-regression-model';
import { makeDataDictionaryNode } from './data-dictionary';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { ITaxonomy } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/taxonomy';
import { makeCustomPmmlNode } from './custom-pmml';
import { constructMiningSchemaNode } from './mining-schema';
import { getAlgorithmNamesAndFolderPathsForModel } from './util';
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
import { MSW } from '../src/ci/model-assets/web-spec/msw/msw';
import { WebSpecV1 } from '../src/ci/model-assets/web-spec/web-spec-v1/web-spec-v1';
const formatXml = require('xml-formatter');

export async function writePMMLFilesForModel(modelName: string) {
    const modelAssets = await ModelAssetsFactory.createFromModelName(modelName);

    const modelConfig = modelAssets.modelConfig.config;
    const modelFolderPath = modelAssets.modelAssetsFolder;

    const algorithmNamesAndFolderPaths = getAlgorithmNamesAndFolderPathsForModel(
        modelName,
    );

    modelAssets.forEachAlgorithmAssets((algorithmAssets, algorithmIndex) => {
        const { name, folderPath } = {
            name: algorithmAssets.algorithmName,
            folderPath: algorithmAssets.algorithmFolder,
        };

        const localTransformationsAndTaxonomy: {
            PMML: {
                LocalTransformations: ILocalTransformations;
                Taxonomy: ITaxonomy;
            };
        } = algorithmAssets.localTransformations;

        const generalRegressionModel = makeGeneralRegressionModelNode(
            algorithmAssets.betasCsv,
            modelConfig,
            algorithmAssets.referenceCsv,
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
                          algorithmAssets.betasCsv,
                          algorithmAssets.webSpec as MSW,
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
                          algorithmAssets.betasCsv,
                          algorithmAssets.localTransformations,
                          algorithmAssets.webSpec as WebSpecV1,
                          algorithmAssets.referenceCsv,
                      ),
                LocalTransformations:
                    localTransformationsAndTaxonomy.PMML.LocalTransformations,
                GeneralRegressionModel: generalRegressionModel,
                MiningSchema: modelConfig.useMsw
                    ? {
                          MiningField: [],
                      }
                    : constructMiningSchemaNode(
                          algorithmAssets.webSpec as WebSpecV1,
                      ),
                ...makeCustomPmmlNode(
                    generalRegressionModel,
                    algorithmAssets.referenceCsv,
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
