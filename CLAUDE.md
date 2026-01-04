# CLAUDE.md - AI Assistant Guide for Transcriptland

## Project Overview

**Transcriptland** (Transcript Processor v2) is an agentic AI-driven React application for processing, analyzing, and extracting insights from transcripts. It implements a multi-agent orchestration system with human-AI collaboration for qualitative research.

### Core Value Proposition
Qualitative research requires deep human understanding. This app bridges the gap by combining a text editor with purpose-built AI agents for structured, iterative human+AI workflows.

---

## Quick Start Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # TypeScript compile + production build
npm run lint     # ESLint check (strict mode, zero warnings allowed)
npm run preview  # Preview production build
npm run test     # Run Playwright UI tests
npm run test:ui  # Run tests with interactive UI
```

---

## Architecture Overview

### Tech Stack
- **React 18** + **TypeScript 5** + **Vite 5**
- **TailwindCSS** with custom Solita design system
- **React Router 7** for client-side routing
- **Google Gemini SDK** and **LiteLLM** for multi-model LLM support
- **Playwright** for end-to-end UI testing
- **No backend** - frontend-only SPA with localStorage persistence

### Directory Structure

```
e2e/                     # Playwright UI tests
├── app.spec.ts         # Core app functionality
└── phases.spec.ts      # Phase navigation tests
src/
├── components/          # React UI components
│   ├── ui/             # Base UI (inputs, text areas, streaming)
│   ├── Agent*.tsx      # Agent visualization & logging
│   └── Settings/       # Configuration modals
├── pages/              # Route pages (Phase1-5)
│   ├── Phase1_UploadAlign.tsx
│   ├── Phase2_ProcessingValidation.tsx
│   ├── Phase3_InsightExtraction.tsx
│   ├── Phase3_5_GapAnalysis.tsx
│   └── Phase4_Consolidation.tsx
├── services/           # Business logic & LLM integration
│   ├── planner.agent.ts   # Context analysis, framework generation
│   ├── writer.agent.ts    # Segment analysis & rewriting
│   ├── critic.agent.ts    # Quality evaluation
│   ├── gap-analysis.agent.ts
│   ├── llm.service.ts     # LLM facade (Gemini/LiteLLM)
│   ├── settings.service.ts # localStorage management
│   └── agent-logger.service.ts
├── contexts/           # React Context (AnalysisContext)
├── hooks/              # Custom hooks (usePhaseNavigation, useStreamingText)
├── types/              # TypeScript definitions
│   ├── index.ts        # Core types (Agent, Transcript)
│   ├── phases.ts       # Phase-specific types
│   └── logging.ts      # Logging types
└── constants/          # Configuration
    ├── default-instructions.ts  # Agent prompts
    └── llm-providers.ts         # LLM config
```

---

## Key Concepts

### 5-Phase User Journey

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Upload & Alignment | Upload transcript, Planner generates summary/metadata/objective |
| 2 | Framework Generation | Planner creates 3-5 analysis segments with guidance |
| 3 | Processing & Evaluation | Writer+Critic agents analyze segments in parallel |
| 3.5 | Gap Analysis | Identify unexplored themes, process gap segments |
| 4 | Consolidation | Review, edit, export as Markdown |

### Agent System

**Four specialized agents:**
- **PlannerAgent**: Context understanding, framework generation
- **WriterAgent**: Segment analysis with source grounding
- **CriticAgent**: Quality evaluation, source alignment verification
- **GapAnalysisAgent**: Identifies unexplored themes

All agents follow this pattern:
```typescript
class SomeAgent {
  async analyzeX(...): Promise<Result>           // Regular call
  async *analyzeXStream(...): AsyncGenerator<string>  // Streaming
}
```

### Service Singletons

All services export singleton instances:
```typescript
// Usage
import { plannerAgent } from '@/services/planner.agent';
import { llmService } from '@/services/llm.service';
import { settingsService } from '@/services/settings.service';
```

---

## Code Patterns & Conventions

### Naming Conventions
- **Files**: kebab-case for services (`agent-logger.service.ts`)
- **Classes**: PascalCase (`PlannerAgent`, `LLMService`)
- **Components**: PascalCase (`SettingsModal.tsx`)
- **Variables/Functions**: camelCase
- **Enums**: PascalCase (`AgentStatus`, `Phase`)

### Agent Method Pattern
```typescript
async analyzeSegment(input: Input): Promise<Output> {
  const model = settingsService.getAgentModel('writer');
  const systemPrompt = settingsService.getAgentInstruction('writer', 'analyzeSegment');

  const logId = agentLogger.logRequest('Writer', AgentRole.WRITER, 'analyzeSegment', prompt);
  const startTime = Date.now();

  try {
    const result = await llmService.generateCompletion(model, systemPrompt, prompt);
    const parsed = this.parseResponse(result.content);

    agentLogger.logResponse(logId, result.content, Date.now() - startTime, result.usage?.total_tokens);
    return parsed;
  } catch (error) {
    agentLogger.logError(logId, error);
    throw error;
  }
}
```

### State Management
- **AnalysisContext**: Central state for analysis workflow
- **localStorage**: Settings persistence (API keys, agent configs)
- **Component state**: UI-specific state (loading, streaming)

### Error Handling
- Try/catch with descriptive error messages
- `agentLogger.logError()` for agent failures
- `react-hot-toast` for user notifications

---

## Important Files

| File | Purpose |
|------|---------|
| `contexts/AnalysisContext.tsx` | Central state management |
| `services/llm.service.ts` | LLM facade (abstracts Gemini/LiteLLM) |
| `services/settings.service.ts` | Settings persistence, validation |
| `constants/default-instructions.ts` | Agent prompt templates |
| `constants/llm-providers.ts` | LLM provider configuration |
| `types/phases.ts` | Phase enum, AnalysisState type |
| `hooks/usePhaseNavigation.ts` | Phase routing enforcement |

---

## LLM Configuration

### Supported Providers

**LiteLLM Gateway** (default)
- Base URL: `https://app-litellmsn66ka.azurewebsites.net/v1`
- Models: Gemini 2.0/2.5, GPT-4o variants

