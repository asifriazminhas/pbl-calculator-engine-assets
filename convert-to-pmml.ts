const Algorithms: Array<{
  name: string;
}> = require("./algorithms.json");
import * as path from "path";
import * as fs from "fs";
import { transformPhiatDictionaryToPmml } from "@ottawamhealth/pbl-calculator-engine/lib/engine/pmml-transformers/web-specifications";
import { limesurveyTxtStringToPmmlString } from "@ottawamhealth/pbl-calculator-engine/lib/engine/pmml-transformers/limesurvey";
import { convertBetasCsvStringToPmml } from "@ottawamhealth/pbl-calculator-engine/lib/engine/pmml-transformers/betas";
import { pmmlXmlStringsToJson } from "@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml-to-json-parser/pmml";
const csvParse = require("csv-parse/lib/sync");
import { PmmlParser } from "@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/parser";
import { Pmml } from "@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/pmml";
import { IGeneralRegressionModel } from "@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/general_regression_model/general_regression_model";
import * as xmlBuilder from "xmlbuilder";

function getPmmlFileStringsSortedByPriorityInFolder(
  assetsFolderPath: string
): string[] {
  // Get the names of all the files in the assets directory
  const assetFileNames = fs.readdirSync(assetsFolderPath);

  return assetFileNames
    .filter(pmmlFileName => pmmlFileName.indexOf(".xml") > -1)
    .filter(pmmlFileName => {
      return isNaN(Number(pmmlFileName.split(".xml")[0])) === false;
    })
    .map(pmmlFileName => pmmlFileName.split(".")[0])
    .map(pmmlFileName => Number(pmmlFileName))
    .sort((pmmlFileNameOne, pmmlFileNameTwo) => {
      return pmmlFileNameOne > pmmlFileNameTwo ? 1 : -1;
    })
    .map(pmmlFileName => "" + pmmlFileName)
    .map(pmmlFileName =>
      fs.readFileSync(`${assetsFolderPath}/${pmmlFileName}.xml`, "utf8")
    );
}

async function getModelPmmlForGenderedModel(
  algorithmFolderPath: string,
  name: string
): Promise<Pmml[]> {
  const maleAlgorithmFolder = `${algorithmFolderPath}/male`;
  const femaleAlgorithmFolder = `${algorithmFolderPath}/female`;

  let malePmmlFiles = [];
  let femalePmmlFiles = [];

  if (fs.existsSync(`${algorithmFolderPath}/male/betas.csv`)) {
    const maleBetaPmml = convertBetasCsvStringToPmml(
      fs.readFileSync(`${algorithmFolderPath}/male/betas.csv`, "utf8"),
      name
    );
    malePmmlFiles.push(maleBetaPmml);

    if (fs.existsSync(`${algorithmFolderPath}/male/reference.csv`)) {
      const maleCustomPmmlString = getCustomPmml(
        await PmmlParser.parsePmmlFromPmmlXmlStrings([maleBetaPmml]),
        fs.readFileSync(`${algorithmFolderPath}/male/reference.csv`, "utf8")
      );
      if (maleCustomPmmlString) {
        malePmmlFiles.push(maleCustomPmmlString);
      }
    }
  }
  if (fs.existsSync(`${algorithmFolderPath}/female/betas.csv`)) {
    const femaleBetaPmml = convertBetasCsvStringToPmml(
      fs.readFileSync(`${algorithmFolderPath}/female/betas.csv`, "utf8"),
      name
    );
    femalePmmlFiles.push(femaleBetaPmml);

    if (fs.existsSync(`${algorithmFolderPath}/female/reference.csv`)) {
      const femaleCustomPmmlString = getCustomPmml(
        await PmmlParser.parsePmmlFromPmmlXmlStrings([femaleBetaPmml]),
        fs.readFileSync(`${algorithmFolderPath}/female/reference.csv`, "utf8")
      );
      if (femaleCustomPmmlString) {
        femalePmmlFiles.push(femaleCustomPmmlString);
      }
    }
  }

  malePmmlFiles = malePmmlFiles.concat(
    getPmmlFileStringsSortedByPriorityInFolder(maleAlgorithmFolder)
  );
  femalePmmlFiles = femalePmmlFiles.concat(
    getPmmlFileStringsSortedByPriorityInFolder(femaleAlgorithmFolder)
  );

  if (fs.existsSync(`${algorithmFolderPath}/web-specifications.csv`)) {
    const webSpecificationsPmml = transformPhiatDictionaryToPmml(
      name,
      fs.readFileSync(`${algorithmFolderPath}/web-specifications.csv`, "utf8"),
      fs.readFileSync(
        `${algorithmFolderPath}/web-specifications-categories.csv`,
        "utf8"
      ),
      csvParse(
        fs.readFileSync(`${algorithmFolderPath}/algorithm-info.csv`, "utf8"),
        {
          columns: true
        }
      ),
      "both",
      false,
      false
    );

    malePmmlFiles.push(webSpecificationsPmml);
    femalePmmlFiles.push(webSpecificationsPmml);
  }

  if (fs.existsSync(`${algorithmFolderPath}/limesurvey.txt`)) {
    const limesurveyPmml = limesurveyTxtStringToPmmlString(
      fs.readFileSync(`${algorithmFolderPath}/limesurvey.txt`, "utf8")
    );

    malePmmlFiles.push(limesurveyPmml);
    femalePmmlFiles.push(limesurveyPmml);
  }

  const malePmml = PmmlParser.parsePmmlFromPmmlXmlStrings(malePmmlFiles);
  const femalePmml = PmmlParser.parsePmmlFromPmmlXmlStrings(femalePmmlFiles);
  return Promise.all([malePmml, femalePmml]);
}

