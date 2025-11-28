import { useEffect, useState } from 'react';
import { Agent, AgentStatus } from '../types';
import { agentOrchestrator } from '../services/agent.orchestrator';
import { Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Real-time visualization of agent execution status and progress
export function AgentVisualizer() {
    const [agents, setAgents] = useState<Agent[]>([]);

    useEffect(() => {
        const unsubscribe = agentOrchestrator.subscribe(setAgents);
        return unsubscribe;
    }, []);

    if (agents.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-semibold text-solita-black mb-3">Agent Activity</h2>
            <AnimatePresence mode="popLayout">
                {agents.map((agent) => (
                    <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white border border-solita-light-grey rounded-lg p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                {agent.status === AgentStatus.RUNNING && (
                                    <Loader2 className="w-5 h-5 text-solita-ochre animate-spin" />
                                )}
                                {agent.status === AgentStatus.COMPLETED && (
                                    <CheckCircle2 className="w-5 h-5 text-solita-green" />
                                )}
                                {agent.status === AgentStatus.FAILED && (
                                    <XCircle className="w-5 h-5 text-solita-red" />
                                )}
                                {agent.status === AgentStatus.IDLE && (
                                    <Circle className="w-5 h-5 text-solita-mid-grey" />
                                )}
                                <span className="font-medium text-solita-black">{agent.name}</span>
                            </div>
                            <span className="text-sm text-solita-mid-grey">{agent.progress}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-solita-light-grey rounded-full h-1.5 mb-2">
                            <motion.div
                                className={`h-1.5 rounded-full ${agent.status === AgentStatus.COMPLETED
                                        ? 'bg-solita-green'
                                        : agent.status === AgentStatus.FAILED
                                            ? 'bg-solita-red'
                                            : 'bg-solita-ochre'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${agent.progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Output or Error */}
                        {agent.output && (
                            <div className="mt-2 text-sm text-solita-dark-grey bg-solita-light-grey/50 rounded p-2">
                                {agent.output.substring(0, 150)}
                                {agent.output.length > 150 && '...'}
                            </div>
                        )}
                        {agent.error && (
                            <div className="mt-2 text-sm text-solita-red bg-solita-red/10 rounded p-2">
                                Error: {agent.error}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
