import { motion, AnimatePresence } from 'framer-motion';
import { X, LucideIcon, Lightbulb } from 'lucide-react';
import { useGuidedHints } from '../hooks/useGuidedHints';

interface GuidedHintProps {
    hintId: string;
    title: string;
    description: string;
    icon?: LucideIcon;
}

// Dismissable hint component for guiding users through the workflow
export function GuidedHint({ hintId, title, description, icon: Icon = Lightbulb }: GuidedHintProps) {
    const { isDismissed, dismissHint } = useGuidedHints();

    if (isDismissed(hintId)) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
            >
                <div className="bg-solita-ochre/10 border border-solita-ochre/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-solita-ochre flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-solita-black text-sm">{title}</h4>
                            <p className="text-sm text-solita-dark-grey mt-1 leading-relaxed">{description}</p>
                        </div>
                        <button
                            onClick={() => dismissHint(hintId)}
                            className="text-solita-mid-grey hover:text-solita-dark-grey transition-colors flex-shrink-0 p-1 -m-1"
                            title="Dismiss hint"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
