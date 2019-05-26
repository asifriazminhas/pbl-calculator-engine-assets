export abstract class CIEnvVariables {
  static getCurrentPrNumber(): number {
    const urlSplitValues = (process.env.CIRCLE_PULL_REQUEST as string).split(
      "/"
    );

    return Number(urlSplitValues[urlSplitValues.length - 1]);
  }

  static getCurrentBranchName(): string {
    return process.env.CIRCLE_BRANCH as string;
  }
}
