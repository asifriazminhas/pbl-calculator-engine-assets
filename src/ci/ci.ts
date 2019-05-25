import { CIEnvVariables } from "./env/ci";

function runCiBuild() {
  if (CIEnvVariables.getCurrentBranchName() === "master") {
    console.log("Starting build for master");

    return require("./master-commit/master-commit");
  } else {
    console.log("Starting build for PR");

    return require("./pr/pr");
  }
}
runCiBuild();
