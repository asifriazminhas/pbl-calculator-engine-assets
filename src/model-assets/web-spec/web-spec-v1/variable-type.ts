export const ContinuousVariableType = 'continuous';
export const CategoricalVariableType = 'categorical';

export type VariableType =
    | typeof ContinuousVariableType
    | typeof CategoricalVariableType;
