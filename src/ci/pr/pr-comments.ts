import Octokit from "@octokit/rest";
const GithubApi = new Octokit({
  auth: process.env.GITHUB_TOKEN
});
import { MarkdownBuilder } from "md-builder";
import { prettifyWarnings } from "../../singletons/warnings/warnings";

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
        `Travis CI encountered the following unknown error when building the current PR`
      )
        .code(error.stack as string)
        .text("@yulric Please look into this")
        .toMarkdown()
    });

    return process.exit(1);
  }

  static async forSuccessfulBuild() {
    const pullRequestSlugSep = process.env.TRAVIS_REPO_SLUG!.split("/");
    const owner = pullRequestSlugSep[0];
    const repo = pullRequestSlugSep[1];

    await GithubApi.issues.createComment({
      owner,
      repo,
      issue_number: Number(process.env.TRAVIS_PULL_REQUEST as string),
      body: MarkdownBuilder.h1(`Build Results`)
        .text(prettifyWarnings())
        .toMarkdown()
    });

    return process.exit(0);
  }
}
