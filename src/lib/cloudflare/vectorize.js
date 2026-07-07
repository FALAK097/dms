import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@/lib/ai/google";
import { getEncoding } from "js-tiktoken";

const geminiEmbeddingModel = google.embedding("gemini-embedding-2");
const openaiEmbeddingModel = openai.embedding("text-embedding-3-small");
const tokenEncoder = getEncoding("cl100k_base");

async function createEmbedding(values, options = {}) {
  try {
    return await embedMany({ model: geminiEmbeddingModel, values, ...options });
  } catch {
    return await embedMany({ model: openaiEmbeddingModel, values, ...options });
  }
}

async function createSingleEmbedding(value, options = {}) {
  try {
    return await embed({ model: geminiEmbeddingModel, value, ...options });
  } catch {
    return await embed({ model: openaiEmbeddingModel, value, ...options });
  }
}

function cloudflareWorkerUrl() {
  const workerUrl = process.env.CLOUDFLARE_QUEUE_WORKER_URL;

  if (!workerUrl) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_URL is not configured");
  }

  return workerUrl;
}

async function vectorizeRequest(path, body) {
  const token = process.env.CLOUDFLARE_QUEUE_WORKER_SECRET;

  if (!token) {
    throw new Error("CLOUDFLARE_QUEUE_WORKER_SECRET is not configured");
  }

  const response = await fetch(new URL(`/vectorize${path}`, cloudflareWorkerUrl()), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    const details = data?.error || response.statusText;
    throw new Error(`Cloudflare Vectorize request failed: ${details}`);
  }

  return data?.result || data;
}

function generateChunks(input, maxTokens = 800, overlapTokens = 150) {
  const text = input.trim();

  if (!text) {
    return [];
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const chunks = [];
  let currentChunk = [];
  let currentTokenCount = 0;

  for (const sentence of sentences) {
    const sentenceTokens = tokenEncoder.encode(sentence);
    const sentenceTokenCount = sentenceTokens.length;

    if (sentenceTokenCount > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentTokenCount = 0;
      }

      const words = sentence.split(/\s+/);
      let wordChunk = [];
      let wordTokenCount = 0;

      for (const word of words) {
        const wordTokens = tokenEncoder.encode(word);
        const wordTokenLength = wordTokens.length;

        if (wordTokenCount + wordTokenLength > maxTokens) {
          if (wordChunk.length > 0) {
            chunks.push(wordChunk.join(" "));
          }
          wordChunk = [word];
          wordTokenCount = wordTokenLength;
        } else {
          wordChunk.push(word);
          wordTokenCount += wordTokenLength;
        }
      }

      if (wordChunk.length > 0) {
        chunks.push(wordChunk.join(" "));
      }
      continue;
    }

    if (currentTokenCount + sentenceTokenCount > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
      }

      if (overlapTokens > 0 && currentChunk.length > 0) {
        let overlapText = [];
        let overlapCount = 0;

        for (let i = currentChunk.length - 1; i >= 0; i--) {
          const tokens = tokenEncoder.encode(currentChunk[i]);
          if (overlapCount + tokens.length <= overlapTokens) {
            overlapText.unshift(currentChunk[i]);
            overlapCount += tokens.length;
          } else {
            break;
          }
        }

        currentChunk = [...overlapText, sentence];
        currentTokenCount = overlapCount + sentenceTokenCount;
      } else {
        currentChunk = [sentence];
        currentTokenCount = sentenceTokenCount;
      }
    } else {
      currentChunk.push(sentence);
      currentTokenCount += sentenceTokenCount;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}

async function generateEmbeddings(value) {
  const chunks = generateChunks(value);

  if (chunks.length === 0) {
    return [];
  }

  const { embeddings } = await createEmbedding(chunks);

  return embeddings.map((vector, i) => ({
    content: chunks[i],
    embedding: vector,
  }));
}

async function generateEmbedding(value) {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await createSingleEmbedding(input);
  return embedding;
}

export async function upsertEmbeddings(
  resourceId,
  content,
  documentName,
  userId
) {
  try {
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        chunkCount: 0,
        error: "No content to embed",
      };
    }

    const chunkEmbeddings = await generateEmbeddings(content);

    if (chunkEmbeddings.length === 0) {
      return {
        success: false,
        chunkCount: 0,
        error: "Failed to generate chunks",
      };
    }

    const vectors = chunkEmbeddings.map((chunk, i) => ({
      id: `${resourceId}-${i}`,
      values: chunk.embedding,
      namespace: userId,
      metadata: {
        resourceId,
        content: chunk.content,
        documentName,
        chunkIndex: i,
        userId,
      },
    }));

    for (let i = 0; i < vectors.length; i += 1000) {
      await vectorizeRequest("/upsert", {
        vectors: vectors.slice(i, i + 1000),
      });
    }

    return {
      success: true,
      chunkCount: chunkEmbeddings.length,
    };
  } catch (error) {
    console.error("Error upserting embeddings:", error);
    return {
      success: false,
      chunkCount: 0,
      error: error.message || "Failed to upsert embeddings",
    };
  }
}

export async function findRelevantContent(
  query,
  userId,
  docId = null,
  topK = 5
) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const filter = docId ? { resourceId: docId } : undefined;

    const results = await vectorizeRequest("/query", {
      vector: queryEmbedding,
      topK,
      namespace: userId,
      returnMetadata: "all",
      returnValues: false,
      ...(filter && { filter }),
    });

    const matches = results?.matches || [];
    const scoreThreshold = docId ? 0 : 0.6;

    return matches
      .filter(
        (result) =>
          result.score >= scoreThreshold &&
          result.metadata?.content &&
          result.metadata.content.trim().length > 0
      )
      .map((result) => ({
        content: result.metadata.content,
        documentName: result.metadata?.documentName || "Unknown",
        chunkIndex: result.metadata?.chunkIndex ?? 0,
        score: result.score || 0,
        resourceId: result.metadata?.resourceId || "",
      }));
  } catch (error) {
    console.error("Error finding relevant content:", error);
    return [];
  }
}

export async function deleteEmbeddings(resourceId, chunkCount) {
  if (!chunkCount || chunkCount < 1) {
    return;
  }

  const ids = Array.from({ length: chunkCount }, (_, i) => `${resourceId}-${i}`);

  for (let i = 0; i < ids.length; i += 1000) {
    await vectorizeRequest("/delete_by_ids", {
      ids: ids.slice(i, i + 1000),
    });
  }
}
