import { IGeneralRegressionModel } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/general_regression_model';
import { IRestrictedCubicSpline } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/custom/restricted_cubic_spline';
const csvParse = require('csv-parse/lib/sync');

export function makeCustomPmmlNode(
    referenceCsvString: string,
    generalRegressionModel: IGeneralRegressionModel,
): {
    CustomPMML: {
        RestrictedCubicSpline: IRestrictedCubicSpline;
    };
} {
    const referenceCsv: Array<{
        Variable: string;
        [index: string]: string;
    }> = csvParse(referenceCsvString, {
        columns: true,
    });

    const referenceRowsWithKnots = referenceCsv.filter(referenceCsvRow => {
        return referenceCsvRow['Knot1'].trim() !== '';
    });

    const parameterNamesAndKnots = referenceRowsWithKnots.map(
        referenceRowWithKnot => {
            let numOfKnots = 0;
            while (
                referenceRowWithKnot[`Knot${numOfKnots + 1}`] !== '' &&
                referenceRowWithKnot[`Knot${numOfKnots + 1}`] !== undefined
            ) {
                numOfKnots += 1;
            }

            let parameterNamesForRcsVar: string[] = [];
            let knotLocations: string[] = [];

            for (let i = 2; i < numOfKnots; i++) {
                parameterNamesForRcsVar.push(
                    generalRegressionModel.ParameterList.Parameter.find(
                        parameter => {
                            return (
                                parameter.$.label ===
                                referenceRowWithKnot.Variable.replace(
                                    'rcs1',
                                    `rcs${i}`,
                                )
                            );
                        },
                    )!.$.name,
                );
            }
            for (let i = 1; i <= numOfKnots; i++) {
                knotLocations.push(referenceRowWithKnot[`Knot${i}`]);
            }

            return {
                parameterNames: parameterNamesForRcsVar,
                knotsLocations: knotLocations,
            };
        },
    );

    return {
        CustomPMML: {
            RestrictedCubicSpline: {
                PCell: parameterNamesAndKnots.map(
                    ({ parameterNames, knotsLocations }) => {
                        return {
                            $: {
                                parameterName: parameterNames.join(', '),
                                knotLocations: knotsLocations.join(', '),
                            },
                        };
                    },
                ),
            },
        },
    };
}
