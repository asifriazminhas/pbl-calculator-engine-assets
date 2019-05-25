import { CIEnvVariables } from "./env/ci";

function runCiBuild() {
  if (CIEnvVariables.getCurrentBranchName() === "master") {
    console.log("Build for master");

    return process.exit(0);
  } else {
    return require("./pr/pr");
  }
}
runCiBuild();
