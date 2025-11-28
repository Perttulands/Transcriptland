import { useState, useEffect, useRef } from 'react';

export type StreamingState = 'idle' | 'streaming' | 'complete' | 'error';

interface UseStreamingTextOptions {
    onComplete?: (text: string) => void;
    onError?: (error: Error) => void;
    simulateTyping?: boolean;
    typingSpeed?: number; // characters per second
}

// Hook for managing streaming text with optional typing animation
// Buffers incoming chunks and displays them with configurable typing speed
export function useStreamingText(options: UseStreamingTextOptions = {}) {
    const [text, setText] = useState('');
    const [state, setState] = useState<StreamingState>('idle');
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const bufferRef = useRef<string>('');
    const animationFrameRef = useRef<number | null>(null);

    const {
        onComplete,
        onError,
        simulateTyping = true,
        typingSpeed = 50, // 50 chars/sec default
    } = options;

    const startStreaming = async (generator: AsyncGenerator<string>) => {
        setState('streaming');
        setError(null);
        setText('');
        bufferRef.current = '';

        abortControllerRef.current = new AbortController();

        try {
            for await (const chunk of generator) {
                if (abortControllerRef.current?.signal.aborted) {
                    break;
                }
                bufferRef.current += chunk;
            }

            if (!abortControllerRef.current?.signal.aborted) {
                setState('complete');
                onComplete?.(bufferRef.current);
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Streaming failed');
            setError(error);
            setState('error');
            onError?.(error);
        }
    };

    // Simulate typing effect by revealing characters progressively
    useEffect(() => {
        if (!simulateTyping) {
            setText(bufferRef.current);
            return;
        }

        // Calculate characters to reveal per animation frame
        const charsPerFrame = Math.max(1, Math.floor(typingSpeed / 60)); // 60 FPS
        let currentIndex = text.length;

        const animate = () => {
            if (currentIndex < bufferRef.current.length) {
                const nextIndex = Math.min(
                    currentIndex + charsPerFrame,
                    bufferRef.current.length
                );
                setText(bufferRef.current.slice(0, nextIndex));
                currentIndex = nextIndex;
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [bufferRef.current.length, simulateTyping, typingSpeed]);

    const stop = () => {
        abortControllerRef.current?.abort();
        setState('idle');
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const reset = () => {
        stop();
        setText('');
        setError(null);
        bufferRef.current = '';
    };

    return {
        text,
        state,
        error,
        startStreaming,
        stop,
        reset,
        isStreaming: state === 'streaming',
        isComplete: state === 'complete',
        hasError: state === 'error',
    };
}
