import { SurvivalModelBuilder } from "@ottawamhealth/pbl-calculator-engine";
import { convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm } from "@ottawamhealth/pbl-calculator-engine/lib/scripts/cause-effect-csv-to-json";
import * as fs from "fs";
import * as path from "path";
import { MultipleAlgorithmModelJson } from "@ottawamhealth/pbl-calculator-engine/lib/engine/multiple-algorithm-model/multiple-algorithm-model-json";
import { transformPhiatDictionaryToPmml } from "@ottawamhealth/pbl-calculator-engine/lib/engine/pmml-transformers/web-specifications";
import { getRefPopJsonsFromRefPopCsv } from "./build/ref-pop";
import { getCalibrationJsonsFromCalibrationCsvString } from "./build/calibration";
const csvParse = require("csv-parse/lib/sync");

function buildReferenceJsonFiles(
  algorithmDirectoryPaths: string[],
  referenceFilesRootFolderName: string,
  outputJsonFilesRootFolderName: string,
  builderMethod: (
    csvFiles: {
      male: string;
      female: string;
    }
  ) => Array<{ fileName: string; jsonObject: object }>
) {
  algorithmDirectoryPaths
    .map(algorithmDirectoryPath => {
      const referenceFilesRootFolderPath = `${algorithmDirectoryPath}/${referenceFilesRootFolderName}`;

      if (fs.existsSync(referenceFilesRootFolderPath)) {
        const nameOfCsvFile = fs
          .readdirSync(`${referenceFilesRootFolderPath}/male`)
          .find(fileName => {
            return fileName.includes(".csv");
          });
        if (!nameOfCsvFile) {
          throw new Error(
            `No csv reference file found in ${referenceFilesRootFolderPath}`
          );
        }

        return builderMethod({
          male: fs.readFileSync(
            `${referenceFilesRootFolderPath}/male/${nameOfCsvFile}`,
            "utf8"
          ),
          female: fs.readFileSync(
            `${referenceFilesRootFolderPath}/female/${nameOfCsvFile}`,
            "utf8"
          )
        });
      } else {
        return undefined;
      }
    })
    .map((referenceJsonObjects, index) => {
      if (referenceJsonObjects) {
        const outputJsonReferenceFilesFolderPath = `${
          algorithmDirectoryPaths[index]
        }/${outputJsonFilesRootFolderName}`;

        if (!fs.existsSync(outputJsonReferenceFilesFolderPath)) {
          fs.mkdirSync(outputJsonReferenceFilesFolderPath);
        }

        referenceJsonObjects.forEach(referenceJsonObject => {
          fs.writeFileSync(
            `${outputJsonReferenceFilesFolderPath}/${
              referenceJsonObject.fileName
            }.json`,
            JSON.stringify(referenceJsonObject.jsonObject)
          );
        });
      }
    });
}

async function build() {
  const IncludeAlgorithms = ["MPoRT", "SPoRT"];

  const algorithmDirectoryNames = fs
    .readdirSync(__dirname)
    .filter(fileOrDirectoryName => {
      return IncludeAlgorithms.indexOf(fileOrDirectoryName) > -1;
    })
    .filter(fileOrDirectoryName => {
      return fs.statSync(`${__dirname}/${fileOrDirectoryName}`).isDirectory();
    });
  const algorithmDirectoryPaths = algorithmDirectoryNames.map(directoryName => {
    return `${__dirname}/${directoryName}`;
  });

  algorithmDirectoryPaths.forEach(algorithmDirectoryPath => {
    const filesInCurrentAlgorithmDirectory = fs.readdirSync(
      algorithmDirectoryPath
    );

    const currentAlgorithmInfo = csvParse(
      fs.readFileSync(`${algorithmDirectoryPath}/algorithm_info.csv`, "utf8"),
      {
        columns: true
      }
    ).find(
      (algorithmInfoRow: { AlgorithmName: string }) =>
        algorithmInfoRow["AlgorithmName"] ===
        algorithmDirectoryPath.split("/").reverse()[0]
    );
    if (!currentAlgorithmInfo) {
      throw new Error();
    }

    if (currentAlgorithmInfo["GenderSpecific"] === "false") {
      filesInCurrentAlgorithmDirectory.forEach(currentAlgorithmFileName => {
        if (
          currentAlgorithmFileName.indexOf(".csv") > -1 &&
          !isNaN(Number(currentAlgorithmFileName.split(".csv")[0]))
        ) {
          fs.writeFileSync(
            `${algorithmDirectoryPath}/${
              currentAlgorithmFileName.split(".csv")[0]
            }.xml`,
            transformPhiatDictionaryToPmml(
              currentAlgorithmInfo["AlgorithmName"],
              fs.readFileSync(
                `${algorithmDirectoryPath}/${currentAlgorithmFileName}`,
                "utf8"
              ),
              "",
              currentAlgorithmInfo,
              "both",
              false,
              true
            )
          );
        }
      });
    }
  });

  const algorithms = await Promise.all(
    algorithmDirectoryPaths.map(algorithmDirectoryPath => {
      return SurvivalModelBuilder.buildFromAssetsFolder(algorithmDirectoryPath);
    })
  );

  const modelJsons = algorithms.map(algorithm => {
    return algorithm.getModelJson();
  });

  modelJsons.forEach((algorithmJson, index) => {
    return fs.writeFileSync(
      `${algorithmDirectoryPaths[index]}/model.json`,
      JSON.stringify(algorithmJson)
    );
  });

  const causeEffectRefJsons = algorithmDirectoryPaths
    .filter(algorithmDirectoryPath => {
      return fs.existsSync(`${algorithmDirectoryPath}/cause-effect-ref.csv`);
    })
    .map((algorithmDirectoryPath, index) => {
      return convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm(
        modelJsons[index] as MultipleAlgorithmModelJson,
        algorithmDirectoryNames[index],
        fs.readFileSync(
          `${algorithmDirectoryPath}/cause-effect-ref.csv`,
          "utf8"
        )
      );
    });
  causeEffectRefJsons.forEach((causeEffectRefJson, index) => {
    fs.writeFileSync(
      `${algorithmDirectoryPaths[index]}/cause-effect-ref.json`,
      JSON.stringify(causeEffectRefJson)
    );
  });

  buildReferenceJsonFiles(
    algorithmDirectoryPaths,
    "ref-pop-references",
    "ref-pops",
    csvReferenceFiles => {
      return getRefPopJsonsFromRefPopCsv(csvReferenceFiles).map(
        ({ refPop, popName }) => {
          return {
            fileName: popName,
            jsonObject: refPop
          };
        }
      );
    }
  );

  buildReferenceJsonFiles(
    algorithmDirectoryPaths,
    "calibration-references",
    "calibration",
    csvReferenceFiles => {
      return getCalibrationJsonsFromCalibrationCsvString(csvReferenceFiles).map(
        ({ calibrationJson, popName }) => {
          return {
            fileName: popName,
            jsonObject: calibrationJson
          };
        }
      );
    }
  );
}

build()
  .then(() => {
    console.log("Build Done");
    process.exit(0);
  })
  .catch(err => {
    console.log("Build error");
    console.error(err);
    process.exit(1);
  });
