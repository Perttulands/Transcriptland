/**
 * LiteLLM Service handles all interactions with the LiteLLM API
 * Supports multiple models including Google Gemini, GPT-4, etc.
 */
export class LiteLLMService {
    private apiKey: string | null = null;
    private baseUrl = 'https://app-litellmsn66ka.azurewebsites.net/v1';

    /**
     * Initialize the LiteLLM service with an API key
     */
    initialize(apiKey: string): void {
        this.apiKey = apiKey;
    }

    /**
     * Check if the service is initialized
     */
    isInitialized(): boolean {
        return this.apiKey !== null;
    }



    /**
     * Make a chat completion request
     */
    /**
     * Make a chat completion request
     */
    private async chatCompletion(
        messages: Array<{ role: string; content: string }>,
        model?: string
    ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
        if (!this.apiKey) {
            throw new Error('LiteLLM API not initialized. Please provide an API key.');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: model || 'google/gemini-2.0-flash-001',
                messages,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`LiteLLM API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            usage: data.usage
        };
    }

    /**
     * Make a streaming chat completion request
     */
    private async *chatCompletionStream(
        messages: Array<{ role: string; content: string }>,
        model?: string
    ): AsyncGenerator<string> {
        if (!this.apiKey) {
            throw new Error('LiteLLM API not initialized. Please provide an API key.');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: model || 'google/gemini-2.0-flash-001',
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`LiteLLM API error: ${error}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (!trimmed.startsWith('data: ')) continue;

                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        // Skip malformed JSON
                        console.warn('Failed to parse SSE line:', trimmed);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Generic completion method for custom prompts
     */
    async generateCompletion(
        systemPrompt: string,
        userPrompt: string,
        model?: string
    ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
        return this.chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], model);
    }

    /**
     * Generic streaming completion method for custom prompts
     */
    async *generateCompletionStream(systemPrompt: string, userPrompt: string, model?: string): AsyncGenerator<string> {
        yield* this.chatCompletionStream([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], model);
    }


    /**
     * Extract themes from a transcript
     */
    async generateThemes(transcript: string, model?: string): Promise<string[]> {
        const prompt = `Analyze the following transcript and extract 3-5 key themes or topics discussed. 
Return ONLY a JSON array of theme names (strings), nothing else.

Transcript:
${transcript}

Example response format: ["Theme 1", "Theme 2", "Theme 3"]`;

        try {
            const result = await this.chatCompletion(
                [{ role: 'user', content: prompt }],
                model
            );

            // Parse JSON response
            const themes = JSON.parse(result.content.trim());
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
    async analyzeTheme(
        transcript: string,
        theme: string,
        model?: string
    ): Promise<string> {
        const prompt = `Analyze the following transcript focusing on the theme: "${theme}".

Provide a detailed analysis including:
1. Key points related to this theme
2. Relevant quotes from the transcript (with exact text)
3. Insights and patterns

Format your response as clear, structured text.

Transcript:
${transcript}`;

        try {
            const result = await this.chatCompletion(
                [{ role: 'user', content: prompt }],
                model
            );
            return result.content;
        } catch (error) {
            console.error('Error analyzing theme:', error);
            throw error;
        }
    }

    /**
     * Validate an API key
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [{ role: 'user', content: 'Hello' }],
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }
}

export const liteLLMService = new LiteLLMService();
