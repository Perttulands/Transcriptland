// Phase-related types for the multi-phase user journey

export enum Phase {
    UPLOAD_ALIGN = 'upload_align',
    PROCESSING_VALIDATION = 'processing_validation',
    INSIGHT_EXTRACTION = 'insight_extraction',
    GAP_ANALYSIS = 'gap_analysis',
    CONSOLIDATION = 'consolidation',
}

export interface PlannerOutput {
    contextUnderstanding: string;
    metadataTags: string[];
    analysisObjective: string;
}

export interface FrameworkSegment {
    id: string;
    title: string;
    objective: string;
    guidance: string;
    order: number;
}

export interface AnalysisFramework {
    metadata: {
        title: string;
        created: Date;
        objective: string;
        tags: string[];
    };
    segments: FrameworkSegment[];
}

export interface SegmentAnalysis {
    segmentId: string;
    content: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
    generatedAt?: Date;
}

export interface CriticEvaluation {
    segmentId: string;
    evaluation: string; // Full markdown evaluation for rendering
    sourceAlignment: boolean; // Pass/fail
    sourceAlignmentIssues?: string[]; // Specific unsupported statements if fail
    objectiveFulfillmentScore: number; // 0-100
    improvementGuidance: string; // How to improve
    suggestions: string[]; // Legacy field for backward compatibility
    generatedAt: Date;
}

export interface GapSuggestion {
    id: string;
    title: string;
    objective: string;
    guidance: string;
    rationale: string; // Why this gap exists
}

export interface GapAnalysis {
    uncoveredThemes: Array<{
        theme: string;
        description: string;
        relevance: string;
    }>;
    alternativePerspectives: Array<{
        perspective: string;
        rationale: string;
    }>;
    recommendations: string[];
    summary: string;
    suggestions: GapSuggestion[]; // Step 1: Identified gaps
    analyzedGaps: Map<string, SegmentAnalysis>; // Step 2: Analyzed gaps
    newSegments: FrameworkSegment[]; // Legacy - for backward compatibility
    generatedAt: Date;
}

export interface AnalysisState {
    currentPhase: Phase;
    transcript: string;
    plannerOutput?: PlannerOutput;
    framework?: AnalysisFramework;
    importedFramework?: AnalysisFramework;
    segmentAnalyses: Map<string, SegmentAnalysis>;
    criticEvaluations: Map<string, CriticEvaluation>;
    gapAnalysis?: GapAnalysis;
}

