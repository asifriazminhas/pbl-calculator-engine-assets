import { SurvivalModelBuilder } from "@ottawamhealth/pbl-calculator-engine";
import { convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm } from "@ottawamhealth/pbl-calculator-engine/lib/scripts/cause-effect-csv-to-json";
import * as fs from "fs";
import * as path from "path";
import { MultipleAlgorithmModelJson } from "@ottawamhealth/pbl-calculator-engine/lib/engine/multiple-algorithm-model/multiple-algorithm-model-json";

async function build() {
  const ExcludedAlgorithms = "sport";

  const algorithmDirectoryNames = fs
    .readdirSync(__dirname)
    .filter(fileOrDirectoryName => {
      return (
        fileOrDirectoryName !== ".git" &&
        fileOrDirectoryName !== "node_modules" &&
        ExcludedAlgorithms.indexOf(fileOrDirectoryName) < 0
      );
    })
    .filter(fileOrDirectoryName => {
      return fs.statSync(`${__dirname}/${fileOrDirectoryName}`).isDirectory();
    });

  const algorithmDirectoryPaths = algorithmDirectoryNames.map(directoryName => {
    return `${__dirname}/${directoryName}`;
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

  const causeEffectRefJsons = algorithmDirectoryPaths.map(
    (algorithmDirectoryPath, index) => {
      return convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm(
        modelJsons[index] as MultipleAlgorithmModelJson,
        algorithmDirectoryNames[index],
        fs.readFileSync(
          `${algorithmDirectoryPath}/cause-effect-ref.csv`,
          "utf8"
        )
      );
    }
  );
  causeEffectRefJsons.forEach((causeEffectRefJson, index) => {
    fs.writeFileSync(
      `${algorithmDirectoryPaths[index]}/cause-effect-ref.json`,
      JSON.stringify(causeEffectRefJson)
    );
  });
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
