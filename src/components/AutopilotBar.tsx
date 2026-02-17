import { useAutopilot } from '../contexts/AutopilotContext';
import { Pause, Play, Square, Zap } from 'lucide-react';

export function AutopilotBar() {
    const { isAutopilot, isPaused, currentStep, enableCritic, pause, resume, stop, setEnableCritic } = useAutopilot();

    if (!isAutopilot) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-solita-black text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 min-w-[420px] max-w-xl">
            {/* Status indicator */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Zap className={`w-5 h-5 flex-shrink-0 ${isPaused ? 'text-solita-ochre' : 'text-solita-green animate-pulse'}`} />
                <span className="text-sm truncate">{currentStep || 'Autopilot active'}</span>
            </div>

            {/* Critic toggle */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none flex-shrink-0">
                <input
                    type="checkbox"
                    checked={enableCritic}
                    onChange={e => setEnableCritic(e.target.checked)}
                    className="accent-solita-ochre w-3.5 h-3.5"
                />
                Critic
            </label>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {isPaused ? (
                    <button
                        onClick={resume}
                        className="p-1.5 rounded-lg bg-solita-green hover:bg-solita-green/80 transition-colors"
                        title="Resume"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={pause}
                        className="p-1.5 rounded-lg bg-solita-ochre hover:bg-solita-ochre/80 transition-colors"
                        title="Pause"
                    >
                        <Pause className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={stop}
                    className="p-1.5 rounded-lg bg-solita-red hover:bg-solita-red/80 transition-colors"
                    title="Stop autopilot"
                >
                    <Square className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
