import { WebSpecV1 } from '../web-spec/web-spec-v1/web-spec-v1';
import { MSW } from '../web-spec/msw/msw';
import { BetasSheet } from './betas-sheet';
import { ReferenceSheet } from './reference-sheet';
import { LocalTransformations } from './local-transformations';

export class AlgorithmAssets {
    algorithmName: string;
    betasSheet: BetasSheet;
    referenceSheet: ReferenceSheet;
    localTransformations!: LocalTransformations; // This is initialized in the finishConstruction method. Because the method to parse the XML is async it cannot be done in the constructor
    webSpec: MSW | WebSpecV1;
    algorithmFolder: string; // Store this because we cannot finish the construction in the constructor and we need it for the finishConstruction method

    constructor(
        algorithmName: string,
        algorithmFolder: string,
        useMsw: boolean,
        modelFolderPath: string,
        parentAlgorithmFolder?: string,
    ) {
        this.algorithmName = algorithmName;
        this.betasSheet = new BetasSheet(
            parentAlgorithmFolder ? parentAlgorithmFolder : algorithmFolder,
        );
        this.referenceSheet = new ReferenceSheet(
            parentAlgorithmFolder ? parentAlgorithmFolder : algorithmFolder,
        );
        this.algorithmFolder = algorithmFolder;
        this.webSpec = useMsw
            ? new MSW(algorithmFolder)
            : new WebSpecV1(modelFolderPath);
    }

    async finishConstruction(): Promise<AlgorithmAssets> {
        this.localTransformations = await LocalTransformations.factory(
            this.algorithmFolder,
        );

        return this;
    }
}
