import { convertToPmml } from '../convert-to-pmml';
import { Validation } from '../ci/validation/validation';

convertToPmml()
    .then(() => {
        console.log(Validation.prettifyValidation());
    })
    .catch(err => {
        console.error(err);
    });
