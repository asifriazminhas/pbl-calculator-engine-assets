import { ModelAssets } from './model-assets';
import { AlgorithmAssets } from './algorithm-assets/algorithm-assets';
import { ModelConfig } from './model-config/model-config';
import { AssetsUtil } from './assets-util';

export class SexStratifiedModelAssets extends ModelAssets {
    maleAlgorithmAssets!: AlgorithmAssets; // Initialized within the finishConstruction method due to the need to call the async finishConstruction method for the AlgorithmAssets class
    femaleAlgorithmAssets!: AlgorithmAssets; // See comment for maleAlgorithmAssets

    constructor(modelConfig: ModelConfig) {
        super(modelConfig);
    }
    async finishConstruction(): Promise<SexStratifiedModelAssets> {
        this.maleAlgorithmAssets = await new AlgorithmAssets(
            this.getAlgorithmNameForSex(Sex.Male),
            this.getAlgorithmAssetsFolderForSex(Sex.Male),
            this.modelConfig.config.useMsw,
            this.modelAssetsFolder,
            this.getParentAlgorithmAssetsFolderForSex(Sex.Male),
        ).finishConstruction();
        this.femaleAlgorithmAssets = await new AlgorithmAssets(
            this.getAlgorithmNameForSex(Sex.Female),
            this.getAlgorithmAssetsFolderForSex(Sex.Female),
            this.modelConfig.config.useMsw,
            this.modelAssetsFolder,
            this.getParentAlgorithmAssetsFolderForSex(Sex.Female),
        );

        return this;
    }

    forEachAlgorithmAssets(
        iterator: (
            algorithmAssets: AlgorithmAssets,
            index: number,
            algorithmsAssets: AlgorithmAssets[],
        ) => void,
    ): void {
        return [this.maleAlgorithmAssets, this.femaleAlgorithmAssets].forEach(
            iterator,
        );
    }

    private getAlgorithmNameForSex(sex: string) {
        return `${this.modelConfig.config.modelName} ${sex} algorithm`;
    }

    private getAlgorithmAssetsFolderForSex(sex: string) {
        return `${this.modelAssetsFolder}/${sex}`;
    }

    private getParentAlgorithmAssetsFolderForSex(sex: string) {
        return this.modelConfig.config.extends
            ? `${AssetsUtil.getAssetsFolderPath(
                  this.modelConfig.config.extends,
              )}/sex`
            : undefined;
    }
}

enum Sex {
    Male = 'male',
    Female = 'female',
}
