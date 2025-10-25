import axios from "axios";
import { calculateFileHash } from "./utils";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const documentAPI = {
  upload: async (files, onUploadProgress) => {
    try {
      const uploadResults = [];
      const duplicates = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const contentHash = await calculateFileHash(file);

        const presignedResponse = await api.post("/documents/presigned-url", {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          contentHash,
        });

        if (presignedResponse.data.duplicate) {
          duplicates.push({
            fileName: file.name,
            existingDocument: presignedResponse.data.document,
          });
          continue;
        }

        const { presignedUrl, key, publicUrl } = presignedResponse.data;

        await axios.put(presignedUrl, file, {
          headers: {
            "Content-Type": file.type,
            "x-amz-acl": "public-read",
          },
          onUploadProgress: (progressEvent) => {
            if (onUploadProgress) {
              const percentCompleted = Math.round(
                ((i + progressEvent.loaded / progressEvent.total) /
                  files.length) *
                  100
              );
              onUploadProgress({ loaded: percentCompleted, total: 100 });
            }
          },
        });

        uploadResults.push({
          key,
          publicUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          contentHash,
        });
      }

      if (uploadResults.length === 0 && duplicates.length > 0) {
        return {
          success: true,
          documents: [],
          count: 0,
          duplicates,
          message: "All files were duplicates",
        };
      }

      const confirmResponse = await api.post("/documents/confirm", {
        files: uploadResults,
      });

      const documents = confirmResponse.data.documents || [];

      if (
        confirmResponse.data.failed &&
        confirmResponse.data.failed.length > 0
      ) {
        console.warn(
          "Some files failed to confirm:",
          confirmResponse.data.failed
        );
      }

      documents.forEach((doc) => {
        if (doc.id) {
          documentAPI.processDocument(doc.id).catch((error) => {
            console.error(
              `Failed to trigger processing for document ${doc.id}:`,
              error
            );
          });
        }
      });

      return {
        ...confirmResponse.data,
        duplicates: duplicates.length > 0 ? duplicates : undefined,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
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

export default api;
