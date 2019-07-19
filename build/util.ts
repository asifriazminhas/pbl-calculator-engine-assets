import * as path from 'path';
import { existsSync } from 'fs';
import { IConfigJson } from '../reference-files';

export function getModelBuildData(): Array<{
    modelName: string;
    folderPath: string;
    webSpecVersion: 'v1' | 'v2';
}> {
    const config: IConfigJson = require('../config.json');

    return config.models.map(({ name, webSpecVersion }) => {
        return {
            folderPath: path.join(__dirname, `../${name}`),
            modelName: name,
            webSpecVersion,
        };
    });
}

export function isGenderedModel(folderPath: string): boolean {
    return existsSync(`${folderPath}/male`);
}
