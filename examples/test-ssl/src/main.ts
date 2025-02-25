import { v4 as uuidv4 } from 'uuid';
import { ComfyUIClient } from 'comfy-ui-client';

const TEST_SERVER = 'tm-8-ubuntu.tail95eb8.ts.net'; // Replace with your secure ComfyUI server
const TEST_PROMPT = {
  '3': {
    class_type: 'KSampler',
    inputs: {
      cfg: 8,
      denoise: 1,
      latent_image: ['5', 0],
      model: ['4', 0],
      negative: ['7', 0],
      positive: ['6', 0],
      sampler_name: 'euler',
      scheduler: 'normal',
      seed: 8566257,
      steps: 20,
    },
  },
  '4': {
    class_type: 'CheckpointLoaderSimple',
    inputs: {
      ckpt_name: 'v1-5-pruned-emaonly.cpkt',
    },
  },
  '5': {
    class_type: 'EmptyLatentImage',
    inputs: {
      batch_size: 1,
      height: 512,
      width: 512,
    },
  },
  '6': {
    class_type: 'CLIPTextEncode',
    inputs: {
      clip: ['4', 1],
      text: 'test image',
    },
  },
  '7': {
    class_type: 'CLIPTextEncode',
    inputs: {
      clip: ['4', 1],
      text: 'bad hands',
    },
  },
  '8': {
    class_type: 'VAEDecode',
    inputs: {
      samples: ['3', 0],
      vae: ['4', 2],
    },
  },
  '9': {
    class_type: 'SaveImage',
    inputs: {
      filename_prefix: 'TestSSL',
      images: ['8', 0],
    },
  },
};

async function testSSLConnection() {
  try {
    // Create client with SSL options
    const client = new ComfyUIClient(TEST_SERVER, uuidv4(), {
      useSSL: true,
      protocol: 'https',
    });

    console.log('Connecting to server...');
    await client.connect();
    console.log('Connected successfully!');

    // Test basic API call
    console.log('Testing API call (getSystemStats)...');
    const stats = await client.getSystemStats();
    console.log('System stats:', stats);

    // Test WebSocket communication
    console.log('Testing WebSocket communication (generating image)...');
    const images = await client.getImages(TEST_PROMPT);
    console.log('Images generated successfully!');

    // Save the test images
    await client.saveImages(images, './output');
    console.log('Images saved to ./output');

    await client.disconnect();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSSLConnection();
