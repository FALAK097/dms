import { createGoogle } from "@ai-sdk/google";

function getGoogleInstance() {
  return createGoogle({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export const google = new Proxy(function () {}, {
  apply(_target, _thisArg, args) {
    return getGoogleInstance()(...args);
  },
  get(_target, prop) {
    const instance = getGoogleInstance();
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
