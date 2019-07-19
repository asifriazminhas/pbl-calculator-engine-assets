import 'babel-polyfill';
import 'source-map-support/register';

import { getModelBuildData } from './util';
import { buildModelJsonFromFolder } from './model';
import * as fs from 'fs';
import { addGroupsToModelsCovariates } from './groups';
import { IModelJson } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-model';
import { ModelAssetsFactory } from '../src/model-assets/model-assets-factory';
import { buildExternalCoefficientsJson } from './external-coefficients';

export async function build() {
    const modelBuildData = getModelBuildData();

    const models = await Promise.all(
        modelBuildData.map(({ folderPath, modelName }) => {
            return buildModelJsonFromFolder(folderPath, modelName);
        }),
    );
    addGroupsToModelsCovariates(models.filter(modelOrAlgorithm => {
        return 'algorithmType' in modelOrAlgorithm === false;
    }) as IModelJson[]);

    const modelAssets = await Promise.all(
        modelBuildData.map(({ modelName }) => {
            return ModelAssetsFactory.createFromModelName(modelName);
        }),
    );
    modelAssets.forEach(modelAsset => {
        buildExternalCoefficientsJson(modelAsset);
    });

    models.forEach((model, index) => {
        fs.writeFileSync(
            `${modelBuildData[index].folderPath}/model.json`,
            JSON.stringify(model, null, 4),
        );
    });
}
