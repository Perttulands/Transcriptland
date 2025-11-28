import { useEffect, useRef } from 'react';
import { AgentMessage, AgentRole } from '../types';
import { Bot, Loader2, Sparkles, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentChatFeedProps {
    messages: AgentMessage[];
    isStreaming?: boolean;
}

export function AgentChatFeed({ messages, isStreaming = false }: AgentChatFeedProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (messages.length === 0 && !isStreaming) {
        return null;
    }

    // Map agent roles to their corresponding icons
    const getRoleIcon = (role: AgentRole) => {
        switch (role) {
            case AgentRole.PLANNER:
                return <Brain size={14} />;
            case AgentRole.WRITER:
                return <Bot size={14} />;
            case AgentRole.CRITIC:
                return <Sparkles size={14} />;
            default:
                return <Bot size={14} />;
        }
    };

    // Map agent roles to their theme colors
    const getRoleColor = (role: AgentRole) => {
        switch (role) {
            case AgentRole.PLANNER:
                return 'bg-solita-ochre/10 text-solita-ochre';
            case AgentRole.WRITER:
                return 'bg-solita-green/10 text-solita-green';
            case AgentRole.CRITIC:
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-solita-mid-grey/10 text-solita-mid-grey';
        }
    };

    return (
        <div className="bg-white border border-solita-light-grey rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-solita-light-grey flex justify-between items-center">
                <h3 className="font-semibold text-solita-black flex items-center gap-2">
                    <Bot size={20} className="text-solita-ochre" />
                    Agent Workflow
                </h3>
                {isStreaming && (
                    <div className="flex items-center gap-2 text-sm font-medium text-solita-ochre">
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                    </div>
                )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-[400px] overflow-y-auto p-4 space-y-4 bg-solita-light-grey/20">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getRoleColor(
                                    msg.role
                                )}`}
                            >
                                {getRoleIcon(msg.role)}
                            </div>

                            {/* Message */}
                            <div className="flex-1 bg-white border border-solita-light-grey rounded-lg p-3 text-sm shadow-sm">
                                <p className="font-semibold text-xs opacity-70 mb-1 uppercase tracking-wider">
                                    {msg.role}
                                </p>
                                <p className="text-solita-black">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
