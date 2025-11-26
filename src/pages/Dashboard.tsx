import { useState, useEffect } from 'react';
import { TranscriptInput } from '../components/TranscriptInput';
import { AgentChatFeed } from '../components/AgentChatFeed';
import { ApiKeyPrompt } from '../components/ApiKeyPrompt';
import { llmService } from '../services/llm.service';
import { markdownService } from '../services/markdown.service';
import { AgentMessage, AgentRole, Insight, MarkdownOutput } from '../types';
import { Download, Sparkles, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settings.service';

export function Dashboard() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [markdownOutput, setMarkdownOutput] = useState<string>('');
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);

    useEffect(() => {
        llmService.hydrateFromSettings();
        const provider = settingsService.getProvider();
        if (settingsService.getApiKey(provider)) {
            setHasApiKey(true);
        }
    }, []);

    const handleFileSelect = (file: File | null, content: string) => {
        setSelectedFile(file);
        setTranscript(content);
        setMessages([]);
        setMarkdownOutput('');
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setTranscript('');
        setMessages([]);
        setMarkdownOutput('');
    };



    const addMessage = (role: AgentRole, content: string) => {
        const message: AgentMessage = {
            id: crypto.randomUUID(),
            role,
            content,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, message]);
    };

    const processTranscript = async () => {
        if (!transcript) {
            toast.error('Please provide a transcript first');
            return;
        }

        if (!llmService.isInitialized()) {
            setShowApiKeyPrompt(true);
            return;
        }

        setIsProcessing(true);
        setMessages([]);

        try {
            addMessage(AgentRole.SYSTEM, 'Analyzing transcript to extract key themes...');

            const themes = await llmService.generateThemes(transcript);

            addMessage(AgentRole.SYSTEM, `Found ${themes.length} themes: ${themes.join(', ')}`);

            const insights: Insight[] = [];

            for (const theme of themes) {
                addMessage(AgentRole.WRITER, `Starting analysis of: ${theme}`);

                try {
                    const analysis = await llmService.analyzeTheme(transcript, theme);
                    addMessage(AgentRole.WRITER, `Completed analysis of: ${theme}`);

                    insights.push({
                        id: crypto.randomUUID(),
                        theme,
                        content: analysis,
                        quotes: [],
                        generatedAt: new Date(),
                    });
                } catch (error) {
                    addMessage(AgentRole.SYSTEM, `Failed to analyze ${theme}. Skipping...`);
                }
            }

            addMessage(AgentRole.SYSTEM, 'Generating final markdown report...');

            const output: MarkdownOutput = {
                readme: `This document contains a comprehensive AI-powered analysis of the provided transcript. It includes ${insights.length} key themes with detailed insights extracted by AI agents.`,
                insights,
                metadata: {
                    transcriptId: 'transcript-' + Date.now(),
                    processedAt: new Date(),
                    agentCount: themes.length,
                },
            };

            const markdown = markdownService.generateMarkdown(output);
            setMarkdownOutput(markdown);

            addMessage(AgentRole.SYSTEM, 'Analysis complete! You can now download the markdown report.');
            toast.success('Transcript processed successfully!');
        } catch (error) {
            console.error('Processing failed:', error);
            addMessage(AgentRole.SYSTEM, `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            toast.error('Failed to process transcript. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadMarkdown = () => {
        if (!markdownOutput) return;
        markdownService.downloadMarkdown(markdownOutput, `transcript-analysis-${Date.now()}.md`);
        toast.success('Markdown file downloaded!');
    };

    const handleApiKeySet = () => {
        setHasApiKey(true);
        toast.success('API key configured successfully!');
    };

    return (
        <div className="min-h-screen bg-solita-light-grey">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-semibold text-solita-black mb-3 flex items-center gap-3">
                            <Sparkles className="w-9 h-9 text-solita-ochre" />
                            Transcript Processor
                        </h1>
                        <p className="text-base text-solita-dark-grey">
                            Extract insights from transcripts using AI agents
                        </p>
                    </div>
                    <div className="flex gap-2">

                        <button
                            onClick={() => setShowApiKeyPrompt(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-solita-light-grey border border-solita-mid-grey text-solita-dark-grey rounded-lg hover:bg-solita-ochre/10 transition-colors"
                            title="Manage API Key"
                        >
                            <Key className="w-4 h-4" />
                            {hasApiKey ? 'Update' : 'Set'} API Key
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-solita-black mb-4">Upload Transcript</h2>

                    <TranscriptInput
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onRemoveFile={handleRemoveFile}
                    />

                    {transcript && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={processTranscript}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                {isProcessing ? 'Processing...' : 'Process Transcript'}
                            </button>
                        </div>
                    )}
                </div>

                {messages.length > 0 && (
                    <div className="mb-6">
                        <AgentChatFeed messages={messages} isStreaming={isProcessing} />
                    </div>
                )}

                {markdownOutput && (
                    <div className="bg-white border border-solita-light-grey rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-solita-black">Results</h2>
                            <button
                                onClick={downloadMarkdown}
                                className="px-4 py-2 bg-solita-green hover:bg-solita-green/90 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download Markdown
                            </button>
                        </div>
                        <pre className="bg-solita-light-grey/50 rounded p-4 text-sm text-solita-dark-grey overflow-x-auto max-h-96 whitespace-pre-wrap">
                            {markdownOutput}
                        </pre>
                    </div>
                )}
            </div>

            <ApiKeyPrompt
                isOpen={showApiKeyPrompt}
                onClose={() => setShowApiKeyPrompt(false)}
                onKeySet={handleApiKeySet}
            />


        </div>
    );
}
