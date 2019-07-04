import { IModelConfigJson } from '../../reference-files';
import * as path from 'path';

export function getAlgorithmNamesAndFolderPathsForModel(
    modelName: string,
): Array<{
    name: string;
    folderPath: string;
}> {
    const modelConfig = getConfigForModel(modelName);

    if (modelConfig.genderSpecific) {
        return [
            {
                name: `${modelConfig.modelName} male algorithm`,
                folderPath: path.join(
                    __dirname,
                    `../${modelConfig.modelName}/male`,
                ),
            },
            {
                name: `${modelConfig.modelName} female algorithm`,
                folderPath: path.join(
                    __dirname,
                    `../${modelConfig.modelName}/female`,
                ),
            },
        ];
    } else {
        return [
            {
                name: `${modelConfig.modelName}`,
                folderPath: path.join(__dirname, `../${modelConfig.modelName}`),
            },
        ];
    }
}

export function getConfigForModel(name: string): IModelConfigJson {
    return require(path.join(__dirname, `../../${name}/model-config.json`));
}
