import { makeHeaderNode } from './header';
import * as fs from 'fs';
import { IPmml } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/pmml';
import { makeGeneralRegressionModelNode } from './general-regression-model';
import { makeDataDictionaryNode } from './data-dictionary';
import { parseString } from 'xml2js';
import { promisify } from 'bluebird';
import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { ITaxonomy } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/taxonomy';
import { makeCustomPmmlNode } from './custom-pmml';
import { constructMiningSchemaNode } from './mining-schema';
const promisifiedParseString = promisify(parseString);

export async function constructPmmlNode(
    algorithmFolderPathsAndNames: Array<{
        name: string;
        folderPath: string;
    }>,
    modelFolderPath: string,
): Promise<IPmml[]> {
    const pmmlNodes: IPmml[] = [];
    for (let { name, folderPath } of algorithmFolderPathsAndNames) {
        const betasCsvString = fs.readFileSync(
            `${folderPath}/betas.csv`,
            'utf8',
        );
        const referenceCsvString = fs.readFileSync(
            `${folderPath}/reference.csv`,
            'utf8',
        );

        const localTransformationsXmlString = fs.readFileSync(
            `${folderPath}/local-transformations.xml`,
            'utf8',
        );
        const localTransformationsAndTaxonomy: {
            PMML: {
                LocalTransformations: ILocalTransformations;
                Taxonomy: ITaxonomy;
            };
        } = await promisifiedParseString(localTransformationsXmlString, {
            explicitArray: false,
            explicitChildren: true,
            preserveChildrenOrder: true,
        });

        const generalRegressionModel = makeGeneralRegressionModelNode(
            betasCsvString,
            referenceCsvString,
        );

        const webSpecificationsCsvString = fs.readFileSync(
            `${modelFolderPath}/web-specifications.csv`,
            'utf8',
        );

        const pmml: IPmml = {
            Header: makeHeaderNode(name),
            DataDictionary: await makeDataDictionaryNode(
                betasCsvString,
                localTransformationsXmlString,
                webSpecificationsCsvString,
            ),
            LocalTransformations:
                localTransformationsAndTaxonomy.PMML.LocalTransformations,
            Taxonomy: localTransformationsAndTaxonomy.PMML.Taxonomy,
            GeneralRegressionModel: generalRegressionModel,
            MiningSchema: constructMiningSchemaNode(webSpecificationsCsvString),
            ...makeCustomPmmlNode(referenceCsvString, generalRegressionModel),
        };

        pmmlNodes.push(pmml);
    }

    return pmmlNodes;
}
