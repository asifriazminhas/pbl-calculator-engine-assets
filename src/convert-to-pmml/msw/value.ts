import { VariableDetails } from '../../model-assets/web-spec/msw/variable-details';

export class ValueFactory {
    static fromVariableName(variableName: string, isStartVariable: boolean) {
        const variableDetails = VariableDetails.findRowsForVariable(
            variableName,
            isStartVariable,
        )
            .filter(({ low, high }) => {
                return low === high;
            })
            .filter(({ low }) => {
                return low.trim().length !== 0;
            });

        return {
            Value: variableDetails.map(({ low, catLabel, catLabelLong }) => {
                return {
                    $: {
                        value: low,
                        displayName: catLabel,
                        description: catLabelLong,
                    },
                };
            }),
        };
    }
}
