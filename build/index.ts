import 'babel-polyfill';

import { getModelBuildData } from './util';
import { buildModelJsonFromFolder } from './model';
import * as fs from 'fs';
import { addGroupsToModelsCovariates } from './groups';

async function build() {
    const modelBuildData = getModelBuildData();

    const models = await Promise.all(
        modelBuildData.map(({ folderPath, modelName }) => {
            return buildModelJsonFromFolder(folderPath, modelName);
        }),
    );
    addGroupsToModelsCovariates(models);

    models.forEach((model, index) => {
        fs.writeFileSync(
            `${modelBuildData[index].folderPath}/model.json`,
            JSON.stringify(model, null, 4),
        );
    });
}

build()
    .then(() => {
        console.log('Done');
    })
    .catch(err => {
        console.error(err);
    });
