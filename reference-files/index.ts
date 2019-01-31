export interface IAlgorithmJson {
    algorithmName: string;
    genderSpecific: boolean;
    regressionType: 'CoxRegression';
    maximumTime: number;
    timeMetric: 'days' | 'years';
    extends?: string;
}
