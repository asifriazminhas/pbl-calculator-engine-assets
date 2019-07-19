import { existsSync } from 'fs';

export class VarMappings {
    // Mappings from old variable names to new ones
    mappings: {
        [oldVarName: string]: string | undefined;
    };

    constructor(algorithmFolderPath: string) {
        this.mappings = require(`${algorithmFolderPath}/mappings.json`);
    }

    static hasVarMappingsFile(algorithmFolderPath: string): boolean {
        return existsSync(`${algorithmFolderPath}/mappings.json`);
    }

    getMapping(oldVarName: string): string {
        const mapping = this.mappings[oldVarName];

        return mapping === undefined ? oldVarName : mapping;
    }
}
