import React from 'react';
import { GapSuggestion, SegmentAnalysis, CriticEvaluation } from '../types/phases';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { ElegantLoader } from '../components/ElegantLoader';
import { StreamingOutput } from './ui/StreamingOutput';
import { StandardTextArea } from './ui/StandardTextArea';

interface SegmentCardProps {
    suggestion: GapSuggestion;
    analysis?: SegmentAnalysis;
    streaming?: string;
    isAnalyzing: boolean;
    evaluation?: CriticEvaluation;
    isEvaluating: boolean;
    onAnalysisChange: (content: string) => void;
    onLaunchCritic: () => void;
    onAddToMain?: () => void; // optional for gap cards
    showAddButton?: boolean;
    onRewrite?: () => void;
    isRewriting?: boolean;
}

// Displays a segment with its analysis, critic evaluation, and action buttons
// Used for both main framework segments and gap analysis suggestions
export const SegmentCard: React.FC<SegmentCardProps> = ({
    suggestion,
    analysis,
    streaming,
    isAnalyzing,
    evaluation,
    isEvaluating,
    onAnalysisChange,
    onLaunchCritic,
    onAddToMain,
    showAddButton = false,
    onRewrite,
    isRewriting = false,
}) => {
    return (
        <div className="bg-white border border-solita-light-grey rounded-lg p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-solita-black mb-2">
                        {suggestion.title}
                    </h3>
                    <p className="text-sm text-solita-dark-grey mb-1">
                        <span className="font-medium">Objective:</span> {suggestion.objective}
                    </p>
                    <p className="text-xs text-solita-mid-grey italic">
                        {suggestion.rationale}
                    </p>
                </div>
            </div>

            {/* Analysis Content */}
            {isAnalyzing ? (
                <div className="mb-4">
                    <StreamingOutput
                        content={streaming || ''}
                        isStreaming={true}
                        label="Writer agent analyzing..."
                    />
                </div>
            ) : analysis ? (
                <div className="mb-4">
                    <StandardTextArea
                        value={analysis.content}
                        onChange={(e) => onAnalysisChange(e.target.value)}
                        variant="filled"
                        className="min-h-[400px]"
                    />
                </div>
            ) : null}

            {/* Critic Evaluation */}
            {evaluation && (
                <div className="mt-4 p-4 bg-solita-light-grey/30 border border-solita-light-grey rounded-lg">
                    <h4 className="font-semibold text-solita-black mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-solita-ochre" />
                        Critic Evaluation
                    </h4>

                    {/* Source Alignment */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            {evaluation.sourceAlignment ? (
                                <>
                                    <div className="w-5 h-5 rounded-full bg-solita-green flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-solita-green">Source Alignment: PASS</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-5 h-5 rounded-full bg-solita-red flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-solita-red">Source Alignment: FAIL</span>
                                </>
                            )}
                        </div>
                        {!evaluation.sourceAlignment && evaluation.sourceAlignmentIssues && (
                            <div className="ml-7 mt-2 text-sm text-solita-dark-grey">
                                <p className="font-medium mb-1">Unsupported statements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {evaluation.sourceAlignmentIssues.map((issue, idx) => (
                                        <li key={idx} className="text-solita-red">{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Objective Fulfillment */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-solita-black">Objective Fulfillment:</span>
                            <span className="text-lg font-semibold text-solita-ochre">{evaluation.objectiveFulfillmentScore}%</span>
                        </div>
                        <div className="w-full bg-solita-light-grey rounded-full h-2 mb-2">
                            <div
                                className="bg-solita-ochre h-2 rounded-full transition-all duration-500"
                                style={{ width: `${evaluation.objectiveFulfillmentScore}%` }}
                            />
                        </div>
                        <div className="text-sm text-solita-dark-grey">
                            <p className="font-medium mb-1">How to improve:</p>
                            <p className="whitespace-pre-wrap">{evaluation.improvementGuidance}</p>
                        </div>
                    </div>

                    {/* Rewrite Button */}
                    {onRewrite && (
                        <button
                            onClick={onRewrite}
                            disabled={isRewriting}
                            className="mt-2 px-4 py-2 bg-solita-green hover:bg-solita-green/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-smooth hover-lift button-press flex items-center gap-2"
                        >
                            {isRewriting ? (
                                <>
                                    <ElegantLoader size="sm" /> Rewriting...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" /> Rewrite Segment
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {analysis && (
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={onLaunchCritic}
                        disabled={isEvaluating}
                        className="px-4 py-2 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-smooth hover-lift button-press flex items-center gap-2"
                    >
                        {isEvaluating ? (
                            <>
                                <ElegantLoader size="sm" /> Evaluating...
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4" /> Launch Critic
                            </>
                        )}
                    </button>
                    {showAddButton && onAddToMain && (
                        <button
                            onClick={onAddToMain}
                            className="px-4 py-2 bg-solita-green hover:bg-solita-green/90 text-white rounded-lg transition-smooth hover-lift button-press flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add to Main Analysis
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
