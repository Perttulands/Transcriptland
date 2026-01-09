import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { usePhaseNavigation } from '../hooks/usePhaseNavigation';
import { Download, Copy, CheckCircle, RotateCcw, ArrowLeft, Eye, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { StandardTextArea } from '../components/ui/StandardTextArea';
import { writerAgent } from '../services/writer.agent';
import { GuidedHint } from '../components/GuidedHint';
import { PHASE_HINTS } from '../constants/hints';

export function Phase4_Consolidation() {
    const navigate = useNavigate();
    const { state, resetAnalysis } = useAnalysisContext();
    const { goToPreviousPhase, canGoBack } = usePhaseNavigation();
    const [consolidatedText, setConsolidatedText] = useState('');
    const [copied, setCopied] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        // Consolidate all segments into a single markdown document
        if (state.framework && state.segmentAnalyses.size > 0) {
            generateMarkdownAsync();
        }
    }, [state.framework, state.segmentAnalyses]);

    const generateMarkdownAsync = async () => {
        setIsGenerating(true);
        try {
            const markdown = await generateMarkdown();
            setConsolidatedText(markdown);
        } catch (error) {
            console.error('Error generating markdown:', error);
            toast.error('Failed to generate consolidated analysis');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateMarkdown = async (): Promise<string> => {
        if (!state.framework) return '';

        const { metadata, segments } = state.framework;
        const analyses = state.segmentAnalyses;

        // Collect all analysis content for summary and keywords
        const allContent = Array.from(analyses.values())
            .filter(a => a.status === 'complete')
            .map(a => a.content)
            .join('\n\n');

        // Generate summaries for each segment
        const segmentSummaries: { [key: string]: string } = {};
        for (const segment of segments) {
            const analysis = analyses.get(segment.id);
            if (analysis && analysis.status === 'complete') {
                try {
                    segmentSummaries[segment.id] = await writerAgent.generateSummary(analysis.content);
                } catch (error) {
                    console.error(`Failed to generate summary for ${segment.id}:`, error);
                    segmentSummaries[segment.id] = 'Summary generation failed.';
                }
            }
        }

        // Generate keywords for the entire analysis
        let keywords: string[] = [];
        try {
            keywords = await writerAgent.generateKeywords(allContent);
        } catch (error) {
            console.error('Failed to generate keywords:', error);
        }

        let md = `# Transcript: ${metadata.title.replace('Analysis: ', '')}\n\n`;
        md += `**Created:** ${metadata.created.toLocaleString()}\n\n`;

        // Add summaries
        md += `## Analysis Summaries\n\n`;
        segments.forEach((segment) => {
            const summary = segmentSummaries[segment.id];
            if (summary) {
                md += `**${segment.title}:** ${summary}\n\n`;
            }
        });

        // Add tags
        md += `**Tags:** `;
        metadata.tags.forEach((tag, index) => {
            md += `\`${tag}\``;
            if (index < metadata.tags.length - 1) md += ', ';
        });
        md += `\n\n`;

        // Add keywords
        if (keywords.length > 0) {
            md += `**Keywords:** ${keywords.join(', ')}\n\n`;
        }

        md += `---\n\n`;

        // Add each segment
        segments.forEach((segment) => {
            const analysis = analyses.get(segment.id);
            if (analysis && analysis.status === 'complete') {
                md += `## ${segment.title}\n\n`;
                md += `**Objective:** ${segment.objective}\n\n`;
                md += `${analysis.content}\n\n`;
                md += `---\n\n`;
            }
        });

        return md;
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(consolidatedText);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const downloadMarkdown = () => {
        const blob = new Blob([consolidatedText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download started!');
    };

    const handleStartOver = () => {
        resetAnalysis();
        setShowResetConfirm(false);
        navigate('/upload');
        toast.success('Ready for a new analysis!');
    };

    return (
        <div className="min-h-screen bg-solita-light-grey pb-24">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold text-solita-black flex items-center gap-3 mb-3">
                        <Download className="w-9 h-9 text-solita-ochre" />
                        Phase 4: Consolidation & Export
                    </h1>
                    <p className="text-base text-solita-dark-grey">
                        Review and export your consolidated analysis
                    </p>
                </div>

                {/* Guided Hint */}
                <GuidedHint
                    hintId={PHASE_HINTS.phase4.consolidation.id}
                    title={PHASE_HINTS.phase4.consolidation.title}
                    description={PHASE_HINTS.phase4.consolidation.description}
                />

                {/* Stats Card */}
                <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-solita-black mb-4">Analysis Summary</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-solita-ochre">
                                {state.framework?.segments.length || 0}
                            </div>
                            <div className="text-sm text-solita-dark-grey">Total Segments</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-solita-green">
                                {Array.from(state.segmentAnalyses.values()).filter(a => a.status === 'complete').length}
                            </div>
                            <div className="text-sm text-solita-dark-grey">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-solita-black">
                                {consolidatedText.split(/\s+/).length}
                            </div>
                            <div className="text-sm text-solita-dark-grey">Total Words</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={copyToClipboard}
                        className="flex-1 px-6 py-3 bg-solita-green hover:bg-solita-green/90 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5" />
                                Copy to Clipboard
                            </>
                        )}
                    </button>
                    <button
                        onClick={downloadMarkdown}
                        className="flex-1 px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Download as Markdown
                    </button>
                </div>

                {/* Consolidated Text Display */}
                <div className="bg-white border border-solita-light-grey rounded-lg p-6 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-solita-black">
                            Consolidated Analysis
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('edit')}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${viewMode === 'edit'
                                    ? 'bg-solita-ochre text-white'
                                    : 'bg-white border border-solita-light-grey text-solita-dark-grey hover:border-solita-ochre'
                                    }`}
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${viewMode === 'preview'
                                    ? 'bg-solita-ochre text-white'
                                    : 'bg-white border border-solita-light-grey text-solita-dark-grey hover:border-solita-ochre'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                        </div>
                    </div>
                    {isGenerating ? (
                        <div className="flex items-center justify-center p-12 text-solita-mid-grey">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solita-ochre mx-auto mb-4"></div>
                                <p>Generating summaries and keywords...</p>
                            </div>
                        </div>
                    ) : viewMode === 'edit' ? (
                        <StandardTextArea
                            value={consolidatedText}
                            onChange={(e) => setConsolidatedText(e.target.value)}
                            variant="filled"
                            className="font-mono text-sm p-6"
                            rows={30}
                        />
                    ) : (
                        <div className="bg-solita-light-grey/30 rounded-lg p-6 overflow-auto max-h-[600px] prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {consolidatedText}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Back Button and Start Over Section */}
                <div className="space-y-6">
                    {/* Back Button */}
                    {canGoBack && (
                        <div className="flex justify-start">
                            <button
                                onClick={goToPreviousPhase}
                                className="px-6 py-3 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Gap Analysis
                            </button>
                        </div>
                    )}

                    {/* Start Over Section */}
                    <div className="bg-white border border-solita-light-grey rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-solita-black mb-3">
                            Process Another Transcript
                        </h2>
                        <p className="text-solita-dark-grey mb-4">
                            Start a new analysis while keeping your settings and preferences.
                        </p>

                        {!showResetConfirm ? (
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="px-6 py-3 bg-white border-2 border-solita-ochre hover:bg-solita-ochre hover:text-white text-solita-ochre rounded-lg transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Start Over with New Transcript
                            </button>
                        ) : (
                            <div className="bg-solita-light-grey/50 border border-solita-ochre rounded-lg p-4">
                                <p className="text-solita-black font-semibold mb-3">
                                    Are you sure you want to start over?
                                </p>
                                <p className="text-sm text-solita-dark-grey mb-4">
                                    This will clear all current analysis data. Your settings (API key, model, custom instructions) will be preserved.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleStartOver}
                                        className="px-4 py-2 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-colors"
                                    >
                                        Yes, Start Over
                                    </button>
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
