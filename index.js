#!/usr/bin/env node

"use strict";
import { execSync } from "child_process";
import inquirer from "inquirer";
import { getArgs, checkGitRepository } from "./helpers.js";
import { addGitmojiToCommitMessage } from "./gitmoji.js";
import { AI_PROVIDER, MODEL, args } from "./config.js";
import openai from "./openai.js";
import ollama from "./ollama.js";
import gemini from "./gemini.js";
import { secrets } from "./secrets.js"; // Import secrets configuration
const PROVIDER_SUPPORT = {
  openai,
  ollama,
  gemini,
};

const REGENERATE_MSG = "♻️ Regenerate Commit Messages";

console.log("Ai provider: ", AI_PROVIDER);

const ENDPOINT = args.ENDPOINT || secrets.ENDPOINT;

// Handle API keys from secrets configuration
let apiKey;
if (AI_PROVIDER === 'openai') {
  apiKey = args.apiKey || secrets.AI_COMMIT_API_KEY;
  if (!apiKey) {
    console.error('Error: OpenAI API key not found in secrets configuration.');
    process.exit(1);
  }
} else if (AI_PROVIDER === 'gemini') {
  apiKey = args.apiKey || secrets.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('Error: Google API key not found in secrets configuration.');
    process.exit(1);
  }
}

const language = args.language || secrets.AI_COMMIT_LANGUAGE || "english";
let template = args.template || secrets.AI_COMMIT_COMMIT_TEMPLATE;
const commitType = args["commit-type"];
const provider = PROVIDER_SUPPORT[AI_PROVIDER] || gemini;
const customMessageConvention = args["custom-conventions"];

const processTemplate = ({ template, commitMessage }) => {
  commitMessage = commitMessage.replace(/```[a-z]*\n|\n```/g, '');

  if (!template.includes("COMMIT_MESSAGE")) {
    console.log(`Warning: template doesn't include {COMMIT_MESSAGE}`);
    return commitMessage;
  }

  let finalCommitMessage = template.replaceAll(
    "{COMMIT_MESSAGE}",
    commitMessage
  );

  if (finalCommitMessage.includes("GIT_BRANCH")) {
    const currentBranch = execSync("git branch --show-current")
      .toString()
      .replaceAll("\n", "");

    console.log("Using currentBranch: ", currentBranch);

    finalCommitMessage = finalCommitMessage.replaceAll(
      "{GIT_BRANCH}",
      currentBranch
    );
  }

  return finalCommitMessage.trim();
};

const makeCommit = (input) => {
  console.log("Committing Message... 🚀 ");
  execSync(`git commit -F -`, { input: input.trim() });
  console.log("Commit Successful! 🎉");
};

const processEmoji = (msg, doAddEmoji) => {
  return msg;
};

const getPromptForSingleCommit = (diff) => {
  return provider.getPromptForSingleCommit(diff, {
    commitType,
    customMessageConvention,
    language,
  });
};

const generateSingleCommit = async (diff) => {
  const prompt = getPromptForSingleCommit(diff);
  if (!(await provider.filterApi({ prompt, filterFee: args["filter-fee"] })))
    process.exit(1);

  const text = await provider.sendMessage(prompt, { apiKey, model: MODEL });

  let finalCommitMessage = processEmoji(text, args.emoji);

  if (args.template) {
    finalCommitMessage = processTemplate({
      template: args.template,
      commitMessage: finalCommitMessage,
    });
    
    console.log(
      `Proposed Commit With Template:\n------------------------------\n${finalCommitMessage}\n------------------------------`
    );
  } else {
    console.log(
      `Proposed Commit:\n------------------------------\n${finalCommitMessage}\n------------------------------`
    );
  }

  if (args.force) {
    makeCommit(finalCommitMessage);
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "continue", 
      message: "Do you want to continue?",
      default: true,
    },
  ]);

  if (!answer.continue) {
    console.log("Commit aborted by user 🙅‍♂️");
    process.exit(1);
  }

  makeCommit(finalCommitMessage);
};

const generateListCommits = async (diff, numOptions = 5) => {
  const prompt = provider.getPromptForMultipleCommits(diff, {
    commitType,
    customMessageConvention,
    numOptions,
    language,
  });
  if (
    !(await provider.filterApi({
      prompt,
      filterFee: args["filter-fee"],
      numCompletion: numOptions,
    }))
  )
    process.exit(1);

  const text = await provider.sendMessage(prompt, { apiKey, model: MODEL });

  let msgs = text
    .split(";")
    .map((msg) => msg.trim())
    .map((msg) => processEmoji(msg, args.emoji));

  if (args.template) {
    msgs = msgs.map((msg) =>
      processTemplate({
        template: args.template,
        commitMessage: msg,
      })
    );
  }

  msgs.push(REGENERATE_MSG);

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "commit",
      message: "Select a commit message",
      choices: msgs,
    },
  ]);

  if (answer.commit === REGENERATE_MSG) {
    await generateListCommits(diff);
    return;
  }

  makeCommit(answer.commit);
};

const filterLockFiles = (diff) => {
  const lines = diff.split("\n");
  let isLockFile = false;
  const filteredLines = lines.filter((line) => {
    if (
      line.match(
        /^diff --git a\/(.*\/)?(yarn\.lock|pnpm-lock\.yaml|package-lock\.json)/
      )
    ) {
      isLockFile = true;
      return false;
    }
    if (isLockFile && line.startsWith("diff --git")) {
      isLockFile = false;
    }
    return !isLockFile;
  });
  return filteredLines.join("\n");
};

async function generateAICommit() {
  const isGitRepository = checkGitRepository();

  if (!isGitRepository) {
    console.error("This is not a git repository 🙅‍♂️");
    process.exit(1);
  }

  let diff = execSync("git diff --staged").toString();

  const originalDiff = diff;
  diff = filterLockFiles(diff);

  if (diff !== originalDiff) {
    console.log(
      "Changes detected in lock files. These changes will be included in the commit but won't be analyzed for commit message generation."
    );
  }

  if (!diff.trim()) {
    console.log("No changes to commit except lock files 🙅");
    console.log(
      "Maybe you forgot to add files? Try running git add . and then run this script again."
    );
    process.exit(1);
  }

  args.list
    ? await generateListCommits(diff)
    : await generateSingleCommit(diff);
}

await generateAICommit();
