import { IHeader } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/header/header';

export function makeHeaderNode(modelName: string): IHeader {
    return {
        $: {
            description: modelName,
            copyright: '',
        },
        Extension: [
            {
                $: {
                    name: 'ModelName',
                    value: modelName,
                },
            },
        ],
    };
}
