# Mock Interview Simulator — Architecture Plan

## Core Idea
A web app where an AI interviewer conducts realistic mock interviews,
adapting its behavior by interview type, role, and level, then provides
structured feedback with positive/negative signal analysis.

## Interview Types & UI Requirements

### 1. Behavioral Interview
**UI**: Chat interface (text + optional speech-to-text)
**Components**:
- Chat panel (primary) — AI asks questions, candidate responds
- Optional: mic button for speech-to-text input
- Timer (45 min countdown)
- After interview: feedback panel with STAR analysis, signal highlighting

**AI behavior**:
- Picks questions based on level/role from knowledge base
- Follows up naturally — doesn't just read from a list
- Probes for specifics when answers are vague
- Tracks which Meta core values have been assessed

**Feedback output**:
- Per-answer breakdown: STAR structure score, highlight what was strong/weak
- Color-coded transcript: green = positive signal, red = negative signal
- Overall score per dimension (from rubric)
- Specific improvement suggestions with examples

---

### 2. Coding Interview
**UI**: Split pane — code editor (left) + chat (right)
**Components**:
- Code editor (Monaco/CodeMirror) with syntax highlighting, multiple language support
- Chat panel — AI presents problem, discusses approach, gives hints
- Test runner — run code against test cases
- Timer (45 min)
- After interview: feedback panel with code review + approach analysis

**AI behavior**:
- Presents problem appropriate for level
- Asks candidate to explain approach before coding
- Gives calibrated hints (not too easy, not too cryptic)
- Asks follow-up questions after solution
- Asks about time/space complexity
- Suggests optimization if candidate has a suboptimal solution

**Feedback output**:
- Approach analysis: did they explore alternatives? optimal solution?
- Code quality review: readability, naming, structure
- Complexity analysis: correct time/space analysis?
- Communication score
- Edge cases: which ones were caught, which were missed
- Comparison to expected level performance

---

### 3. System Design Interview
**UI**: Split pane — drawing canvas (left) + chat (right)
**Components**:
- Drawing canvas (Excalidraw/tldraw embedded) for architecture diagrams
- Chat panel — AI guides through design phases
- Requirements notepad — track functional/non-functional requirements
- Capacity estimation calculator (optional helper widget)
- Timer (45-60 min)
- After interview: feedback panel with design analysis

**AI behavior**:
- Presents design problem, lets candidate drive
- Evaluates whether candidate asks clarifying questions
- Guides through phases if candidate gets stuck (requirements → HLD → deep dive)
- Challenges design decisions: "what happens when X fails?"
- Asks about trade-offs at each decision point
- Redirects if candidate goes too deep too early or stays too shallow

**Feedback output**:
- Requirements gathering score: did they ask the right questions?
- Architecture review: are components well-chosen? data flow clear?
- Trade-off analysis: did they discuss alternatives?
- Deep dive quality: did they go deep enough on critical components?
- Scalability assessment
- Missing components or considerations
- Annotated diagram with suggestions

---

### 4. ML System Design Interview
**UI**: Split pane — drawing canvas (left) + chat (right) (similar to system design)
**Components**:
- Drawing canvas for ML pipeline architecture
- Chat panel with ML-specific guidance
- Metrics notepad — track offline/online metrics
- Timer (45-60 min)
- After interview: ML-specific feedback panel

**AI behavior**:
- Presents ML design problem
- Evaluates problem formulation (is the ML task correctly defined?)
- Probes on data: where do labels come from? feature freshness?
- Challenges model choices: why not a simpler model?
- Asks about serving, monitoring, experimentation
- Tests understanding of feedback loops and model drift

**Feedback output**:
- Problem formulation score
- Data & feature engineering analysis
- Model architecture justification
- Serving & production readiness
- Monitoring & iteration plan
- Overall ML maturity assessment

---

### 5. AI-Native Coding Interview
**UI**: Split pane — code editor with AI assistant (left) + interviewer chat (right)
**Components**:
- Code editor (Monaco/CodeMirror) with syntax highlighting
- Built-in AI coding assistant (separate from interviewer AI) — candidate prompts it
- Interviewer chat panel — AI observes and interacts
- Prompt history panel — shows candidate's prompts to the AI assistant
- Timer (45-60 min)
- After interview: feedback on AI collaboration effectiveness

