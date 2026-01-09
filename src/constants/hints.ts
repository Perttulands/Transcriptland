// Guided hint content for each phase of the analysis workflow
// These hints help new users understand what to do at each step

export interface HintContent {
    id: string;
    title: string;
    description: string;
}

export const PHASE_HINTS = {
    phase1: {
        upload: {
            id: 'phase1-upload',
            title: 'Upload Your Transcript',
            description: 'Upload a transcript file (.txt, .md, .docx) or paste text directly into the text area. The AI will analyze your content to understand its context.',
        },
        analyze: {
            id: 'phase1-analyze',
            title: 'Analyze Context',
            description: 'Click "Analyze Context" to let the AI identify the topic, suggest relevant tags, and define an analysis objective. This helps frame the subsequent analysis.',
        },
        edit: {
            id: 'phase1-edit',
            title: 'Review & Customize',
            description: 'The AI suggestions are a starting point. Feel free to edit the context understanding, add or remove tags, and refine the objective to better match your needs.',
        },
    },
    phase2: {
        framework: {
            id: 'phase2-framework',
            title: 'Analysis Framework',
            description: 'The framework divides your analysis into focused segments. Each segment has a title, objective, and guidance that directs how the AI will analyze that aspect of your transcript.',
        },
        segments: {
            id: 'phase2-segments',
            title: 'Customize Segments',
            description: 'You can add, edit, delete, or reorder segments to match your analysis needs. Each segment will be analyzed independently by a dedicated AI writer.',
        },
    },
    phase3: {
        analysis: {
            id: 'phase3-analysis',
            title: 'Parallel Analysis',
            description: 'Click "Launch Analysis Team" to start. Multiple AI writers analyze each segment simultaneously, and results stream in real-time as the transcript is processed.',
        },
        evaluate: {
            id: 'phase3-evaluate',
            title: 'Evaluate & Refine',
            description: 'Use the "Evaluate" button to get feedback from an AI critic on each analysis. If improvements are needed, click "Rewrite" to generate an improved version.',
        },
    },
    phase3_5: {
        gap: {
            id: 'phase35-gap',
            title: 'Identify Missing Perspectives',
            description: 'Gap analysis identifies themes or perspectives not covered in your initial analysis. Select any gaps you want to explore, and the AI will generate additional insights.',
        },
    },
    phase4: {
        consolidation: {
            id: 'phase4-consolidation',
            title: 'Review & Export',
            description: 'Your complete analysis is compiled here in markdown format. Review the content, make any final edits, then copy to clipboard or download as a file.',
        },
    },
} as const;
