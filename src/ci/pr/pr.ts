// This script is run when a commit has been pushed to a branch that has a PR attached to it

import { convertToPmml } from '../../convert-to-pmml';
import { PrComments } from './pr-comments';
import { Validation } from '../validation/validation';

process.on('uncaughtException', err => {
    console.log(`Error when building PR`);
    console.error(err);

    return process.exit(1);
});

convertToPmml()
    .then(() => {
        console.log('Built PMML files');

        return PrComments.forSuccessfulBuild();
    })
    .then(() => {
        console.log('Logged PR comments for successful build');

        if (Validation.hasErrors()) {
            return process.exit(1);
        } else {
            return process.exit(0);
        }
    })
    .catch(err => {
        return PrComments.forUncaughtException(err);
    })
    .then(() => {
        console.log('Logged PR comments for failed build');

        return process.exit(1);
    });
