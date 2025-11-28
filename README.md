# AI Transcript Processor

A powerful, agentic AI-driven application for processing, analyzing, and extracting insights from transcripts. This tool leverages a multi-agent system to break down transcripts, generate analysis frameworks, and provide deep insights with a premium, fluid user experience.

## Problem 

Qualitative work requires deep understanding of the users context. While AI can be helpful, it can be very problematic if one relies only on AI-processed transcripts in design work. For me, this has meant that AI has not been very useful in doing qualitative analysis as I have lacked the tooling for incremental and fruitful human + AI collaboration. 

## Solution 

This tool combines a text editor with purpose built agents to enhance processing of text. The primary intended usecase is the analysis of transcripts. The outputs are structured and well organized .md files with metadata to make them the perfect context for later AI-powered workflows. 

## User Journey

### Phase 1: Upload & Alignment
Load your transcript and let the AI align on the context and objectives.

### Phase 2: Framework Generation
Review and refine the AI-generated analysis structure.

### Phase 3: Processing & Evaluation
Launch the agent team to process segments in parallel with real-time streaming and critique.

### Phase 4: Gap Analysis
Identify missing themes and expand the analysis to cover all bases.

### Phase 5: Consolidation
Compile the analysis, add summaries, make final edits and export.

![Process Diagram](./process.png)

## Features

### Core Functionality
- **Multi-Format Support**: Upload `.docx`, `.md`, `.txt` files, or paste text directly.
- **AI + Human Collaboration**: Augment your thinking with better structure and breadth instead of delegating the analysis entirely to AI.
- **Context Awareness**: AI automatically detects context, tags metadata, and proposes analysis objectives.
- **Dynamic Framework Generation**: The "Planner" agent creates a structured analysis framework tailored to your transcript.
- **Parallel Processing**: Writer agents analyze all segments simultaneously with real-time streaming output.
- **Quality Assurance**: "Critic" agents evaluate analyses for source alignment and objective fulfillment.
- **Iterative Refinement**: Rewrite segments based on critic feedback with a single click.
- **Gap Analysis**: Automatically identifies unexplored themes and suggests new analysis segments.
- **Flexible Export**: Edit and export the final analysis as structured Markdown files.

### Developer & Power User Features
- **Agent Log Panel**: Comprehensive debugging interface showing all AI interactions, prompts, responses, token usage, and execution times.
- **Customizable Instructions**: Override default agent prompts to fine-tune behavior for specific use cases.
- **Model Selection**: Choose different AI models per agent (Planner, Writer, Critic, Gap Analysis).
- **Multiple LLM Providers**: Support for Google Gemini (direct) or a LiteLLM proxy gateway (for Azure OpenAI and other models).
- **Local Storage**: All settings and API keys stored locally for privacy and persistence.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, React Router
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Framer Motion for animations, React Hot Toast for notifications
- **AI Integration**: Multi-agent orchestration (Planner, Writer, Critic, Gap Analysis agents)
- **LLM Providers**: Google Gemini API (direct), LiteLLM proxy (Azure OpenAI, Google models via gateway)
- **Document Parsing**: Mammoth.js for DOCX support

## Getting Started

1.  Clone the repository: `git clone <repository-url>`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
4.  Open the application in your browser (typically http://localhost:5173)
5.  Click "Set API Key" on the landing page and configure your LLM provider:
    - **Google Gemini**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
    - **LiteLLM Gateway**: Use an API key for a configured LiteLLM proxy instance (provides access to Azure OpenAI and other models)

### Production Build
```bash
npm run build
npm run preview  # Preview the production build
```

## Usage Tips

- **Phase Navigation**: Use the phase indicator at the top to track progress and jump between phases.
- **Agent Log Panel**: Click the panel at the bottom to inspect all AI interactions, debug issues, and monitor token usage.
- **Customization**: Access Settings to customize agent prompts, change models, or switch LLM providers.
- **Iterative Analysis**: Don't settle for first drafts - use the Critic agent to evaluate and refine your analyses.
- **Gap Analysis**: Run this phase to ensure comprehensive coverage of your transcript's themes. 
