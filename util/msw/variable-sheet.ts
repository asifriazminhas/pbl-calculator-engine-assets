import {
    VariablesSheet,
    VariableDetailsSheet,
    IVariablesSheetRow,
    TrueColumnValue,
} from '../../reference-files/msw';

export function findVariableSheetRowForFinalVariableName(
    finalVariableName: string,
    variableSheet: VariablesSheet,
    variableDetailsSheet: VariableDetailsSheet,
) {
    return variableSheet.find(variableSheetRow => {
        return (
            getFinalVariableNameForVariableSheetRow(
                variableSheetRow,
                variableDetailsSheet,
            ).indexOf(finalVariableName) > -1
        );
    });
}

function getFinalVariableNameForVariableSheetRow(
    variableSheetRow: IVariablesSheetRow,
    variableDetailsSheet: VariableDetailsSheet,
): string[] {
    const variableDetailsRows = variableDetailsSheet.filter(({ variable }) => {
        return variable === variableSheetRow.variable;
    });

    if (variableDetailsRows.length === 0) {
        throw new Error(
            `No row found in variables details sheet for variable ${
                variableSheetRow.variable
            }`,
        );
    }

    let finalVariablesNames: string[] = [];

    if (variableSheetRow.dummy === TrueColumnValue) {
        variableDetailsRows.forEach(({ dummyVariable }) => {
            finalVariablesNames.push(dummyVariable);
        });
    } else {
        finalVariablesNames.push(variableSheetRow.variable);
    }

    if (variableSheetRow.centre === TrueColumnValue) {
        for (
            let variableIndex = 0;
            variableIndex < finalVariablesNames.length;
            variableIndex++
        ) {
            finalVariablesNames[variableIndex] += '_C';
        }
    }

    if (variableSheetRow.rcs !== '0') {
        const variableNameAfterCentering = finalVariablesNames[0];

        const numOfKnots = Number(variableSheetRow.rcs);

        for (let knotNumber = 1; knotNumber < numOfKnots; knotNumber++) {
            finalVariablesNames[
                knotNumber - 1
            ] = `${variableNameAfterCentering}_rcs${knotNumber}`;
        }
    }

    return finalVariablesNames;
}
