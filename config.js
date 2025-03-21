import { getArgs } from './helpers.js';


export const args = getArgs();

/**
 * possible values: 'openai' or 'ollama'
 */
export const AI_PROVIDER = args.PROVIDER ||'gemini';


/**
 * name of the model to use.
 * can use this to switch between different local models.
 */
export const MODEL = 'gemini-2.0-flash';
