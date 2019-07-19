import test from 'tape';
import { runIntegrationTest, getRelativeDifference } from './test-utils';
import { expect } from 'chai';
import {
    Data,
    findDatumWithName,
} from '@ottawamhealth/pbl-calculator-engine/lib/engine/data';
import { CoxSurvivalAlgorithm } from '@ottawamhealth/pbl-calculator-engine/lib/engine/algorithm/regression-algorithm/cox-survival-algorithm/cox-survival-algorithm';
import { InteractionCovariate } from '@ottawamhealth/pbl-calculator-engine/lib/engine/data-field/covariate/interaction-covariate/interaction-covariate';
import { NoDatumFoundError } from '@ottawamhealth/pbl-calculator-engine/lib/engine/errors/no-datum-found-error';

function checkDataForAlgorithm(data: Data, cox: CoxSurvivalAlgorithm) {
    cox.covariates
        .filter(covariate => !(covariate instanceof InteractionCovariate))
        .forEach(covariate => {
            findDatumWithName(covariate.name, data);
        });
}

function assertScore(expectedScore: number, actualScore: number, data: Data) {
    const percentDiff = getRelativeDifference(
        expectedScore as number,
        actualScore,
    );
    const MaximumPercentDiff = 10;

    expect(percentDiff).to.be.lessThan(
        10,
        `
        Percent difference ${percentDiff} greater than ${MaximumPercentDiff}
        Expected Score: ${expectedScore}
        Actual Score: ${actualScore}
        Data: ${JSON.stringify(data)}
    `,
    );
}

function testCalculatedScoreForDataAndExpectedScore(
    coxAlgorithm: CoxSurvivalAlgorithm,
    data: Data,
) {
    // Debugging code
    /*if (expectedRisk !== 0.002523241) {
        return;
    }*/

    checkDataForAlgorithm(data, coxAlgorithm);

    let expectedRisk;
    try {
        expectedRisk = Number(findDatumWithName('RISK_5', data).coefficent);
    } catch (err) {
        if (!(err instanceof NoDatumFoundError)) {
            throw err;
        }
    }
    let expectedSurvival;
    try {
        expectedSurvival = Number(findDatumWithName('s', data).coefficent);
    } catch (err) {
        if (!(err instanceof NoDatumFoundError)) {
            throw err;
        }
    }
    let expectedBin;
    try {
        expectedBin = Number(findDatumWithName('Bin', data).coefficent);
    } catch (err) {
        if (!(err instanceof NoDatumFoundError)) {
            throw err;
        }
    }

    if (coxAlgorithm.bins) {
        const binData = coxAlgorithm.bins.getBinDataForScore(
            Math.round(coxAlgorithm.calculateScore(data) * 10000000) / 10000000,
        );
        const binNumber = Object.keys(coxAlgorithm.bins.binsData)
            .map(Number)
            .find(currentBinNumber => {
                return (
                    coxAlgorithm.bins!.binsData[currentBinNumber] === binData
                );
            });

        expect(
            binNumber,
            `
            ran_id: ${findDatumWithName('ran_id', data).coefficent}
        `,
        ).to.equal(expectedBin);
    } else {
        if (expectedRisk !== undefined) {
            return assertScore(
                expectedRisk,
                coxAlgorithm.getRiskToTime(data),
                data,
            );
        } else {
            return assertScore(
                expectedSurvival as number,
                coxAlgorithm.getSurvivalToTime(data),
                data,
            );
        }
    }
}

test(`Testing Scoring`, async t => {
    return runIntegrationTest(
        'score-data',
        'score-data',
        'Scoring',
        [],
        testCalculatedScoreForDataAndExpectedScore,
        t,
    );
});
