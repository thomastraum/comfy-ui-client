import { program } from 'commander';
import { join } from 'path';

import { txt2img } from './txt2img.js';
import { uploadImageTest } from './uploadImageTest.js';
import { exampleTxt2ImgPrompt } from './prompts.js';

program
  .name('comfy-ui-client')
  .description('CLI to comfy-ui-client')
  .version('0.0.0');

program
  .command('txt2img')
  .action(async () => {
    await txt2img(exampleTxt2ImgPrompt(), './tmp');
  });

program
  .command('upload-image')
  .option('-i, --image <path>', 'Path to the image file', './tmp/ComfyUI_00001_.png')
  .option('-o, --overwrite', 'Overwrite existing image', false)
  .action(async (options) => {
    const imagePath = join(process.cwd(), options.image);
    await uploadImageTest(imagePath, options.overwrite);
  });

program.parse();
