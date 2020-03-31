import {GitHub} from '@actions/github/lib/github';

import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  const githubContext = github.context;
  const githubToken = core.getInput('repo-token');
  const githubClient: GitHub = new GitHub(githubToken);

  const titleRegex = new RegExp(core.getInput('title-regex'));
  const title = githubContext.payload.pull_request?.title ?? "";

  const onFailedRegexComment = core.getInput('on-failed-regex-comment')
    .replace('%regex%', titleRegex.source);

  core.debug(`Title Regex: ${titleRegex}`);
  core.debug(`Title: ${title}`);

  const headSHA = githubContext.payload.pull_request?.head.sha;
  if (!headSHA) {
    core.setFailed("Error: could not find a HEAD SHA for this PR");
  }

  try {
    const pr = githubContext.issue;

    let matchesRegex = titleRegex.test(title);
    if (!matchesRegex) {
      await githubClient.pulls.createReview({
        owner: pr.owner,
        repo: pr.repo,
        pull_number: pr.number,
        body: onFailedRegexComment,
        event: 'COMMENT'
      });
    }

    await githubClient.repos.createStatus({
      owner: pr.owner,
      repo: pr.repo,
      sha: headSHA,
      state: matchesRegex ? 'success' : 'pending',
      context: 'labelbox/pr-lint',
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

// noinspection JSIgnoredPromiseFromCall
run();
