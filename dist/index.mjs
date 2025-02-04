// src/client.ts
import { writeFile } from "fs/promises";
import { join } from "path";
import pino from "pino";
import WebSocket from "ws";
import FormData from "form-data";
var logger = pino({
  level: "info"
});
var ComfyUIClient = class {
  serverAddress;
  clientId;
  protocol = "http:";
  // Default to http
  ws;
  constructor(serverAddress, clientId) {
    this.serverAddress = serverAddress;
    this.clientId = clientId;
  }
  connect(timeoutMs = 2e4) {
    return new Promise((resolve, reject) => {
      const connectWebSocket = () => {
        this.protocol = this.serverAddress.includes("localhost") || this.serverAddress.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/) ? "http:" : "https:";
        const wsProtocol = this.protocol === "https:" ? "wss:" : "ws:";
        const url = `${wsProtocol}//${this.serverAddress}/ws?clientId=${this.clientId}`;
        logger.info(`Connecting to url: ${url}`);
        this.ws = new WebSocket(url, {
          perMessageDeflate: false
        });
        const timeoutId = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, timeoutMs);
        this.ws.on("open", () => {
          clearTimeout(timeoutId);
          logger.info("Connection open");
          resolve();
        });
        this.ws.on("close", () => {
          clearTimeout(timeoutId);
          logger.info("Connection closed");
        });
        this.ws.on("error", (err) => {
          clearTimeout(timeoutId);
          logger.error({ err }, "WebSockets error");
          reject(err);
        });
        this.ws.on("message", (data, isBinary) => {
          if (isBinary) {
            logger.debug("Received binary data");
          } else {
            logger.debug("Received data: %s", data.toString());
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
      this.ws = void 0;
    }
  }
  getHttpUrl(path) {
    return `${this.protocol}//${this.serverAddress}${path}`;
  }
  async getEmbeddings() {
    const res = await fetch(this.getHttpUrl("/embeddings"));
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getExtensions() {
    const res = await fetch(this.getHttpUrl("/extensions"));
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async queuePrompt(prompt) {
    const res = await fetch(this.getHttpUrl("/prompt"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        client_id: this.clientId
      })
    });
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async interrupt() {
    const res = await fetch(this.getHttpUrl("/interrupt"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
  }
  async editHistory(params) {
    const res = await fetch(this.getHttpUrl("/history"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
  }
  getImageMimeType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "bmp":
        return "image/bmp";
      default:
        return "application/octet-stream";
    }
  }
  async uploadImage(image, filename, overwrite) {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const contentType = this.getImageMimeType(filename);
    let body = "";
    body += `--${boundary}\r
`;
    body += `Content-Disposition: form-data; name="image"; filename="${filename}"\r
`;
    body += `Content-Type: ${contentType}\r
\r
`;
    const bodyStart = Buffer.from(body, "utf-8");
    const bodyEnd = Buffer.from(`\r
--${boundary}--\r
`, "utf-8");
    if (overwrite !== void 0) {
      body += `--${boundary}\r
`;
      body += 'Content-Disposition: form-data; name="overwrite"\r\n\r\n';
      body += `${overwrite}\r
`;
    }
    const requestBody = Buffer.concat([
      bodyStart,
      image,
      bodyEnd
    ]);
    const res = await fetch(this.getHttpUrl("/upload/image"), {
      method: "POST",
      body: requestBody,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      }
    });
    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async uploadMask(image, filename, originalRef, overwrite) {
    const formData = new FormData();
    formData.append("image", new Blob([image]), filename);
    formData.append("originalRef", JSON.stringify(originalRef));
    if (overwrite !== void 0) {
      formData.append("overwrite", overwrite.toString());
    }
    const res = await fetch(this.getHttpUrl("/upload/mask"), {
      method: "POST",
      body: formData
    });
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getImage(filename, subfolder, type) {
    const res = await fetch(
      this.getHttpUrl("/view?") + new URLSearchParams({
        filename,
        subfolder,
        type
      })
    );
    const blob = await res.blob();
    return blob;
  }
  async viewMetadata(folderName, filename) {
    const res = await fetch(
      this.getHttpUrl("/view_metadata/") + folderName + "?filename=" + filename
    );
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getSystemStats() {
    const res = await fetch(this.getHttpUrl("/system_stats"));
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getPrompt() {
    const res = await fetch(this.getHttpUrl("/prompt"));
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getObjectInfo(nodeClass) {
    const res = await fetch(
      this.getHttpUrl("/object_info") + (nodeClass ? "/" + nodeClass : "")
    );
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getHistory(promptId) {
    const res = await fetch(
      this.getHttpUrl("/history") + (promptId ? "/" + promptId : "")
    );
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getQueue() {
    const res = await fetch(this.getHttpUrl("/queue"));
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async saveImages(response, outputDir) {
    for (const nodeId of Object.keys(response)) {
      for (const img of response[nodeId]) {
        const arrayBuffer = await img.blob.arrayBuffer();
        const outputPath = join(outputDir, img.image.filename);
        await writeFile(outputPath, Buffer.from(arrayBuffer));
      }
    }
  }
  async getImages(prompt) {
    if (!this.ws) {
      throw new Error(
        "WebSocket client is not connected. Please call connect() before interacting."
      );
    }
    const queue = await this.queuePrompt(prompt);
    const promptId = queue.prompt_id;
    return new Promise((resolve, reject) => {
      const outputImages = {};
      const onMessage = async (data, isBinary) => {
        if (isBinary) {
          return;
        }
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "executing") {
            const messageData = message.data;
            if (!messageData.node) {
              const donePromptId = messageData.prompt_id;
              logger.info(`Done executing prompt (ID: ${donePromptId})`);
              if (messageData.prompt_id === promptId) {
                const historyRes = await this.getHistory(promptId);
                const history = historyRes[promptId];
                for (const nodeId of Object.keys(history.outputs)) {
                  const nodeOutput = history.outputs[nodeId];
                  if (nodeOutput.images) {
                    const imagesOutput = [];
                    for (const image of nodeOutput.images) {
                      const blob = await this.getImage(
                        image.filename,
                        image.subfolder,
                        image.type
                      );
                      imagesOutput.push({
                        blob,
                        image
                      });
                    }
                    outputImages[nodeId] = imagesOutput;
                  }
                }
                this.ws?.off("message", onMessage);
                return resolve(outputImages);
              }
            }
          }
        } catch (err) {
          return reject(err);
        }
      };
      this.ws?.on("message", onMessage);
    });
  }
};
export {
  ComfyUIClient
};
