import { useState } from 'react';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { usePhaseNavigation } from '../hooks/usePhaseNavigation';
import { gapAnalysisAgent } from '../services/gap-analysis.agent';
import { writerAgent } from '../services/writer.agent';
import { criticAgent } from '../services/critic.agent';
import { GapSuggestion, SegmentAnalysis, CriticEvaluation } from '../types/phases';
import { SegmentCard } from '../components/SegmentCard';
import { Search, CheckCircle, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Plus, X } from 'lucide-react';
import { StandardInput } from '../components/ui/StandardInput';
import { StandardTextArea } from '../components/ui/StandardTextArea';
import { StreamingOutput } from '../components/ui/StreamingOutput';
import toast from 'react-hot-toast';
import { GuidedHint } from '../components/GuidedHint';
import { PHASE_HINTS } from '../constants/hints';

type AnalysisStep = 'identify' | 'analyze';

export function Phase3_5_GapAnalysis() {
    const { state, addGapToMainAnalysis } = useAnalysisContext();
    const { goToPreviousPhase, proceedToNextPhase, canGoBack } = usePhaseNavigation();

    const [step, setStep] = useState<AnalysisStep>('identify');

    // Identification step state
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [identificationText, setIdentificationText] = useState('');
    const [suggestions, setSuggestions] = useState<GapSuggestion[]>([]);
    const [selectedGaps, setSelectedGaps] = useState<Set<string>>(new Set());

    // Analysis step state
    const [gapAnalyses, setGapAnalyses] = useState<Map<string, SegmentAnalysis>>(new Map());
    const [streamingContent, setStreamingContent] = useState<Map<string, string>>(new Map());
    const [analyzingGaps, setAnalyzingGaps] = useState<Set<string>>(new Set());
    const [evaluations, setEvaluations] = useState<Map<string, CriticEvaluation>>(new Map());
    const [evaluatingGaps, setEvaluatingGaps] = useState<Set<string>>(new Set());

    // Custom gap state
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customGap, setCustomGap] = useState({ title: '', objective: '', guidance: '', rationale: '' });

    const handleAddCustomGap = () => {
        if (!customGap.title || !customGap.objective) {
            toast.error('Title and Objective are required');
            return;
        }
        const newGap: GapSuggestion = {
            id: `custom-gap-${Date.now()}`,
            title: customGap.title,
            objective: customGap.objective,
            guidance: customGap.guidance || 'Analyze this specific gap.',
            rationale: customGap.rationale || 'User identified gap.'
        };
        setSuggestions(prev => [...prev, newGap]);
        setSelectedGaps(prev => new Set(prev).add(newGap.id));
        setIsAddingCustom(false);
        setCustomGap({ title: '', objective: '', guidance: '', rationale: '' });
        toast.success('Custom gap added');
    };

    const identifyGaps = async () => {
        if (!state.framework || !state.transcript) {
            toast.error('Missing framework or transcript');
            return;
        }
        setIsIdentifying(true);
        setIdentificationText('');
        setSuggestions([]);
        try {
            let fullText = '';
            for await (const chunk of gapAnalysisAgent.identifyGaps(
                state.transcript,
                state.framework,
                Array.from(state.segmentAnalyses.values())
            )) {
                fullText += chunk;
                setIdentificationText(fullText);
            }
            const parsed = gapAnalysisAgent.parseGapSuggestions(fullText);
            setSuggestions(parsed);
            if (parsed.length === 0) {
                toast.error('No gaps identified. Try adjusting your analysis.');
            } else {
                toast.success(`Identified ${parsed.length} potential gaps`);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to identify gaps');
        } finally {
            setIsIdentifying(false);
        }
    };

    const toggleGapSelection = (id: string) => {
        const newSet = new Set(selectedGaps);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedGaps(newSet);
    };

    const analyzeSelectedGaps = async () => {
        if (selectedGaps.size === 0) {
            toast.error('Select at least one gap');
            return;
        }
        setStep('analyze');
        const toAnalyze = suggestions.filter(s => selectedGaps.has(s.id));
        for (const suggestion of toAnalyze) {
            analyzeGap(suggestion);
        }
    };

    const analyzeGap = async (suggestion: GapSuggestion) => {
        if (!state.transcript) return;
        setAnalyzingGaps(prev => new Set(prev).add(suggestion.id));
        try {
            let content = '';
            for await (const chunk of writerAgent.analyzeSegmentStream(
                suggestion.id,
                suggestion.title,
                suggestion.objective,
                suggestion.guidance,
                state.transcript
            )) {
                content += chunk;
                setStreamingContent(prev => new Map(prev).set(suggestion.id, content));
            }
            const analysis: SegmentAnalysis = {
                segmentId: suggestion.id,
                content,
                status: 'complete',
                generatedAt: new Date()
            };
            setGapAnalyses(prev => new Map(prev).set(suggestion.id, analysis));
            setStreamingContent(prev => {
                const m = new Map(prev);
                m.delete(suggestion.id);
                return m;
            });
        } catch (e) {
            console.error(e);
            toast.error(`Failed to analyze: ${suggestion.title}`);
        } finally {
            setAnalyzingGaps(prev => {
                const s = new Set(prev);
                s.delete(suggestion.id);
                return s;
            });
        }
    };

    const launchCritic = async (gapId: string) => {
        const analysis = gapAnalyses.get(gapId);
        const suggestion = suggestions.find(s => s.id === gapId);
        if (!analysis || !suggestion) return;
        setEvaluatingGaps(prev => new Set(prev).add(gapId));
        try {
            const evalResult = await criticAgent.evaluateSegment(
                gapId,
                analysis.content,
                suggestion.objective,
                state.transcript || ''
            );
            setEvaluations(prev => new Map(prev).set(gapId, evalResult));
            toast.success('Critic evaluation complete');
        } catch (e) {
            console.error(e);
            toast.error('Failed to evaluate segment');
        } finally {
            setEvaluatingGaps(prev => {
                const s = new Set(prev);
                s.delete(gapId);
                return s;
            });
        }
    };

    const addToMain = (gapId: string) => {
        const analysis = gapAnalyses.get(gapId);
        const suggestion = suggestions.find(s => s.id === gapId);

        if (!analysis) return;

        if (suggestion) {
            addGapToMainAnalysis(gapId, analysis, suggestion);
        } else {
            addGapToMainAnalysis(gapId, analysis);
        }

        // clean up local state
        setGapAnalyses(prev => {
            const m = new Map(prev);
            m.delete(gapId);
            return m;
        });
        setEvaluations(prev => {
            const m = new Map(prev);
            m.delete(gapId);
            return m;
        });
        setSelectedGaps(prev => {
            const s = new Set(prev);
            s.delete(gapId);
            return s;
        });

        toast.success(`"${suggestion?.title || 'Gap'}" added to main analysis`);
    };

    return (
        <div className="min-h-screen bg-solita-light-grey pb-24">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold text-solita-black flex items-center gap-3 mb-3">
                        <Search className="w-9 h-9 text-solita-ochre" />
                        Phase 4: Gap Analysis
                    </h1>
                    <p className="text-base text-solita-dark-grey">
                        Identify and analyze unexplored themes from the transcript
                    </p>
                </div>

                {/* Guided Hint */}
                <GuidedHint
                    hintId={PHASE_HINTS.phase3_5.gap.id}
                    title={PHASE_HINTS.phase3_5.gap.title}
                    description={PHASE_HINTS.phase3_5.gap.description}
                />

                {/* Identify Step */}
                {step === 'identify' && (
                    <>
                        {/* Custom Gap Form */}
                        {isAddingCustom && (
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-solita-black">Add Custom Gap</h2>
                                    <button onClick={() => setIsAddingCustom(false)} className="text-solita-mid-grey hover:text-solita-black">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <StandardInput
                                        label="Gap Title"
                                        value={customGap.title}
                                        onChange={(e) => setCustomGap(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Regulatory Compliance"
                                    />
                                    <StandardTextArea
                                        label="Objective"
                                        value={customGap.objective}
                                        onChange={(e) => setCustomGap(prev => ({ ...prev, objective: e.target.value }))}
                                        placeholder="What should be analyzed?"
                                    />
                                    <StandardTextArea
                                        label="Guidance (Optional)"
                                        value={customGap.guidance}
                                        onChange={(e) => setCustomGap(prev => ({ ...prev, guidance: e.target.value }))}
                                        placeholder="Specific instructions for the agent..."
                                    />
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => setIsAddingCustom(false)}
                                            className="px-4 py-2 bg-white border border-solita-light-grey text-solita-dark-grey rounded-lg hover:bg-solita-light-grey/50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddCustomGap}
                                            className="px-4 py-2 bg-solita-ochre text-white rounded-lg hover:bg-solita-ochre/90 transition-colors"
                                        >
                                            Add Gap
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Initial button */}
                        {suggestions.length === 0 && !isIdentifying && !isAddingCustom && (
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-solita-black mb-3">Discover Coverage Gaps</h2>
                                <p className="text-solita-dark-grey mb-4">
                                    AI will analyze your completed segments to identify themes, perspectives, or insights that weren't covered.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={identifyGaps} className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-smooth hover-lift button-press flex items-center gap-2">
                                        <Search className="w-5 h-5" /> Identify Coverage Gaps
                                    </button>
                                    <button onClick={() => setIsAddingCustom(true)} className="px-6 py-3 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                                        <Plus className="w-5 h-5" /> Add Custom Gap
                                    </button>
                                    <button onClick={proceedToNextPhase} className="px-6 py-3 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                                        Skip to Consolidation <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading state */}
                        {isIdentifying && (
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-solita-black mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-solita-ochre" /> Analyzing Coverage
                                </h2>
                                <div className="relative">
                                    <StreamingOutput
                                        content={identificationText}
                                        isStreaming={true}
                                        className="text-lg"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Suggestions list */}
                        {suggestions.length > 0 && !isIdentifying && (
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-solita-black mb-4">Suggested Gaps ({suggestions.length})</h2>
                                <p className="text-sm text-solita-dark-grey mb-4">
                                    Select the gaps you'd like to analyze. Each will be processed by a writer agent.
                                </p>
                                <div className="space-y-3">
                                    {suggestions.map(suggestion => (
                                        <div
                                            key={suggestion.id}
                                            onClick={() => toggleGapSelection(suggestion.id)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth hover-lift ${selectedGaps.has(suggestion.id) ? 'border-solita-ochre bg-solita-ochre/5' : 'border-solita-light-grey hover:border-solita-ochre/50'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-smooth ${selectedGaps.has(suggestion.id) ? 'border-solita-ochre bg-solita-ochre' : 'border-solita-mid-grey'}`}>
                                                    {selectedGaps.has(suggestion.id) && <CheckCircle className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-solita-black mb-1">{suggestion.title}</h3>
                                                    <p className="text-sm text-solita-dark-grey mb-2"><span className="font-medium">Objective:</span> {suggestion.objective}</p>
                                                    <p className="text-sm text-solita-mid-grey italic">{suggestion.rationale}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex gap-3">
                                        <button onClick={identifyGaps} className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Re-identify Gaps
                                        </button>
                                        <button onClick={() => setIsAddingCustom(true)} className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Add Custom Gap
                                        </button>
                                        <button onClick={proceedToNextPhase} className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                                            Skip to Consolidation <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button onClick={analyzeSelectedGaps} disabled={selectedGaps.size === 0} className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-smooth hover-lift button-press flex items-center gap-2">
                                        Analyze Selected Gaps ({selectedGaps.size}) <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Analyze Step */}
                {step === 'analyze' && (
                    <>
                        <div className="space-y-6 mb-6">
                            {suggestions.filter(s => selectedGaps.has(s.id)).map(suggestion => {
                                const analysis = gapAnalyses.get(suggestion.id);
                                const streaming = streamingContent.get(suggestion.id);
                                const isAnalyzing = analyzingGaps.has(suggestion.id);
                                const evaluation = evaluations.get(suggestion.id);
                                const isEvaluating = evaluatingGaps.has(suggestion.id);
                                return (
                                    <SegmentCard
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        analysis={analysis}
                                        streaming={streaming}
                                        isAnalyzing={isAnalyzing}
                                        evaluation={evaluation}
                                        isEvaluating={isEvaluating}
                                        onAnalysisChange={content => {
                                            const newMap = new Map(gapAnalyses);
                                            const existing = newMap.get(suggestion.id);
                                            if (existing) {
                                                newMap.set(suggestion.id, { ...existing, content });
                                            } else {
                                                newMap.set(suggestion.id, { segmentId: suggestion.id, content, status: 'complete', generatedAt: new Date() });
                                            }
                                            setGapAnalyses(newMap);
                                        }}
                                        onLaunchCritic={() => launchCritic(suggestion.id)}
                                        onAddToMain={() => addToMain(suggestion.id)}
                                        showAddButton={true}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex justify-between">
                            <button onClick={() => setStep('identify')} className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to Identification
                            </button>
                            <button onClick={proceedToNextPhase} className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-smooth hover-lift button-press flex items-center gap-2">
                                Proceed to Consolidation <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}

                {/* Back button when no suggestions */}
                {canGoBack && step === 'identify' && suggestions.length === 0 && (
                    <div className="mt-6">
                        <button onClick={goToPreviousPhase} className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-smooth flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Insight Extraction
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
