import {
    IVariablesSheetRow,
    CatValue,
    VariableTypeValues,
    IVariableDetailsSheetRow,
} from '../../reference-files/msw';
import { IBaseDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';

export function constructBaseDataFieldNodeFromVariableSheetRow(
    { variable, labelLong, variableType, label }: IVariablesSheetRow,
    overwriteFields?: Partial<IBaseDataField<any>['$']>,
) {
    return {
        $: Object.assign(
            {
                name: variable,
                displayName: labelLong,
                optype: getOpTypeForVariableType(variableType),
                dataType: 'integer',
                'X-shortLabel': label,
                'X-required': 'false',
                'X-recommended': 'false',
            },
            overwriteFields,
        ),
        Extension: [],
    };
}

export function constructBaseDataFieldNodeFromVariableDetails(
    {
        variableStart,
        variableStartLabel,
        variableStartShortLabel,
        variable,
        variableType,
        variableStartType,
    }: IVariableDetailsSheetRow,
    isStartVariable: boolean,
) {
    return isStartVariable
        ? {
              $: {
                  name: variableStart,
                  displayName: variableStartLabel,
                  optype: getOpTypeForVariableType(variableStartType),
                  dataType: 'integer',
                  'X-shortLabel': variableStartShortLabel,
                  'X-required': 'false',
                  'X-recommended': 'false',
              },
          }
        : {
              $: {
                  name: variable,
                  displayName: variableStartLabel,
                  optype: getOpTypeForVariableType(variableType),
                  dataType: 'integer',
                  'X-shortLabel': variableStartShortLabel,
                  'X-required': 'false',
                  'X-recommended': 'false',
              },
              Extension: [],
          };
}

function getOpTypeForVariableType(
    variableType: VariableTypeValues,
): 'categorical' | 'continuous' {
    return variableType === CatValue ? 'categorical' : 'continuous';
}
