import { ModelAssets } from '../src/model-assets/model-assets';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { RiskFactor } from '@ottawamhealth/pbl-calculator-engine/lib/risk-factors';
import { MSW } from '../src/model-assets/web-spec/msw/msw';

export function buildExternalCoefficientsJson(modelAssets: ModelAssets) {
    modelAssets.forEachAlgorithmAssets(
        ({ externalCoefficients, webSpec, algorithmFolder }) => {
            if (externalCoefficients !== undefined) {
                const mappings = require(`${algorithmFolder}/mappings.json`);
                const msw = webSpec as MSW;

                externalCoefficients.forEach(
                    ({ variableBetas, betaSetName }) => {
                        const externalCoefficientsJson: {
                            [riskFactor in RiskFactor]?: {
                                [variableName: string]: number;
                            }
                        } = {};

                        variableBetas.forEach(variableBeta => {
                            let groups: RiskFactor[];
                            if (variableBeta.isInteractionVariable() === true) {
                                const interactions = variableBeta.name
                                    .replace('_int', '')
                                    .split('X');
                                groups = interactions.map(interaction => {
                                    return getGroupForCovariate(
                                        mappings[interaction],
                                        msw,
                                    );
                                });
                            } else {
                                groups = [
                                    getGroupForCovariate(
                                        variableBeta.name,
                                        msw,
                                    ),
                                ];
                            }

                            groups.forEach(group => {
                                if (
                                    externalCoefficientsJson[group] ===
                                    undefined
                                ) {
                                    externalCoefficientsJson[group] = {};
                                }

                                externalCoefficientsJson[group]![
                                    variableBeta.name
                                ] = Number(variableBeta.beta);
                            });
                        });

                        const externalCoefficientsFolderPath = `${algorithmFolder}/external-coefficients`;
                        if (
                            existsSync(externalCoefficientsFolderPath) === false
                        ) {
                            mkdirSync(externalCoefficientsFolderPath);
                        }

                        writeFileSync(
                            `${externalCoefficientsFolderPath}/${betaSetName}.json`,
                            JSON.stringify(externalCoefficientsJson, null, 4),
                        );
                    },
                );
            }
        },
    );
}

function getGroupForCovariate(covariateName: string, msw: MSW) {
    const mswRow = msw.findRowForCovariateName(covariateName);
    if (!mswRow) {
        throw new Error(
            `Cannot parse external coefficient for variable ${covariateName}. No group found.`,
        );
    }

    return mswRow.row.subject;
}
