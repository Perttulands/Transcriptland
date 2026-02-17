import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AutopilotContextType {
    isAutopilot: boolean;
    enableCritic: boolean;
    isPaused: boolean;
    currentStep: string;
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    setEnableCritic: (v: boolean) => void;
    setCurrentStep: (step: string) => void;
}

const AutopilotContext = createContext<AutopilotContextType | undefined>(undefined);

export function AutopilotProvider({ children }: { children: ReactNode }) {
    const [isAutopilot, setIsAutopilot] = useState(false);
    const [enableCritic, setEnableCritic] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [currentStep, setCurrentStep] = useState('');

    const start = useCallback(() => {
        setIsAutopilot(true);
        setIsPaused(false);
        setCurrentStep('Starting autopilot...');
    }, []);

    const pause = useCallback(() => {
        setIsPaused(true);
        setCurrentStep(prev => `Paused: ${prev}`);
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
        setCurrentStep(prev => prev.replace(/^Paused:\s*/, ''));
    }, []);

    const stop = useCallback(() => {
        setIsAutopilot(false);
        setIsPaused(false);
        setCurrentStep('');
    }, []);

    return (
        <AutopilotContext.Provider
            value={{
                isAutopilot,
                enableCritic,
                isPaused,
                currentStep,
                start,
                pause,
                resume,
                stop,
                setEnableCritic,
                setCurrentStep,
            }}
        >
            {children}
        </AutopilotContext.Provider>
    );
}

export function useAutopilot() {
    const ctx = useContext(AutopilotContext);
    if (!ctx) throw new Error('useAutopilot must be used within AutopilotProvider');
    return ctx;
}
