import csvParse from 'csv-parse/lib/sync';

export class WebSpec {
    webSpecFile: Array<{ Name: string; Type: string; [index: string]: string }>;

    constructor(webSpecFileString: string) {
        this.webSpecFile = csvParse(webSpecFileString, {
            columns: true,
        });
    }

    findSpecForVariable(variableName: string) {
        return this.webSpecFile.find(({ Name }) => {
            return Name === variableName;
        });
    }
}
