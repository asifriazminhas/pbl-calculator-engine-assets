import { IDataDictionary } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_dictionary';
import { IDataField } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field';
import { uniqBy } from 'lodash';
import { getDataFieldNamesFromLocalTransformationsNode } from '../util/local-transformations';
import { WebSpecV1 } from '../src/ci/model-assets/web-spec/web-spec-v1/web-spec-v1';
import { AlgorithmAssets } from '../src/ci/model-assets/algorithm-assets/algorithm-assets';
import { DataFieldConverter } from './data-field';

export function makeDataDictionaryNode(
    algorithmAssets: AlgorithmAssets,
): IDataDictionary {
    const webSpec = algorithmAssets.webSpec as WebSpecV1;

    const betaDataFields: IDataField[] = algorithmAssets.betasSheet
        .getCovariateNames()
        .map(covariateName => {
            return new DataFieldConverter(covariateName)
                .fromWebSpec(webSpec)
                .fromReferenceSheet(algorithmAssets.referenceSheet)
                .build();
        });

    const localTransformationDataFields: IDataField[] = getDataFieldNamesFromLocalTransformationsNode(
        algorithmAssets.localTransformations.PMML.LocalTransformations,
    ).map(dataFieldName => {
        return new DataFieldConverter(dataFieldName)
            .fromWebSpec(webSpec)
            .fromReferenceSheet(algorithmAssets.referenceSheet)
            .build();
    });

    const dataFields = uniqBy(
        betaDataFields.concat(localTransformationDataFields),
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
