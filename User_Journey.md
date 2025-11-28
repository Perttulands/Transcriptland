## User Journey
### Phase 1: Upload
1. User loads transcript file (supported formats are .docx .md .txt .pdf) or pastes text in text box, click proceed
2. AI reads first 1000 characters of the transcript to understand context. Agent writes a one sentence context understanding (what is the context of the transcript). Agent adds some metadata tags and proposes analysis objective for the transcript processing. 
3. User is presented with the one sentence context understanding, the meta data tags and the proposed analysis objective in clean, separate UI elements. User can edit these very easily.

### Phase 2: Analysis Framework
1. User clicks a button to generate an analysis framework, which creates the structure that will be used to process the transcript. 
2. AI agent (Planner) generates framework to be used in transcript processing. This is a structured .md file with a yaml frontmatter. Each segment in the analysis framework is in its own window and stored as its own .md file. 
3. User verifies the framework and can easily edit it in a clean UI.

### Phase 3: Processing & Evaluation
1. User clicks a button to launch analysis team. 
   1. Writer agent, writes based on given instruction using only the provided transcript as the source material. 
   2. Critic agent, when prompted writes an evaluation of the quality of the segment and verifies that every statement is based on the source transcript material
2. User can see all segments being processed with streaming output
3. User can run critic evaluation on any segment

### Phase 4: Gap Analysis
**2-Step Process:**
1. **Gap Identification** - Gap Analysis agent identifies unexplored themes and suggests new segments. User selects which gaps to analyze.
2. **Gap Analysis** - Writer agents analyze selected gap segments in parallel, creating cards identical to Phase 3 with streaming output. User can run critic on these cards.
3. **Integration** - User clicks "Add to Main Analysis" button on gap cards to move them into Phase 3 flow.

### Phase 5: Consolidation & Export
1. User reviews all completed segments (main + gaps)
2. User can edit consolidated markdown text
3. User can toggle between Edit and Preview modes
4. User can copy to clipboard or download as .md file

### User experience
1. Streaming agent output is preferred. This creates engagement and transparency. When multiple agents are working in parallel, user can see each of their work streaming in separate windows simultaneously.
2. Our clickable objects are very clickable and satisfying to click with smooth hover effects and micro-animations
3. We use the design system outlined in /design_system.md 
4. There is a logging panel that tracks everything sent to agents and their responses to support debugging. It should include all instructions we send and there is a functionality to click agent name to see the full agent config and code 
5. Loading states are elegant with smooth transitions, not jarring spinners
6. The overall experience should feel premium, fluid, and responsive