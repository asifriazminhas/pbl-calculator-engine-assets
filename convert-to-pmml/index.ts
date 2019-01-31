const algorithms: Array<{
    name: string;
}> = require('../algorithms.json');
import { writePMMLFilesForModel } from './pmml';

export async function convertToPmml() {
    return Promise.all(
        algorithms.map(({ name }) => {
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