**AI behavior** (interviewer):
- Presents a larger-scope problem
- Observes how candidate uses the AI assistant
- Notes prompting patterns, whether candidate reviews AI output
- Asks "why did you delegate that to AI?" or "did you verify that?"
- May ask candidate to explain AI-generated code

**AI behavior** (coding assistant):
- Acts as a realistic AI coding tool (like Copilot/Claude)
- Responds to candidate prompts with code, explanations, suggestions
- Intentionally imperfect — sometimes generates suboptimal or subtly buggy code
- Quality varies like a real AI tool would

**Feedback output**:
- Decomposition score: how well did they break down the problem?
- Prompting effectiveness: specific vs vague, iteration quality
- Critical evaluation: did they catch AI bugs? modify output?
- Architecture ownership: who drove the design, candidate or AI?
- Scope achieved vs expected
- Annotated prompt history with commentary

---

## Tech Stack

```
Frontend:
├── Next.js (React) — main framework
├── Monaco Editor — code editing (coding + AI-native)
├── tldraw or Excalidraw — drawing canvas (system design + ML design)
├── Web Speech API — optional speech-to-text for behavioral
└── Tailwind CSS — styling

Backend:
├── Next.js API routes — session management, AI orchestration
├── Claude API — powers both interviewer AI and coding assistant AI
│   ├── Interviewer agent — different system prompts per interview type
│   └── Coding assistant agent — AI-native mode only
├── SQLite (local) or PostgreSQL — session history, feedback storage
└── Knowledge base — JSON files loaded into system prompts

Key packages:
├── @anthropic-ai/sdk — Claude API
├── @monaco-editor/react — code editor
├── @tldraw/tldraw — drawing canvas
└── next-auth (optional) — if we want user accounts
```

## Session Flow (all types)

```
1. SETUP
   User selects: role (SWE/MLE/DE) → level (E3-E6) → interview type
   System loads: appropriate questions, rubric, system prompt

2. INTERVIEW (45-60 min)
   AI conducts interview using type-specific behavior
   All interactions logged (chat, code changes, diagram snapshots)
   Timer counts down with gentle warnings

3. FEEDBACK (generated after interview ends)
   AI analyzes full transcript + artifacts against rubric
   Produces structured feedback with:
   - Per-dimension scores (from evaluation_rubrics.json)
   - Highlighted positive signals (green) and negative signals (red)
   - Specific improvement suggestions
   - Level calibration: "your performance was at E4 level because..."
   - Action items for next practice session
```

## System Prompt Architecture

Each interview type gets a tailored system prompt that includes:
1. Interviewer persona and behavior rules
2. Relevant questions from knowledge base (filtered by role + level)
3. Evaluation rubric for that interview type
4. Phase guidance (e.g., for system design: requirements → HLD → deep dive)
5. Follow-up question templates
6. Signal detection instructions

The feedback generation uses a separate system prompt that:
1. Receives the full transcript + rubric
2. Scores each dimension with evidence from the transcript
3. Highlights specific moments as positive/negative signals
4. Generates actionable improvement advice

## Build Order (suggested phases)

### Phase 1: Behavioral Interview (simplest UI — chat only)
- Chat interface + timer
- Claude API integration with behavioral system prompt
- Knowledge base loading (questions + rubric)
- Post-interview feedback generation
- Speech-to-text (stretch)

### Phase 2: Coding Interview (add code editor)
- Split pane: code editor + chat
- Monaco editor integration with multi-language support
- Code execution (sandboxed, or just syntax checking)
- Coding-specific system prompt and feedback

### Phase 3: System Design (add drawing canvas)
- Split pane: tldraw/Excalidraw + chat
- Diagram snapshot capture for feedback
- Design-phase tracking system prompt
- Design-specific feedback with annotated diagrams

### Phase 4: ML Design (variant of system design)
- Reuse drawing canvas
- ML-specific system prompt, questions, and rubric
- ML-specific feedback dimensions

### Phase 5: AI-Native Coding (most complex — two AI agents)
- Triple pane: code editor + AI assistant + interviewer chat
- Two Claude API streams (interviewer + coding assistant)
- Prompt history tracking
- AI collaboration analysis in feedback
