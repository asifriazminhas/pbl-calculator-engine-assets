// This script is run when a commit is pushed to the master branch

import { convertToPmml } from '../../convert-to-pmml';
import { build } from '../../../build';

process.on('uncaughtException', err => {
    console.log(`Error when building commit on master`);
    console.error(err);

    return process.exit(1);
});

convertToPmml()
    .then(() => {
        console.log('Built PMML files');

        return build();
    })
    .then(() => {
        console.log('Build model JSON');

        process.exit(0);
    });
