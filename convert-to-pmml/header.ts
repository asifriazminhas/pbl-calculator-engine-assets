import { ICustomHeader } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/custom/header';

export function makeHeaderNode(modelName: string): ICustomHeader {
    return {
        $: {
            description: modelName,
        },
        Extension: {
            name: 'ModelName' as 'ModelName',
            value: modelName,
        },
    };
}
