"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ComfyUIClient: () => ComfyUIClient
});
module.exports = __toCommonJS(src_exports);

// src/client.ts
var import_promises = require("fs/promises");
var import_path = require("path");
var import_pino = __toESM(require("pino"));
var import_ws = __toESM(require("ws"));
var logger = (0, import_pino.default)({
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
  connect(timeoutMs = 2e4) {
    return new Promise((resolve, reject) => {
      const connectWebSocket = () => {
        const url = `wss://${this.serverAddress}/ws?clientId=${this.clientId}`;
        logger.info(`Connecting to url: ${url}`);
        this.ws = new import_ws.default(url, {
          perMessageDeflate: false
        });
        const timeoutId = setTimeout(() => {
          if (this.ws?.readyState !== import_ws.default.OPEN) {
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
  async getEmbeddings() {
    const res = await fetch(`http://${this.serverAddress}/embeddings`);
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getExtensions() {
    const res = await fetch(`http://${this.serverAddress}/extensions`);
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
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
      throw new Error(JSON.stringify(json));
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
      throw new Error(JSON.stringify(json));
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
      throw new Error(JSON.stringify(json));
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
    const res = await fetch(`http://${this.serverAddress}/upload/mask`, {
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
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getSystemStats() {
    const res = await fetch(`http://${this.serverAddress}/system_stats`);
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getPrompt() {
    const res = await fetch(`http://${this.serverAddress}/prompt`);
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getObjectInfo(nodeClass) {
    const res = await fetch(
      `http://${this.serverAddress}/object_info` + (nodeClass ? `/${nodeClass}` : "")
    );
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getHistory(promptId) {
    const res = await fetch(
      `http://${this.serverAddress}/history` + (promptId ? `/${promptId}` : "")
    );
    const json = await res.json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
  async getQueue() {
    const res = await fetch(`http://${this.serverAddress}/queue`);
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
        const outputPath = (0, import_path.join)(outputDir, img.image.filename);
        await (0, import_promises.writeFile)(outputPath, Buffer.from(arrayBuffer));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ComfyUIClient
});
