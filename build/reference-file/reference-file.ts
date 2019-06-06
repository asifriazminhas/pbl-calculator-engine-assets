import { getModelBuildData } from '../util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';

export function constructBuildReferenceFileFunction(
    referenceInputFileNames: {
        male: string;
        female: string;
    },
    buildOutputReferenceFiles: (
        maleReferenceFile: string,
        femaleReferenceFile: string,
    ) => BuildOutputReferenceFileReturnValue,
    outputFolderName: string,
) {
    return function() {
        const modelNamesAndFolderPaths = getModelBuildData();

        let outputFiles: BuildOutputReferenceFileReturnValue = [];

        modelNamesAndFolderPaths.forEach(({ folderPath }) => {
            if (
                existsSync(path.join(folderPath, referenceInputFileNames.male))
            ) {
                const maleInputReferenceFile = readFileSync(
                    path.join(folderPath, referenceInputFileNames.male),
                    'utf8',
                );
                const femaleInputReferenceFile = readFileSync(
                    path.join(folderPath, referenceInputFileNames.female),
                    'utf8',
                );

                outputFiles = buildOutputReferenceFiles(
                    maleInputReferenceFile,
                    femaleInputReferenceFile,
                );

                outputFiles.forEach(({ fileName, referenceFileJson }) => {
                    writeFileSync(
                        path.join(folderPath, outputFolderName, fileName),
                        JSON.stringify(referenceFileJson),
                    );
                });
            }
        });
    };
}

type BuildOutputReferenceFileReturnValue = Array<{
    fileName: string;
    referenceFileJson: object | Array<object>;
}>;
