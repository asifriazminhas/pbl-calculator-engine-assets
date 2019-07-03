import { VariableDetails } from '../../src/ci/model-assets/web-spec/msw/variable-details';

export class ValueFactory {
    static fromVariableName(variableName: string) {
        const variableDetails = VariableDetails.findRowForCatVariable(
            variableName,
        );

        return {
            Value: variableDetails
                .filter(({ low }) => {
                    return low.trim().length !== 0;
                })
                .map(({ low, catLabel, catLabelLong }) => {
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
