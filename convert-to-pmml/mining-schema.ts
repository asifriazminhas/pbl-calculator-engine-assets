import { IMiningSchema } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/mining-schema';
import { InvalidValueTreatment as PmmlInvalidValueTreatment } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/invalid-value-treatment';
import { MissingValueTreatment as PmmlMissingValueTreatment } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/missing-value-treatment';
import csvParse from 'csv-parse/lib/sync';

export function constructMiningSchemaNode(
    webSpecCsvString: string,
): IMiningSchema {
    const webSpecCsv: WebSpecV2CsvRow[] = csvParse(webSpecCsvString, {
        columns: true,
    });

    return {
        MiningField: webSpecCsv.map(
            ({ InvalidValueTreatment, Name, MissingValueReplacement }) => {
                return {
                    $: Object.assign(
                        {
                            name: Name,
                            invalidValueTreatment:
                                InvalidValueTreatment === 'asMissing'
                                    ? PmmlInvalidValueTreatment.AsMissing
                                    : InvalidValueTreatment === 'returnInvalid'
                                    ? PmmlInvalidValueTreatment.ReturnInvalid
                                    : PmmlInvalidValueTreatment.AsIs,
                        },
                        MissingValueReplacement === 'asMean'
                            ? {
                                  missingValueTreatment:
                                      PmmlMissingValueTreatment.AsMean,
                              }
                            : undefined,
                    ),
                };
            },
        ),
    };
}

interface WebSpecV2CsvRow {
    Name: string;
    UserMin_male: string;
    UserMin_female: string;
    UserMax_male: string;
    UserMax_female: string;
    InvalidValueTreatment: 'returnInvalid' | 'asMissing' | '';
    MissingValueReplacement: 'asMean' | '';
}
