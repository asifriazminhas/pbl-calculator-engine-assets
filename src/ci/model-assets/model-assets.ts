import { existsSync } from 'fs';
import * as path from 'path';
import { Errors } from '../validation/errors';

export class ModelAssets {
    static validateAssetsForModel(modelName: string): boolean {
        const hasModelConfigJson = existsSync(
            path.join(__dirname, `../../../${modelName}/model-config.json`),
        );
        if (!hasModelConfigJson) {
            Errors.addError({
                algorithm: modelName,
                message: `Missing model-config.json file in root of model folder. Please add one inside the ${modelName} folder. You can use the tool at {TODO ADD LINK HERE} to generate the file contents`,
            });
            return false;
        }

        return true;
    }
}
