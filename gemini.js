import inquirer from "inquirer";
import { AI_PROVIDER } from "./config.js";
import { readFileSync } from 'fs';
import { join } from 'path';

const FEE_PER_1K_TOKENS = 0.0;
const MAX_TOKENS = 1_000_000;
const FEE_COMPLETION = 0.001;

const gemini = {
  sendMessage: async (
    input,
    { apiKey, model = "google/gemini-2.0-flash-lite-preview-02-05:free" }
  ) => {
    console.log("prompting Gemini API...");
    //console.log("prompt: ", input);

    const body = {
      contents: [{
        parts: [{
          text: input
        }]
      }]
    };
    
    // console.log("Request body:", JSON.stringify(body, null, 2));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("Error generating commit message: ", data.error);
      return "";
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  },

  getPromptForSingleCommit: (
    diff,
    { commitType, customMessageConvention, language }
  ) => {
    const { commitMessageTemplate } = require('./commit-message.js');
    
    return commitMessageTemplate
      .replace('{language}', language)
      .replace('{commitType}', commitType ? ` with commit type '${commitType}'` : '')
      .replace('{customRules}', customMessageConvention ? `Apply these JSON formatted rules: ${customMessageConvention}.` : '')
      .replace('{diff}', diff);
  },

  getPromptForMultipleCommits: (
    diff,
    { commitType, customMessageConvention, numOptions, language }
  ) => {
    return (
      `Write a professional git commit message based on the diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      `Generate ${numOptions} options separated by ";".` +
      "For each option, use the present tense, return the full sentence and also commit type." +
      `${
        customMessageConvention
          ? ` Apply these JSON formatted rules: ${customMessageConvention}.`
          : ""
      }` +
      `\n\n${diff}`
    );
  },

  filterApi: async ({ prompt, numCompletion = 1, filterFee }) => {
    const numTokens = prompt.split(" ").length; // Approximate token count
    const fee =
      (numTokens / 1000) * FEE_PER_1K_TOKENS + FEE_COMPLETION * numCompletion;

    if (numTokens > MAX_TOKENS) {
      console.log(
        "The commit diff is too large for the Gemini API. Max 128k tokens."
      );
      return false;
    }

    // if (filterFee) {
    //   console.log(`This will cost you ~$${fee.toFixed(3)} for using the API.`);
    //   const answer = await inquirer.prompt([
    //     {
    //       type: "confirm",
    //       name: "continue",
    //       message: "Do you want to continue 💸?",
    //       default: true,
    //     },
    //   ]);
    //   if (!answer.continue) return false;
    // }

    return true;
  },
};

export default gemini;
