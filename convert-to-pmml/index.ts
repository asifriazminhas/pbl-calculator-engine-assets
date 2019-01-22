const algorithms: Array<{
    name: string;
}> = require('../algorithms.json');
import * as path from 'path';
import * as fs from 'fs';
const csvParse = require('csv-parse/lib/sync');
import { constructPmmlNode } from './pmml';
import { buildXmlFromXml2JsObject } from '@ottawamhealth/pbl-calculator-engine/lib/util/xmlbuilder';

export async function convertToPmml() {
    for (const { name } of algorithms) {
        const modelFolderPath = path.join(__dirname, `../${name}`);

        const isGenderedModel = fs.existsSync(`${modelFolderPath}/male`);

        const algorithmFolderPathsAndNames: Array<{
            name: string;
            folderPath: string;
        }> = [];

        const algorithmInfo = csvParse(
            fs.readFileSync(`${modelFolderPath}/algorithm-info.csv`, 'utf8'),
            {
                columns: true,
            },
        );
        if (isGenderedModel) {
            algorithmFolderPathsAndNames.push({
                folderPath: `${modelFolderPath}/male`,
                name: `Male ${algorithmInfo[0].AlgorithmName}`,
            });
            algorithmFolderPathsAndNames.push({
                folderPath: `${modelFolderPath}/female`,
                name: `Female ${algorithmInfo[0].AlgorithmName}`,
            });
        } else {
            algorithmFolderPathsAndNames.push({
                folderPath: modelFolderPath,
                name: algorithmInfo[0].AlgorithmName,
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
