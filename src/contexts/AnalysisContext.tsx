import { createContext, useContext, useState, ReactNode } from 'react';
import { Phase, AnalysisState, PlannerOutput, AnalysisFramework, SegmentAnalysis, GapAnalysis, FrameworkSegment, GapSuggestion } from '../types/phases';

interface AnalysisContextType {
    state: AnalysisState;
    setPhase1Data: (plannerOutput: PlannerOutput, transcript: string) => void;
    setPhase2Data: (framework: AnalysisFramework) => void;
    setPhase3Data: (analyses: SegmentAnalysis[]) => void;
    setGapAnalysis: (analysis: GapAnalysis) => void;
    addGapToMainAnalysis: (gapId: string, analysis: SegmentAnalysis, suggestion?: GapSuggestion) => void;
    setPhase4Data: () => void;
    resetAnalysis: () => void;
    canProceedToPhase: (phase: Phase) => boolean;
    currentPhase: Phase;
    setCurrentPhase: (phase: Phase) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

// Central state management for the multi-phase analysis workflow
// Manages transcript, planner output, framework, analyses, and gap analysis
export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AnalysisState>({
        currentPhase: Phase.UPLOAD_ALIGN,
        transcript: '',
        plannerOutput: undefined,
        framework: undefined,
        segmentAnalyses: new Map(),
        criticEvaluations: new Map(),
        gapAnalysis: undefined,
    });

    // Update planner output and transcript for Phase 1
    const setPhase1Data = (plannerOutput: PlannerOutput, transcript: string) => {
        setState(prev => ({
            ...prev,
            plannerOutput,
            transcript,
            currentPhase: Phase.UPLOAD_ALIGN,
        }));
    };

    const setPhase2Data = (framework: AnalysisFramework) => {
        setState(prev => ({
            ...prev,
            framework,
            currentPhase: Phase.PROCESSING_VALIDATION,
        }));
    };

    const setPhase3Data = (analyses: SegmentAnalysis[]) => {
        const analysesMap = new Map<string, SegmentAnalysis>();
        analyses.forEach(analysis => {
            analysesMap.set(analysis.segmentId, analysis);
        });

        setState(prev => ({
            ...prev,
            segmentAnalyses: analysesMap,
            currentPhase: Phase.INSIGHT_EXTRACTION,
        }));
    };

    const setGapAnalysis = (analysis: GapAnalysis) => {
        setState(prev => ({
            ...prev,
            gapAnalysis: {
                ...analysis,
                suggestions: analysis.suggestions || [],
                analyzedGaps: analysis.analyzedGaps || new Map()
            },
            currentPhase: Phase.GAP_ANALYSIS,
        }));
    };

    // Move a gap analysis into the main framework as a permanent segment
    const addGapToMainAnalysis = (gapId: string, analysis: SegmentAnalysis, suggestion?: GapSuggestion) => {
        setState(prev => {
            const newAnalyses = new Map(prev.segmentAnalyses);
            newAnalyses.set(gapId, analysis);

            // Find the suggestion to add to framework
            const targetSuggestion = suggestion || prev.gapAnalysis?.suggestions.find(s => s.id === gapId);
            let newFramework = prev.framework;

            if (targetSuggestion && prev.framework) {
                const newSegment: FrameworkSegment = {
                    id: targetSuggestion.id,
                    title: targetSuggestion.title,
                    objective: targetSuggestion.objective,
                    guidance: targetSuggestion.guidance,
                    order: prev.framework.segments.length + 1
                };
                newFramework = {
                    ...prev.framework,
                    segments: [...prev.framework.segments, newSegment]
                };
            }

            // Remove from gap analysis
            const newGapAnalyses = new Map(prev.gapAnalysis?.analyzedGaps || new Map());
            newGapAnalyses.delete(gapId);

            return {
                ...prev,
                segmentAnalyses: newAnalyses,
                framework: newFramework,
                gapAnalysis: prev.gapAnalysis ? {
                    ...prev.gapAnalysis,
                    analyzedGaps: newGapAnalyses
                } : undefined
            };
        });
    };

    const setPhase4Data = () => {
        setState(prev => ({
            ...prev,
            currentPhase: Phase.CONSOLIDATION,
        }));
    };

    const resetAnalysis = () => {
        setState({
            currentPhase: Phase.UPLOAD_ALIGN,
            transcript: '',
            plannerOutput: undefined,
            framework: undefined,
            segmentAnalyses: new Map(),
            criticEvaluations: new Map(),
            gapAnalysis: undefined,
        });
    };

    const canProceedToPhase = (phase: Phase): boolean => {
        switch (phase) {
            case Phase.UPLOAD_ALIGN:
                return true;
            case Phase.PROCESSING_VALIDATION:
                return state.plannerOutput !== undefined && state.transcript !== '';
            case Phase.INSIGHT_EXTRACTION:
                return state.framework !== undefined;
            case Phase.GAP_ANALYSIS:
                return state.segmentAnalyses.size > 0;
            case Phase.CONSOLIDATION:
                return state.segmentAnalyses.size > 0; // Can skip gap analysis
            default:
                return false;
        }
    };

    const setCurrentPhase = (phase: Phase) => {
        setState(prev => ({ ...prev, currentPhase: phase }));
    };

    return (
        <AnalysisContext.Provider
            value={{
                state,
                setPhase1Data,
                setPhase2Data,
                setPhase3Data,
                setGapAnalysis,
                addGapToMainAnalysis,
                setPhase4Data,
                resetAnalysis,
                canProceedToPhase,
                currentPhase: state.currentPhase,
                setCurrentPhase,
            }}
        >
            {children}
        </AnalysisContext.Provider>
    );
}

export function useAnalysisContext() {
    const context = useContext(AnalysisContext);
    if (context === undefined) {
        throw new Error('useAnalysisContext must be used within an AnalysisProvider');
    }
    return context;
}
