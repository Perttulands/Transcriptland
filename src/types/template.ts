import { FrameworkSegment } from './phases';

export interface ParsedTemplate {
    contextUnderstanding: string;
    tags: string[];
    analysisObjective: string;
    frameworkSegments: FrameworkSegment[];
}

export interface SavedTemplate {
    id: string;
    name: string;
    createdAt: string;
    rawText: string;
    parsed: ParsedTemplate;
}
