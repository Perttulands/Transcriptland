import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TranscriptInput } from '../components/TranscriptInput';
import { AgentLogPanel } from '../components/AgentLogPanel';
import { ApiKeyPrompt } from '../components/ApiKeyPrompt';
import { ImportTemplateModal } from '../components/ImportTemplateModal';
import { plannerAgent } from '../services/planner.agent';
import { agentLogger } from '../services/agent-logger.service';
import { llmService } from '../services/llm.service';
import { settingsService } from '../services/settings.service';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { useAutopilot } from '../contexts/AutopilotContext';
import { PlannerOutput, AnalysisFramework } from '../types/phases';
import { ParsedTemplate } from '../types/template';
import { AgentLog } from '../types/logging';
import { Sparkles, Tag, Target, ArrowRight, Loader2, Key, FileText, XCircle, AlertTriangle, Upload, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { StandardTextArea } from '../components/ui/StandardTextArea';
import { StandardInput } from '../components/ui/StandardInput';
import { GuidedHint } from '../components/GuidedHint';
import { PHASE_HINTS } from '../constants/hints';

export function Phase1_UploadAlign() {
    const { setPhase1Data, setImportedFramework } = useAnalysisContext();
    const autopilot = useAutopilot();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [logs, setLogs] = useState<AgentLog[]>([]);

    // API Key and Settings
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);

    // Editable fields
    const [contextUnderstanding, setContextUnderstanding] = useState('');
    const [metadataTags, setMetadataTags] = useState<string[]>([]);
    const [analysisObjective, setAnalysisObjective] = useState('');
    const [newTag, setNewTag] = useState('');

    // Import template modal
    const [showImportModal, setShowImportModal] = useState(false);

    // Autopilot toggle (local — only starts when user clicks Analyze Context)
    const [autopilotEnabled, setAutopilotEnabled] = useState(false);

    // Track whether analysis just completed so autopilot can auto-proceed
    const analysisJustCompleted = useRef(false);

    // Initialize API key state and load from localStorage
    useEffect(() => {
        llmService.hydrateFromSettings();
        const provider = settingsService.getProvider();
        if (settingsService.getApiKey(provider)) {
            setHasApiKey(true);
        }
    }, []);

    // Subscribe to logger updates
    useEffect(() => {
        const unsubscribe = agentLogger.subscribe((newLogs) => {
            setLogs(newLogs);
        });
        return unsubscribe;
    }, []);

    // Autopilot auto-proceed: when analysis completes and autopilot is active, proceed automatically
    useEffect(() => {
        if (
            analysisJustCompleted.current &&
            autopilot.isAutopilot &&
            !autopilot.isPaused &&
            contextUnderstanding &&
            metadataTags.length > 0 &&
            analysisObjective &&
            transcript
        ) {
            analysisJustCompleted.current = false;
            autopilot.setCurrentStep('Phase 1 complete — proceeding to Framework...');
            // Small delay so user can see toast before navigation
            const timer = setTimeout(() => proceedToFramework(), 400);
            return () => clearTimeout(timer);
        }
    }, [contextUnderstanding, metadataTags, analysisObjective, transcript, autopilot.isAutopilot, autopilot.isPaused]);

    const handleFileSelect = (file: File | null, content: string) => {
        setSelectedFile(file);
        setTranscript(content);
        setContextUnderstanding('');
        setMetadataTags([]);
        setAnalysisObjective('');
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setTranscript('');
        setContextUnderstanding('');
        setMetadataTags([]);
        setAnalysisObjective('');
    };

    const handleImportTemplate = (parsed: ParsedTemplate, _rawText: string) => {
        // Fill Phase 1 fields
        if (parsed.contextUnderstanding) setContextUnderstanding(parsed.contextUnderstanding);
        if (parsed.tags.length > 0) setMetadataTags(parsed.tags);
        if (parsed.analysisObjective) setAnalysisObjective(parsed.analysisObjective);

        // Store framework segments for Phase 2 consumption
        if (parsed.frameworkSegments.length > 0) {
            const framework: AnalysisFramework = {
                metadata: {
                    title: `Imported Template`,
                    created: new Date(),
                    objective: parsed.analysisObjective || '',
                    tags: parsed.tags,
                },
                segments: parsed.frameworkSegments,
            };
            setImportedFramework(framework);
        }
    };

    const analyzeTranscript = async () => {
        if (!transcript) {
            toast.error('Please provide a transcript first');
            return;
        }

        // Check for API key before attempting analysis
        if (!hasApiKey) {
            toast.error('Please set your API key first');
            setShowApiKeyPrompt(true);
            return;
        }

        // If autopilot toggle is on, start autopilot mode
        if (autopilotEnabled && !autopilot.isAutopilot) {
            autopilot.start();
        }

        if (autopilot.isAutopilot) {
            autopilot.setCurrentStep('Phase 1: Analyzing context...');
        }

        setIsAnalyzing(true);

        try {
            const output = await plannerAgent.generatePlannerOutput(
                transcript,
                (context) => setContextUnderstanding(context),
                (tags) => setMetadataTags(tags),
                (objective) => setAnalysisObjective(objective)
            );

            setContextUnderstanding(output.contextUnderstanding);
            setMetadataTags(output.metadataTags);
            setAnalysisObjective(output.analysisObjective);

            toast.success('Analysis complete!');
            analysisJustCompleted.current = true;
        } catch (error) {
            console.error('Analysis failed:', error);
            // Check if error is related to API key
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
            if (errorMessage.includes('api') || errorMessage.includes('key') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
                toast.error('API key error. Please check your API key is valid.');
                setShowApiKeyPrompt(true);
            } else {
                toast.error('Analysis failed. Please check your API key and try again.');
            }
            // Stop autopilot on error
            if (autopilot.isAutopilot) autopilot.stop();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !metadataTags.includes(newTag.trim())) {
            setMetadataTags([...metadataTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setMetadataTags(metadataTags.filter(tag => tag !== tagToRemove));
    };

    // Validate all fields before proceeding to avoid navigation with incomplete data
    const proceedToFramework = () => {
        // Validate local state (not context state to avoid race condition)
        if (!transcript || !contextUnderstanding || metadataTags.length === 0 || !analysisObjective) {
            toast.error('Please complete all fields before proceeding');
            return;
        }

        // Create the final output object
        const finalOutput: PlannerOutput = {
            contextUnderstanding,
            metadataTags,
            analysisObjective,
        };

        // Set the data in context
        setPhase1Data(finalOutput, transcript);

        // Navigate directly - we've already validated the data locally
        // No need to wait for context state update or check canProceedToPhase
        navigate('/framework');
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
            <div className="min-h-screen bg-solita-light-grey pb-24">
                <div className="container mx-auto px-6 py-12 max-w-5xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h1 className="text-4xl font-semibold text-solita-black flex items-center gap-3">
                                <Sparkles className="w-9 h-9 text-solita-ochre" />
                                Phase 1: Upload & Align
                            </h1>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="px-4 py-2 bg-white border border-solita-light-grey hover:bg-solita-ochre/10 text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Import Template
                                </button>
                                <button
                                    onClick={() => setShowApiKeyPrompt(true)}
                                    className="px-4 py-2 bg-white border border-solita-light-grey hover:bg-solita-ochre/10 text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Key className="w-4 h-4" />
                                    {hasApiKey ? 'Change' : 'Set'} API Key
                                </button>

                            </div>
                        </div>
                        <p className="text-base text-solita-dark-grey">
                            Upload your transcript (.txt, .md, .docx) and let AI understand the context
                        </p>
                    </div>

                    {/* Guided Hint */}
                    <GuidedHint
                        hintId={PHASE_HINTS.phase1.upload.id}
                        title={PHASE_HINTS.phase1.upload.title}
                        description={PHASE_HINTS.phase1.upload.description}
                    />

                    {/* API Key Warning Banner */}
                    {!hasApiKey && (
                        <div className="bg-solita-red/10 border border-solita-red/30 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-solita-red flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-solita-black">API Key Required</h4>
                                    <p className="text-sm text-solita-dark-grey mt-1">
                                        You need to set an API key before you can analyze transcripts.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowApiKeyPrompt(true)}
                                    className="px-4 py-2 bg-solita-red hover:bg-solita-red/90 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Set API Key
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Transcript Input */}
                    <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                        <TranscriptInput
                            onFileSelect={handleFileSelect}
                            selectedFile={selectedFile}
                            onRemoveFile={handleRemoveFile}
                        />

                        {selectedFile && (
                            <div className="mt-4 p-3 bg-solita-light-grey rounded-md flex items-center justify-between text-sm text-solita-dark-grey">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-solita-ochre" />
                                    <span>{selectedFile.name}</span>
                                    <span className="text-xs text-solita-mid-grey">({formatFileSize(selectedFile.size)})</span>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="text-solita-mid-grey hover:text-solita-dark-grey transition-colors"
                                    title="Remove file"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-between">
                            {/* Autopilot toggle */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <div
                                    onClick={() => setAutopilotEnabled(!autopilotEnabled)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${autopilotEnabled ? 'bg-solita-ochre' : 'bg-solita-mid-grey/40'}`}
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autopilotEnabled ? 'translate-x-5' : ''}`}
                                    />
                                </div>
                                <Zap className={`w-4 h-4 ${autopilotEnabled ? 'text-solita-ochre' : 'text-solita-mid-grey'}`} />
                                <span className={`text-sm ${autopilotEnabled ? 'text-solita-ochre font-medium' : 'text-solita-dark-grey'}`}>
                                    Autopilot
                                </span>
                            </label>

                            <button
                                onClick={analyzeTranscript}
                                disabled={isAnalyzing || !transcript}
                                className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Analyze Context
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Analysis Results */}
                    {(contextUnderstanding || metadataTags.length > 0 || analysisObjective) && (
                        <>
                            {/* Context Understanding */}
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-solita-black mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-solita-ochre" />
                                    Context Understanding
                                </h3>
                                <StandardTextArea
                                    value={contextUnderstanding}
                                    onChange={(e) => setContextUnderstanding(e.target.value)}
                                    rows={3}
                                    placeholder="One sentence describing what this transcript is about..."
                                />
                            </div>

                            {/* Metadata Tags */}
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-solita-black mb-3 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-solita-green" />
                                    Metadata Tags
                                </h3>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {metadataTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-2 px-3 py-1 bg-solita-green/10 text-solita-green rounded-full text-sm"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-solita-green/70"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <StandardInput
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                        placeholder="Add a tag..."
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={addTag}
                                        className="px-4 py-2 bg-solita-green hover:bg-solita-green/90 text-white rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Analysis Objective */}
                            <div className="bg-white border border-solita-light-grey rounded-lg p-6 mb-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-solita-black flex items-center gap-2">
                                        <Target className="w-5 h-5 text-solita-ochre" />
                                        Analysis Objective
                                    </h3>

                                </div>
                                <StandardTextArea
                                    value={analysisObjective}
                                    onChange={(e) => setAnalysisObjective(e.target.value)}
                                    rows={3}
                                    placeholder="What should this analysis focus on?"
                                />
                            </div>

                            {/* Proceed Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={proceedToFramework}
                                    className="px-6 py-3 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Proceed to Framework Generation
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* API Key Prompt Modal */}
            <ApiKeyPrompt
                isOpen={showApiKeyPrompt}
                onClose={() => setShowApiKeyPrompt(false)}
                onKeySet={() => setHasApiKey(true)}
            />

            {/* Import Template Modal */}
            <ImportTemplateModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportTemplate}
            />

            {/* Agent Log Panel */}
            <AgentLogPanel logs={logs} onClear={() => agentLogger.clearLogs()} />
        </>
    );
}
