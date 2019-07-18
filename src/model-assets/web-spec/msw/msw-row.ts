import { VariableType } from './variable-type';
import { MswBoolean, TrueColumnValue } from './msw-boolean';
import { trim } from 'lodash';
import { VariableDetails } from './variable-details';
import { CovariateNameGenError } from './msw-errors';
import { RiskFactor } from '@ottawamhealth/pbl-calculator-engine/lib/risk-factors';

export class MSWRow {
    row: IMswSheetRow;

    constructor(row: IMswSheetRow) {
        this.row = row;
    }

    isOnlyStartVariable(): boolean {
        return (
            this.row.variable === this.row.variableStart.split(',').map(trim)[0]
        );
    }

    isStartVariable(variableName: string): boolean {
        return (
            this.row.variableStart
                .split(',')
                .map(trim)
                .indexOf(variableName) > -1
        );
    }

    getCovariateNames() {
        const variableDetailsRows = VariableDetails.findRowsForVariable(
            this.row.variable,
            false,
        );

        if (variableDetailsRows.length === 0) {
            throw new CovariateNameGenError(
                `Could not generate name for variable ${
                    this.row.variable
                }. No variable detail rows found for this variable`,
            );
        }

        const covariateNames: string[] = [];

        if (this.row.dummy === TrueColumnValue) {
            variableDetailsRows.forEach(({ dummyVariable }) => {
                covariateNames.push(dummyVariable);
            });
        } else {
            covariateNames.push(this.row.variable);
        }

        if (this.row.centre === TrueColumnValue) {
            for (
                let variableIndex = 0;
                variableIndex < covariateNames.length;
                variableIndex++
            ) {
                covariateNames[variableIndex] += '_C';
            }
        }

        if (this.row.rcs !== '0') {
            const variableNameAfterCentering = covariateNames[0];

            const numOfKnots = Number(this.row.rcs);

            for (let knotNumber = 1; knotNumber < numOfKnots; knotNumber++) {
                covariateNames[
                    knotNumber - 1
                ] = `${variableNameAfterCentering}_rcs${knotNumber}`;
            }
        }

        return covariateNames;
    }
}

export interface IMswSheetRow {
    variable: string;
    variableType: VariableType;
    catLabel: string;
    centre: MswBoolean;
    rcs: string;
    dummy: MswBoolean;
    min: string;
    max: string;
    labelLong: string;
    label: string;
    variableStart: string;
    required: MswBoolean;
    recommended: MswBoolean;
    subject: RiskFactor;
}
