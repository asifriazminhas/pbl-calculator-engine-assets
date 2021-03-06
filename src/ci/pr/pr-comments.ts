import Octokit from '@octokit/rest';
const GithubApi = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
import { MarkdownBuilder } from 'md-builder';
import { Owner, RepoName } from '../../constants/github';
import { CIEnvVariables } from '../../env/ci';
import { Validation } from '../validation/validation';
import { CIName } from '../../constants/ci';

export abstract class PrComments {
    static async forUncaughtException(error: Error) {
        await GithubApi.issues.createComment(
            Object.assign({}, PrComments.buildBaseGithubApiObj(), {
                body: MarkdownBuilder.h2(
                    `${CIName} encountered the following unknown error when building the current PR`,
                )
                    .code(error.stack as string)
                    .text('@yulric Please look into this')
                    .toMarkdown(),
            }),
        );
    }

    static async forSuccessfulBuild() {
        await GithubApi.issues.createComment(
            Object.assign({}, PrComments.buildBaseGithubApiObj(), {
                body: MarkdownBuilder.h1(`Build Results`)
                    .text(Validation.prettifyValidation())
                    .toMarkdown(),
            }),
        );
    }

    private static buildBaseGithubApiObj() {
        return {
            owner: Owner,
            repo: RepoName,
            issue_number: CIEnvVariables.getCurrentPrNumber(),
        };
    }
}
