import { existsSync } from 'fs';
import * as path from 'path';
import { AppUrl } from '../../constants/ci';
import { Validation } from '../validation/validation';

export class ModelAssets {
    static validateAssetsForModel(modelName: string): boolean {
        const hasModelConfigJson = existsSync(
            path.join(__dirname, `../../../${modelName}/model-config.json`),
        );
        if (!hasModelConfigJson) {
            Validation.addError({
                algorithm: modelName,
                message: `Missing model-config.json file in root of model folder. Please add one inside the ${modelName} folder. You can use the tool at ${AppUrl} to generate the file contents`,
            });
            return false;
        }

        return true;
    }
}