function getModelFromNonGenderedModel(
  modelFolderPath: string,
  modelName: string
): Promise<Pmml> {
  let pmmlFiles = getPmmlFileStringsSortedByPriorityInFolder(modelFolderPath);
  if (fs.existsSync(`${modelFolderPath}/betas.csv`)) {
    pmmlFiles = [
      convertBetasCsvStringToPmml(
        fs.readFileSync(`${modelFolderPath}/betas.csv`, "utf8"),
        modelName
      )
    ].concat(pmmlFiles);
  }

  return PmmlParser.parsePmmlFromPmmlXmlStrings(pmmlFiles);
}

async function convertToPmml() {
  const modelPmmls: Array<Pmml | Pmml[]> = await Promise.all(
    //@ts-ignore
    Algorithms.map(({ name }) => {
      const algorithmFolderPath = path.join(__dirname, `${name}`);

      if (fs.existsSync(`${algorithmFolderPath}/male`)) {
        return getModelPmmlForGenderedModel(algorithmFolderPath, name);
      } else {
        return getModelFromNonGenderedModel(algorithmFolderPath, name);
      }
    })
  );

  const pmmlStrings = modelPmmls.map(modelPmml => {
    if (modelPmml instanceof Array) {
      const malePmmlString = modelPmml[0].toString();
      const femalePmmlString = modelPmml[1].toString();

      return {
        male: malePmmlString,
        female: femalePmmlString
      };
    } else {
      return modelPmml.toString();
    }
  });

  pmmlStrings.forEach((pmmlStrings, index) => {
    const algorithmFolderPath = path.join(
      __dirname,
      `${Algorithms[index].name}`
    );

    if (typeof pmmlStrings === "string") {
      fs.writeFileSync(`${algorithmFolderPath}/model.xml`, pmmlStrings);
    } else {
      fs.writeFileSync(
        `${algorithmFolderPath}/male/model.xml`,
        pmmlStrings.male
      );
      fs.writeFileSync(
        `${algorithmFolderPath}/female/model.xml`,
        pmmlStrings.female
      );
    }
  });
}

convertToPmml()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

interface CsvFileRow {
  [index: string]: string;
}
type CsvFile = CsvFileRow[];

function getCustomPmml(
  pmml: Pmml,
  referenceCsvFileString: string
): string | null {
  const csvParseOptions = {
    columns: true
  };
  const referenceCsv: CsvFile = csvParse(
    referenceCsvFileString,
    csvParseOptions
  );

  if (pmml.pmmlXml.PMML.GeneralRegressionModel) {
    const generalRegressionModel = pmml.pmmlXml.PMML.GeneralRegressionModel;

    const referenceRowsWithKnots = referenceCsv.filter(referenceCsvRow => {
      return referenceCsvRow["Knot1"].trim() !== "";
    });

    const parameterNamesAndKnots = referenceRowsWithKnots.map(
      referenceRowWithKnot => {
        let numOfKnots = 0;
        while (
          referenceRowWithKnot[`Knot${numOfKnots + 1}`] !== "" &&
          referenceRowWithKnot[`Knot${numOfKnots + 1}`] !== undefined
        ) {
          numOfKnots += 1;
        }

        let parameterNamesForRcsVar: string[] = [];
        let knotLocations: string[] = [];

        for (let i = 2; i < numOfKnots; i++) {
          parameterNamesForRcsVar.push(
            generalRegressionModel.ParameterList.Parameter.find(parameter => {
              return (
                parameter.$.label ===
                `${referenceRowWithKnot["Variable"]}_rcs${i}`
              );
            })!.$.name
          );
        }
        for (let i = 1; i <= numOfKnots; i++) {
          knotLocations.push(referenceRowWithKnot[`Knot${i}`]);
        }

        return {
          parameterNames: parameterNamesForRcsVar,
          knotsLocations: knotLocations
        };
      }
    );

    const pmmlNode = xmlBuilder.create("PMML");
    const customPmmlNode = pmmlNode.ele("CustomPMML");
    const restrictedCubicSplineNode = customPmmlNode.ele(
      "RestrictedCubicSpline"
    );
    referenceRowsWithKnots.forEach((refRowWithKnot, index) => {
      const pCellNode = restrictedCubicSplineNode.ele("PCell");
      pCellNode.att(
        "parameterName",
        parameterNamesAndKnots[index].parameterNames.join(", ")
      );
      pCellNode.att(
        "knotLocations",
        parameterNamesAndKnots[index].knotsLocations.join(", ")
      );
    });

    return pmmlNode.toString();
  }

  return null;
}
