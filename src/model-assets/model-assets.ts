import { existsSync } from 'fs';
import { AppUrl } from '../constants/ci';
import { Validation } from '../ci/validation/validation';
import { MarkdownBuilder } from 'md-builder';
import { ModelConfig } from './model-config/model-config';
import { AssetsUtil } from './assets-util';
import { AlgorithmAssets } from './algorithm-assets/algorithm-assets';

export abstract class ModelAssets {
    modelConfig: ModelConfig;

    constructor(modelConfig: ModelConfig) {
        this.modelConfig = modelConfig;
    }

    abstract forEachAlgorithmAssets(
        iterator: (
            algorithmAssets: AlgorithmAssets,
            index: number,
            algorithmsAssets: AlgorithmAssets[],
        ) => void,
    ): void;

    static validateAssetsForModel(modelName: string): boolean {
        const hasModelConfigJson = existsSync(
            ModelConfig.getModelConfigPath(modelName),
        );
        if (!hasModelConfigJson) {
            Validation.addError({
                algorithm: modelName,
                message: MarkdownBuilder.text(
                    `Missing model-config.json file in root of model folder. Please add one inside the ${modelName} folder. You can use the tool at${MarkdownBuilder.link(
                        {
                            linkTo: AppUrl,
                            linkLabel: AppUrl,
                        },
                    ).toMarkdown()} to generate the file contents`,
                ).toMarkdown(),
            });
            return false;
        }

        return true;
    }

    get modelAssetsFolder(): string {
        return AssetsUtil.getAssetsFolderPath(
            this.modelConfig.config.modelName,
        );
    }
}
