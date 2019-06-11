import { WebSpecV1 } from '../src/ci/model-assets/web-spec/web-spec-v1/web-spec-v1';
import { IDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml';
import {
    IValue,
    IInterval,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ReferenceSheet } from '../src/ci/model-assets/algorithm-assets/reference-sheet';
import { AlgorithmAssets } from '../src/ci/model-assets/algorithm-assets/algorithm-assets';

export function constructDataField(
    variableName: string,
    algorithmAssets: AlgorithmAssets,
): IDataField {
    if (
        (algorithmAssets.webSpec as WebSpecV1).getVariableType(variableName) ===
        'categorical'
    ) {
        return {
            $: constructDataFieldDollarProperties(variableName, 'categorical'),
            Extension: [],
            Value: constructValuesNode(
                variableName,
                algorithmAssets.webSpec as WebSpecV1,
            ),
        };
    } else {
        return {
            $: constructDataFieldDollarProperties(variableName, 'continuous'),
            Extension: [],
            Interval: constructIntervalNode(
                variableName,
                algorithmAssets.referenceSheet,
            ),
        };
    }
}

function constructDataFieldDollarProperties<
    T extends 'continuous' | 'categorical'
>(variableName: string, opType: T) {
    return {
        name: variableName,
        displayName: '',
        optype: opType,
        dataType: 'integer',
        'X-shortLabel': '',
        'X-required': 'false',
        'X-recommended': 'false',
    };
}

function constructValuesNode(
    variableName: string,
    webSpec: WebSpecV1,
): IValue[] {
    if (!webSpec.categoriesSheet) {
        console.warn(
            `No categories sheet found. Categories not being set for variable ${variableName}`,
        );
        return [];
    }

    const categoriesFound = webSpec.getCategoryRowsForVariable(variableName);
    if (categoriesFound.length === 0) {
        console.warn(`No categories found for variable ${variableName}`);
    }

    return categoriesFound.map(category => {
        return {
            $: {
                value: category['Category Value'],
                displayName: category['Category Label'],
                description: category['Category Description'],
            },
        };
    });
}

function constructIntervalNode(
    variableName: string,
    referenceSheet: ReferenceSheet,
): IInterval {
    const referenceCsvRow = referenceSheet.findRowForVariable(variableName);

    if (!referenceCsvRow) {
        console.warn(
            `No reference row found for variable ${variableName}. Interval margins being set to infinity`,
        );
        return {
            $: {
                'X-description': '',
                closure: 'closedClosed',
            },
        };
    } else {
        return {
            $: {
                'X-description': '',
                closure: 'openOpen',
                leftMargin: referenceCsvRow.Minimum,
                rightMargin: referenceCsvRow.Maximum,
            },
        };
    }
}
