import { writePMMLFilesForModel } from './pmml';
import { IConfigJson } from '../../reference-files';
import { ModelAssets } from '../ci/model-assets/model-assets';

export async function convertToPmml() {
    const config: IConfigJson = require('../../config.json');

    return Promise.all(
        config.models
            .filter(({ name }) => {
                return ModelAssets.validateAssetsForModel(name);
            })
            .map(({ name }) => {
                return writePMMLFilesForModel(name);
            }),
    );
}
