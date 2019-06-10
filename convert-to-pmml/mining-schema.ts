import { IMiningSchema } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/mining-schema';
import { InvalidValueTreatment as PmmlInvalidValueTreatment } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/invalid-value-treatment';
import { MissingValueTreatment as PmmlMissingValueTreatment } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/mining-schema/missing-value-treatment';
import { WebSpecV1 } from '../src/ci/model-assets/web-spec/web-spec-v1/web-spec-v1';
import {
    AsMissing,
    ReturnInvalid,
} from '../src/ci/model-assets/web-spec/web-spec-v1/invalid-value-treatment';
import { AsMean } from '../src/ci/model-assets/web-spec/web-spec-v1/missing-value-replacement';

export function constructMiningSchemaNode(
    webSpecSheet: WebSpecV1,
): IMiningSchema {
    return {
        MiningField: webSpecSheet.sheet.map(
            ({ InvalidValueTreatment, Name, MissingValueReplacement }) => {
                return {
                    $: Object.assign(
                        {
                            name: Name,
                            invalidValueTreatment:
                                InvalidValueTreatment === AsMissing
                                    ? PmmlInvalidValueTreatment.AsMissing
                                    : InvalidValueTreatment === ReturnInvalid
                                    ? PmmlInvalidValueTreatment.ReturnInvalid
                                    : PmmlInvalidValueTreatment.AsIs,
                        },
                        MissingValueReplacement === AsMean
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
