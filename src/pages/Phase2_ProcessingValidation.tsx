import { useState } from 'react';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { usePhaseNavigation } from '../hooks/usePhaseNavigation';
import { FrameworkSegmentCard } from '../components/FrameworkSegmentCard';
import { ElegantLoader } from '../components/ElegantLoader';
import { plannerAgent } from '../services/planner.agent';
import { FrameworkSegment } from '../types/phases';
import { Reorder } from 'framer-motion';
import { FileText, Sparkles, ArrowRight, ArrowLeft, Plus, Tag } from 'lucide-react';
import { StreamingOutput } from '../components/ui/StreamingOutput';
import toast from 'react-hot-toast';
import { GuidedHint } from '../components/GuidedHint';
import { PHASE_HINTS } from '../constants/hints';

export function Phase2_ProcessingValidation() {
    const { state, setPhase2Data } = useAnalysisContext();
    const { proceedToNextPhase, goToPreviousPhase, canGoBack } = usePhaseNavigation();

    const [isGenerating, setIsGenerating] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [segments, setSegments] = useState<FrameworkSegment[]>(state.framework?.segments || []);

    const generateFramework = async () => {
        if (!state.plannerOutput || !state.transcript) {
            toast.error('Missing Phase 1 data');
            return;
        }

        setIsGenerating(true);
        setStreamingText('');

        try {
            let fullText = '';
            for await (const chunk of plannerAgent.generateFrameworkStream(
                state.transcript,
                state.plannerOutput.contextUnderstanding,
                state.plannerOutput.analysisObjective,
                state.plannerOutput.metadataTags
            )) {
                fullText += chunk;
                setStreamingText(fullText);
            }

            // Parse the framework from the streamed text
            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const rawSegments = parsed.segments || parsed.Segments || [];
                const frameworkSegments: FrameworkSegment[] = rawSegments.map((seg: any, index: number) => ({
                    id: `segment-${Date.now()}-${index}`,
                    title: seg.title || seg.Title || 'Untitled Segment',
                    objective: seg.objective || seg.Objective || 'No objective provided',
                    guidance: seg.guidance || seg.Guidance || 'No guidance provided',
                    order: index,
                }));

                const framework = {
                    metadata: {
                        title: `Analysis: ${state.plannerOutput.contextUnderstanding}`,
                        created: new Date(),
                        objective: state.plannerOutput.analysisObjective,
                        tags: state.plannerOutput.metadataTags,
                    },
                    segments: frameworkSegments,
                };

                setSegments(framework.segments);
                setPhase2Data(framework);
                toast.success('Framework generated!');
            }
        } catch (error) {
            console.error('Framework generation failed:', error);
            toast.error('Failed to generate framework. Please try again.');
        } finally {
            setIsGenerating(false);
            setStreamingText('');
        }
    };

    const updateSegment = (index: number, updated: FrameworkSegment) => {
        const newSegments = [...segments];
        newSegments[index] = updated;
        setSegments(newSegments);

        // Update context
        if (state.framework) {
            setPhase2Data({
                ...state.framework,
                segments: newSegments,
            });
        }
    };

    const handleReorder = (newOrder: FrameworkSegment[]) => {
        const reordered = newOrder.map((seg, i) => ({ ...seg, order: i }));
        setSegments(reordered);

        if (state.framework) {
            setPhase2Data({
                ...state.framework,
                segments: reordered,
            });
        }
    };

    const deleteSegment = (index: number) => {
        const newSegments = segments.filter((_, i) => i !== index);
        // Reorder remaining segments
        const reordered = newSegments.map((seg, i) => ({ ...seg, order: i }));
        setSegments(reordered);

        if (state.framework) {
            setPhase2Data({
                ...state.framework,
                segments: reordered,
            });
        }
    };

    const addSegment = () => {
        const newSegment: FrameworkSegment = {
            id: `segment-${Date.now()}`,
            title: 'New Segment',
            objective: 'Define the objective for this segment',
            guidance: 'Provide guidance on how to analyze this aspect',
            order: segments.length,
        };

        const newSegments = [...segments, newSegment];
        setSegments(newSegments);

        if (state.framework) {
            setPhase2Data({
                ...state.framework,
                segments: newSegments,
            });
        }
    };

    const proceedToPhase3 = () => {
        if (segments.length === 0) {
            toast.error('Please generate a framework first');
            return;
        }

        proceedToNextPhase();
    };

    return (
        <div className="min-h-screen bg-solita-light-grey pb-24">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold text-solita-black flex items-center gap-3 mb-3">
                        <FileText className="w-9 h-9 text-solita-ochre" />
                        Phase 2: Processing & Validation
                    </h1>
                    <p className="text-base text-solita-dark-grey">
                        Generate and refine the analysis framework
                    </p>
                </div>

                {/* Guided Hint */}
                <GuidedHint
                    hintId={PHASE_HINTS.phase2.framework.id}
                    title={PHASE_HINTS.phase2.framework.title}
                    description={PHASE_HINTS.phase2.framework.description}
                />

                {/* Phase 1 Summary */}
                <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-solita-black mb-4">Phase 1 Summary</h2>

                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-solita-dark-grey">Context:</span>
                            <p className="text-solita-black">{state.plannerOutput?.contextUnderstanding}</p>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-solita-dark-grey">Objective:</span>
                            <p className="text-solita-black">{state.plannerOutput?.analysisObjective}</p>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-solita-dark-grey flex items-center gap-2 mb-2">
                                <Tag className="w-4 h-4 text-solita-green" />
                                Tags:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {state.plannerOutput?.metadataTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-solita-green/10 text-solita-green rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Framework Button */}
                {segments.length === 0 && (
                    <div className="bg-white border border-solita-light-grey rounded-lg p-8 mb-6 shadow-sm text-center">
                        <Sparkles className="w-12 h-12 text-solita-ochre mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-solita-black mb-2">
                            Ready to Generate Framework
                        </h3>
                        <p className="text-solita-dark-grey mb-6">
                            AI will create a structured framework with 3-5 segments to guide your analysis
                        </p>
                        <button
                            onClick={generateFramework}
                            disabled={isGenerating}
                            className="px-8 py-3 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                        >
                            {isGenerating ? (
                                <ElegantLoader message="Generating Framework..." size="sm" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Analysis Framework
                                </>
                            )}
                        </button>
                        {isGenerating && streamingText && (
                            <div className="mt-6">
                                <StreamingOutput
                                    content={streamingText}
                                    isStreaming={true}
                                    label="Streaming framework..."
                                    className="text-lg"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Framework Segments */}
                {segments.length > 0 && (
                    <>
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold text-solita-black">
                                    Analysis Framework
                                </h2>
                                <button
                                    onClick={addSegment}
                                    className="px-4 py-2 bg-solita-green hover:bg-solita-green/90 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Segment
                                </button>
                            </div>

                            <Reorder.Group axis="y" values={segments} onReorder={handleReorder} className="space-y-4">
                                {segments.map((segment, index) => (
                                    <Reorder.Item key={segment.id} value={segment} dragListener={false}>
                                        <div className="relative group">

                                            <FrameworkSegmentCard
                                                segment={segment}
                                                onUpdate={(updated) => updateSegment(index, updated)}
                                                onDelete={() => deleteSegment(index)}
                                            />
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between">
                            {canGoBack && (
                                <button
                                    onClick={goToPreviousPhase}
                                    className="px-6 py-3 bg-white border border-solita-light-grey hover:border-solita-dark-grey text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Upload & Align
                                </button>
                            )}
                            <button
                                onClick={proceedToPhase3}
                                className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-colors flex items-center gap-2 ml-auto"
                            >
                                Proceed to Insight Extraction
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
