import { IGeneralRegressionModel } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/general_regression_model';
import { IParameter } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/parameter';
import { IPCell } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/p_cell';
import { IPredictor } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/predictor';
import { AlgorithmAssets } from '../src/ci/model-assets/algorithm-assets/algorithm-assets';
import { ModelConfig } from '../src/ci/model-assets/model-config/model-config';

export function makeGeneralRegressionModelNode(
    algorithmAssets: AlgorithmAssets,
    modelConfig: ModelConfig,
): IGeneralRegressionModel {
    const { betasSheet, referenceSheet } = algorithmAssets;

    const parameters: IParameter[] = betasSheet.covariates.map(
        (covariate, index) => {
            const referenceCsvRow = referenceSheet.findRowForVariable(
                covariate.name,
            );

            return {
                $: Object.assign(
                    {},
                    {
                        name: `p${index}`,
                        label: covariate.name,
                    },
                    referenceCsvRow && referenceCsvRow.Mean
                        ? {
                              referencePoint: referenceCsvRow.Mean,
                          }
                        : undefined,
                ),
            };
        },
    );

    const pCells: IPCell[] = betasSheet.covariates.map((covariate, index) => {
        return {
            $: {
                parameterName: `p${index}`,
                df: '',
                beta: covariate.beta,
            },
        };
    });

    const predictors: IPredictor[] = betasSheet.covariates.map(covariate => {
        return {
            $: {
                name: covariate.name,
            },
        };
    });

    return {
        $: {
            baselineHazard: betasSheet.baselineHazard,
            modelType: modelConfig.config.regressionType,
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
                value: `${modelConfig.config.maximumTime}`,
            },
            {
                name: 'timeMetric',
                value: modelConfig.config.timeMetric,
            },
        ],
    };
}
