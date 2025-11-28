import { llmService } from './llm.service';
import { agentLogger } from './agent-logger.service';
import { settingsService } from './settings.service';
import { DEFAULT_INSTRUCTIONS } from '../constants/default-instructions';
import { GapAnalysis, GapSuggestion, AnalysisFramework, SegmentAnalysis } from '../types/phases';

export class GapAnalysisAgent {
    /**
     * Get the configured model for this agent
     */
    private getModel(): string {
        return settingsService.getAgentModel('gapAnalysis');
    }

    /**
     * Step 1: Identify coverage gaps and suggest new segments
     */
    async *identifyGaps(
        transcript: string,
        framework: AnalysisFramework,
        segmentAnalyses: SegmentAnalysis[]
    ): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.gapAnalysis.analyzeGaps;
        const systemPrompt = settingsService.getAgentInstruction('gapAnalysis', 'analyzeGaps') || defaultPrompt;

        const analyzedTopics = framework.segments.map(s => `- ${s.title}: ${s.objective}`).join('\n');
        const analysisContent = segmentAnalyses
            .map(a => `### ${framework.segments.find(s => s.id === a.segmentId)?.title}\n${a.content.substring(0, 500)}...`)
            .join('\n\n');

        const userPrompt = `Transcript:
${transcript}

Framework Segments Analyzed:
${analyzedTopics}

Sample of Completed Analyses:
${analysisContent}

Identify themes, perspectives, or insights from the transcript that were NOT covered by these analyses.

Output a JSON array of gap suggestions in this format:
\`\`\`json
[
  {
    "title": "Title of the gap",
    "objective": "What this analysis should discover",
    "guidance": "Instructions for the writer agent",
    "rationale": "Why this gap exists and why it matters"
  }
]
\`\`\`
`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Gap Analysis Agent',
            'identify-gaps',
            systemPrompt,
            userPrompt,
            model
        );

        try {
            let fullResponse = '';
            for await (const chunk of llmService.generateCompletionStream(systemPrompt, userPrompt, model)) {
                fullResponse += chunk;
                yield chunk;
            }

            const duration = Date.now() - startTime;
            agentLogger.logResponse(logId, fullResponse, duration);
        } catch (error) {
            agentLogger.logError('Gap Analysis Agent', 'identify-gaps', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Step 2: Analyzes coverage gaps in the completed segment analyses (legacy method)
     */
    async *analyzeGaps(
        transcript: string,
        framework: AnalysisFramework,
        segmentAnalyses: SegmentAnalysis[]
    ): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.gapAnalysis.analyzeGaps;
        const systemPrompt = settingsService.getAgentInstruction('gapAnalysis', 'analyzeGaps') || defaultPrompt;

        // Build context about what was analyzed
        const analyzedTopics = framework.segments.map(s => `- ${s.title}: ${s.objective}`).join('\n');
        const analysisContent = segmentAnalyses
            .map(a => `### ${framework.segments.find(s => s.id === a.segmentId)?.title}\n${a.content.substring(0, 500)}...`)
            .join('\n\n');

        const userPrompt = `Transcript:
${transcript}

Framework Segments Analyzed:
${analyzedTopics}

Sample of Completed Analyses:
${analysisContent}

Analyze what themes, perspectives, or insights from the transcript were NOT covered by these analyses.
Output your analysis in Markdown format with the following sections:
# Gap Analysis Summary
## Uncovered Themes
## Alternative Perspectives
## Recommendations

IMPORTANT: At the end of your response, provide a JSON block defining new segments to address these gaps.
The JSON block must be wrapped in \`\`\`json ... \`\`\` and follow this structure:
[
  {
    "title": "Title of the new segment",
    "objective": "Objective for the new analysis",
    "guidance": "Guidance for the writer agent"
  }
]
`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Gap Analysis Agent',
            'gap-analysis',
            systemPrompt,
            userPrompt,
            model
        );

        try {
            let fullResponse = '';

            for await (const chunk of llmService.generateCompletionStream(systemPrompt, userPrompt, model)) {
                fullResponse += chunk;
                yield chunk;
            }

            const duration = Date.now() - startTime;
            agentLogger.logResponse(logId, fullResponse, duration);
        } catch (error) {
            agentLogger.logError('Gap Analysis Agent', 'gap-analysis', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Parse gap suggestions from JSON code block in LLM response
     */
    parseGapSuggestions(text: string): GapSuggestion[] {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
            console.error('No JSON block found in gap identification response');
            return [];
        }

        try {
            const suggestions = JSON.parse(jsonMatch[1]);
            return suggestions.map((s: any, i: number) => ({
                id: `gap-${Date.now()}-${i}`,
                title: s.title,
                objective: s.objective,
                guidance: s.guidance,
                rationale: s.rationale || 'No rationale provided'
            }));
        } catch (e) {
            console.error('Failed to parse gap suggestions JSON', e);
            return [];
        }
    }

    /**
     * Parse the streamed response to extract JSON segments (legacy method)
     */
    parseGapAnalysis(text: string): GapAnalysis {
        let newSegments: any[] = [];
        let summary = text;

        // Extract JSON block
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                newSegments = JSON.parse(jsonMatch[1]);
                // Remove the JSON block from the summary for cleaner display
                summary = text.replace(jsonMatch[0], '').trim();
            } catch (e) {
                console.error('Failed to parse segments JSON', e);
            }
        }

        return {
            uncoveredThemes: [],
            alternativePerspectives: [],
            recommendations: [],
            summary: summary,
            suggestions: [],
            analyzedGaps: new Map(),
            newSegments: newSegments.map((s, i) => ({
                id: `gap-segment-${Date.now()}-${i}`,
                title: s.title,
                objective: s.objective,
                guidance: s.guidance,
                order: 999 + i // Temporary order
            })),
            generatedAt: new Date(),
        };
    }
}

export const gapAnalysisAgent = new GapAnalysisAgent();
