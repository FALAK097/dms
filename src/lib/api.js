import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const documentAPI = {
  upload: async (files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    const documents = response.data.documents || [];
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

    return response.data;
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
