import { convertToPmml } from "../../convert-to-pmml";
import { PrComments } from "./pr-comments";

convertToPmml()
  .then(() => {
    console.log("Build Done");
  })
  .catch((err: Error) => {
    console.log(`Error when building PR`);
    console.error(err);

    PrComments.forUncaughtException(err).catch(err => {
      console.log(`Error when posting PR comment to Github`);
      console.error(err);

      process.exit(1);
    });
  });
