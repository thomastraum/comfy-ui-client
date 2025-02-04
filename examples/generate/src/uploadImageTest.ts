import { v4 as uuidv4 } from 'uuid';
import { ComfyUIClient } from 'comfy-ui-client';
import { readFile } from 'fs/promises';
import path from 'path';

// The ComfyUI server address
const SERVER_ADDRESS = 'thomastraum--example-comfyui-ui-dev.modal.run';

export const uploadImageTest = async (imagePath: string, overwrite: boolean = false): Promise<void> => {
  // Create client ID
  const clientId = uuidv4();

  // Create client
  const client = new ComfyUIClient(SERVER_ADDRESS, clientId);

  try {
    // Connect to server
    await client.connect();

    // Read image file
    const imageBuffer = await readFile(imagePath);
    
    // Get the original filename from the path
    const filename = path.basename(imagePath);

    // Upload image with original filename
    const result = await client.uploadImage(imageBuffer, filename, overwrite);
    console.log('Upload result:', result);
  } catch (error) {
    console.error('An error occurred during image upload:', error);
  } finally {
    // Disconnect
    await client.disconnect();
  }
}; 