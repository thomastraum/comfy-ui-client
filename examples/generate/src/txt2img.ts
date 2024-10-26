import { v4 as uuidv4 } from 'uuid';
import { ComfyUIClient } from 'comfy-ui-client';
import type { Prompt } from 'comfy-ui-client';

// The ComfyUI server address
// const SERVER_ADDRESS = '127.0.0.1:8188';
const SERVER_ADDRESS = 'tm-8.tail95eb8.ts.net:8188';

export const txt2img = async (
  prompt: Prompt,
  outputDir: string,
): Promise<void> => {
  // Create client ID
  const clientId = uuidv4();

  // Create client
  const client = new ComfyUIClient(SERVER_ADDRESS, clientId);

  try {
    // Connect to server
    await client.connect();

    // Get images
    const images = await client.getImages(prompt);

    // Save images to file
    await client.saveImages(images, outputDir);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Disconnect
    await client.disconnect();
  }
};
