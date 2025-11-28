import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { docxParserService } from '../services/docx-parser.service';
import toast from 'react-hot-toast';

interface FileUploadZoneProps {
    onFileSelect: (file: File, content: string) => void;
    selectedFile: File | null;
    onRemove: () => void;
}

export function FileUploadZone({ onFileSelect, selectedFile, onRemove }: FileUploadZoneProps) {
    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                try {
                    let text: string;

                    // Parse DOCX files using mammoth, read text files directly
                    if (docxParserService.isDocxFile(file)) {
                        toast.loading('Parsing Word document...');
                        text = await docxParserService.parseDocx(file);
                        toast.dismiss();
                        toast.success('Word document parsed successfully!');
                    } else {
                        // Plain text file
                        text = await file.text();
                    }

                    onFileSelect(file, text);
                } catch (error) {
                    toast.dismiss();
                    toast.error(error instanceof Error ? error.message : 'Failed to read file');
                    console.error('File reading error:', error);
                }
            }
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'text/markdown': ['.md'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false,
    });

    if (selectedFile) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-solita-green bg-white p-6 rounded-lg flex items-center justify-between shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <File size={32} className="text-solita-green" />
                    <div>
                        <p className="font-semibold text-solita-black">{selectedFile.name}</p>
                        <p className="text-sm text-solita-dark-grey">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="text-solita-red hover:bg-solita-red/10 p-2 rounded-lg transition-colors"
                    aria-label="Remove file"
                >
                    <X size={24} />
                </button>
            </motion.div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${isDragActive
                ? 'border-solita-ochre bg-solita-ochre/5 scale-[1.02]'
                : 'border-solita-mid-grey hover:border-solita-dark-grey hover:bg-solita-light-grey/30'
                }`}
        >
            <input {...getInputProps()} />
            <Upload
                size={48}
                className={`mx-auto mb-4 transition-colors ${isDragActive ? 'text-solita-ochre' : 'text-solita-mid-grey'
                    }`}
            />
            {isDragActive ? (
                <p className="text-lg font-semibold text-solita-ochre">Drop the file here...</p>
            ) : (
                <>
                    <p className="text-lg font-semibold text-solita-black mb-2">
                        Drag & drop a transcript file here
                    </p>
                    <p className="text-sm text-solita-dark-grey">
                        or click to browse (.txt, .md, .docx)
                    </p>
                    <p className="text-xs text-solita-mid-grey mt-2">Maximum file size: 10MB</p>
                </>
            )}
        </div>
    );
}
