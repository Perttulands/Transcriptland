import { useState, useCallback, useRef } from 'react';
import { parseTemplate } from '../services/template-parser.service';
import { templateStorageService } from '../services/template-storage.service';
import { ParsedTemplate, SavedTemplate } from '../types/template';
import { X, Upload, FileText, Save, Trash2, FolderOpen } from 'lucide-react';
import { StandardTextArea } from './ui/StandardTextArea';
import { StandardInput } from './ui/StandardInput';
import toast from 'react-hot-toast';
import mammoth from 'mammoth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onImport: (parsed: ParsedTemplate, rawText: string) => void;
}

type Tab = 'paste' | 'saved';

export function ImportTemplateModal({ isOpen, onClose, onImport }: Props) {
    const [tab, setTab] = useState<Tab>('paste');
    const [rawText, setRawText] = useState('');
    const [preview, setPreview] = useState<ParsedTemplate | null>(null);
    const [saveName, setSaveName] = useState('');
    const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => templateStorageService.loadAll());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleParse = useCallback(() => {
        if (!rawText.trim()) {
            toast.error('Paste or upload template text first');
            return;
        }
        const parsed = parseTemplate(rawText);
        setPreview(parsed);
        toast.success('Template parsed — review the preview below');
    }, [rawText]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                setRawText(result.value);
            } else {
                const text = await file.text();
                setRawText(text);
            }
            toast.success(`Loaded ${file.name}`);
        } catch {
            toast.error('Failed to read file');
        }

        // Reset file input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleImport = useCallback(() => {
        const parsed = preview || parseTemplate(rawText);
        onImport(parsed, rawText);
        toast.success('Template imported!');
        onClose();
    }, [preview, rawText, onImport, onClose]);

    const handleSave = useCallback(() => {
        if (!saveName.trim()) {
            toast.error('Enter a name for this template');
            return;
        }
        const parsed = preview || parseTemplate(rawText);
        const template: SavedTemplate = {
            id: `tpl-${Date.now()}`,
            name: saveName.trim(),
            createdAt: new Date().toISOString(),
            rawText,
            parsed,
        };
        templateStorageService.save(template);
        setSavedTemplates(templateStorageService.loadAll());
        setSaveName('');
        toast.success('Template saved');
    }, [saveName, preview, rawText]);

    const handleLoadSaved = useCallback((tpl: SavedTemplate) => {
        setRawText(tpl.rawText);
        setPreview(tpl.parsed);
        setTab('paste');
        toast.success(`Loaded "${tpl.name}"`);
    }, []);

    const handleDeleteSaved = useCallback((id: string) => {
        templateStorageService.remove(id);
        setSavedTemplates(templateStorageService.loadAll());
        toast.success('Template deleted');
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-solita-light-grey">
                    <h2 className="text-xl font-semibold text-solita-black flex items-center gap-2">
                        <FileText className="w-5 h-5 text-solita-ochre" />
                        Import Analysis Template
                    </h2>
                    <button onClick={onClose} className="text-solita-mid-grey hover:text-solita-black transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-solita-light-grey">
                    <button
                        onClick={() => setTab('paste')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'paste' ? 'text-solita-ochre border-b-2 border-solita-ochre' : 'text-solita-mid-grey hover:text-solita-dark-grey'}`}
                    >
                        Paste / Upload
                    </button>
                    <button
                        onClick={() => { setTab('saved'); setSavedTemplates(templateStorageService.loadAll()); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'saved' ? 'text-solita-ochre border-b-2 border-solita-ochre' : 'text-solita-mid-grey hover:text-solita-dark-grey'}`}
                    >
                        Saved Templates ({savedTemplates.length})
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {tab === 'paste' && (
                        <>
                            {/* Upload button */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white border border-solita-light-grey hover:border-solita-ochre text-solita-dark-grey rounded-lg transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload .txt / .docx
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.docx"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {/* Textarea */}
                            <StandardTextArea
                                value={rawText}
                                onChange={(e) => { setRawText(e.target.value); setPreview(null); }}
                                rows={10}
                                placeholder="Paste your analysis template text here..."
                            />

                            {/* Parse button */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleParse}
                                    disabled={!rawText.trim()}
                                    className="px-4 py-2 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors text-sm"
                                >
                                    Preview Parse
                                </button>
                            </div>

                            {/* Preview */}
                            {preview && (
                                <div className="bg-solita-light-grey/50 rounded-lg p-4 space-y-3 text-sm">
                                    <h3 className="font-semibold text-solita-black">Parsed Preview</h3>

                                    {preview.contextUnderstanding && (
                                        <div>
                                            <span className="font-medium text-solita-dark-grey">Context:</span>
                                            <p className="text-solita-black">{preview.contextUnderstanding}</p>
                                        </div>
                                    )}

                                    {preview.tags.length > 0 && (
                                        <div>
                                            <span className="font-medium text-solita-dark-grey">Tags:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {preview.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-solita-green/10 text-solita-green rounded-full text-xs">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {preview.analysisObjective && (
                                        <div>
                                            <span className="font-medium text-solita-dark-grey">Objective:</span>
                                            <p className="text-solita-black">{preview.analysisObjective}</p>
                                        </div>
                                    )}

                                    {preview.frameworkSegments.length > 0 && (
                                        <div>
                                            <span className="font-medium text-solita-dark-grey">
                                                Framework Segments ({preview.frameworkSegments.length}):
                                            </span>
                                            <ul className="mt-1 space-y-1">
                                                {preview.frameworkSegments.map(seg => (
                                                    <li key={seg.id} className="text-solita-black">
                                                        <span className="font-medium">{seg.title}</span>
                                                        {seg.objective && <span className="text-solita-mid-grey"> — {seg.objective.slice(0, 80)}...</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Save controls */}
                                    <div className="flex gap-2 items-center pt-2 border-t border-solita-light-grey">
                                        <StandardInput
                                            value={saveName}
                                            onChange={e => setSaveName(e.target.value)}
                                            placeholder="Template name..."
                                            className="flex-1"
                                        />
                                        <button
                                            onClick={handleSave}
                                            disabled={!saveName.trim()}
                                            className="px-3 py-2 bg-solita-green hover:bg-solita-green/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                        >
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'saved' && (
                        <>
                            {savedTemplates.length === 0 ? (
                                <div className="text-center py-12 text-solita-mid-grey">
                                    <FolderOpen className="w-10 h-10 mx-auto mb-3" />
                                    <p>No saved templates yet.</p>
                                    <p className="text-sm">Import and save a template from the Paste tab.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedTemplates.map(tpl => (
                                        <div key={tpl.id} className="flex items-center justify-between p-4 border border-solita-light-grey rounded-lg hover:border-solita-ochre/50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-solita-black truncate">{tpl.name}</h4>
                                                <p className="text-xs text-solita-mid-grey">
                                                    {new Date(tpl.createdAt).toLocaleDateString()} — {tpl.parsed.frameworkSegments.length} segments
                                                </p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleLoadSaved(tpl)}
                                                    className="px-3 py-1.5 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg text-sm transition-colors"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSaved(tpl.id)}
                                                    className="p-1.5 text-solita-mid-grey hover:text-solita-red transition-colors"
                                                    title="Delete template"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-solita-light-grey">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-solita-light-grey text-solita-dark-grey rounded-lg hover:bg-solita-light-grey/50 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!rawText.trim()}
                        className="px-4 py-2 bg-solita-ochre hover:bg-solita-ochre/90 disabled:bg-solita-mid-grey text-white rounded-lg transition-colors text-sm"
                    >
                        Import Template
                    </button>
                </div>
            </div>
        </div>
    );
}
