import { useState } from 'react';
import { FileUploadZone } from './FileUploadZone';
import { Type } from 'lucide-react';
import { StandardTextArea } from './ui/StandardTextArea';

interface TranscriptInputProps {
    onFileSelect: (file: File | null, content: string) => void;
    selectedFile: File | null;
    onRemoveFile: () => void;
}

// Allow transcript input via file upload or direct text paste
export function TranscriptInput({ onFileSelect, selectedFile, onRemoveFile }: TranscriptInputProps) {
    const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
    const [textInput, setTextInput] = useState('');

    const handleFileSelect = (file: File, content: string) => {
        onFileSelect(file, content);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setTextInput(newText);
        onFileSelect(null, newText); // No file for pasted text
    };

    return (
        <div>
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setInputMode('file')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${inputMode === 'file'
                        ? 'bg-solita-ochre text-white'
                        : 'bg-solita-light-grey text-solita-dark-grey hover:bg-solita-ochre/10'
                        }`}
                >
                    Upload File
                </button>
                <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${inputMode === 'text'
                        ? 'bg-solita-ochre text-white'
                        : 'bg-solita-light-grey text-solita-dark-grey hover:bg-solita-ochre/10'
                        }`}
                >
                    <Type className="w-4 h-4" />
                    Paste Text
                </button>
            </div>

            {/* Input Area */}
            {inputMode === 'file' ? (
                <FileUploadZone
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onRemove={onRemoveFile}
                />
            ) : (
                <div>
                    <StandardTextArea
                        value={textInput}
                        onChange={handleTextChange}
                        placeholder="Paste your transcript text here..."
                        className="h-64"
                    />
                </div>
            )}
        </div>
    );
}
