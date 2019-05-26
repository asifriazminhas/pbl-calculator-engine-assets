import { convertToPmml } from "../../../convert-to-pmml";
import { PrComments } from "./pr-comments";

process.on("uncaughtException", err => {
  console.log(`Error when building PR`);
  console.error(err);

  return process.exit(1);
});

convertToPmml()
  .then(() => {
    console.log("Built PMML files");

    return PrComments.forSuccessfulBuild();
  })
  .then(() => {
    console.log("Logged PR comments for successful build");

    return process.exit(0);
  })
  .catch(err => {
    return PrComments.forUncaughtException(err);
  })
  .then(() => {
    console.log("Logged PR comments for failed build");

    return process.exit(1);
  });
