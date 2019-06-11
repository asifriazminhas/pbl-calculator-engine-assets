import {
    WebSpecV1SheetRow,
    WebSpecV1,
} from '../src/ci/model-assets/web-spec/web-spec-v1/web-spec-v1';
import { IDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml';
import { IValue } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { ReferenceSheet } from '../src/ci/model-assets/algorithm-assets/reference-sheet';

export class DataFieldConverter {
    private dataField: IDataField;

    constructor(variableName: string) {
        this.dataField = {
            $: {
                name: variableName,
                displayName: '',
                dataType: 'integer',
                optype: 'continuous',
                'X-shortLabel': '',
                'X-required': 'false',
                'X-recommended': 'false',
            },
            Interval: {
                $: {
                    'X-description': '',
                    closure: 'closedClosed',
                },
            },
            Extension: [],
        };
    }

    fromWebSpec(webSpec: WebSpecV1): DataFieldConverter {
        const webSpecRow = webSpec.findRowForVariable(this.dataField.$.name);

        if (!webSpecRow) {
            return this;
        }

        this.dataField.$.displayName = webSpecRow.displayName;
        this.dataField.$.optype = webSpecRow.variableType;

        if (this.dataField.$.optype === 'categorical') {
            this.dataField = Object.assign(
                {},
                this.dataField,
                this.constructValuesNode(webSpecRow, webSpec),
            );
        }

        return this;
    }

    fromReferenceSheet(referenceSheet: ReferenceSheet): DataFieldConverter {
        if (this.dataField.$.optype === 'categorical') {
            return this;
        }

        this.dataField = Object.assign(
            {},
            this.dataField,
            this.constructIntervalNode(this.dataField.$.name, referenceSheet),
        );

        return this;
    }

    build(): IDataField {
        return this.dataField;
    }

    private constructValuesNode(
        webSpecRow: WebSpecV1SheetRow,
        webSpec: WebSpecV1,
    ):
        | {
              Value: IValue[];
          }
        | undefined {
        if (webSpecRow.variableType === 'continuous') {
            return undefined;
        }

        if (!webSpec.categoriesSheet) {
            return undefined;
        }

        const categoriesFound = webSpec.getCategoryRowsForVariable(
            webSpecRow.Name,
        );

        if (categoriesFound.length === 0) {
            console.warn(`No categories found for variable ${webSpecRow.Name}`);
        }

        return {
            Value: categoriesFound.map(category => {
                return {
                    $: {
                        value: category['Category Value'],
                        displayName: category['Category Label'],
                        description: category['Category Description'],
                    },
                };
            }),
        };
    }

    private constructIntervalNode(
        variableName: string,
        referenceSheet: ReferenceSheet,
    ) {
        const referenceCsvRow = referenceSheet.findRowForVariable(variableName);

        if (!referenceCsvRow) {
            console.warn(
                `No reference row found for variable ${variableName}. Interval margins being set infinity`,
            );
            return {
                Interval: {
                    $: {
                        'X-description': '',
                        closure: 'closedClosed',
                    },
                },
            };
        } else {
            return {
                Interval: {
                    $: {
                        closure: 'openOpen',
                        leftMargin: referenceCsvRow.Minimum,
                        rightMargin: referenceCsvRow.Maximum,
                    },
                },
            };
        }
    }
}
