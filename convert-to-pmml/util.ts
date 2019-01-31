import { IAlgorithmJson } from '../reference-files';
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
                name: `${modelConfig.algorithmName} male algorithm`,
                folderPath: path.join(
                    __dirname,
                    `../${modelConfig.algorithmName}/male`,
                ),
            },
            {
                name: `${modelConfig.algorithmName} female algorithm`,
                folderPath: path.join(
                    __dirname,
                    `../${modelConfig.algorithmName}/female`,
                ),
            },
        ];
    } else {
        return [
            {
                name: `${modelConfig.algorithmName}`,
                folderPath: path.join(
                    __dirname,
                    `../${modelConfig.algorithmName}`,
                ),
            },
        ];
    }
}

export function getConfigForModel(name: string): IAlgorithmJson {
    return require(path.join(__dirname, `../${name}/algorithm-info.json`));
}
