import { constructBuildReferenceFileFunction } from './reference-file';
import {
    ReferencePopulation,
    RefPopsWithPredicate,
} from '@ottawamhealth/pbl-calculator-engine/lib/engine/ref-pop/reference-population';
import csvParse = require('csv-parse/lib/sync');

export const buildRefPopReferenceFiles = constructBuildReferenceFileFunction(
    {
        male: '/ref-pop-references/male/risk.csv',
        female: '/ref-pop-references/female/risk.csv',
    },
    function(maleReferenceFile, femaleReferenceFile) {
        return getRefPopJsonsFromRefPopCsv({
            male: maleReferenceFile,
            female: femaleReferenceFile,
        }).map(({ refPop, popName }) => {
            return {
                fileName: popName,
                referenceFileJson: refPop,
            };
        });
    },
    'ref-pops',
);

function getRefPopJsonsFromRefPopCsv(refPopCsvStrings: {
    male: string;
    female: string;
}): Array<{
    popName: string;
    refPop: ReferencePopulation | RefPopsWithPredicate;
}> {
    const csvParseOptions = {
        columns: true,
    };

    const refPopCsv: {
        male: RefPopCsv;
        female: RefPopCsv;
    } = {
        male: csvParse(refPopCsvStrings.male, csvParseOptions),
        female: csvParse(refPopCsvStrings.female, csvParseOptions),
    };

    let refPops: Array<{
        popName: string;
        refPop: ReferencePopulation | RefPopsWithPredicate;
    }> = [];

    Object.keys(refPopCsv.male[0])
        .filter(refPopCsvColumn => {
            return refPopCsvColumn !== 'age';
        })
        .forEach(popName => {
            const refPopForCurrentPop = [
                {
                    refPop: convertRefPopCsvToRefPop(refPopCsv.male, popName),
                    predicate: {
                        equation: `predicateResult = obj['sex'] === 'male'`,
                        variables: ['sex'],
                    },
                },
                {
                    refPop: convertRefPopCsvToRefPop(refPopCsv.female, popName),
                    predicate: {
                        equation: `predicateResult = obj['sex'] === 'female'`,
                        variables: ['sex'],
                    },
                },
            ];

            refPops.push({
                refPop: refPopForCurrentPop,
                popName,
            });
        });

    return refPops;
}

interface RefPopCsvRow {
    age: string;
    [index: string]: string;
}

type RefPopCsv = RefPopCsvRow[];

function convertRefPopCsvToRefPop(
    refPopCsv: RefPopCsv,
    popName: string,
): ReferencePopulation {
    return refPopCsv.map(refPopCsvRow => {
        return {
            age: Number(refPopCsvRow.age),
            outcomeRisk: Number(refPopCsvRow[popName]),
        };
    });
}
