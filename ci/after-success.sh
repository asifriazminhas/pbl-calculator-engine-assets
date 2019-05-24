#!/bin/sh

setup_git() {
  git config --global user.email "projectbiglife@toh.ca"
  git config --global user.name "BLLBot"
}

commit_website_files() {
  git checkout $TRAVIS_BRANCH
  git add .
  git commit --message "[Feature] Algorithm Files Build"
}

upload_files() {
  git remote add origin https://${GITHUB_TOKEN}@github.com/Big-Life-Lab/pbl-calculator-engine-assets.git > /dev/null 2>&1
  git push --quiet --set-upstream origin $TRAVIS_BRANCH 
}

setup_git
commit_website_files
upload_files
