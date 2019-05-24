import { convertToPmml } from "../../convert-to-pmml";
import { PrComments } from "./pr-comments";

process.on("uncaughtException", err => {
  console.log(`Error when building PR`);
  console.error(err);

  return PrComments.forUncaughtException(err).catch(onPrCommentException);
});

convertToPmml()
  .then(() => {
    console.log("Build Successful");

    return PrComments.forSuccessfulBuild();
  })
  .catch(onPrCommentException);

function onPrCommentException(err: Error) {
  console.log(`Error when posting PR comment to Github`);
  console.error(err);

  process.exit(1);
}
