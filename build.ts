import { AlgorithmBuilder } from '@ottawamhealth/pbl-calculator-engine';
import * as fs from 'fs';
import * as path from 'path';

async function build() {
    const algorithmDirectoryNames = fs.readdirSync(__dirname)
        .filter((fileOrDirectoryName) => {
            return fileOrDirectoryName !== '.git' && fileOrDirectoryName !== 'node_modules';
        })
        .filter((fileOrDirectoryName) => {
            return fs
                .statSync(`${__dirname}/${fileOrDirectoryName}`)
                .isDirectory();
        });
    
    const algorithmDirectoryPaths = algorithmDirectoryNames
        .map((directoryName) => {
            return `${__dirname}/${directoryName}`;
        });
    
    const algorithms = await Promise.all(
        algorithmDirectoryPaths
            .map((algorithmDirectoryPath) => {
                return AlgorithmBuilder
                    .buildSurvivalAlgorithm()
                    .buildFromAssetsFolder(algorithmDirectoryPath)
            })
    );

    algorithms
        .map((algorithm) => {
            return algorithm.toJson()
        })    
        .map((algorithmJson, index) => {
            return fs.writeFileSync(
                `${algorithmDirectoryPaths[index]}/${algorithmDirectoryNames[index]}.json`,
                JSON.stringify(algorithmJson)
            );
        });
}

build()
    .then(() => {
        console.log('Build Done');
        process.exit(0);
    })
    .catch((err) => {
        console.log('Build error');
        console.error(err);
        process.exit(1);
    });