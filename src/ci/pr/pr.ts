import { convertToPmml } from "../../../convert-to-pmml";
import { PrComments } from "./pr-comments";

process.on("uncaughtException", err => {
  console.log(`Error when building PR`);
  console.error(err);

  return process.exit(1);
});

convertToPmml()
  .then(() => {
    console.log("Build Successful");

    return PrComments.forSuccessfulBuild();
  })
  .then(() => {
    return process.exit(0);
  })
  .catch(err => {
    PrComments.forUncaughtException(err);
  })
  .then(() => {
    return process.exit(1);
  });
