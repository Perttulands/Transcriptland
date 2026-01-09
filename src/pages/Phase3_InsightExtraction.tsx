import { useState } from 'react';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { usePhaseNavigation } from '../hooks/usePhaseNavigation';
import { ElegantLoader } from '../components/ElegantLoader';
import { SegmentCard } from '../components/SegmentCard';
import { writerAgent } from '../services/writer.agent';
import { criticAgent } from '../services/critic.agent';
import { SegmentAnalysis, CriticEvaluation } from '../types/phases';
import { Lightbulb, ArrowRight, ArrowLeft, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { GuidedHint } from '../components/GuidedHint';
import { PHASE_HINTS } from '../constants/hints';

export function Phase3_InsightExtraction() {
    const { state, setPhase3Data } = useAnalysisContext();
    const { proceedToNextPhase, goToPreviousPhase, canGoBack, skipToConsolidation, canProceed } = usePhaseNavigation();

    const [analyses, setAnalyses] = useState<Map<string, SegmentAnalysis>>(state.segmentAnalyses);
    const [criticEvaluations, setCriticEvaluations] = useState<Map<string, CriticEvaluation>>(state.criticEvaluations);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzingSegments, setAnalyzingSegments] = useState<Set<string>>(new Set());
    const [streamingContent, setStreamingContent] = useState<Map<string, string>>(new Map());
    const [evaluatingSegments, setEvaluatingSegments] = useState<Set<string>>(new Set());
    const [rewritingSegments, setRewritingSegments] = useState<Set<string>>(new Set());

    const segments = state.framework?.segments || [];

    const launchAnalysisTeam = async () => {
        if (!state.framework || !state.transcript) {
            toast.error('Missing framework or transcript');
            return;
        }

        setIsAnalyzing(true);
        const analyzing = new Set(segments.map(s => s.id));
        setAnalyzingSegments(analyzing);
        setStreamingContent(new Map());

        // Initialize empty analyses to show cards immediately
        const initialAnalyses = new Map(analyses);
        segments.forEach(segment => {
            if (!initialAnalyses.has(segment.id)) {
                initialAnalyses.set(segment.id, {
                    segmentId: segment.id,
                    content: '',
                    status: 'pending',
                    generatedAt: new Date()
                });
            }
        });
        setAnalyses(initialAnalyses);

        try {
            // Launch all writer agents in parallel with streaming
            const promises = segments.map(async (segment) => {
                let content = '';

                for await (const chunk of writerAgent.analyzeSegmentStream(
                    segment.id,
                    segment.title,
                    segment.objective,
                    segment.guidance,
                    state.transcript
                )) {
                    content += chunk;
                    setStreamingContent(prev => new Map(prev).set(segment.id, content));
                }

                return {
                    segmentId: segment.id,
                    content: content.trim(),
                    status: 'complete' as const,
                    generatedAt: new Date(),
                };
            });

            const results = await Promise.all(promises);

            const newAnalyses = new Map<string, SegmentAnalysis>();
            results.forEach((result: SegmentAnalysis) => {
                newAnalyses.set(result.segmentId, result);
            });

            setAnalyses(newAnalyses);
            setPhase3Data(Array.from(newAnalyses.values()));
            toast.success('All segments analyzed!');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Some analyses failed. Check the log panel.');
        } finally {
            setIsAnalyzing(false);
            setAnalyzingSegments(new Set());
            setStreamingContent(new Map());
        }
    };

    const launchCritic = async (segmentId: string) => {
        const analysis = analyses.get(segmentId);
        const segment = segments.find(s => s.id === segmentId);

        if (!analysis || !segment || !state.transcript) {
            toast.error('Missing data for critic evaluation');
            return;
        }

        setEvaluatingSegments(prev => new Set(prev).add(segmentId));

        try {
            const evaluation = await criticAgent.evaluateSegment(
                segmentId,
                analysis.content,
                segment.objective,
                state.transcript
            );

            setCriticEvaluations(prev => new Map(prev).set(segmentId, evaluation));
            toast.success('Evaluation complete!');
        } catch (error) {
            console.error('Evaluation failed:', error);
            toast.error('Evaluation failed. Check the log panel.');
        } finally {
            setEvaluatingSegments(prev => {
                const next = new Set(prev);
                next.delete(segmentId);
                return next;
            });
        }
    };

    const rewriteSegment = async (segmentId: string) => {
        const analysis = analyses.get(segmentId);
        const evaluation = criticEvaluations.get(segmentId);
        const segment = segments.find(s => s.id === segmentId);

        if (!analysis || !evaluation || !segment || !state.transcript) {
            toast.error('Missing data for rewrite');
            return;
        }

        setRewritingSegments(prev => new Set(prev).add(segmentId));

        try {
            const rewritten = await writerAgent.rewriteSegment(
                analysis.content,
                evaluation.evaluation,
                segment.objective,
                state.transcript
            );

            const updatedAnalysis: SegmentAnalysis = {
                ...analysis,
                content: rewritten,
                generatedAt: new Date(),
            };

            setAnalyses(prev => new Map(prev).set(segmentId, updatedAnalysis));
            setPhase3Data(Array.from(new Map(analyses).set(segmentId, updatedAnalysis).values()));

            // Clear the evaluation so user can re-evaluate if needed
            setCriticEvaluations(prev => {
                const next = new Map(prev);
                next.delete(segmentId);
                return next;
            });

            toast.success('Segment rewritten!');
        } catch (error) {
            console.error('Rewrite failed:', error);
            toast.error('Rewrite failed. Check the log panel.');
        } finally {
            setRewritingSegments(prev => {
                const next = new Set(prev);
                next.delete(segmentId);
                return next;
            });
        }
    };

    return (
        <div className="min-h-screen bg-solita-light-grey pb-24">
            <div className="container mx-auto px-6 py-12 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold text-solita-black flex items-center gap-3 mb-3">
                        <Lightbulb className="w-9 h-9 text-solita-ochre" />
                        Phase 3: Insight Extraction
                    </h1>
                    <p className="text-base text-solita-dark-grey">
                        Launch writer agents to analyze each segment in parallel
                    </p>
                </div>

                {/* Guided Hint */}
                <GuidedHint
                    hintId={PHASE_HINTS.phase3.analysis.id}
                    title={PHASE_HINTS.phase3.analysis.title}
                    description={PHASE_HINTS.phase3.analysis.description}
                />

                {/* Launch Analysis Team Button */}
                {analyses.size === 0 && (
                    <div className="bg-white border border-solita-light-grey rounded-lg p-8 mb-6 shadow-sm text-center">
                        <Lightbulb className="w-12 h-12 text-solita-ochre mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-solita-black mb-2">
                            Ready to Launch Analysis Team
                        </h3>
                        <p className="text-solita-dark-grey mb-6">
                            {segments.length} writer agents will analyze the transcript in parallel
                        </p>
                        <button
                            onClick={launchAnalysisTeam}
                            disabled={isAnalyzing}
                            className="px-8 py-3 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                        >
                            {isAnalyzing ? (
                                <ElegantLoader message="Analyzing..." size="sm" />
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Launch Analysis Team
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Segment Analyses */}
                {analyses.size > 0 && (
                    <>
                        <div className="space-y-6 mb-6">
                            {segments.map((segment) => {
                                const analysis = analyses.get(segment.id);
                                const evaluation = criticEvaluations.get(segment.id);
                                const isAnalyzingThis = analyzingSegments.has(segment.id);
                                const isEvaluating = evaluatingSegments.has(segment.id);
                                const isRewriting = rewritingSegments.has(segment.id);

                                return (
                                    <SegmentCard
                                        key={segment.id}
                                        suggestion={{
                                            id: segment.id,
                                            title: segment.title,
                                            objective: segment.objective,
                                            guidance: segment.guidance,
                                            rationale: ''
                                        }}
                                        analysis={analysis}
                                        streaming={streamingContent.get(segment.id)}
                                        isAnalyzing={isAnalyzingThis}
                                        evaluation={evaluation}
                                        isEvaluating={isEvaluating}
                                        onAnalysisChange={(content) => {
                                            const newAnalyses = new Map(analyses);
                                            if (analysis) {
                                                newAnalyses.set(segment.id, {
                                                    ...analysis,
                                                    content
                                                });
                                                setAnalyses(newAnalyses);
                                                setPhase3Data(Array.from(newAnalyses.values()));
                                            }
                                        }}
                                        onLaunchCritic={() => launchCritic(segment.id)}
                                        onRewrite={() => rewriteSegment(segment.id)}
                                        isRewriting={isRewriting}
                                    />
                                );
                            })}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between gap-4">
                            {canGoBack && (
                                <button
                                    onClick={goToPreviousPhase}
                                    className="px-6 py-3 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Framework
                                </button>
                            )}
                            <div className="flex gap-4 ml-auto">
                                <button
                                    onClick={skipToConsolidation}
                                    className="px-6 py-3 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Skip to Consolidation
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={proceedToNextPhase}
                                    disabled={!canProceed}
                                    className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Proceed to Gap Analysis
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
