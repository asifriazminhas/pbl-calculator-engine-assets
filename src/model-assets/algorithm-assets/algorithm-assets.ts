import { WebSpecV1 } from '../web-spec/web-spec-v1/web-spec-v1';
import { MSW } from '../web-spec/msw/msw';
import { BetasSheet } from './betas-sheet/betas-sheet';
import { ReferenceSheet } from './reference-sheet';
import { LocalTransformations } from './local-transformations';
import { ExternalCoefficients } from './external-coefficients';

export class AlgorithmAssets {
    algorithmName: string;
    predictiveBetas: BetasSheet;
    referenceSheet: ReferenceSheet;
    localTransformations!: LocalTransformations; // This is initialized in the finishConstruction method. Because the method to parse the XML is async it cannot be done in the constructor
    webSpec: MSW | WebSpecV1;
    algorithmFolder: string; // Store this because we cannot finish the construction in the constructor and we need it for the finishConstruction method
    externalCoefficients?: ExternalCoefficients[];

    constructor(
        algorithmName: string,
        algorithmFolder: string,
        useMsw: boolean,
        modelFolderPath: string,
        parentAlgorithmFolder?: string,
    ) {
        this.algorithmName = algorithmName;
        this.predictiveBetas = new BetasSheet(
            parentAlgorithmFolder ? parentAlgorithmFolder : algorithmFolder,
        );
        this.referenceSheet = new ReferenceSheet(
            parentAlgorithmFolder ? parentAlgorithmFolder : algorithmFolder,
        );
        this.algorithmFolder = algorithmFolder;
        this.webSpec = useMsw
            ? new MSW(algorithmFolder)
            : new WebSpecV1(modelFolderPath);
        this.externalCoefficients = ExternalCoefficients.create(
            algorithmFolder,
        );
    }

    async finishConstruction(): Promise<AlgorithmAssets> {
        this.localTransformations = await LocalTransformations.factory(
            this.algorithmFolder,
        );

        return this;
    }
}
