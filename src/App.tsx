import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { PhaseIndicator } from './components/PhaseIndicator';
import { AgentLogPanel } from './components/AgentLogPanel';
import { agentLogger } from './services/agent-logger.service';
import { AgentLog } from './types/logging';
import { Phase1_UploadAlign } from './pages/Phase1_UploadAlign';
import { Phase2_ProcessingValidation } from './pages/Phase2_ProcessingValidation';
import { Phase3_InsightExtraction } from './pages/Phase3_InsightExtraction';
import { Phase3_5_GapAnalysis } from './pages/Phase3_5_GapAnalysis';
import { Phase4_Consolidation } from './pages/Phase4_Consolidation';

// Main application component managing routing and global state
// Provides analysis context and agent logging to all pages
function App() {
    const [logs, setLogs] = useState<AgentLog[]>([]);

    // Listen for agent log updates and update local state
    useEffect(() => {
        const unsubscribe = agentLogger.subscribe((newLogs) => {
            setLogs(newLogs);
        });
        return unsubscribe;
    }, []);

    return (
        <BrowserRouter>
            <AnalysisProvider>
                <div className="min-h-screen bg-solita-light-grey">
                    <PhaseIndicator />
                    <Routes>
                        <Route path="/" element={<Phase1_UploadAlign />} />
                        <Route path="/framework" element={<Phase2_ProcessingValidation />} />
                        <Route path="/extraction" element={<Phase3_InsightExtraction />} />
                        <Route path="/gap-analysis" element={<Phase3_5_GapAnalysis />} />
                        <Route path="/consolidation" element={<Phase4_Consolidation />} />
                    </Routes>
                </div>
                <Toaster position="top-right" />
            </AnalysisProvider>
            <AgentLogPanel logs={logs} onClear={() => agentLogger.clearLogs()} />
        </BrowserRouter>
    );
}

export default App;
