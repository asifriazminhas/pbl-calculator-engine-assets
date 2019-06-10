import { ModelAssets } from './model-assets';
import { AlgorithmAssets } from './algorithm-assets/algorithm-assets';
import { ModelConfig } from './model-config/model-config';
import { AssetsUtil } from './assets-util';

export class UnStratifiedModelAssets extends ModelAssets {
    // This is initialized in the finishConstruction method due to the async finishConstruction method for the AlgorithmAssets class
    algorithmAssets!: AlgorithmAssets;

    constructor(modelConfig: ModelConfig) {
        super(modelConfig);
    }
    async finishConstruction(): Promise<UnStratifiedModelAssets> {
        this.algorithmAssets = await new AlgorithmAssets(
            this.modelConfig.config.modelName,
            this.modelAssetsFolder,
            this.modelConfig.config.useMsw,
            this.modelAssetsFolder,
            this.modelConfig.config.extends
                ? AssetsUtil.getAssetsFolderPath(
                      this.modelConfig.config.extends,
                  )
                : undefined,
        ).finishConstruction();

        return this;
    }

    forEachAlgorithmAssets(
        iterator: (
            algorithmAssets: AlgorithmAssets,
            index: number,
            algorithmsAssets: AlgorithmAssets[],
        ) => void,
    ): void {
        return [this.algorithmAssets].forEach(iterator);
    }
}
