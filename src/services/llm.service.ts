import { liteLLMService } from './litellm.service';
import { geminiService } from './gemini.service';
import { settingsService } from './settings.service';
import { LLMProvider } from '../constants/llm-providers';

export interface CompletionResult {
    content: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// Facade service routing requests to Google Gemini or LiteLLM based on provider
class LLMService {
    initialize(apiKey: string, provider?: LLMProvider): void {
        const resolvedProvider = this.resolveProvider(provider);
        if (resolvedProvider === 'google') {
            geminiService.initialize(apiKey);
        } else {
            liteLLMService.initialize(apiKey);
        }
    }

    // Load API key and provider from localStorage
    hydrateFromSettings(): void {
        const provider = settingsService.getProvider();
        const apiKey = settingsService.getApiKey(provider);
        if (apiKey) {
            this.initialize(apiKey, provider);
        }
    }

    isInitialized(provider?: LLMProvider): boolean {
        const resolvedProvider = this.resolveProvider(provider);
        if (resolvedProvider === 'google') {
            return geminiService.isInitialized();
        }
        return liteLLMService.isInitialized();
    }

    async validateApiKey(provider: LLMProvider, apiKey: string): Promise<boolean> {
        if (provider === 'google') {
            return geminiService.validateApiKey(apiKey);
        }
        return liteLLMService.validateApiKey(apiKey);
    }

    async generateCompletion(systemPrompt: string, userPrompt: string, model?: string): Promise<CompletionResult> {
        const provider = this.resolveProvider();
        const normalizedModel = this.normalizeModel(provider, model);
        if (provider === 'google') {
            return geminiService.generateCompletion(systemPrompt, userPrompt, normalizedModel);
        }
        return liteLLMService.generateCompletion(systemPrompt, userPrompt, normalizedModel);
    }

    async *generateCompletionStream(systemPrompt: string, userPrompt: string, model?: string): AsyncGenerator<string> {
        const provider = this.resolveProvider();
        const normalizedModel = this.normalizeModel(provider, model);
        if (provider === 'google') {
            for await (const chunk of geminiService.generateCompletionStream(systemPrompt, userPrompt, normalizedModel)) {
                yield chunk;
            }
            return;
        }
        for await (const chunk of liteLLMService.generateCompletionStream(systemPrompt, userPrompt, normalizedModel)) {
            yield chunk;
        }
    }

    async generateThemes(transcript: string, model?: string): Promise<string[]> {
        const provider = this.resolveProvider();
        const normalizedModel = this.normalizeModel(provider, model);
        if (provider === 'google') {
            return geminiService.generateThemes(transcript, normalizedModel);
        }
        return liteLLMService.generateThemes(transcript, normalizedModel);
    }

    async analyzeTheme(transcript: string, theme: string, model?: string): Promise<string> {
        const provider = this.resolveProvider();
        const normalizedModel = this.normalizeModel(provider, model);
        if (provider === 'google') {
            return geminiService.analyzeTheme(transcript, theme, normalizedModel);
        }
        return liteLLMService.analyzeTheme(transcript, theme, normalizedModel);
    }

    private resolveProvider(provider?: LLMProvider): LLMProvider {
        return provider ?? settingsService.getProvider();
    }

    // Remove provider prefix for Google models (google/model -> model)
    private normalizeModel(provider: LLMProvider, model?: string): string | undefined {
        if (!model) {
            return undefined;
        }
        if (provider === 'google' && model.startsWith('google/')) {
            return model.replace(/^google\//, '');
        }
        return model;
    }
}

export const llmService = new LLMService();
