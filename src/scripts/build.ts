import { build } from '../../build';

build()
    .then(() => {
        console.log('Done');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
