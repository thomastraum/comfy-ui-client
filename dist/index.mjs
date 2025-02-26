// src/client.ts
import { writeFile } from "fs/promises";
import { join } from "path";
import pino from "pino";
import WebSocket from "ws";
var logger = pino({
  level: "info"
});
var ComfyUIClient = class {
  serverAddress;
  clientId;
  ws;
  constructor(serverAddress, clientId) {
    this.serverAddress = serverAddress;
    this.clientId = clientId;
  }
  connect() {
    return new Promise(async (resolve) => {
      if (this.ws) {
        await this.disconnect();
      }
      const url = `ws://${this.serverAddress}/ws?clientId=${this.clientId}`;
      logger.info(`Connecting to url: ${url}`);
      this.ws = new WebSocket(url, {
        perMessageDeflate: false
      });
      this.ws.on("open", () => {
        logger.info("Connection open");
        resolve();
      });
      this.ws.on("close", () => {
        logger.info("Connection closed");
      });
      this.ws.on("error", (err) => {
        logger.error({ err }, "WebSockets error");
      });
      this.ws.on("message", (data, isBinary) => {
        if (isBinary) {
          logger.debug("Received binary data");
        } else {
          logger.debug("Received data: %s", data.toString());
        }
      });
    });
  }
  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = void 0;
    }
  }
  async getEmbeddings() {
    const res = await fetch(`http://${this.serverAddress}/embeddings`);
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getExtensions() {
    const res = await fetch(`http://${this.serverAddress}/extensions`);
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async queuePrompt(prompt) {
    const res = await fetch(`http://${this.serverAddress}/prompt`, {
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
      throw json;
    }
    logger.info("Queue prompt result: %s", JSON.stringify(json));
    if ("node_errors" in json && Object.keys(json.node_errors).length > 0) {
      throw json;
    }
    return json;
  }
  async interrupt() {
    const res = await fetch(`http://${this.serverAddress}/interrupt`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
  }
  async editHistory(params) {
    const res = await fetch(`http://${this.serverAddress}/history`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
  }
  async uploadImage(image, filename, overwrite) {
    const formData = new FormData();
    formData.append("image", new Blob([image]), filename);
    if (overwrite !== void 0) {
      formData.append("overwrite", overwrite.toString());
    }
    const res = await fetch(`http://${this.serverAddress}/upload/image`, {
      method: "POST",
      body: formData
    });
    const json = await res.json();
    if ("error" in json) {
      throw json;
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
    const res = await fetch(`http://${this.serverAddress}/upload/mask`, {
      method: "POST",
      body: formData
    });
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getImage(filename, subfolder, type) {
    const res = await fetch(
      `http://${this.serverAddress}/view?` + new URLSearchParams({
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
      `http://${this.serverAddress}/view_metadata/${folderName}?filename=${filename}`
    );
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getSystemStats() {
    const res = await fetch(`http://${this.serverAddress}/system_stats`);
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getPrompt() {
    const res = await fetch(`http://${this.serverAddress}/prompt`);
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getObjectInfo(nodeClass) {
    const res = await fetch(
      `http://${this.serverAddress}/object_info` + (nodeClass ? `/${nodeClass}` : "")
    );
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getHistory(promptId) {
    const res = await fetch(
      `http://${this.serverAddress}/history` + (promptId ? `/${promptId}` : "")
    );
    const json = await res.json();
    if ("error" in json) {
      throw json;
    }
    return json;
  }
  async getQueue() {
    const res = await fetch(`http://${this.serverAddress}/queue`);
    const json = await res.json();
    if ("error" in json) {
      throw json;
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
