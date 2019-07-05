import { ModelAssets } from './model-assets';
import { ModelConfig } from './model-config/model-config';
import { SexStratifiedModelAssets } from './sex-stratified-model-assets';
import { UnStratifiedModelAssets } from './un-stratified-model-assets';

export abstract class ModelAssetsFactory {
    static async createFromModelName(modelName: string): Promise<ModelAssets> {
        const modelConfig = new ModelConfig(modelName);
        if (modelConfig.config.genderSpecific) {
            return await new SexStratifiedModelAssets(
                modelConfig,
            ).finishConstruction();
        } else {
            return await new UnStratifiedModelAssets(
                modelConfig,
            ).finishConstruction();
        }
    }
}