**Google Gemini Direct**
- Models: Gemini 2.0/2.5 Flash variants

### Settings Persistence
- Stored in localStorage key: `transcript_processor_settings`
- Includes: API keys, selected models, custom agent instructions
- Export/import as JSON supported

---

## Development Guidelines

### Adding a New Agent
1. Create `src/services/new-agent.agent.ts` following existing patterns
2. Add to `AgentType` in `settings.service.ts`
3. Add default instructions in `constants/default-instructions.ts`
4. Register in `agent-config.registry.ts`
5. Add settings UI in `components/SettingsModal.tsx`

### Adding a New Phase
1. Create `src/pages/Phase[X]_[Name].tsx`
2. Add to `Phase` enum in `types/phases.ts`
3. Update `AnalysisState` type
4. Add route in `App.tsx`
5. Update `usePhaseNavigation.ts` navigation logic

### Modifying Agent Prompts
- Default prompts: `constants/default-instructions.ts`
- User overrides: Settings modal (stored in localStorage)
- Reset available per agent

---

## Design System

### Color Palette (Solita)
```
Black:      #282828    Light Grey: #E6E6E6
Mid Grey:   #828282    Dark Grey:  #505050
Green:      #576449    Ochre:      #DA9353
Red:        #D04848
```

### Typography
- Primary: Sharp Sans
- Fallback: Century Gothic, Arial

---

## Testing & Debugging

### UI Testing with Playwright

**Test Commands:**
```bash
npm run test         # Run all tests headlessly
npm run test:ui      # Interactive test runner UI
npm run test:headed  # Run tests in visible browser
npm run test:debug   # Debug mode with inspector
npm run test:report  # View HTML test report
```

**Test Structure:**
```
e2e/
├── app.spec.ts      # Core app functionality tests
└── phases.spec.ts   # Phase navigation tests
```

**Writing Tests:**
- Tests live in `e2e/` directory
- Use `@playwright/test` framework
- Dev server auto-starts via `playwright.config.ts`
- Tests run against `http://localhost:5173`

**Example Test:**
```typescript
import { test, expect } from '@playwright/test';

test('should display Phase 1 page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Phase 1/i })).toBeVisible();
});
```

### Agent Debugging
- AgentLogPanel shows all LLM interactions
- Logs include: timestamp, agent, action, prompt, response, duration, tokens
- Located at bottom of interface

---

## Key Architectural Decisions

1. **Frontend-only**: No backend, direct LLM API calls from browser
2. **localStorage persistence**: API keys never leave user's browser
3. **AsyncGenerator for streaming**: Native token-by-token streaming support
4. **Promise.allSettled**: Parallel agent execution, graceful failure handling
5. **Singleton services**: Single instance per service for state management
6. **Type-safe phases**: Enum-based routing prevents invalid states

---

## Common Tasks

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview  # Test build locally
```

### Check Code Quality
```bash
npm run lint
```

### Run UI Tests
```bash
npm run test           # Run all tests
npm run test:headed    # Watch tests in browser
```

### Configure API Key
1. Click "Set API Key" in the app
2. Choose provider (LiteLLM or Google)
3. Enter API key
4. Key stored in localStorage

---

## Files to Avoid Modifying Without Care

- `contexts/AnalysisContext.tsx` - Central state, affects entire app
- `services/settings.service.ts` - Settings schema changes need migration
- `types/phases.ts` - Phase changes affect navigation logic
- `constants/llm-providers.ts` - LLM config affects all API calls

---

## Related Documentation

- `README.md` - Project overview
- `User_Journey.md` - Detailed phase descriptions
- `Design_system.md` - Visual design guidelines
- `agents.md` - Agent operating protocols
- `AI_controls.md` - LLM options documentation
