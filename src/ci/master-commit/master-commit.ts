import { convertToPmml } from "../../../convert-to-pmml";

process.on("uncaughtException", err => {
  console.log(`Error when building commit on master`);
  console.error(err);

  return process.exit(1);
});

convertToPmml().then(() => {
  console.log("Built PMML files");

  //return process.exit(0);
});
