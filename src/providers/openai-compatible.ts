import { endpointRequiresAuth } from "../config/endpoint";
import type { OpenAiCompatibleProviderConfig } from "../config/types";
import { objectFrom, textFrom } from "../utils/coerce";
import { normalizeLanguage } from "./helpers";
import { postMultipartTranscription } from "./multipart";
import type { SttProvider } from "./types";

export const createOpenAiCompatibleProvider = (config: OpenAiCompatibleProviderConfig): SttProvider => ({
  id: "openai-compatible",
  async transcribe(input) {
    // Also send Bearer when an API key is configured, so authenticated
    // localhost servers (llama-swap apiKeys) work. Local-only endpoints
    // without a key still omit auth as before.
    const needsAuth = endpointRequiresAuth(config.endpoint) || Boolean(config.apiKey);
    const payload = await postMultipartTranscription({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      authHeader: needsAuth ? "bearer" : "none",
      model: config.model,
      audioPath: input.audioPath,
      language: normalizeLanguage(input.language ?? config.language),
      signal: input.signal,
      fields: { response_format: config.responseFormat },
      missingKeyMessage: "Missing API key for OpenAI-compatible STT endpoint. Set provider.apiKeyEnv or use a localhost endpoint.",
    });
    const text = textFrom(objectFrom(payload).text);
    if (!text) throw new Error("OpenAI-compatible transcription response did not include text.");
    return { text };
  },
});
