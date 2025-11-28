import { llmService } from './llm.service';
import { agentLogger } from './agent-logger.service';
import { settingsService } from './settings.service';
import { DEFAULT_INSTRUCTIONS } from '../constants/default-instructions';
import { PlannerOutput, AnalysisFramework, FrameworkSegment } from '../types/phases';

export class PlannerAgent {
    /**
     * Get the configured model for this agent
     */
    private getModel(): string {
        return settingsService.getAgentModel('planner');
    }

    /**
     * Analyzes the first portion of a transcript to understand context
     */
    async analyzeContext(firstChars: string): Promise<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.analyzeContext;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'analyzeContext') || defaultPrompt;

        const userPrompt = `Here are the first characters of a transcript:

${firstChars}

Write one sentence describing what this transcript is about.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Analyzes the first portion of a transcript to understand context (streaming version)
     */
    async *analyzeContextStream(firstChars: string): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.analyzeContext;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'analyzeContext') || defaultPrompt;

        const userPrompt = `Here are the first characters of a transcript:

${firstChars}

Write one sentence describing what this transcript is about.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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
            agentLogger.logResponse(logId, fullResponse.trim(), duration);
        } catch (error) {
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Generates metadata tags for the transcript
     */
    async generateMetadata(transcript: string): Promise<string[]> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.generateMetadata;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'generateMetadata') || defaultPrompt;

        const userPrompt = `Generate metadata tags for this transcript:

${transcript.substring(0, 2000)}

Return only comma-separated tags.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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
            return result.content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } catch (error) {
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Proposes an analysis objective based on context
     */
    async proposeObjective(context: string, transcript: string): Promise<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.proposeObjective;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'proposeObjective') || defaultPrompt;

        const userPrompt = `Context: ${context}

Transcript preview:
${transcript.substring(0, 1500)}

Propose an analysis objective for this transcript.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Proposes an analysis objective based on context (streaming version)
     */
    async *proposeObjectiveStream(context: string, transcript: string): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.proposeObjective;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'proposeObjective') || defaultPrompt;

        const userPrompt = `Context: ${context}

Transcript preview:
${transcript.substring(0, 1500)}

Propose an analysis objective for this transcript.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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
            agentLogger.logResponse(logId, fullResponse.trim(), duration);
        } catch (error) {
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Generates complete planner output with streaming support
     */
    async generatePlannerOutput(
        transcript: string,
        onContextUpdate?: (text: string) => void,
        onTagsUpdate?: (tags: string[]) => void,
        onObjectiveUpdate?: (text: string) => void
    ): Promise<PlannerOutput> {
        const firstChars = transcript.substring(0, 1000);

        // Generate context understanding
        const context = await this.analyzeContext(firstChars);
        onContextUpdate?.(context);

        // Generate metadata tags
        const tags = await this.generateMetadata(transcript);
        onTagsUpdate?.(tags);

        // Generate analysis objective
        const objective = await this.proposeObjective(context, transcript);
        onObjectiveUpdate?.(objective);

        return {
            contextUnderstanding: context,
            metadataTags: tags,
            analysisObjective: objective,
        };
    }

    /**
     * Generates an analysis framework with segments for transcript processing
     */
    async generateFramework(
        transcript: string,
        contextUnderstanding: string,
        analysisObjective: string,
        metadataTags: string[]
    ): Promise<AnalysisFramework> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.generateFramework;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'generateFramework') || defaultPrompt;

        const userPrompt = `Context: ${contextUnderstanding}

Analysis Objective: ${analysisObjective}

Tags: ${metadataTags.join(', ')}

Transcript preview:
${transcript.substring(0, 2000)}

Create an analysis framework with 3-5 segments that will guide the extraction of insights from this transcript.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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

            // Extract JSON response from potential markdown code blocks
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse framework response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const segments: FrameworkSegment[] = parsed.segments.map((seg: any, index: number) => ({
                id: `segment-${Date.now()}-${index}`,
                title: seg.title,
                objective: seg.objective,
                guidance: seg.guidance,
                order: index,
            }));

            return {
                metadata: {
                    title: `Analysis: ${contextUnderstanding}`,
                    created: new Date(),
                    objective: analysisObjective,
                    tags: metadataTags,
                },
                segments,
            };
        } catch (error) {
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Generates an analysis framework with segments for transcript processing (streaming version)
     */
    async *generateFrameworkStream(
        transcript: string,
        contextUnderstanding: string,
        analysisObjective: string,
        metadataTags: string[]
    ): AsyncGenerator<string> {
        const defaultPrompt = DEFAULT_INSTRUCTIONS.planner.generateFramework;
        const systemPrompt = settingsService.getAgentInstruction('planner', 'generateFramework') || defaultPrompt;

        const userPrompt = `Context: ${contextUnderstanding}

Analysis Objective: ${analysisObjective}

Tags: ${metadataTags.join(', ')}

Transcript preview:
${transcript.substring(0, 2000)}

Create an analysis framework with 3-5 segments that will guide the extraction of insights from this transcript.`;

        const model = this.getModel();
        const startTime = Date.now();
        const logId = agentLogger.logRequest(
            'Planner Agent',
            'planner',
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
            agentLogger.logError('Planner Agent', 'planner', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
}

export const plannerAgent = new PlannerAgent();
