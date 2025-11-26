import { useState, useEffect } from 'react';
import { X, Key, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { StandardInput } from './ui/StandardInput';
import { llmService } from '../services/llm.service';
import { settingsService } from '../services/settings.service';
import { LLM_PROVIDER_CONFIGS, LLMProvider } from '../constants/llm-providers';

interface ApiKeyPromptProps {
    isOpen: boolean;
    onClose: () => void;
    onKeySet: () => void;
}

export function ApiKeyPrompt({ isOpen, onClose, onKeySet }: ApiKeyPromptProps) {
    const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(settingsService.getProvider());
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const provider = settingsService.getProvider();
        setSelectedProvider(provider);
        setApiKey(settingsService.getApiKey(provider) || '');
    }, [isOpen]);

    const handleProviderChange = (provider: LLMProvider) => {
        setSelectedProvider(provider);
        setApiKey(settingsService.getApiKey(provider) || '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!apiKey.trim()) {
            toast.error('Please enter an API key');
            return;
        }

        setIsValidating(true);

        try {
            const isValid = await llmService.validateApiKey(selectedProvider, apiKey);

            if (isValid) {
                settingsService.saveApiKey(selectedProvider, apiKey);
                settingsService.setProvider(selectedProvider);
                llmService.initialize(apiKey, selectedProvider);
                toast.success('Provider configured successfully!');
                onKeySet();
                onClose();
            } else {
                toast.error('Invalid API key. Please check and try again.');
            }
        } catch (error) {
            toast.error('Failed to validate API key');
        } finally {
            setIsValidating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-solita-black flex items-center gap-2">
                        <Key className="w-5 h-5 text-solita-ochre" />
                        LLM Provider & API Key
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-solita-mid-grey hover:text-solita-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4 space-y-2">
                    <p className="text-sm text-solita-dark-grey">Select which LLM provider you want to use.</p>
                    <div className="flex flex-col gap-2">
                        {Object.values(LLM_PROVIDER_CONFIGS).map((providerConfig) => (
                            <button
                                key={providerConfig.id}
                                type="button"
                                onClick={() => handleProviderChange(providerConfig.id)}
                                className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${selectedProvider === providerConfig.id
                                    ? 'border-solita-ochre bg-solita-ochre/10'
                                    : 'border-solita-light-grey hover:border-solita-ochre/60'
                                    }`}
                                disabled={isValidating}
                            >
                                <div className="mt-1">
                                    <Globe className={`w-4 h-4 ${selectedProvider === providerConfig.id ? 'text-solita-ochre' : 'text-solita-mid-grey'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-solita-black">{providerConfig.label}</p>
                                    <p className="text-xs text-solita-dark-grey">{providerConfig.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-sm text-solita-dark-grey mb-4">
                    {LLM_PROVIDER_CONFIGS[selectedProvider].apiKeyLabel}
                </p>
                <form onSubmit={handleSubmit}>
                    <StandardInput
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={LLM_PROVIDER_CONFIGS[selectedProvider].apiKeyPlaceholder}
                        className="mb-4"
                        disabled={isValidating}
                    />

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-solita-light-grey border border-solita-mid-grey text-solita-dark-grey rounded-lg hover:bg-solita-ochre/10 transition-colors"

                            disabled={isValidating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            disabled={isValidating}
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Validating...
                                </>
                            ) : (
                                'Save Key'
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-xs text-solita-mid-grey mt-4">
                    Your API key is stored locally and never sent to our servers. Need help?{' '}
                    <a
                        href={LLM_PROVIDER_CONFIGS[selectedProvider].docsUrl}
                        className="text-solita-ochre hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Provider docs
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
