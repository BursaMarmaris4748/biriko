export type OcrProvider = 'groq' | 'gemini';

export const CONFIG = {
  ocrProvider: 'groq' as OcrProvider,
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  geminiModel: 'gemini-2.5-flash',
  groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  groqModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
};

export function setOcrProvider(provider: OcrProvider) {
  CONFIG.ocrProvider = provider;
}

export function getOcrProvider(): OcrProvider {
  return CONFIG.ocrProvider;
}

export function setGeminiApiKey(key: string) {
  CONFIG.geminiApiKey = key;
}

export function getGeminiApiKey(): string {
  return CONFIG.geminiApiKey;
}

export function setGeminiModel(model: string) {
  CONFIG.geminiModel = model;
}

export function getGeminiModel(): string {
  return CONFIG.geminiModel;
}

export function setGroqApiKey(key: string) {
  CONFIG.groqApiKey = key;
}

export function getGroqApiKey(): string {
  return CONFIG.groqApiKey;
}

export function setGroqModel(model: string) {
  CONFIG.groqModel = model;
}

export function getGroqModel(): string {
  return CONFIG.groqModel;
}
