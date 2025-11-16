import axios from "axios";
import { calculateFileHash } from "./utils";
import { openDB } from "idb";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const DB_NAME = "dms-upload-queue";
const DB_VERSION = 1;
const STORE_NAME = "queue";

class UploadQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.listeners = [];
    this.db = null;
    this.initialized = false;
    this.abortControllers = new Map();
  }

  async init() {
    if (this.initialized) return;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { autoIncrement: true });
          }
        },
      });

      const storedItems = await this.db.getAll(STORE_NAME);

      if (storedItems && storedItems.length > 0) {
        this.queue = storedItems.map((item) => ({
          ...item,
          onProgress: null,
        }));

        this.notifyListeners();

        if (!this.processing) {
          this.processQueue();
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
      this.initialized = true;
    }
  }

  async persistQueue() {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      await tx.objectStore(STORE_NAME).clear();

      for (const item of this.queue) {
        const serializableItem = {
          file: item.file,
          addedAt: item.addedAt,
          status: item.status,
        };
        await tx.objectStore(STORE_NAME).add(serializableItem);
      }

      await tx.done;
      console.log(`[Queue] Persisted ${this.queue.length} items to IndexedDB`);
    } catch (error) {
      console.error("Failed to persist queue:", error);
    }
  }

  async addToQueue(files, onProgress) {
    await this.init();

    const newItems = files.map((file) => ({
      file,
      onProgress,
      addedAt: Date.now(),
      status: "queued",
    }));

    this.queue.push(...newItems);
    await this.persistQueue();
    this.notifyListeners();

    if (!this.processing) {
      this.processQueue();
    }
  }

  async removeFromQueue(index) {
    const item = this.queue[index];
    this.queue.splice(index, 1);
    await this.persistQueue();
    this.notifyListeners();
  }

  cancelUpload(fileName) {
    const controller = this.abortControllers.get(fileName);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(fileName);
    }

    const index = this.queue.findIndex((item) => item.file?.name === fileName);
    if (index !== -1) {
      this.removeFromQueue(index);
    }
  }

  async clearQueue() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    this.queue = [];
    await this.persistQueue();
    this.notifyListeners();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    await this.init();
    this.processing = true;
    this.notifyListeners();

    while (this.queue.length > 0) {
      const item = this.queue[0];

      if (!item.file) {
        console.warn("[Queue] Item has no file, removing:", item);
        await this.removeFromQueue(0);
        continue;
      }

      const abortController = new AbortController();
      this.abortControllers.set(item.file.name, abortController);
      try {
        const contentHash = await calculateFileHash(item.file);

        let presignedResponse;
        let retryCount = 0;
        const maxRetries = 5;

        while (retryCount <= maxRetries) {
          try {
            presignedResponse = await api.post("/documents/presigned-url", {
              fileName: item.file.name,
              fileType: item.file.type,
              fileSize: item.file.size,
              contentHash,
            });
            break;
          } catch (error) {
            if (error.response?.status === 429 && retryCount < maxRetries) {
              const retryAfter = parseInt(
                error.response.headers["retry-after"] || "60",
                10
              );

              if (item.onProgress) {
                item.onProgress({
                  fileName: item.file.name,
                  status: "waiting",
                  message: `Rate limit reached. Retrying in ${retryAfter}s...`,
                  queueLength: this.queue.length,
                });
              }

              await new Promise((resolve) =>
                setTimeout(resolve, retryAfter * 1000)
              );
              retryCount++;
            } else {
              throw error;
            }
          }
        }

        if (presignedResponse.data.duplicate) {
          if (item.onProgress) {
            item.onProgress({
              fileName: item.file.name,
              status: "duplicate",
              document: presignedResponse.data.document,
            });
          }
          await this.removeFromQueue(0);
          continue;
        }

        const { presignedUrl, key, publicUrl } = presignedResponse.data;

        if (item.onProgress) {
          item.onProgress({
            fileName: item.file.name,
            status: "uploading",
            progress: 0,
            queueLength: this.queue.length,
          });
        }

        await axios.put(presignedUrl, item.file, {
          headers: {
            "Content-Type": item.file.type,
            "x-amz-acl": "public-read",
          },
          signal: abortController.signal,
          onUploadProgress: (progressEvent) => {
            if (item.onProgress) {
              const percent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              item.onProgress({
                fileName: item.file.name,
                status: "uploading",
                progress: percent,
                queueLength: this.queue.length,
              });
            }
          },
        });

        this.abortControllers.delete(item.file.name);

        const confirmResponse = await api.post("/documents/confirm", {
          files: [
            {
              key,
              publicUrl,
              fileName: item.file.name,
              fileType: item.file.type,
              fileSize: item.file.size,
              contentHash,
            },
          ],
        });

        const document = confirmResponse.data.documents?.[0];
        if (document?.id) {
          documentAPI.processDocument(document.id).catch((error) => {
            console.error(
              `Failed to trigger processing for document ${document.id}:`,
              error
            );
          });
        }

        if (item.onProgress) {
          item.onProgress({
            fileName: item.file.name,
            status: "completed",
            document,
            queueLength: this.queue.length - 1,
          });
        }

        await this.removeFromQueue(0);
      } catch (error) {
        console.error(`Upload failed for ${item.file.name}:`, error);

        this.abortControllers.delete(item.file?.name);

        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          if (item.onProgress) {
            item.onProgress({
              fileName: item.file.name,
              status: "cancelled",
              queueLength: this.queue.length,
            });
          }
        } else {
          if (item.onProgress) {
            item.onProgress({
              fileName: item.file.name,
              status: "failed",
              error: error.message,
              queueLength: this.queue.length,
            });
          }
        }

        await this.removeFromQueue(0);
      }
    }

    this.processing = false;
    await this.persistQueue();
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach((listener) => {
      listener({
        queueLength: this.queue.length,
        processing: this.processing,
      });
    });
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
    };
  }
}

