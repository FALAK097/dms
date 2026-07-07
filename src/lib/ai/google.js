import { createGoogle } from "@ai-sdk/google";

export const google = createGoogle({
  apiKey: process.env.GEMINI_API_KEY,
});
