import { writePMMLFilesForModel } from './pmml';
import { IConfigJson } from '../reference-files';

export async function convertToPmml() {
    const config: IConfigJson = require('../config.json');

    return Promise.all(
        config.models.map(({ name }) => {
            return writePMMLFilesForModel(name);
        }),
    );
}

convertToPmml()
    .then(() => {
        console.log('Done');
    })
    .catch(err => {
        console.error(err);
    });