const uploadQueue = new UploadQueue();

export const documentAPI = {
  upload: async (files, onUploadProgress) => {
    return new Promise((resolve) => {
      const results = {
        completed: [],
        duplicates: [],
        failed: [],
        queued: 0,
      };

      let processedCount = 0;

      const progressHandler = (update) => {
        if (update.status === "completed") {
          results.completed.push(update.document);
          processedCount++;
        } else if (update.status === "duplicate") {
          results.duplicates.push({
            fileName: update.fileName,
            existingDocument: update.document,
          });
          processedCount++;
        } else if (update.status === "failed") {
          results.failed.push({
            fileName: update.fileName,
            error: update.error,
          });
          processedCount++;
        }

        if (onUploadProgress) {
          onUploadProgress({
            ...update,
            completed: results.completed.length,
            total: files.length,
            processedCount,
          });
        }

        if (processedCount === files.length) {
          resolve({
            success: true,
            documents: results.completed,
            count: results.completed.length,
            duplicates:
              results.duplicates.length > 0 ? results.duplicates : undefined,
            failed: results.failed.length > 0 ? results.failed : undefined,
            queued: results.queued,
          });
        }
      };

      uploadQueue.addToQueue(files, progressHandler);
      results.queued = files.length;
    });
  },

  getUploadQueueStatus: async () => {
    await uploadQueue.init();
    return uploadQueue.getStatus();
  },

  clearUploadQueue: async () => {
    await uploadQueue.clearQueue();
  },

  cancelUpload: (fileName) => {
    uploadQueue.cancelUpload(fileName);
  },

  subscribeToQueue: (listener) => {
    return uploadQueue.subscribe(listener);
  },

  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get(`/documents?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  processDocument: async (documentId) => {
    const response = await api.post("/documents/process", { documentId });
    return response.data;
  },

  getDownloadUrl: async (documentId) => {
    const response = await api.get(
      `/documents/download-url?documentId=${documentId}`
    );
    return response.data;
  },
};

export const conversationAPI = {
  getAll: async () => {
    const response = await api.get("/conversations");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  create: async () => {
    const response = await api.post("/conversations");
    return response.data;
  },

  updateTitle: async (id, title) => {
    const response = await api.patch(`/conversations/${id}`, { title });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },
};

export const dropboxAPI = {
  syncNow: async () => {
    const response = await api.post("/dropbox/sync");
    return response.data;
  },
  selectFolder: async (folderPath) => {
    const response = await api.post("/dropbox/folder", { folderPath });
    return response.data;
  },
};

export default api;
