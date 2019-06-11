import { RegressionType } from './regression-type';
import { TimeMetric } from './time-metric';
import { AlgorithmType } from './algorithm-type';
import { AssetsUtil } from '../assets-util';

interface IModelConfigJson {
    modelName: string;
    genderSpecific: boolean;
    algorithmType: AlgorithmType;
    regressionType: RegressionType;
    maximumTime: number;
    timeMetric: TimeMetric;
    useMsw: boolean;
    extends?: string;
    sexVariable?: string;
    sexValues?: {
        male: number;
        female: number;
    };
}

export class ModelConfig {
    config: IModelConfigJson;

    constructor(modelName: string) {
        this.config = require(ModelConfig.getModelConfigPath(modelName));
    }

    static getModelConfigPath(modelName: string): string {
        return `${AssetsUtil.getAssetsFolderPath(modelName)}/model-config.json`;
    }
}
