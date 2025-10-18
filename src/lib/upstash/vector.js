import { Index } from "@upstash/vector";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { getEncoding } from "js-tiktoken";

export const vectorIndex = Index.fromEnv();

const embeddingModel = openai.embedding("text-embedding-ada-002");
const tokenEncoder = getEncoding("cl100k_base");

function generateChunks(input, maxTokens = 600, overlapTokens = 100) {
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

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return embeddings.map((vector, i) => ({
    content: chunks[i],
    embedding: vector,
  }));
}

export async function upsertEmbeddings(resourceId, content, documentName) {
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

    const toUpsert = chunkEmbeddings.map((chunk, i) => ({
      id: `${resourceId}-${i}`,
      vector: chunk.embedding,
      metadata: {
        resourceId,
        content: chunk.content,
        documentName,
        chunkIndex: i,
      },
    }));

    await vectorIndex.upsert(toUpsert);

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
