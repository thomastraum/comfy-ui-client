import type { Prompt } from 'comfy-ui-client';

export const exampleTxt2ImgPrompt = (): Prompt => {
  const prompt: Prompt = {
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
        ckpt_name: 'v1-5-pruasdadned-emaonly.cpkt',
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
        text: 'masterpiece best quality girl',
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
        filename_prefix: 'ComfyUI',
        images: ['8', 0],
      },
    },
  };

  return prompt;
};

export const exampleTxt2ImgLoraPrompt = (): Prompt => {
  const prompt: Prompt = {
    '3': {
      inputs: {
        seed: 851616030078638,
        steps: 20,
        cfg: 8,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['10', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
      class_type: 'KSampler',
    },
    '4': {
      inputs: {
        ckpt_name: 'v1-5-pruned-emaonly.ckpt',
      },
      class_type: 'CheckpointLoaderSimple',
    },
    '5': {
      inputs: {
        width: 512,
        height: 512,
        batch_size: 1,
      },
      class_type: 'EmptyLatentImage',
    },
    '6': {
      inputs: {
        text: 'masterpiece best quality girl',
        clip: ['10', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '7': {
      inputs: {
        text: 'bad hands',
        clip: ['10', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '8': {
      inputs: {
        samples: ['3', 0],
        vae: ['4', 2],
      },
      class_type: 'VAEDecode',
    },
    '9': {
      inputs: {
        filename_prefix: 'ComfyUI',
        images: ['8', 0],
      },
      class_type: 'SaveImage',
    },
    '10': {
      inputs: {
        lora_name: 'epiNoiseoffset_v2.safetensors',
        strength_model: 1,
        strength_clip: 1,
        model: ['4', 0],
        clip: ['4', 1],
      },
      class_type: 'LoraLoader',
    },
  };

  return prompt;
};

export const complexPrompt = (): Prompt => {
  const prompt: Prompt = {
    3: {
      inputs: {
        seed: '2',
        steps: 30,
        cfg: 6,
        sampler_name: 'dpm_2_ancestral',
        scheduler: 'karras',
        denoise: 1,
        model: ['10', 0],
        positive: ['19', 0],
        negative: ['19', 1],
        latent_image: ['19', 2],
      },
      class_type: 'KSampler',
    },
    4: {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'v1-5-pruned-emaonly.cpkt',
      },
    },
    6: {
      inputs: {
        text:
          '80mm lens:\n' +
          'high quality, detailed, best qualityasdad asd asd asd asd ',
        clip: ['4', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    7: {
      inputs: {
        text:
          'blurry, noisy, messy, lowres, jpeg, artifacts, ill, distorted, malformed\n' +
          '\n' +
          '\n' +
          '\n' +
          '\n' +
          '\n' +
          '\n' +
          '\n' +
          'asdasda',
        clip: ['4', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    8: {
      inputs: { samples: ['3', 0], vae: ['4', 2] },
      class_type: 'VAEDecode',
    },
    9: {
      inputs: { filename_prefix: 'IPAdapter', images: ['8', 0] },
      class_type: 'SaveImage',
    },
    10: {
      inputs: {
        weight: 0.8,
        start_at: 0,
        end_at: 1,
        weight_type: 'standard',
        model: ['11', 0],
        ipadapter: ['11', 1],
        image: ['12', 0],
      },
      class_type: 'IPAdapter',
    },
    11: {
      inputs: { preset: 'STANDARD (medium strength)', model: ['4', 0] },
      class_type: 'IPAdapterUnifiedLoader',
    },
    12: {
      inputs: {
        upload: 'image',
        image: '64475c36ca275d6a770e4b7f33ab036e_20250225T105620.jpg',
      },
      class_type: 'LoadImage',
    },
    14: {
      inputs: { ipadapter_file: 'ip-adapter_sdxl_vit-h.safetensors' },
      class_type: 'IPAdapterModelLoader',
    },
    16: {
      inputs: {
        resolution: '704x1408 (0.5)',
        batch_size: 1,
        width_override: 0,
        height_override: 0,
      },
      class_type: 'SDXLEmptyLatentSizePicker+',
    },
    17: {
      inputs: {
        image: '3f31d66f9c24ba1f794766817b132577_20250225T105253.jpg',
        upload: 'image',
      },
      class_type: 'LoadImage',
    },
    19: {
      inputs: {
        noise_mask: true,
        positive: ['44', 0],
        negative: ['44', 1],
        vae: ['4', 2],
        pixels: ['38', 0],
        mask: ['21', 0],
      },
      class_type: 'InpaintModelConditioning',
    },
    20: {
      inputs: {
        image: 'shoe_test-v012-_puzzlematte_1_0100_20250213T172927.png',
        upload: 'image',
        image_type: 'beauty',
      },
      class_type: 'LoadImage',
    },
    21: {
      inputs: { channel: 'red', image: ['22', 0] },
      class_type: 'ImageToMask',
    },
    22: {
      inputs: { image: ['20', 0] },
      class_type: 'ImageInvert',
    },
    23: {
      inputs: { mask: ['21', 0] },
      class_type: 'MaskPreview+',
    },
    32: {
      inputs: {
        width: ['33', 0],
        height: ['34', 0],
        interpolation: 'bicubic',
        method: 'keep proportion',
        condition: 'always',
        multiple_of: 16,
        image: ['17', 0],
      },
      class_type: 'ImageResize+',
    },
    33: {
      inputs: { value: 1024 },
      class_type: 'INTConstant',
    },
    34: {
      inputs: { value: 2048 },
      class_type: 'INTConstant',
    },
    38: {
      inputs: { image: ['32', 0] },
      class_type: 'GetImageSizeAndCount',
    },
    39: {
      inputs: { images: ['38', 0] },
      class_type: 'PreviewImage',
    },
    44: {
      inputs: {
        strength: 0.8,
        start_percent: 0,
        end_percent: 0.326,
        positive: ['6', 0],
        negative: ['7', 0],
        control_net: ['45', 0],
        image: ['49', 0],
        vae: ['4', 2],
      },
      class_type: 'ControlNetApplyAdvanced',
    },
    45: {
      inputs: { control_net_name: 'diffusers_xl_depth_full.safetensors' },
      class_type: 'ControlNetLoader',
    },
    46: {
      inputs: {
        dimensions: '1024 x 1024  (square)',
        clip_scale: 2,
        batch_size: 1,
      },
      class_type: 'SDXL Empty Latent Image (rgthree)',
    },
    47: {
      inputs: { pixels: ['38', 0], vae: ['4', 2] },
      class_type: 'VAEEncode',
    },
    49: {
      inputs: {
        image: 'shoe_test-v012-_depth0100_20250213T172932.png',
        upload: 'image',
        image_type: 'depth',
      },
      class_type: 'LoadImage',
    },
  };
  return prompt;
};

export const exampleSdxlPrompt = (): Prompt => {
  const prompt: Prompt = {
    "3": {
      "inputs": {
        "seed": "1077510451584272",
        "steps": 25,
        "cfg": 6,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 0.77,
        "model": [
          "10",
          0
        ],
        "positive": [
          "19",
          0
        ],
        "negative": [
          "19",
          1
        ],
        "latent_image": [
          "19",
          2
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "KSampler",
        "visible": true
      }
    },
    "4": {
      "inputs": {
        "ckpt_name": "juggernautXL_versionXInpaint.safetensors"
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Load Checkpoint",
        "visible": true
      }
    },
    "6": {
      "inputs": {
        "text": "80mm lens: Macro photograph of a textured surface resembling shiny pinkish granules, showcasing intricate patterns and glimmers of light, high detail, focusing on the interplay of reflections and depth.\n\nhigh quality, detailed, best quality",
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Prompt)",
        "visible": true
      }
    },
    "7": {
      "inputs": {
        "text": "blurry, noisy, messy, lowres, jpeg, artifacts, ill, distorted, malformed",
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Prompt)",
        "visible": true
      }
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE Decode"
      }
    },
    "9": {
      "inputs": {
        "filename_prefix": "IPAdapter",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "Save Image"
      }
    },
    "10": {
      "inputs": {
        "weight": 0.55,
        "start_at": 0,
        "end_at": 1,
        "weight_type": "standard",
        "model": [
          "11",
          0
        ],
        "ipadapter": [
          "11",
          1
        ],
        "image": [
          "12",
          0
        ]
      },
      "class_type": "IPAdapter",
      "_meta": {
        "title": "IPAdapter",
        "visible": true
      }
    },
    "11": {
      "inputs": {
        "preset": "STANDARD (medium strength)",
        "model": [
          "4",
          0
        ]
      },
      "class_type": "IPAdapterUnifiedLoader",
      "_meta": {
        "title": "IPAdapter Unified Loader",
        "visible": true
      }
    },
    "12": {
      "inputs": {
        "image": "a3d5dd46507d81a89756164a300809ca_20250222T135435.jpg",
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": {
        "title": "style",
        "visible": true
      }
    },
    "14": {
      "inputs": {
        "ipadapter_file": "ip-adapter-plus-face_sd15.safetensors"
      },
      "class_type": "IPAdapterModelLoader",
      "_meta": {
        "title": "IPAdapter Model Loader"
      }
    },
    "17": {
      "inputs": {
        "image": "shoe_test-v013_0037_20250222T100934.png",
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": {
        "title": "bveauty",
        "visible": true
      }
    },
    "19": {
      "inputs": {
        "noise_mask": true,
        "positive": [
          "44",
          0
        ],
        "negative": [
          "44",
          1
        ],
        "vae": [
          "4",
          2
        ],
        "pixels": [
          "38",
          0
        ],
        "mask": [
          "21",
          0
        ]
      },
      "class_type": "InpaintModelConditioning",
      "_meta": {
        "title": "InpaintModelConditioning"
      }
    },
    "20": {
      "inputs": {
        "image": "shoe_test-v013-_puzzlematte_1_0037_20250222T100945.png",
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": {
        "title": "mask",
        "visible": true
      }
    },
    "21": {
      "inputs": {
        "channel": "red",
        "image": [
          "22",
          0
        ]
      },
      "class_type": "ImageToMask",
      "_meta": {
        "title": "Convert Image to Mask"
      }
    },
    "22": {
      "inputs": {
        "image": [
          "20",
          0
        ]
      },
      "class_type": "ImageInvert",
      "_meta": {
        "title": "Invert Image"
      }
    },
    "23": {
      "inputs": {
        "mask": [
          "21",
          0
        ]
      },
      "class_type": "MaskPreview+",
      "_meta": {
        "title": "🔧 Mask Preview"
      }
    },
    "32": {
      "inputs": {
        "width": [
          "33",
          0
        ],
        "height": [
          "34",
          0
        ],
        "interpolation": "bicubic",
        "method": "keep proportion",
        "condition": "always",
        "multiple_of": 16,
        "image": [
          "17",
          0
        ]
      },
      "class_type": "ImageResize+",
      "_meta": {
        "title": "🔧 Image Resize"
      }
    },
    "33": {
      "inputs": {
        "value": 1024
      },
      "class_type": "INTConstant",
      "_meta": {
        "title": "Width"
      }
    },
    "34": {
      "inputs": {
        "value": 2048
      },
      "class_type": "INTConstant",
      "_meta": {
        "title": "Height"
      }
    },
    "38": {
      "inputs": {
        "image": [
          "32",
          0
        ]
      },
      "class_type": "GetImageSizeAndCount",
      "_meta": {
        "title": "Get Image Size & Count"
      }
    },
    "39": {
      "inputs": {
        "images": [
          "38",
          0
        ]
      },
      "class_type": "PreviewImage",
      "_meta": {
        "title": "Preview Image"
      }
    },
    "44": {
      "inputs": {
        "strength": 0.78,
        "start_percent": 0,
        "end_percent": 0.6,
        "positive": [
          "6",
          0
        ],
        "negative": [
          "7",
          0
        ],
        "control_net": [
          "52",
          0
        ],
        "image": [
          "49",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "ControlNetApplyAdvanced",
      "_meta": {
        "title": "Apply ControlNet",
        "visible": true
      }
    },
    "47": {
      "inputs": {
        "pixels": [
          "38",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "VAEEncode",
      "_meta": {
        "title": "VAE Encode"
      }
    },
    "49": {
      "inputs": {
        "image": "shoe_test-v013-_depth0037-1_20250222T134930.png",
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": {
        "title": "depth",
        "visible": true
      }
    },
    "52": {
      "inputs": {
        "control_net_name": "diffusers_xl_depth_full.safetensors"
      },
      "class_type": "ControlNetLoader",
      "_meta": {
        "title": "Load ControlNet Model"
      }
    },
  };
  return prompt;
};
