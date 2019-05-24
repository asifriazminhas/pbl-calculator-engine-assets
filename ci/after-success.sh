#!/bin/sh

setup_git() {
  git config --global user.email "projectbiglife@toh.ca"
  git config --global user.name "BLLBot"
}

commit_website_files() {
  git checkout -b $TRAVIS_PULL_REQUEST_BRANCH
  git add .
  git commit --message "[Feature] Algorithm Files Build"
}

upload_files() {
  git push --quiet --set-upstream https://${GITHUB_TOKEN}@github.com/Big-Life-Lab/pbl-calculator-engine-assets.git $TRAVIS_PULL_REQUEST_BRANCH 
}

setup_git
commit_website_files
upload_files