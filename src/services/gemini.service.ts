import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GeminiService handles all interactions with the Gemini API
 */
export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private readonly defaultModel = 'gemini-2.0-flash-001';

    /**
     * Initialize the Gemini API with an API key
     */
    initialize(apiKey: string): void {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Check if the service is initialized
     */
    isInitialized(): boolean {
        return this.genAI !== null;
    }

    private getModelInstance(model?: string, systemPrompt?: string) {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized. Please provide an API key.');
        }
        const config: { model: string; systemInstruction?: string } = {
            model: model || this.defaultModel,
        };
        if (systemPrompt) {
            config.systemInstruction = systemPrompt;
        }
        return this.genAI.getGenerativeModel(config);
    }

    async generateCompletion(
        systemPrompt: string,
        userPrompt: string,
        model?: string
    ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
        const generativeModel = this.getModelInstance(model, systemPrompt);
        const result = await generativeModel.generateContent(userPrompt);
        const response = await result.response;
        const usage = response.usageMetadata;
        return {
            content: response.text() || '',
            usage: usage ? {
                prompt_tokens: usage.promptTokenCount ?? 0,
                completion_tokens: usage.candidatesTokenCount ?? 0,
                total_tokens: usage.totalTokenCount ?? 0,
            } : undefined
        };
    }

    async *generateCompletionStream(
        systemPrompt: string,
        userPrompt: string,
        model?: string
    ): AsyncGenerator<string> {
        const generativeModel = this.getModelInstance(model, systemPrompt);
        const result = await generativeModel.generateContentStream(userPrompt);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                yield chunkText;
            }
        }
    }

    /**
     * Extract themes from a transcript
     */
    async generateThemes(transcript: string, model?: string): Promise<string[]> {
        const generativeModel = this.getModelInstance(model);

        const prompt = `Analyze the following transcript and extract 3-5 key themes or topics discussed. 
Return ONLY a JSON array of theme names (strings), nothing else.

Transcript:
${transcript}

Example response format: ["Theme 1", "Theme 2", "Theme 3"]`;

        try {
            const result = await generativeModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const themes = JSON.parse(text.trim());
            return Array.isArray(themes) ? themes : [];
        } catch (error) {
            console.error('Error generating themes:', error);
            // Fallback to generic themes
            return ['Main Topics', 'Key Insights', 'Important Points'];
        }
    }

    /**
     * Analyze a specific theme in the transcript
     */
    async analyzeTheme(transcript: string, theme: string, model?: string): Promise<string> {
        const generativeModel = this.getModelInstance(model);

        const prompt = `Analyze the following transcript focusing on the theme: "${theme}".

Provide a detailed analysis including:
1. Key points related to this theme
2. Relevant quotes from the transcript (with exact text)
3. Insights and patterns

Format your response as clear, structured text.

Transcript:
${transcript}`;

        try {
            const result = await generativeModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error analyzing theme:', error);
            throw error;
        }
    }

    /**
     * Stream analysis for real-time updates
     */
    async *streamAnalysis(transcript: string, theme: string, model?: string): AsyncGenerator<string> {
        const generativeModel = this.getModelInstance(model);

        const prompt = `Analyze the following transcript focusing on the theme: "${theme}".

Provide a detailed analysis including:
1. Key points related to this theme
2. Relevant quotes from the transcript
3. Insights and patterns

Transcript:
${transcript}`;

        try {
            const result = await generativeModel.generateContentStream(prompt);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                yield chunkText;
            }
        } catch (error) {
            console.error('Error streaming analysis:', error);
            throw error;
        }
    }

    /**
     * Validate an API key
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const testAI = new GoogleGenerativeAI(apiKey);
            const testModel = testAI.getGenerativeModel({ model: this.defaultModel });

            // Try a simple generation to validate
            const result = await testModel.generateContent('Hello');
            await result.response;

            return true;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }
}

export const geminiService = new GeminiService();
