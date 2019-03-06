import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { IDerivedField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/derived_field';
import {
    IFieldRef,
    IApply,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/common';
import { flatten, uniq } from 'lodash';

export function getDataFieldNamesFromLocalTransformationsNode(
    localTransformations: ILocalTransformations,
): string[] {
    return uniq(
        flatten(
            localTransformations.DerivedField instanceof Array
                ? localTransformations.DerivedField.map(derivedField => {
                      return getDataFieldNamesFromDerivedFieldNode(
                          derivedField,
                      );
                  })
                : getDataFieldNamesFromDerivedFieldNode(
                      localTransformations.DerivedField,
                  ),
        ),
    );
}

function getDataFieldNamesFromDerivedFieldNode(
    derivedField: IDerivedField,
): string[] {
    const fieldRefNodeFieldNames = derivedField.FieldRef
        ? getDataFieldNamesFromFieldRefNode(derivedField.FieldRef)
        : [];
    const applyNodeFieldNames = derivedField.Apply
        ? getDataFieldNamesFromApplyNode(derivedField.Apply)
        : [];

    return [derivedField.$.name]
        .concat(fieldRefNodeFieldNames)
        .concat(applyNodeFieldNames);
}

function getDataFieldNamesFromFieldRefNode(fieldRef: IFieldRef): string[] {
    return [fieldRef.$.field];
}

function getDataFieldNamesFromApplyNode(apply: IApply): string[] {
    return apply.$$
        ? flatten(
              apply.$$.filter(applyChildNode => {
                  return (
                      applyChildNode['#name'] === 'FieldRef' ||
                      applyChildNode['#name'] === 'Apply'
                  );
              }).map(applyChildNode => {
                  return applyChildNode['#name'] === 'FieldRef'
                      ? getDataFieldNamesFromFieldRefNode(
                            applyChildNode as IFieldRef,
                        )
                      : getDataFieldNamesFromApplyNode(
                            applyChildNode as IApply,
                        );
              }),
          )
        : [];
}
