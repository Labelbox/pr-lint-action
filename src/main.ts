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

  try {
    if (!titleRegex.test(title)) {
      core.setFailed(onFailedRegexComment);

      const pr = githubContext.issue;
      await githubClient.pulls.createReview({
        owner: pr.owner,
        repo: pr.repo,
        pull_number: pr.number,
        body: onFailedRegexComment,
        event: 'COMMENT'
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

// noinspection JSIgnoredPromiseFromCall
run();
