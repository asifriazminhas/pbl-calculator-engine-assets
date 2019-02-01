import { IGeneralRegressionModel } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/general_regression_model';
import { IParameter } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/parameter';
import { IPCell } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/p_cell';
import { IPredictor } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/predictor';
import { IModelConfigJson } from '../reference-files';
const csvParse = require('csv-parse/lib/sync');

export function makeGeneralRegressionModelNode(
    betasCsvString: string,
    referenceCsvString: string,
    modelConfig: IModelConfigJson,
): IGeneralRegressionModel {
    const betasCsv = csvParse(betasCsvString, {
        columns: true,
    });
    const covariateNames = Object.keys(betasCsv[0]).filter(columnName => {
        return columnName !== 'H0_5YR';
    });

    const referenceCsv: ReferenceCsv = csvParse(referenceCsvString, {
        columns: true,
    });
    const parameters: IParameter[] = covariateNames.map(
        (covariateName, index) => {
            const referenceCsvRow = referenceCsv.find(({ Variable }) => {
                return Variable === covariateName;
            });

            return {
                $: Object.assign(
                    {},
                    {
                        name: `p${index}`,
                        label: covariateName,
                    },
                    referenceCsvRow
                        ? {
                              referencePoint: referenceCsvRow.Mean,
                          }
                        : undefined,
                ),
            };
        },
    );

    const pCells: IPCell[] = covariateNames.map((covariateName, index) => {
        return {
            $: {
                parameterName: `p${index}`,
                df: '',
                beta: betasCsv[0][covariateName],
            },
        };
    });

    const predictors: IPredictor[] = covariateNames.map(covariateName => {
        return {
            $: {
                name: covariateName,
            },
        };
    });

    return {
        $: {
            baselineHazard: betasCsv[0]['H0_5YR'],
            modelType: 'CoxRegression',
        },
        ParameterList: {
            Parameter: parameters,
        },
        ParamMatrix: {
            PCell: pCells,
        },
        CovariateList: {
            Predictor: predictors,
        },
        Extension: [
            {
                name: 'maximumTime',
                value: `${modelConfig.maximumTime}`,
            },
            {
                name: 'timeMetric',
                value: `${
                    modelConfig.timeMetric
                }` as IModelConfigJson['timeMetric'],
            },
        ],
    };
}

interface ReferenceCsvRow {
    Variable: string;
    Mean: string;
}
type ReferenceCsv = ReferenceCsvRow[];
