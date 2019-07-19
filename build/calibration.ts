import {
    ICalibrationFactorJsonObject,
    CalibrationJson,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/json/json-calibration';

// tslint:disable-next-line
const csvParse = require('csv-parse/lib/sync');

export interface ICalibrationCsvRow {
    age: string;
    [index: string]: string;
}

export type CalibrationCsv = ICalibrationCsvRow[];

function getCalibrationFactorObjectsForPopName(
    calibrationCsv: CalibrationCsv,
    popName: string,
): ICalibrationFactorJsonObject[] {
    return calibrationCsv.map(calibrationCsvRow => {
        return {
            age: Number(calibrationCsvRow.age),
            factor: Number(calibrationCsvRow[popName]),
        };
    });
}

export function getCalibrationJsonsFromCalibrationCsvString(calibrationCsvStrings: {
    male: string;
    female: string;
}): {
    calibrationJson: CalibrationJson;
    popName: string;
}[] {
    const csvParseOptions = {
        columns: true,
    };

    const calibrationCsv: {
        male: CalibrationCsv;
        female: CalibrationCsv;
    } = {
        male: csvParse(calibrationCsvStrings.male, csvParseOptions),
        female: csvParse(calibrationCsvStrings.female, csvParseOptions),
    };

    const calibrationPopNames = Object.keys(calibrationCsv.male[0]).filter(
        calibrationCsvColumn => {
            return calibrationCsvColumn !== 'age';
        },
    );

    const calibrationJsonsWithPopName: {
        calibrationJson: CalibrationJson;
        popName: string;
    }[] = [];

    calibrationPopNames.forEach(calibrationPopName => {
        const maleCalibrationFactorObjects = getCalibrationFactorObjectsForPopName(
            calibrationCsv.male,
            calibrationPopName,
        );
        const femaleCalibrationFactorObjects = getCalibrationFactorObjectsForPopName(
            calibrationCsv.female,
            calibrationPopName,
        );

        calibrationJsonsWithPopName.push({
            calibrationJson: [
                {
                    calibrationFactorObjects: maleCalibrationFactorObjects,
                    predicate: {
                        equation: `predicateResult = obj['sex'] === 'male'`,
                        variables: ['sex'],
                    },
                },
                {
                    calibrationFactorObjects: femaleCalibrationFactorObjects,
                    predicate: {
                        equation: `predicateResult = obj['sex'] === 'female'`,
                        variables: ['sex'],
                    },
                },
            ],
            popName: calibrationPopName,
        });
    });

    return calibrationJsonsWithPopName;
}
