export interface IVariableDetailsSheetRow {
    variableStartLabel: string;
    variableStartShortLabel: string;
    variable: string;
    dummyVariable: string;
    catValues: string;
    catLabel: string;
    catLabelLong: string;
    low: string;
    high: string;
    variableType: VariableTypeValues;
    variableStart: string;
    variableStartType: VariableTypeValues;
    catStartLabel: string;
}
export type VariableDetailsSheet = IVariableDetailsSheetRow[];

export interface IVariablesSheetRow {
    variable: string;
    variableType: VariableTypeValues;
    catLabel: string;
    centre: BooleanColumnValues;
    rcs: string;
    dummy: BooleanColumnValues;
    min: string;
    max: string;
    labelLong: string;
    label: string;
}
export type VariablesSheet = IVariablesSheetRow[];

export const TrueColumnValue = '1';
export const FalseColumnValue = '0';
type BooleanColumnValues = typeof TrueColumnValue | typeof FalseColumnValue;

export const CatValue = 'cat';
export const ContValue = 'cont';
export type VariableTypeValues = typeof CatValue | typeof ContValue;
