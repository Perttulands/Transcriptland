import { useNavigate } from 'react-router-dom';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { Phase } from '../types/phases';
import toast from 'react-hot-toast';

const PHASE_ROUTES: Record<Phase, string> = {
    [Phase.UPLOAD_ALIGN]: '/',
    [Phase.PROCESSING_VALIDATION]: '/framework',
    [Phase.INSIGHT_EXTRACTION]: '/extraction',
    [Phase.GAP_ANALYSIS]: '/gap-analysis',
    [Phase.CONSOLIDATION]: '/consolidation',
};

// Navigation hook enforcing phase-to-phase progression rules
export function usePhaseNavigation() {
    const navigate = useNavigate();
    const { currentPhase, canProceedToPhase, setCurrentPhase } = useAnalysisContext();

    // Navigate forward with validation
    const proceedToNextPhase = () => {
        const nextPhase = getNextPhase(currentPhase);

        if (!nextPhase) {
            toast.error('Already at the final phase');
            return;
        }

        if (!canProceedToPhase(nextPhase)) {
            toast.error('Please complete the current phase before proceeding');
            return;
        }

        setCurrentPhase(nextPhase);
        navigate(PHASE_ROUTES[nextPhase]);
    };

    const navigateToPhase = (phase: Phase) => {
        if (!canProceedToPhase(phase)) {
            toast.error('Cannot navigate to this phase yet');
            return;
        }

        setCurrentPhase(phase);
        navigate(PHASE_ROUTES[phase]);
    };

    const skipToConsolidation = () => {
        setCurrentPhase(Phase.CONSOLIDATION);
        navigate(PHASE_ROUTES[Phase.CONSOLIDATION]);
    };

    const goToPreviousPhase = () => {
        const previousPhase = getPreviousPhase(currentPhase);

        if (!previousPhase) {
            toast.error('Already at the first phase');
            return;
        }

        setCurrentPhase(previousPhase);
        navigate(PHASE_ROUTES[previousPhase]);
    };

    const canProceed = (): boolean => {
        const nextPhase = getNextPhase(currentPhase);
        return nextPhase !== null && canProceedToPhase(nextPhase);
    };

    const canGoBack = (): boolean => {
        return getPreviousPhase(currentPhase) !== null;
    };

    return {
        proceedToNextPhase,
        goToPreviousPhase,
        navigateToPhase,
        skipToConsolidation,
        currentPhase,
        canProceed: canProceed(),
        canGoBack: canGoBack(),
    };
}

function getNextPhase(current: Phase): Phase | null {
    switch (current) {
        case Phase.UPLOAD_ALIGN:
            return Phase.PROCESSING_VALIDATION;
        case Phase.PROCESSING_VALIDATION:
            return Phase.INSIGHT_EXTRACTION;
        case Phase.INSIGHT_EXTRACTION:
            return Phase.GAP_ANALYSIS;
        case Phase.GAP_ANALYSIS:
            return Phase.CONSOLIDATION;
        case Phase.CONSOLIDATION:
            return null;
        default:
            return null;
    }
}

function getPreviousPhase(current: Phase): Phase | null {
    switch (current) {
        case Phase.UPLOAD_ALIGN:
            return null;
        case Phase.PROCESSING_VALIDATION:
            return Phase.UPLOAD_ALIGN;
        case Phase.INSIGHT_EXTRACTION:
            return Phase.PROCESSING_VALIDATION;
        case Phase.GAP_ANALYSIS:
            return Phase.INSIGHT_EXTRACTION;
        case Phase.CONSOLIDATION:
            return Phase.GAP_ANALYSIS;
        default:
            return null;
    }
}
