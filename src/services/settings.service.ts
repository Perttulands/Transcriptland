// Settings service for persisting user preferences using localStorage

import { DEFAULT_LLM_PROVIDER, LLM_PROVIDER_CONFIGS, LLMProvider } from '../constants/llm-providers';

export type AgentType = 'planner' | 'writer' | 'critic' | 'gapAnalysis';

export interface AgentSettings {
    model: string;
    instructions: Record<string, string>;
}

export interface AppSettings {
    provider: LLMProvider;
    apiKeys: Partial<Record<LLMProvider, string>>;
    agents: {
        planner: AgentSettings;
        writer: AgentSettings;
        critic: AgentSettings;
        gapAnalysis: AgentSettings;
    };
}

const buildAgentDefaults = (provider: LLMProvider): AppSettings['agents'] => {
    const defaultModel = LLM_PROVIDER_CONFIGS[provider].defaultModel;
    return {
        planner: { model: defaultModel, instructions: {} },
        writer: { model: defaultModel, instructions: {} },
        critic: { model: defaultModel, instructions: {} },
        gapAnalysis: { model: defaultModel, instructions: {} }
    };
};

const STORAGE_KEY = 'transcript_processor_settings';

const DEFAULT_SETTINGS: AppSettings = {
    provider: DEFAULT_LLM_PROVIDER,
    apiKeys: {},
    agents: buildAgentDefaults(DEFAULT_LLM_PROVIDER)
};

const LEGACY_PROVIDER_MODELS: Partial<Record<LLMProvider, Set<string>>> = {
    google: new Set(['gemini-2.0-flash-001', 'google/gemini-2.0-flash-001'])
};

// Validate provider string against known provider configurations
const isValidProvider = (value: string | undefined): value is LLMProvider => {
    if (!value) return false;
    return Object.prototype.hasOwnProperty.call(LLM_PROVIDER_CONFIGS, value);
};

// Update agent models when provider changes, reset if models incompatible
const normalizeAgentsForProvider = (
    agents: Partial<AppSettings['agents']> | undefined,
    provider: LLMProvider,
    forceReset = false
): AppSettings['agents'] => {
    const defaultAgents = buildAgentDefaults(provider);
    const allowedModels = new Set(LLM_PROVIDER_CONFIGS[provider].models.map((m) => m.id));

    const mapAgent = (agent: AgentType): AgentSettings => {
        const existing = agents?.[agent];
        const modelFromExisting = existing?.model;
        const isLegacyModel = modelFromExisting ? LEGACY_PROVIDER_MODELS[provider]?.has(modelFromExisting) : false;
        const canReuseExisting = !forceReset && modelFromExisting && allowedModels.has(modelFromExisting) && !isLegacyModel;
        const model = canReuseExisting ? modelFromExisting : defaultAgents[agent].model;
        return {
            model,
            instructions: existing?.instructions || {}
        };
    };

    return {
        planner: mapAgent('planner'),
        writer: mapAgent('writer'),
        critic: mapAgent('critic'),
        gapAnalysis: mapAgent('gapAnalysis')
    };
};

class SettingsService {
    /**
     * Load settings from localStorage
     */
    load(): AppSettings {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            }
            const parsed = JSON.parse(stored);

            // Merge with defaults to ensure all agents exist
            const provider: LLMProvider = isValidProvider(parsed.provider)
                ? parsed.provider
                : DEFAULT_SETTINGS.provider;

            const apiKeys: AppSettings['apiKeys'] = {
                ...DEFAULT_SETTINGS.apiKeys,
                ...(parsed.apiKeys || {})
            };

            // Support legacy single apiKey shape
            if (!apiKeys[provider] && parsed.apiKey) {
                apiKeys[provider] = parsed.apiKey;
            }

            const merged: AppSettings = {
                provider,
                apiKeys,
                agents: normalizeAgentsForProvider(parsed.agents, provider)
            };
            return merged;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
    }

    /**
     * Save settings to localStorage
     */
    save(settings: AppSettings): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Clear all settings
     */
    clear(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear settings:', error);
        }
    }

    /**
     * Save API key
     */
    saveApiKey(provider: LLMProvider, apiKey: string): void {
        const settings = this.load();
        settings.apiKeys[provider] = apiKey;
        this.save(settings);
    }

    /**
     * Get saved API key
     */
    getApiKey(provider?: LLMProvider): string | undefined {
        const resolvedProvider = provider ?? this.getProvider();
        return this.load().apiKeys[resolvedProvider];
    }

    /**
     * Get current LLM provider
     */
    getProvider(): LLMProvider {
        return this.load().provider;
    }

    /**
     * Update selected LLM provider and align agent defaults
     */
    setProvider(provider: LLMProvider): void {
        const settings = this.load();
        if (settings.provider === provider) {
            return;
        }
        settings.provider = provider;
        settings.agents = normalizeAgentsForProvider(settings.agents, provider, true);
        this.save(settings);
    }

    /**
     * Get model for a specific agent
     */
    getAgentModel(agent: AgentType): string {
        return this.load().agents[agent].model;
    }

    /**
     * Save model for a specific agent
     */
    saveAgentModel(agent: AgentType, model: string): void {
        const settings = this.load();
        settings.agents[agent].model = model;
        this.save(settings);
    }

    /**
     * Get custom instruction for a specific agent and method
     */
    getAgentInstruction(agent: AgentType, method: string): string | undefined {
        return this.load().agents[agent].instructions[method];
    }

    /**
     * Save custom instruction for a specific agent and method
     */
    saveAgentInstruction(agent: AgentType, method: string, instruction: string): void {
        const settings = this.load();
        settings.agents[agent].instructions[method] = instruction;
        this.save(settings);
    }

    /**
     * Reset a specific agent to defaults (model and instructions)
     */
    resetAgent(agent: AgentType): void {
        const settings = this.load();
        const provider = settings.provider;
        const providerDefaults = buildAgentDefaults(provider);
        settings.agents[agent] = {
            model: providerDefaults[agent].model,
            instructions: {}
        };
        this.save(settings);
    }

    /**
     * Reset all agents to defaults
     */
    resetAllAgents(): void {
        const settings = this.load();
        settings.agents = buildAgentDefaults(settings.provider);
        this.save(settings);
    }

    /**
     * Export settings as JSON string
     */
    export(): string {
        return JSON.stringify(this.load(), null, 2);
    }

    /**
     * Import settings from JSON string
     */
    import(jsonString: string): boolean {
        try {
            const settings = JSON.parse(jsonString);
            this.save(settings);
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

export const settingsService = new SettingsService();
