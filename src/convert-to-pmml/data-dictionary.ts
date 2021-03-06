import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { uniqBy } from 'lodash';
import { AlgorithmAssets } from '../model-assets/algorithm-assets/algorithm-assets';
import { constructDataField } from './data-field';

export function makeDataDictionaryNode(
    algorithmAssets: AlgorithmAssets,
): IDataDictionary {
    const covariateFields = algorithmAssets.predictiveBetas.covariates.map(
        covariate => {
            return constructDataField(covariate.name, algorithmAssets);
        },
    );

    const localTransformationFields = algorithmAssets.localTransformations
        .getFieldNames()
        .map(dataFieldName => {
            return constructDataField(dataFieldName, algorithmAssets);
        });

    const dataFields = uniqBy(
        covariateFields.concat(localTransformationFields),
        dataField => {
            return dataField.$.name;
        },
    );

    return {
        DataField: dataFields,
        $: {
            numberOfFields: `${dataFields.length}`,
        },
    };
}
