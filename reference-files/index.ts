export interface IModelConfigJson {
    modelName: string;
    genderSpecific: boolean;
    regressionType: 'CoxRegression';
    maximumTime: number;
    timeMetric: 'days' | 'years';
    useMsw: boolean;
    extends?: string;
}

export interface IConfigJson {
    models: Array<{
        name: string;
        webSpecVersion: 'v1' | 'v2';
    }>;
}
