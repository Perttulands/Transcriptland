import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { PhaseIndicator } from './components/PhaseIndicator';
import { AgentLogPanel } from './components/AgentLogPanel';
import { agentLogger } from './services/agent-logger.service';
import { AgentLog } from './types/logging';
import { LandingPage } from './pages/LandingPage';
import { Phase1_UploadAlign } from './pages/Phase1_UploadAlign';
import { Phase2_ProcessingValidation } from './pages/Phase2_ProcessingValidation';
import { Phase3_InsightExtraction } from './pages/Phase3_InsightExtraction';
import { Phase3_5_GapAnalysis } from './pages/Phase3_5_GapAnalysis';
import { Phase4_Consolidation } from './pages/Phase4_Consolidation';

// Inner app component that can use useLocation (must be inside BrowserRouter)
function AppContent() {
    const location = useLocation();
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const isLandingPage = location.pathname === '/';

    // Listen for agent log updates and update local state
    useEffect(() => {
        const unsubscribe = agentLogger.subscribe((newLogs) => {
            setLogs(newLogs);
        });
        return unsubscribe;
    }, []);

    return (
        <AnalysisProvider>
            <div className="min-h-screen bg-solita-light-grey">
                {!isLandingPage && <PhaseIndicator />}
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/upload" element={<Phase1_UploadAlign />} />
                    <Route path="/framework" element={<Phase2_ProcessingValidation />} />
                    <Route path="/extraction" element={<Phase3_InsightExtraction />} />
                    <Route path="/gap-analysis" element={<Phase3_5_GapAnalysis />} />
                    <Route path="/consolidation" element={<Phase4_Consolidation />} />
                </Routes>
            </div>
            <Toaster position="top-right" />
            {!isLandingPage && <AgentLogPanel logs={logs} onClear={() => agentLogger.clearLogs()} />}
        </AnalysisProvider>
    );
}

// Main application component wrapping with BrowserRouter
function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
