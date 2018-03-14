const csvParse = require("csv-parse/lib/sync");
import {
  ReferencePopulation,
  RefPopsWithPredicate
} from "@ottawamhealth/pbl-calculator-engine";

interface RefPopCsvRow {
  age: string;
  [index: string]: string;
}

type RefPopCsv = RefPopCsvRow[];

function convertRefPopCsvToRefPop(
  refPopCsv: RefPopCsv,
  popName: string
): ReferencePopulation {
  return refPopCsv.map(refPopCsvRow => {
    return {
      age: Number(refPopCsvRow.age),
      outcomeRisk: Number(refPopCsvRow[popName])
    };
  });
}

export function getRefPopJsonsFromRefPopCsv(refPopCsvStrings: {
  male: string;
  female: string;
}): Array<{
  popName: string;
  refPop: ReferencePopulation | RefPopsWithPredicate;
}> {
  const csvParseOptions = {
    columns: true
  };

  const refPopCsv: {
    male: RefPopCsv;
    female: RefPopCsv;
  } = {
    male: csvParse(refPopCsvStrings.male, csvParseOptions),
    female: csvParse(refPopCsvStrings.female, csvParseOptions)
  };

  let refPops: Array<{
    popName: string;
    refPop: ReferencePopulation | RefPopsWithPredicate;
  }> = [];

  Object.keys(refPopCsv.male[0])
    .filter(refPopCsvColumn => {
      return refPopCsvColumn !== "age";
    })
    .forEach(popName => {
      const refPopForCurrentPop = [
        {
          refPop: convertRefPopCsvToRefPop(refPopCsv.male, popName),
          predicate: {
            equation: `predicateResult = obj['sex'] === 'male'`,
            variables: ["sex"]
          }
        },
        {
          refPop: convertRefPopCsvToRefPop(refPopCsv.female, popName),
          predicate: {
            equation: `predicateResult = obj['sex'] === 'female'`,
            variables: ["sex"]
          }
        }
      ];

      refPops.push({
        refPop: refPopForCurrentPop,
        popName
      });
    });

  return refPops;
}
