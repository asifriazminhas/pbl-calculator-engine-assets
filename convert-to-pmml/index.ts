const algorithms: Array<{
    name: string;
}> = require('../algorithms.json');
import * as path from 'path';
import * as fs from 'fs';
import { constructPmmlNode } from './pmml';
import { buildXmlFromXml2JsObject } from '@ottawamhealth/pbl-calculator-engine/lib/util/xmlbuilder';
import { IAlgorithmJson } from '../reference-files';

export async function convertToPmml() {
    for (const { name } of algorithms) {
        const modelFolderPath = path.join(__dirname, `../${name}`);

        const isGenderedModel = fs.existsSync(`${modelFolderPath}/male`);

        const algorithmFolderPathsAndNames: Array<{
            name: string;
            folderPath: string;
        }> = [];

        const algorithmInfo: IAlgorithmJson = require(`${modelFolderPath}/algorithm-info.json`);

        if (isGenderedModel) {
            algorithmFolderPathsAndNames.push({
                folderPath: `${modelFolderPath}/male`,
                name: `Male ${algorithmInfo.algorithmName}`,
            });
            algorithmFolderPathsAndNames.push({
                folderPath: `${modelFolderPath}/female`,
                name: `Female ${algorithmInfo.algorithmName}`,
            });
        } else {
            algorithmFolderPathsAndNames.push({
                folderPath: modelFolderPath,
                name: algorithmInfo.algorithmName,
            });
        }

        const pmmlNodes = await constructPmmlNode(
            algorithmFolderPathsAndNames,
            modelFolderPath,
        );

        pmmlNodes.forEach((pmmlNode, index) => {
            fs.writeFileSync(
                `${algorithmFolderPathsAndNames[index].folderPath}/model.xml`,
                buildXmlFromXml2JsObject({
                    PMML: pmmlNode,
                }),
            );
        });
    }
}

convertToPmml()
    .then(() => {
        console.log('Done');
    })
    .catch(err => {
        console.error(err);
    });
