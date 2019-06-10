import { ModelAssets } from './model-assets';
import { AlgorithmAssets } from './algorithm-assets';
import { ModelConfig } from './model-config/model-config';

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
        ).finishConstruction();
        this.femaleAlgorithmAssets = await new AlgorithmAssets(
            this.getAlgorithmNameForSex(Sex.Female),
            this.getAlgorithmAssetsFolderForSex(Sex.Female),
        );

        return this;
    }

    private getAlgorithmNameForSex(sex: string) {
        return `${this.modelConfig.config.modelName} ${sex} algorithm`;
    }

    private getAlgorithmAssetsFolderForSex(sex: string) {
        return `${this.modelAssetsFolder}/${sex}`;
    }
}

enum Sex {
    Male = 'male',
    Female = 'female',
}
