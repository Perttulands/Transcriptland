import { useState } from 'react';
import { AgentLog } from '../types/logging';
import { getAgentConfig } from '../services/agent-config.registry';
import { Terminal, ChevronDown, ChevronUp, X, Code, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentLogPanelProps {
    logs: AgentLog[];
    onClear: () => void;
}

// Developer panel displaying detailed agent interaction logs
// Shows request/response pairs, errors, and token usage
export function AgentLogPanel({ logs, onClear }: AgentLogPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AgentLog | null>(null);
    const [showAgentConfig, setShowAgentConfig] = useState<string | null>(null);

    const formatTimestamp = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Color-code log actions for visual distinction
    const getActionColor = (action: AgentLog['action']) => {
        switch (action) {
            case 'request':
                return 'text-blue-600 bg-blue-50';
            case 'response':
                return 'text-green-600 bg-green-50';
            case 'error':
                return 'text-red-600 bg-red-50';
        }
    };

    const agentConfig = showAgentConfig ? getAgentConfig(showAgentConfig) : null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-solita-mid-grey shadow-2xl">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-solita-dark-grey text-white cursor-pointer hover:bg-solita-black transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5" />
                    <h3 className="font-semibold">AI Agent Panel</h3>
                    <span className="px-2 py-1 bg-solita-ochre rounded-full text-xs font-medium">
                        {logs.length} logs
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {logs.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                        >
                            Clear
                        </button>
                    )}
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '400px' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex h-full">
                            {/* Logs List */}
                            <div className="flex-1 overflow-y-auto border-r border-solita-light-grey">
                                {logs.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-solita-mid-grey">
                                        <p>No agent interactions yet</p>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {[...logs].reverse().map((log) => (
                                            <div
                                                key={log.id}
                                                onClick={() => setSelectedLog(log)}
                                                className={`p-3 rounded cursor-pointer transition-colors ${selectedLog?.id === log.id
                                                    ? 'bg-solita-ochre/20 border-l-4 border-solita-ochre'
                                                    : 'hover:bg-solita-light-grey'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowAgentConfig(log.agentRole);
                                                            }}
                                                            className="font-semibold text-solita-ochre hover:underline"
                                                        >
                                                            {log.agentName}
                                                        </button>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-solita-mid-grey flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                </div>
                                                {log.duration && (
                                                    <div className="text-xs text-solita-mid-grey">
                                                        Duration: {log.duration}ms
                                                    </div>
                                                )}
                                                {log.tokens && (
                                                    <div className="text-xs text-solita-mid-grey">
                                                        Tokens: {log.tokens.total.toLocaleString()} (prompt: {log.tokens.prompt.toLocaleString()}, completion: {log.tokens.completion.toLocaleString()})
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Log Detail */}
                            <div className="w-1/2 overflow-y-auto bg-solita-light-grey/30 p-4">
                                {selectedLog ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-lg text-solita-black">Log Details</h4>
                                            <button
                                                onClick={() => setSelectedLog(null)}
                                                className="text-solita-mid-grey hover:text-solita-black"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {selectedLog.action === 'request' && selectedLog.prompt && (
                                            <>
                                                <div>
                                                    <h5 className="font-semibold text-sm text-solita-dark-grey mb-2">System Prompt</h5>
                                                    <pre className="bg-white p-3 rounded border border-solita-light-grey text-xs overflow-x-auto whitespace-pre-wrap">
                                                        {selectedLog.prompt.system}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-sm text-solita-dark-grey mb-2">User Prompt</h5>
                                                    <pre className="bg-white p-3 rounded border border-solita-light-grey text-xs overflow-x-auto whitespace-pre-wrap">
                                                        {selectedLog.prompt.user}
                                                    </pre>
                                                </div>
                                            </>
                                        )}

                                        {selectedLog.action === 'response' && selectedLog.response && (
                                            <div>
                                                <h5 className="font-semibold text-sm text-solita-dark-grey mb-2">Response</h5>
                                                <pre className="bg-white p-3 rounded border border-solita-light-grey text-xs overflow-x-auto whitespace-pre-wrap">
                                                    {selectedLog.response}
                                                </pre>
                                            </div>
                                        )}

                                        {selectedLog.action === 'error' && selectedLog.error && (
                                            <div>
                                                <h5 className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Error
                                                </h5>
                                                <pre className="bg-red-50 p-3 rounded border border-red-200 text-xs overflow-x-auto whitespace-pre-wrap text-red-700">
                                                    {selectedLog.error}
                                                </pre>
                                            </div>
                                        )}

                                        {selectedLog.model && (
                                            <div className="text-xs text-solita-mid-grey">
                                                Model: <span className="font-mono">{selectedLog.model}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-solita-mid-grey">
                                        <p>Select a log to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Agent Config Modal */}
            <AnimatePresence>
                {agentConfig && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowAgentConfig(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-semibold text-solita-black flex items-center gap-2">
                                    <Code className="w-6 h-6 text-solita-ochre" />
                                    {agentConfig.name}
                                </h3>
                                <button
                                    onClick={() => setShowAgentConfig(null)}
                                    className="text-solita-mid-grey hover:text-solita-black"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm text-solita-dark-grey mb-1">Description</h4>
                                    <p className="text-solita-black">{agentConfig.description}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-solita-dark-grey mb-1">Model</h4>
                                    <code className="bg-solita-light-grey px-2 py-1 rounded text-sm">{agentConfig.model}</code>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-solita-dark-grey mb-1">Code Location</h4>
                                    <code className="bg-solita-light-grey px-2 py-1 rounded text-sm">{agentConfig.codeLocation}</code>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-solita-dark-grey mb-2">System Prompt</h4>
                                    <pre className="bg-solita-light-grey p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                                        {agentConfig.systemPrompt}
                                    </pre>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-solita-dark-grey mb-2">Methods</h4>
                                    <div className="space-y-2">
                                        {agentConfig.methods.map((method) => (
                                            <div key={method.name} className="bg-solita-light-grey p-3 rounded">
                                                <code className="text-sm font-semibold text-solita-ochre">{method.signature}</code>
                                                <p className="text-xs text-solita-dark-grey mt-1">{method.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
