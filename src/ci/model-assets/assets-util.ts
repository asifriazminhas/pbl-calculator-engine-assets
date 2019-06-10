import * as path from 'path';

export abstract class AssetsUtil {
    static getAssetsFolderPath(modelName: string) {
        return path.join(__dirname, `../../../../${modelName}`);
    }
}
