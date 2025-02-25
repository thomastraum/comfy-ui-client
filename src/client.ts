import { writeFile } from 'fs/promises';
import { join } from 'path';

import pino from 'pino';
import WebSocket from 'ws';
import FormData from 'form-data';
import { Readable } from 'stream';

import type {
  EditHistoryRequest,
  FolderName,
  HistoryResult,
  ImageContainer,
  ImageRef,
  ImagesResponse,
  ObjectInfoResponse,
  Prompt,
  PromptQueueResponse,
  QueuePromptResult,
  QueueResponse,
  ResponseError,
  SystemStatsResponse,
  UploadImageResult,
  ViewMetadataResponse,
} from './types.js';

// TODO: Make logger customizable
const logger = pino({
  level: 'info',
});

// Add ClientOptions interface near the top with other imports
interface ClientOptions {
  useSSL?: boolean;
  protocol?: 'http' | 'https';
}

export class ComfyUIClient {
  public serverAddress: string;
  public clientId: string;
  protected options: ClientOptions;
  protected ws?: WebSocket;

  constructor(
    serverAddress: string,
    clientId: string,
    options: ClientOptions = {},
  ) {
    this.serverAddress = serverAddress;
    this.clientId = clientId;
    this.options = {
      useSSL: false,
      protocol: 'http',
      ...options,
    };
  }

