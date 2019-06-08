import { RegressionType } from './regression-type';
import { TimeMetric } from './time-metric';
import * as path from 'path';

interface IModelConfigJson {
    modelName: string;
    genderSpecific: boolean;
    regressionType: RegressionType;
    maximumTime: number;
    timeMetric: TimeMetric;
}

export class ModelConfig {
    config: IModelConfigJson;

    constructor(modelName: string) {
        this.config = require(ModelConfig.getModelConfigPath(modelName));
    }

    static getModelConfigPath(modelName: string): string {
        return path.join(
            __dirname,
            `../../../../${modelName}/model-config.json`,
        );
    }
}
