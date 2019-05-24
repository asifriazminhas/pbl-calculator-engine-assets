import { convertToPmml } from "../../convert-to-pmml";
import Octokit from "@octokit/rest";
const GithubApi = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

convertToPmml()
  .then(() => {
    console.log("Done");
    throw new Error(`Test Uncught Exception`);
  })
  .catch((err: Error) => {
    console.error(err);

    const pullRequestSlugSep = process.env.TRAVIS_REPO_SLUG!.split("/");
    const owner = pullRequestSlugSep[0];
    const repo = pullRequestSlugSep[1];

    GithubApi.issues
      .createComment({
        owner,
        repo,
        issue_number: Number(process.env.TRAVIS_PULL_REQUEST as string),
        body: err.toString()
      })
      .then(() => {
        process.exit(1);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  });
