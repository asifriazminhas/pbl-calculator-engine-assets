import { SurvivalModelBuilder } from "@ottawamhealth/pbl-calculator-engine";
import { convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm } from "@ottawamhealth/pbl-calculator-engine/lib/scripts/cause-effect-csv-to-json";
import * as fs from "fs";
import * as path from "path";

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

  algorithms
    .map(algorithm => {
      return algorithm.getModel();
    })
    .map((algorithmJson, index) => {
      return fs.writeFileSync(
        `${algorithmDirectoryPaths[index]}/${
          algorithmDirectoryNames[index]
        }.json`,
        JSON.stringify(algorithmJson)
      );
    });

  const causeImpactRefJsons = algorithmDirectoryPaths.map(
    (algorithmDirectoryPath, index) => {
      return convertCauseEffectCsvToGenderCauseEffectRefForAlgorithm(
        algorithmDirectoryNames[index],
        fs.readFileSync(
          `${algorithmDirectoryPath}/cause-impact-ref.csv`,
          "utf8"
        )
      );
    }
  );
  causeImpactRefJsons.forEach((causeImpactRefJson, index) => {
    fs.writeFileSync(
      `${algorithmDirectoryPaths[index]}/cause-impact-ref.json`,
      JSON.stringify(causeImpactRefJson)
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