  connect() {
    return new Promise<void>(async (resolve) => {
      if (this.ws) {
        await this.disconnect();
      }

      const wsProtocol = this.options.useSSL ? 'wss' : 'ws';
      const url = `${wsProtocol}://${this.serverAddress}/ws?clientId=${this.clientId}`;

        logger.info(`Connecting to url: ${url}`);

        this.ws = new WebSocket(url, {
          perMessageDeflate: false,
        });

        const timeoutId = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, timeoutMs);

        this.ws.on('open', () => {
          clearTimeout(timeoutId);
          logger.info('Connection open');
          resolve();
        });

        this.ws.on('close', () => {
          clearTimeout(timeoutId);
          logger.info('Connection closed');
        });

        this.ws.on('error', (err) => {
          clearTimeout(timeoutId);
          logger.error({ err }, 'WebSockets error');
          reject(err);
        });

        this.ws.on('message', (data, isBinary) => {
          if (isBinary) {
            logger.debug('Received binary data');
          } else {
            logger.debug('Received data: %s', data.toString());
          }
        });
      };

      if (this.ws) {
        this.disconnect().then(connectWebSocket).catch(reject);
      } else {
        connectWebSocket();
      }
    });
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  // Helper method for building API URLs
  protected getApiUrl(endpoint: string): string {
    const protocol = this.options.protocol || 'http';
    return `${protocol}://${this.serverAddress}${endpoint}`;
  }

  async getEmbeddings(): Promise<string[]> {
    const res = await fetch(this.getApiUrl('/embeddings'));

    const json: string[] | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getExtensions(): Promise<string[]> {
    const res = await fetch(this.getApiUrl('/extensions'));

    const json: string[] | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async queuePrompt(prompt: Prompt): Promise<QueuePromptResult> {
    const res = await fetch(this.getApiUrl('/prompt'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        client_id: this.clientId,
      }),
    });

    const json: QueuePromptResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async interrupt(): Promise<void> {
    const res = await fetch(this.getApiUrl('/interrupt'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const json: QueuePromptResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }
  }

  async editHistory(params: EditHistoryRequest): Promise<void> {
    const res = await fetch(this.getApiUrl('/history'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const json: QueuePromptResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }
  }

  private getImageMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'bmp':
        return 'image/bmp';
      default:
        return 'application/octet-stream';
    }
  }

  async uploadImage(
    image: Buffer,
    filename: string,
    overwrite?: boolean,
  ): Promise<UploadImageResult> {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const contentType = this.getImageMimeType(filename);
    
    // Construct multipart form-data manually
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`;
    body += `Content-Type: ${contentType}\r\n\r\n`;
    
    // Combine the body parts into a single buffer
    const bodyStart = Buffer.from(body, 'utf-8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    
    if (overwrite !== undefined) {
      body += `--${boundary}\r\n`;
      body += 'Content-Disposition: form-data; name="overwrite"\r\n\r\n';
      body += `${overwrite}\r\n`;
    }
    
    // Combine all parts into a single buffer
    const requestBody = Buffer.concat([
      bodyStart,
      image,
      bodyEnd
    ]);

    const res = await fetch(this.getApiUrl('/upload/image'), {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}: ${res.statusText}`);
    }

    const json: UploadImageResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async uploadMask(
    image: Buffer,
    filename: string,
    originalRef: ImageRef,
    overwrite?: boolean,
  ): Promise<UploadImageResult> {
    const formData = new FormData();
    formData.append('image', new Blob([image]), filename);
    formData.append('originalRef', JSON.stringify(originalRef));

    if (overwrite !== undefined) {
      formData.append('overwrite', overwrite.toString());
    }

    const res = await fetch(this.getApiUrl('/upload/mask'), {
      method: 'POST',
      body: formData as unknown as BodyInit,
    });

    const json: UploadImageResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getImage(
    filename: string,
    subfolder: string,
    type: string,
  ): Promise<Blob> {
    const res = await fetch(
      this.getApiUrl('/view?') +
        new URLSearchParams({
          filename,
          subfolder,
          type,
        }),
    );

    const blob = await res.blob();
    return blob;
  }

  async viewMetadata(
    folderName: FolderName,
    filename: string,
  ): Promise<ViewMetadataResponse> {
    const res = await fetch(
      this.getApiUrl('/view_metadata/') + folderName + '?filename=' + filename,
    );

    const json: ViewMetadataResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getSystemStats(): Promise<SystemStatsResponse> {
    const res = await fetch(this.getApiUrl('/system_stats'));

    const json: SystemStatsResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getPrompt(): Promise<PromptQueueResponse> {
    const res = await fetch(this.getApiUrl('/prompt'));

    const json: PromptQueueResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getObjectInfo(nodeClass?: string): Promise<ObjectInfoResponse> {
    const res = await fetch(
      this.getApiUrl('/object_info') + (nodeClass ? '/' + nodeClass : ''),
    );

    const json: ObjectInfoResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getHistory(promptId?: string): Promise<HistoryResult> {
    const res = await fetch(
      this.getApiUrl('/history') + (promptId ? '/' + promptId : ''),
    );

    const json: HistoryResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getQueue(): Promise<QueueResponse> {
    const res = await fetch(this.getApiUrl('/queue'));

    const json: QueueResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async saveImages(response: ImagesResponse, outputDir: string) {
    for (const nodeId of Object.keys(response)) {
      for (const img of response[nodeId]) {
        const arrayBuffer = await img.blob.arrayBuffer();

        const outputPath = join(outputDir, img.image.filename);
        await writeFile(outputPath, Buffer.from(arrayBuffer));
      }
    }
  }

  async getImages(prompt: Prompt): Promise<ImagesResponse> {
    if (!this.ws) {
      throw new Error(
        'WebSocket client is not connected. Please call connect() before interacting.',
      );
    }

    const queue = await this.queuePrompt(prompt);
    const promptId = queue.prompt_id;

    return new Promise<ImagesResponse>((resolve, reject) => {
      const outputImages: ImagesResponse = {};

      const onMessage = async (data: WebSocket.RawData, isBinary: boolean) => {
        // Previews are binary data
        if (isBinary) {
          return;
        }

        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'executing') {
            const messageData = message.data;
            if (!messageData.node) {
              const donePromptId = messageData.prompt_id;

              logger.info(`Done executing prompt (ID: ${donePromptId})`);

              // Execution is done
              if (messageData.prompt_id === promptId) {
                // Get history
                const historyRes = await this.getHistory(promptId);
                const history = historyRes[promptId];

                // Populate output images
                for (const nodeId of Object.keys(history.outputs)) {
                  const nodeOutput = history.outputs[nodeId];
                  if (nodeOutput.images) {
                    const imagesOutput: ImageContainer[] = [];
                    for (const image of nodeOutput.images) {
                      const blob = await this.getImage(
                        image.filename,
                        image.subfolder,
                        image.type,
                      );
                      imagesOutput.push({
                        blob,
                        image,
                      });
                    }

                    outputImages[nodeId] = imagesOutput;
                  }
                }

                // Remove listener
                this.ws?.off('message', onMessage);
                return resolve(outputImages);
              }
            }
          }
        } catch (err) {
          return reject(err);
        }
      };

      // Add listener
      this.ws?.on('message', onMessage);
    });
  }
}
