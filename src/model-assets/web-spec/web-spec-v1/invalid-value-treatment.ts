import { MissingValue } from './missing-value';

export const ReturnInvalid = 'returnInvalid';
export const AsMissing = 'asMissing';

export type InvalidValueTreatment =
    | typeof ReturnInvalid
    | typeof AsMissing
    | typeof MissingValue;
