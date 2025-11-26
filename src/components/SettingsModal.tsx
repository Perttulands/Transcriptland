import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Download, Upload } from 'lucide-react';
import { settingsService, AgentType } from '../services/settings.service';
import { DEFAULT_INSTRUCTIONS } from '../constants/default-instructions';
import toast from 'react-hot-toast';
import { DEFAULT_LLM_PROVIDER, LLM_PROVIDER_CONFIGS } from '../constants/llm-providers';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AGENT_INFO: { key: AgentType; label: string; description: string }[] = [
    { key: 'planner', label: 'Planner Agent', description: 'Analyzes context and generates analysis frameworks' },
    { key: 'writer', label: 'Writer Agent', description: 'Analyzes transcript segments and generates insights' },
    { key: 'critic', label: 'Critic Agent', description: 'Evaluates analysis quality and provides feedback' },
    { key: 'gapAnalysis', label: 'Gap Analysis Agent', description: 'Identifies unexplored themes and perspectives' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [settings, setSettings] = useState(() => settingsService.load());
    const provider = settings.provider ?? DEFAULT_LLM_PROVIDER;
    const providerConfig = LLM_PROVIDER_CONFIGS[provider];
    const availableModels = providerConfig.models;

    useEffect(() => {
        if (isOpen) {
            setSettings(settingsService.load());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        settingsService.save(settings);
        toast.success('Settings saved!');
        onClose();
    };

    const handleResetAgent = (agent: AgentType) => {
        if (confirm(`Reset ${AGENT_INFO.find(a => a.key === agent)?.label} to defaults?`)) {
            settingsService.resetAgent(agent);
            setSettings(settingsService.load());
            toast.success('Agent reset to defaults');
        }
    };

    const handleExport = () => {
        const json = settingsService.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-processor-settings-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Settings exported!');
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    if (settingsService.import(content)) {
                        setSettings(settingsService.load());
                        toast.success('Settings imported!');
                    } else {
                        toast.error('Failed to import settings');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-solita-light-grey">
                    <h2 className="text-2xl font-semibold text-solita-black">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-solita-light-grey rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">
                        {/* Agent Configuration Sections */}
                        {AGENT_INFO.map((agentInfo) => (
                            <div key={agentInfo.key} className="border border-solita-light-grey rounded-lg p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-solita-black">{agentInfo.label}</h3>
                                        <p className="text-sm text-solita-dark-grey mt-1">{agentInfo.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleResetAgent(agentInfo.key)}
                                        className="px-3 py-1.5 bg-white border border-solita-light-grey hover:border-red-500 hover:text-red-500 text-solita-dark-grey rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset to Default
                                    </button>
                                </div>

                                {/* Model Selector */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-solita-black mb-2">
                                        LLM Model ({providerConfig.label})
                                    </label>
                                    <select
                                        value={settings.agents[agentInfo.key].model}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            agents: {
                                                ...settings.agents,
                                                [agentInfo.key]: {
                                                    ...settings.agents[agentInfo.key],
                                                    model: e.target.value
                                                }
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-solita-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-solita-ochre focus:border-transparent"
                                    >
                                        {availableModels.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.provider})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Prompts */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-solita-black">Custom Instructions</h4>
                                    {Object.entries(DEFAULT_INSTRUCTIONS[agentInfo.key]).map(([method, defaultPrompt]) => (
                                        <div key={method}>
                                            <label className="block text-sm font-medium text-solita-black mb-2">
                                                {method.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <textarea
                                                value={settings.agents[agentInfo.key].instructions[method] || defaultPrompt}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    agents: {
                                                        ...settings.agents,
                                                        [agentInfo.key]: {
                                                            ...settings.agents[agentInfo.key],
                                                            instructions: {
                                                                ...settings.agents[agentInfo.key].instructions,
                                                                [method]: e.target.value
                                                            }
                                                        }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-solita-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-solita-ochre focus:border-transparent font-mono text-sm text-solita-black leading-relaxed resize-vertical"
                                                rows={8}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Import/Export Section */}
                        <div className="border-t border-solita-light-grey pt-6">
                            <h3 className="text-lg font-semibold text-solita-black mb-4">Import / Export Settings</h3>
                            <p className="text-sm text-solita-dark-grey mb-4">
                                Export your settings to back them up or share them. Import previously saved settings to restore your configuration.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Settings
                                </button>
                                <button
                                    onClick={handleImport}
                                    className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Import Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-solita-light-grey">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
