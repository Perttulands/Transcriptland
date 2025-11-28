import { llmService } from './llm.service';
import { agentLogger } from './agent-logger.service';
import { settingsService } from './settings.service';
import { DEFAULT_INSTRUCTIONS } from '../constants/default-instructions';
import { SegmentAnalysis } from '../types/phases';

export class WriterAgent {
    /**
     * Get the configured model for this agent
     */
    private getModel(): string {
        return settingsService.getAgentModel('writer');
    }

    /**
     * Analyzes a single segment of the transcript
     */
    async analyzeSegment(
        segmentId: string,
        segmentTitle: string,
        segmentObjective: string,
        segmentGuidance: string,
        transcript: string
    ): Promise<SegmentAnalysis> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.writer.analyzeSegment;
        const systemPrompt = settingsService.getAgentInstruction('writer', 'analyzeSegment') || defaultPrompt;

        const userPrompt = `Segment Title: ${segmentTitle}

Objective: ${segmentObjective}

Guidance: ${segmentGuidance}

Transcript:
${transcript}

Write your analysis for this segment, using only the transcript as your source.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Writer Agent',
            'writer',
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

            return {
                segmentId,
                content: result.content.trim(),
                status: 'complete',
                generatedAt: new Date(),
            };
        } catch (error) {
            agentLogger.logError('Writer Agent', 'writer', error instanceof Error ? error.message : 'Unknown error');
            return {
                segmentId,
                content: '',
                status: 'error',
            };
        }
    }

    /**
     * Rewrites a segment based on critic feedback
     */
    async rewriteSegment(
        originalContent: string,
        criticFeedback: string,
        segmentObjective: string,
        transcript: string
    ): Promise<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.writer.rewriteSegment;
        const systemPrompt = settingsService.getAgentInstruction('writer', 'rewriteSegment') || defaultPrompt;

        const userPrompt = `Original Content:
${originalContent}

Critic Feedback:
${criticFeedback}

Objective: ${segmentObjective}

Transcript:
${transcript}

Rewrite the content addressing all feedback points.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Writer Agent',
            'writer',
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
            return result.content.trim();
        } catch (error) {
            agentLogger.logError('Writer Agent', 'writer', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Analyzes a single segment of the transcript (streaming version)
     */
    async *analyzeSegmentStream(
        _segmentId: string,
        segmentTitle: string,
        segmentObjective: string,
        segmentGuidance: string,
        transcript: string
    ): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.writer.analyzeSegment;
        const systemPrompt = settingsService.getAgentInstruction('writer', 'analyzeSegment') || defaultPrompt;

        const userPrompt = `Segment Title: ${segmentTitle}

Objective: ${segmentObjective}

Guidance: ${segmentGuidance}

Transcript:
${transcript}

Write your analysis for this segment, using only the transcript as your source.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Writer Agent',
            'writer',
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
            agentLogger.logError('Writer Agent', 'writer', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Generates a short 1-sentence summary of an analysis component
     */
    async generateSummary(content: string): Promise<string> {
        const systemPrompt = "You are a concise technical writer. Summarize the following analysis in exactly one sentence.";
        const userPrompt = `Analysis Content:\n${content}\n\nOne sentence summary:`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Writer Agent',
            'writer',
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
            return result.content.trim();
        } catch (error) {
            agentLogger.logError('Writer Agent', 'writer', error instanceof Error ? error.message : 'Unknown error');
            return "Summary generation failed.";
        }
    }

    /**
     * Generates 10 keywords for the analysis
     */
    async generateKeywords(content: string): Promise<string[]> {
        const systemPrompt = "You are a technical writer. Extract exactly 10 relevant keywords from the text. Return ONLY a JSON array of strings.";
        const userPrompt = `Text:\n${content}\n\nKeywords (JSON array):`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Writer Agent',
            'writer',
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

            // Parse JSON array, handling both valid and invalid responses
            try {
                const keywords = JSON.parse(result.content.trim());
                return Array.isArray(keywords) ? keywords : [];
            } catch {
                return [];
            }
        } catch (error) {
            agentLogger.logError('Writer Agent', 'writer', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
}

export const writerAgent = new WriterAgent();
