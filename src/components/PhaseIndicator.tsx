import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phase } from '../types/phases';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { Check, Sparkles, FileText, Lightbulb, Download, Settings, RotateCcw, Search } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

const PHASE_INFO = [
    { phase: Phase.UPLOAD_ALIGN, label: 'Upload', icon: Sparkles },
    { phase: Phase.PROCESSING_VALIDATION, label: 'Analysis Framework', icon: FileText },
    { phase: Phase.INSIGHT_EXTRACTION, label: 'Processing & Evaluation', icon: Lightbulb },
    { phase: Phase.GAP_ANALYSIS, label: 'Gap Analysis', icon: Search },
    { phase: Phase.CONSOLIDATION, label: 'Consolidate', icon: Download },
];

export function PhaseIndicator() {
    const { currentPhase, resetAnalysis } = useAnalysisContext();
    const navigate = useNavigate();
    const [showSettings, setShowSettings] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleReset = () => {
        resetAnalysis();
        navigate('/upload');
        setShowResetConfirm(false);
    };

    // Determine if a phase is completed, active, or upcoming based on current phase
    const getPhaseStatus = (phase: Phase): 'completed' | 'active' | 'upcoming' => {
        const currentIndex = PHASE_INFO.findIndex(p => p.phase === currentPhase);
        const phaseIndex = PHASE_INFO.findIndex(p => p.phase === phase);

        if (phaseIndex < currentIndex) return 'completed';
        if (phaseIndex === currentIndex) return 'active';
        return 'upcoming';
    };

    return (
        <>
            <div className="sticky top-0 z-40 bg-white border-b border-solita-light-grey shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Settings Button */}
                            <button
                                onClick={() => setShowSettings(true)}
                                className="px-4 py-2 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium text-sm"
                                title="Settings"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>

                            {/* Reset Data Button */}
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="px-4 py-2 bg-solita-red hover:bg-solita-red/90 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium text-sm"
                                title="Reset Data"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Reset</span>
                            </button>
                        </div>

                        {/* Center: Phase Flow with Continuous Line */}
                        <div className="flex items-center justify-center flex-1 max-w-5xl mx-auto relative">
                            {/* Continuous Background Line - anchored to circle centers */}
                            <div
                                className="absolute top-5 h-0.5 bg-solita-light-grey"
                                style={{
                                    zIndex: 0,
                                    left: 'calc(20px + 0.5rem)', // Half of circle width (20px) + half of first gap
                                    right: 'calc(20px + 0.5rem)' // Half of circle width (20px) + half of last gap
                                }}
                            ></div>

                            {/* Progress Line (fills based on completion) */}
                            <div
                                className="absolute top-5 h-0.5 bg-solita-green transition-all duration-500"
                                style={{
                                    zIndex: 0,
                                    left: 'calc(20px + 0.5rem)',
                                    // Width is percentage of distance between first and last phase
                                    width: `calc((${PHASE_INFO.findIndex(p => p.phase === currentPhase)} / ${PHASE_INFO.length - 1}) * (100% - 40px - 1rem))`
                                }}
                            ></div>

                            {/* Phase Circles - using gap for consistent spacing */}
                            <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12 w-full relative" style={{ zIndex: 1 }}>
                                {PHASE_INFO.map((phaseInfo) => {
                                    const status = getPhaseStatus(phaseInfo.phase);
                                    const Icon = phaseInfo.icon;

                                    return (
                                        <div key={phaseInfo.phase} className="flex flex-col items-center flex-shrink-0">
                                            {/* Phase Circle */}
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'completed'
                                                        ? 'bg-solita-green text-white shadow-md'
                                                        : status === 'active'
                                                            ? 'bg-solita-ochre text-white shadow-lg ring-2 ring-solita-ochre/30'
                                                            : 'bg-white border-2 border-solita-light-grey text-solita-mid-grey'
                                                    }`}
                                            >
                                                {status === 'completed' ? (
                                                    <Check className="w-5 h-5" />
                                                ) : (
                                                    <Icon className="w-5 h-5" />
                                                )}
                                            </div>
                                            {/* Phase Label */}
                                            <span
                                                className={`mt-2 text-xs md:text-sm font-medium text-center whitespace-nowrap transition-colors duration-300 ${status === 'active'
                                                        ? 'text-solita-ochre'
                                                        : status === 'completed'
                                                            ? 'text-solita-green'
                                                            : 'text-solita-mid-grey'
                                                    }`}
                                            >
                                                {phaseInfo.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Spacer for balance */}
                        <div className="flex-shrink-0 hidden lg:block" style={{ width: '180px' }}></div>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Dialog */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-xl font-semibold text-solita-black mb-3">
                            Reset All Data?
                        </h3>
                        <p className="text-solita-dark-grey mb-6">
                            This will clear all current analysis data and return you to the landing page.
                            Your settings (API key, model, custom instructions) will be preserved.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 bg-solita-light-grey hover:bg-solita-mid-grey/30 text-solita-black rounded-lg transition-smooth"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-solita-red hover:bg-solita-red/90 text-white rounded-lg transition-smooth"
                            >
                                Reset Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
}
