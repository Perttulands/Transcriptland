import { llmService } from './llm.service';
import { agentLogger } from './agent-logger.service';
import { settingsService } from './settings.service';
import { DEFAULT_INSTRUCTIONS } from '../constants/default-instructions';
import { CriticEvaluation } from '../types/phases';

export class CriticAgent {
    /**
     * Get the configured model for this agent
     */
    private getModel(): string {
        return settingsService.getAgentModel('critic');
    }

    /**
     * Evaluates a segment analysis for quality and source alignment
     */
    async evaluateSegment(
        segmentId: string,
        segmentContent: string,
        segmentObjective: string,
        transcript: string
    ): Promise<CriticEvaluation> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.critic.evaluateSegment;
        const systemPrompt = settingsService.getAgentInstruction('critic', 'evaluateSegment') || defaultPrompt;

        const userPrompt = `Segment Objective: ${segmentObjective}

Content to Evaluate:
${segmentContent}

Source Transcript:
${transcript}

Evaluate this content using ONLY these two criteria:

1. **Source Alignment**: Check if EVERY statement in the content is supported by the source transcript.
   - If even ONE statement is not supported, this is a FAIL
   - If FAIL, list the specific unsupported statements

2. **Objective Fulfillment**: Score from 0-100% how well the objective is met
   - Provide specific guidance on how to improve

Respond in this EXACT format:

## Source Alignment
[PASS or FAIL]
[If FAIL, list each unsupported statement on a new line starting with "- "]

## Objective Fulfillment
Score: [0-100]%

## Improvement Guidance
[Specific actionable guidance on how to improve the content]`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Critic Agent',
            'critic',
            systemPrompt,
            userPrompt,
            model
        );

        try {
            const result = await llmService.generateCompletion(systemPrompt, userPrompt, model);
            const duration = Date.now() - startTime;
            agentLogger.logResponse(logId, result.content, duration, result.usage ? {
                prompt: result.usage.prompt_tokens,
                completion: result.usage.completion_tokens,
                total: result.usage.total_tokens
            } : undefined);

            // Parse the structured response
            const sourceAlignmentMatch = result.content.match(/## Source Alignment\s+(PASS|FAIL)/i);
            const sourceAlignment = sourceAlignmentMatch?.[1]?.toUpperCase() === 'PASS';

            // Extract source alignment issues from bullet points
            const sourceAlignmentIssues: string[] = [];
            if (!sourceAlignment) {
                const issuesSection = result.content.match(/## Source Alignment[\s\S]*?(?=## Objective Fulfillment|$)/i)?.[0];
                if (issuesSection) {
                    const lines = issuesSection.split('\n');
                    // Extract bullet points from issues section
                    for (const line of lines) {
                        if (line.trim().match(/^[-•*]\s+/)) {
                            sourceAlignmentIssues.push(line.trim().replace(/^[-•*]\s+/, ''));
                        }
                    }
                }
            }

            // Extract objective fulfillment score
            const scoreMatch = result.content.match(/Score:\s*(\d+)%?/i);
            const objectiveFulfillmentScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

            // Extract improvement guidance
            const guidanceMatch = result.content.match(/## Improvement Guidance\s+([\s\S]*?)(?=##|$)/i);
            const improvementGuidance = guidanceMatch?.[1]?.trim() || 'No specific guidance provided';

            return {
                segmentId,
                evaluation: result.content.trim(),
                sourceAlignment,
                sourceAlignmentIssues: sourceAlignmentIssues.length > 0 ? sourceAlignmentIssues : undefined,
                objectiveFulfillmentScore,
                improvementGuidance,
                suggestions: [], // Legacy field
                generatedAt: new Date(),
            };
        } catch (error) {
            agentLogger.logError('Critic Agent', 'critic', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Evaluates a segment analysis for quality and source alignment (streaming version)
     */
    async *evaluateSegmentStream(
        _segmentId: string,
        segmentContent: string,
        segmentObjective: string,
        transcript: string
    ): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.critic.evaluateSegment;
        const systemPrompt = settingsService.getAgentInstruction('critic', 'evaluateSegment') || defaultPrompt;

        const userPrompt = `Segment Objective: ${segmentObjective}

Content to Evaluate:
${segmentContent}

Source Transcript:
${transcript}

Evaluate this content using the following rubric:
1. **Source Alignment**: Is every claim supported by the transcript?
2. **Completeness**: Does it fully address the objective?
3. **Clarity**: Is the writing clear and concise?

Output your evaluation in Markdown format.
If there are issues, provide specific suggestions for improvement.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Critic Agent',
            'critic',
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
            agentLogger.logError('Critic Agent', 'critic', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
}

export const criticAgent = new CriticAgent();
