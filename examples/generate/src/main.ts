import { program } from 'commander';

import { txt2img } from './txt2img.js';
import {
  exampleTxt2ImgPrompt,
  exampleTxt2ImgLoraPrompt,
  complexPrompt,
  exampleSdxlPrompt,
} from './prompts.js';

program
  .name('comfy-ui-client')
  .description('CLI to comfy-ui-client')
  .version('0.0.0');

// Type guards to check the error shape
function isNodeError(
  error: unknown,
): error is { node_errors: Record<string, unknown> } {
  return typeof error === 'object' && error !== null && 'node_errors' in error;
}

function isComfyError(error: unknown): error is { error: string } {
  return typeof error === 'object' && error !== null && 'error' in error;
}

function handleError(error: unknown) {
  if (isNodeError(error)) {
    console.error('Node errors occurred:', error.node_errors);
  } else if (isComfyError(error)) {
    console.error('ComfyUI error:', error.error);
  } else {
    console.error('Unexpected error:', error);
  }
  process.exit(1);
}

program.command('txt2img').action(async () => {
  try {
    const prompt = await exampleTxt2ImgPrompt();
    await txt2img(prompt, './tmp');
  } catch (error) {
    handleError(error);
  }
});

program.command('lora').action(async () => {
  try {
    const prompt = await exampleTxt2ImgLoraPrompt();
    await txt2img(prompt, './tmp');
  } catch (error) {
    handleError(error);
  }
});

program.command('complex').action(async () => {
  try {
    const prompt = await complexPrompt();
    await txt2img(prompt, './tmp');
  } catch (error) {
    handleError(error);
  }
});

program.command('exampleSdxlPrompt').action(async () => {
  try {
    const prompt = await exampleSdxlPrompt();
    await txt2img(prompt, './tmp');
  } catch (error) {
    handleError(error);
  }
});


program.parse();
