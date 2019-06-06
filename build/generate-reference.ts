import { Model } from '@ottawamhealth/pbl-calculator-engine/lib/engine/model/model';
import { Data } from '@ottawamhealth/pbl-calculator-engine/lib/engine/data';

const HealthyReference = false;
const isModelMPoRT = true;
const modelJson = require('../mport.json');
const healthyReferenceJson: {
    male: { [index: string]: number };
    female: { [index: string]: number };
} = require('../healthy-reference-mport.json');
const model = new Model(modelJson);
if (isModelMPoRT) {
    const calibration = require('../calibration_2011-2013.json');
    model.algorithms = model.algorithms.map(
        ({ algorithm, predicate }, index) => {
            return {
                algorithm: algorithm.addCalibrationToAlgorithm(calibration, [
                    {
                        name: 'sex',
                        coefficent: index === 0 ? 'male' : 'female',
                    },
                ]),
                predicate,
            };
        },
    );
}

const maleData: Data = HealthyReference
    ? Object.keys(healthyReferenceJson.male).map(name => {
          return {
              name,
              coefficent: healthyReferenceJson.male[name],
          };
      })
    : [];
maleData.push({
    name: 'sex',
    coefficent: 'male',
});

const femaleData: Data = HealthyReference
    ? Object.keys(healthyReferenceJson.female).map(name => {
          return {
              name,
              coefficent: healthyReferenceJson.female[name],
          };
      })
    : [];
femaleData.push({
    name: 'sex',
    coefficent: 'female',
});

const healthyReference: Array<{
    refPop: Array<{
        age: number;
        outcomeRisk: number;
    }>;
    predicate: {
        equation: string;
        variables: string[];
    };
}> = [
    {
        refPop: [],
        predicate: {
            equation: "predicateResult = obj['sex'] === 'male'",
            variables: ['sex'],
        },
    },
    {
        refPop: [],
        predicate: {
            equation: "predicateResult = obj['sex'] === 'female'",
            variables: ['sex'],
        },
    },
];
for (let i = 20; i <= 90; i++) {
    // @ts-ignore
    healthyReference[0].refPop.push({
        age: i,
        outcomeRisk: model.getAlgorithmForData(maleData).getRiskToTime(
            maleData.concat([
                {
                    name: 'age',
                    coefficent: i,
                },
            ]),
        ),
    });
    // @ts-ignore
    healthyReference[1].refPop.push({
        age: i,
        outcomeRisk: model.getAlgorithmForData(femaleData).getRiskToTime(
            femaleData.concat([
                {
                    name: 'age',
                    coefficent: i,
                },
            ]),
        ),
    });
}

import * as fs from 'fs';
import * as path from 'path';

fs.writeFileSync(
    HealthyReference
        ? path.join(__dirname, '../healthy-reference.json')
        : path.join(__dirname, '../mean-reference.json'),
    JSON.stringify(healthyReference),
);
