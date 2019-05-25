import { convertToPmml } from "../../../convert-to-pmml";

process.on("uncaughtException", err => {
  console.log(`Error when building commit`);
  console.error(err);

  return process.exit(1);
});

convertToPmml().then(() => {
  console.log("Build Successful");

  return process.exit(0);
});
