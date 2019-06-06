export interface IModelConfigJson {
    modelName: string;
    genderSpecific: boolean;
    algorithmType: 'Simple' | 'Regression';
    regressionType: 'CoxRegression';
    maximumTime: number;
    timeMetric: 'days' | 'years';
    useMsw: boolean;
    extends?: string;
    sexVariable?: string;
    sexValues?: {
        male: number;
        female: number;
    };
}

export interface IConfigJson {
    models: Array<{
        name: string;
        webSpecVersion: 'v1' | 'v2';
    }>;
}
