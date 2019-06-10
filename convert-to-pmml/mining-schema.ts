import { IMiningSchema } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/mining-schema';
import { InvalidValueTreatment as PmmlInvalidValueTreatment } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/invalid-value-treatment';
import { MissingValueTreatment as PmmlMissingValueTreatment } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/missing-value-treatment';
import { WebSpecV1 } from '../src/ci/model-assets/web-spec/web-spec-v1/web-spec-v1';

export function constructMiningSchemaNode(
    webSpecSheet: WebSpecV1,
): IMiningSchema {
    const webSpecCsv = webSpecSheet.sheet;

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
