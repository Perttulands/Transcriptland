export type LLMProvider = 'litellm' | 'google';

export interface LLMProviderModelOption {
    id: string;
    name: string;
    provider: string;
    description?: string;
}

export interface LLMProviderConfig {
    id: LLMProvider;
    label: string;
    description: string;
    docsUrl: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    models: LLMProviderModelOption[];
    defaultModel: string;
}

export const LLM_PROVIDER_CONFIGS: Record<LLMProvider, LLMProviderConfig> = {
    litellm: {
        id: 'litellm',
        label: 'LiteLLM Gateway',
        description: 'Use a LiteLLM proxy to reach multiple commercial models with a single API surface.',
        docsUrl: 'https://docs.litellm.ai',
        apiKeyLabel: 'LiteLLM API Key',
        apiKeyPlaceholder: 'Enter your LiteLLM API key',
        models: [
            { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google via LiteLLM' },
            { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google via LiteLLM' },
            { id: 'google/gemini-1.5-pro-002', name: 'Gemini 1.5 Pro', provider: 'Google via LiteLLM' },
            { id: 'azure/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'Azure OpenAI' },
            { id: 'azure/gpt-4o', name: 'GPT-4o', provider: 'Azure OpenAI' },
            { id: 'azure/o1-mini', name: 'O1 Mini', provider: 'Azure OpenAI' },
        ],
        defaultModel: 'google/gemini-2.0-flash-001',
    },
    google: {
        id: 'google',
        label: 'Google Gemini',
        description: 'Connect directly to the Google Gemini API without an intermediary.',
        docsUrl: 'https://ai.google.dev/gemini-api/docs',
        apiKeyLabel: 'Google API Key',
        apiKeyPlaceholder: 'Enter your Google AI Studio API key',
        models: [
            { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google' },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
            { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google' },
        ],
        defaultModel: 'gemini-2.5-flash-lite',
    },
};

export const DEFAULT_LLM_PROVIDER: LLMProvider = 'litellm';
