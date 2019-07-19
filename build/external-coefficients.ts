import { ModelAssets } from '../src/model-assets/model-assets';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { RiskFactor } from '@ottawamhealth/pbl-calculator-engine/lib/risk-factors';
import { MSW } from '../src/model-assets/web-spec/msw/msw';
import { ExternalCoefficients } from '../src/model-assets/algorithm-assets/external-coefficients';

export function buildExternalCoefficientsJson(modelAssets: ModelAssets) {
    modelAssets.forEachAlgorithmAssets(
        ({ externalCoefficients, webSpec, algorithmFolder, mapVariable }) => {
            if (externalCoefficients !== undefined) {
                const msw = webSpec as MSW;

                externalCoefficients.forEach(externalCoefficientsAsset => {
                    const externalCoefficientsJson = buildJsonForExternalCoefficients(
                        externalCoefficientsAsset,
                        msw,
                        mapVariable,
                    );

                    const externalCoefficientsFolderPath = `${algorithmFolder}/external-coefficients`;
                    if (existsSync(externalCoefficientsFolderPath) === false) {
                        mkdirSync(externalCoefficientsFolderPath);
                    }

                    writeFileSync(
                        `${externalCoefficientsFolderPath}/${
                            externalCoefficientsAsset.betaSetName
                        }.json`,
                        JSON.stringify(externalCoefficientsJson, null, 4),
                    );
                });
            }
        },
    );
}

function buildJsonForExternalCoefficients(
    { variableBetas }: ExternalCoefficients,
    msw: MSW,
    mapVar?: (varName: string) => string,
) {
    const externalCoefficientsJson: {
        [riskFactor in RiskFactor]?: Array<{
            name: string;
            beta: number;
        }>
    } = {};

    variableBetas.forEach(variableBeta => {
        msw.getGroupsForCovariate(variableBeta.name, mapVar).forEach(group => {
            if (externalCoefficientsJson[group] === undefined) {
                externalCoefficientsJson[group] = [];
            }

            externalCoefficientsJson[group]!.push({
                name: variableBeta.name,
                beta: Number(variableBeta.beta),
            });
        });
    });

    return externalCoefficientsJson;
}
