import Octokit from "@octokit/rest";
const GithubApi = new Octokit({
  auth: process.env.GITHUB_TOKEN
});
import { MarkdownBuilder } from "md-builder";

export abstract class PrComments {
  static async forUncaughtException(error: Error) {
    const pullRequestSlugSep = process.env.TRAVIS_REPO_SLUG!.split("/");
    const owner = pullRequestSlugSep[0];
    const repo = pullRequestSlugSep[1];

    await GithubApi.issues.createComment({
      owner,
      repo,
      issue_number: Number(process.env.TRAVIS_PULL_REQUEST as string),
      body: MarkdownBuilder.h2(
        `Travic CI encountered the following error when building the current PR`
      )
        .code(error.stack as string)
        .text("@yulric Please look into this")
        .toMarkdown()
    });

    return process.exit(1);
  }
}
