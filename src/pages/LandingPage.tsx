import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-solita-light-grey flex flex-col items-center justify-center px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-3xl w-full text-center"
            >
                {/* Title */}
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="w-10 h-10 text-solita-ochre" />
                    <h1 className="text-4xl md:text-5xl font-semibold text-solita-black">
                        TranscriptAI
                    </h1>
                </div>

                {/* Tagline */}
                <p className="text-lg md:text-xl text-solita-dark-grey mb-8">
                    Intelligent transcript analysis powered by AI
                </p>

                {/* Process Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <img
                        src="/Process.png"
                        alt="Analysis workflow: Upload, Framework, Processing, Gap Analysis, Consolidation"
                        className="w-full max-w-2xl mx-auto rounded-lg"
                    />
                </motion.div>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-base text-solita-dark-grey mb-10 max-w-xl mx-auto leading-relaxed"
                >
                    Transform your transcripts into structured insights through a guided 5-phase workflow.
                    Upload your content, generate an analysis framework, extract insights with AI assistance,
                    identify gaps, and consolidate into a comprehensive report.
                </motion.p>

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    onClick={() => navigate('/upload')}
                    className="px-8 py-4 bg-solita-ochre hover:bg-solita-ochre/90 text-white rounded-lg transition-all duration-200 flex items-center gap-3 mx-auto text-lg font-medium shadow-md hover:shadow-lg"
                >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                </motion.button>
            </motion.div>
        </div>
    );
}
